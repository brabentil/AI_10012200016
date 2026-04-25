#!/usr/bin/env python3
"""Part D full RAG pipeline: query -> retrieval -> context -> prompt -> LLM -> response."""

from __future__ import annotations

import argparse
import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import faiss
import numpy as np
from openai import OpenAI
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    import tiktoken
except ModuleNotFoundError:  # pragma: no cover
    tiktoken = None

_RUNTIME_CACHE: dict[str, Any] = {}


class Tokenizer:
    def __init__(self) -> None:
        self._encoder = None
        if tiktoken is not None:
            self._encoder = tiktoken.get_encoding("cl100k_base")

    def count(self, text: str) -> int:
        if self._encoder is None:
            return len(text.split())
        return len(self._encoder.encode(text))

    def truncate(self, text: str, max_tokens: int) -> str:
        if self._encoder is None:
            return " ".join(text.split()[:max_tokens])
        token_ids = self._encoder.encode(text)
        return self._encoder.decode(token_ids[:max_tokens])


def load_env_from_file(env_path: Path) -> None:
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            rows.append(json.loads(line))
    return rows


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True), encoding="utf-8")


def normalize_array(values: np.ndarray) -> np.ndarray:
    if values.size == 0:
        return values
    min_v = float(values.min())
    max_v = float(values.max())
    if max_v - min_v < 1e-12:
        return np.zeros_like(values)
    return (values - min_v) / (max_v - min_v)


def pick_chunk_file(code_root: Path) -> Path:
    results_path = code_root / "eval" / "chunking_results.json"
    if results_path.exists():
        results = load_json(results_path)
        best = results.get("best_strategy")
        for item in results.get("strategy_results", []):
            if item.get("strategy") == best:
                chunk_file = Path(item.get("chunk_file", ""))
                if chunk_file.exists():
                    return chunk_file

    fallback = code_root / "data" / "processed" / "chunks_large.jsonl"
    if fallback.exists():
        return fallback
    raise FileNotFoundError("No chunk file found. Run data preparation first.")


def retrieve_hybrid(
    query: str,
    model: SentenceTransformer,
    embeddings: np.ndarray,
    vectorizer: TfidfVectorizer,
    tfidf_matrix: Any,
    chunks: list[dict[str, Any]],
    top_k: int,
    alpha: float,
) -> list[dict[str, Any]]:
    query_embedding = model.encode([query], convert_to_numpy=True, normalize_embeddings=True).astype(np.float32)[0]
    vector_scores = embeddings @ query_embedding
    keyword_scores = cosine_similarity(vectorizer.transform([query]), tfidf_matrix).ravel()
    vector_norm = normalize_array(vector_scores)
    keyword_norm = normalize_array(keyword_scores)
    hybrid_scores = alpha * vector_norm + (1.0 - alpha) * keyword_norm
    top_indices = np.argsort(hybrid_scores)[::-1][:top_k]

    rows: list[dict[str, Any]] = []
    for rank, idx in enumerate(top_indices, start=1):
        chunk = chunks[int(idx)]
        rows.append(
            {
                "rank": rank,
                "chunk_id": chunk["chunk_id"],
                "source": chunk["source"],
                "doc_id": chunk["doc_id"],
                "vector_score": float(vector_scores[int(idx)]),
                "keyword_score": float(keyword_scores[int(idx)]),
                "hybrid_score": float(hybrid_scores[int(idx)]),
                "text": chunk["text"],
            }
        )
    return rows


def build_context_block(
    retrieved_rows: list[dict[str, Any]],
    tokenizer: Tokenizer,
    max_context_tokens: int,
) -> tuple[str, list[dict[str, Any]], int]:
    used = 0
    blocks: list[str] = []
    selected: list[dict[str, Any]] = []

    for row in retrieved_rows:
        header = f"[{row['chunk_id']}] source={row['source']} doc={row['doc_id']}"
        block = f"{header}\n{row['text']}"
        block_tokens = tokenizer.count(block)
        if used + block_tokens <= max_context_tokens:
            blocks.append(block)
            selected.append(
                {
                    "rank": row["rank"],
                    "chunk_id": row["chunk_id"],
                    "source": row["source"],
                    "doc_id": row["doc_id"],
                    "vector_score": row["vector_score"],
                    "keyword_score": row["keyword_score"],
                    "hybrid_score": row["hybrid_score"],
                    "used_tokens": block_tokens,
                    "truncated": False,
                }
            )
            used += block_tokens
            continue

        remaining = max_context_tokens - used
        if remaining <= 40:
            break
        header_tokens = tokenizer.count(header + "\n")
        text_budget = max(remaining - header_tokens, 1)
        truncated_text = tokenizer.truncate(row["text"], text_budget)
        truncated_block = f"{header}\n{truncated_text}"
        truncated_tokens = tokenizer.count(truncated_block)
        while truncated_tokens > remaining and text_budget > 1:
            text_budget -= 1
            truncated_text = tokenizer.truncate(row["text"], text_budget)
            truncated_block = f"{header}\n{truncated_text}"
            truncated_tokens = tokenizer.count(truncated_block)
        blocks.append(truncated_block)
        selected.append(
            {
                "rank": row["rank"],
                "chunk_id": row["chunk_id"],
                "source": row["source"],
                "doc_id": row["doc_id"],
                "vector_score": row["vector_score"],
                "keyword_score": row["keyword_score"],
                "hybrid_score": row["hybrid_score"],
                "used_tokens": truncated_tokens,
                "truncated": True,
            }
        )
        used += truncated_tokens
        break
    return "\n\n".join(blocks), selected, used


def build_prompt(query: str, context_block: str) -> tuple[str, str]:
    system_prompt = (
        "You are a strict grounded assistant for Academic City RAG. "
        "Use only retrieved context, cite chunk IDs like [chunk_id] for factual claims, "
        "and if evidence is missing output exactly: Insufficient evidence in retrieved context."
    )
    user_prompt = (
        f"User query:\n{query}\n\n"
        f"Retrieved context:\n{context_block}\n\n"
        "Rules:\n"
        "- Use only the retrieved context.\n"
        "- Do not invent facts.\n"
        "- Include citations like [chunk_id].\n"
        "- If context is insufficient, output exactly: Insufficient evidence in retrieved context.\n"
    )
    return system_prompt, user_prompt


def generate_response(client: OpenAI, model: str, system_prompt: str, user_prompt: str) -> str:
    response = client.responses.create(
        model=model,
        input=[
            {"role": "system", "content": [{"type": "input_text", "text": system_prompt}]},
            {"role": "user", "content": [{"type": "input_text", "text": user_prompt}]},
        ],
        temperature=0.2,
        max_output_tokens=350,
    )
    return (response.output_text or "").strip()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run full RAG pipeline for one query")
    parser.add_argument("--query", type=str, required=True)
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--hybrid-alpha", type=float, default=0.55)
    parser.add_argument("--embedding-model", type=str, default="sentence-transformers/all-MiniLM-L6-v2")
    parser.add_argument("--llm-model", type=str, default="gpt-4o-mini")
    parser.add_argument("--max-context-tokens", type=int, default=1200)
    return parser.parse_args()


def get_runtime(
    *,
    code_root: Path,
    embedding_model: str,
) -> dict[str, Any]:
    cache_key = f"{str(code_root)}::{embedding_model}"
    cached = _RUNTIME_CACHE.get(cache_key)
    if cached is not None:
        return cached

    chunk_file = pick_chunk_file(code_root)
    chunks = load_jsonl(chunk_file)
    embeddings = np.load(code_root / "indexes" / "faiss" / "chunk_embeddings.npy")
    # Keep index load to ensure artifact exists and is compatible.
    index = faiss.read_index(str(code_root / "indexes" / "faiss" / "retrieval.index"))
    model = SentenceTransformer(embedding_model, device="cpu")
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    tfidf_matrix = vectorizer.fit_transform([c["text"] for c in chunks])

    runtime = {
        "chunk_file": chunk_file,
        "chunks": chunks,
        "embeddings": embeddings,
        "model": model,
        "vectorizer": vectorizer,
        "tfidf_matrix": tfidf_matrix,
        "index": index,
    }
    _RUNTIME_CACHE[cache_key] = runtime
    return runtime


def run_pipeline(
    *,
    query: str,
    top_k: int = 5,
    hybrid_alpha: float = 0.55,
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2",
    llm_model: str = "gpt-4o-mini",
    max_context_tokens: int = 1200,
    code_root: Path | None = None,
) -> tuple[dict[str, Any], Path]:
    if code_root is None:
        script_path = Path(__file__).resolve()
        code_root = script_path.parents[2]

    load_env_from_file(code_root / ".env")
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise EnvironmentError("OPENAI_API_KEY is missing in code/.env")

    run_id = f"rag_run_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}_{uuid.uuid4().hex[:8]}"
    stage_times: dict[str, str] = {}

    # Stage 1: retrieval setup + query retrieval
    stage_times["retrieval_start"] = datetime.now(timezone.utc).isoformat()
    runtime = get_runtime(code_root=code_root, embedding_model=embedding_model)
    chunk_file = runtime["chunk_file"]
    chunks = runtime["chunks"]
    embeddings = runtime["embeddings"]
    model = runtime["model"]
    vectorizer = runtime["vectorizer"]
    tfidf_matrix = runtime["tfidf_matrix"]
    retrieved = retrieve_hybrid(
        query=query,
        model=model,
        embeddings=embeddings,
        vectorizer=vectorizer,
        tfidf_matrix=tfidf_matrix,
        chunks=chunks,
        top_k=top_k,
        alpha=hybrid_alpha,
    )
    stage_times["retrieval_end"] = datetime.now(timezone.utc).isoformat()

    # Stage 2: context selection
    stage_times["context_selection_start"] = datetime.now(timezone.utc).isoformat()
    tokenizer = Tokenizer()
    context_block, selected_context, used_context_tokens = build_context_block(
        retrieved_rows=retrieved,
        tokenizer=tokenizer,
        max_context_tokens=max_context_tokens,
    )
    stage_times["context_selection_end"] = datetime.now(timezone.utc).isoformat()

    # Stage 3: prompt construction
    stage_times["prompt_construction_start"] = datetime.now(timezone.utc).isoformat()
    system_prompt, user_prompt = build_prompt(query=query, context_block=context_block)
    final_prompt = f"SYSTEM:\n{system_prompt}\n\nUSER:\n{user_prompt}"
    stage_times["prompt_construction_end"] = datetime.now(timezone.utc).isoformat()

    # Stage 4: llm generation
    stage_times["llm_generation_start"] = datetime.now(timezone.utc).isoformat()
    client = OpenAI(api_key=api_key)
    response_text = generate_response(
        client=client,
        model=llm_model,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
    )
    stage_times["llm_generation_end"] = datetime.now(timezone.utc).isoformat()

    payload = {
        "run_id": run_id,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "input": {
            "query": query,
            "top_k": top_k,
            "hybrid_alpha": hybrid_alpha,
            "embedding_model": embedding_model,
            "llm_model": llm_model,
            "max_context_tokens": max_context_tokens,
        },
        "stage_times": stage_times,
        "pipeline": {
            "retrieved_documents": [
                {
                    "rank": r["rank"],
                    "chunk_id": r["chunk_id"],
                    "source": r["source"],
                    "doc_id": r["doc_id"],
                    "similarity_scores": {
                        "vector_score": r["vector_score"],
                        "keyword_score": r["keyword_score"],
                        "hybrid_score": r["hybrid_score"],
                    },
                    "text_preview": r["text"][:300],
                }
                for r in retrieved
            ],
            "context_selection": {
                "used_context_tokens": used_context_tokens,
                "selected_chunks": selected_context,
            },
            "final_prompt_sent_to_llm": final_prompt,
            "response": response_text,
        },
    }

    output_path = code_root / "logs" / "runs" / f"{run_id}.json"
    write_json(output_path, payload)
    return payload, output_path


def main() -> int:
    args = parse_args()
    payload, output_path = run_pipeline(
        query=args.query,
        top_k=args.top_k,
        hybrid_alpha=args.hybrid_alpha,
        embedding_model=args.embedding_model,
        llm_model=args.llm_model,
        max_context_tokens=args.max_context_tokens,
    )

    print(f"Run ID: {payload['run_id']}")
    print("")
    print("Retrieved documents and similarity scores:")
    for row in payload["pipeline"]["retrieved_documents"]:
        s = row["similarity_scores"]
        print(
            f"- rank={row['rank']} chunk={row['chunk_id']} "
            f"vector={s['vector_score']:.4f} keyword={s['keyword_score']:.4f} hybrid={s['hybrid_score']:.4f}"
        )
    print("")
    print("Final prompt sent to LLM:")
    print(payload["pipeline"]["final_prompt_sent_to_llm"])
    print("")
    print("Final response:")
    print(payload["pipeline"]["response"])
    print("")
    print(f"Saved full run log: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
