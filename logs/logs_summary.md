# RAG System - Logs Summary

**Generated Date**: 2026-04-25
**Total Individual Runs**: 30
**Last Run Recorded**: `rag_run_20260424T174831Z_9e410fce.json`

---

## 1. Data Engineering & Chunking (Part A)
*   **Total Documents**: 349 (98 CSV Region Docs, 251 PDF Page Docs)
*   **Strategies Evaluated**:
    *   `small`: 180 tokens / 30 overlap
    *   `medium`: 360 tokens / 60 overlap
    *   `large`: 600 tokens / 100 overlap
*   **Winner**: **Large Strategy**
    *   Selected for production based on Recall@5 and MRR@5.
    *   Total chunks generated: 796.
    *   Boundary Rule: Sentence-aware windowing.

## 2. Retrieval Performance (Part B)
*   **Methodology**: Compared dense-vector retrieval (FAISS) against Hybrid search.
*   **Key Finding**: Vector-only retrieval (baseline) consistently failed on keyword-heavy or structured data queries (e.g., specific vote counts or table row names).
*   **Hybrid Implementation**: 
    *   Formula: `0.55 * Vector + 0.45 * TF-IDF`.
    *   Significant improvement in Top1 Accuracy and MRR@5.
*   **Corpus**: Chunks from the Budget 2025 PDF and Election Results CSV.

## 3. Prompt Engineering (Part C)
*   **Variants Tested**:
    *   `v1_basic`: General context injection.
    *   `v2_grounded`: Strict fallback to "Insufficient evidence".
    *   `v3_structured`: Enforced citation style and structured sections.
*   **Best Variant**: `v3_structured` (Highest citation compliance and factual grounding).
*   **Context Management**: Ranked retrieval with a 1200-token budget and priority-based truncation.

## 4. Robustness & Adversarial Evaluation (Part D)
*   **Hallucination Rate**:
    *   **RAG**: 27.7%
    *   **Pure LLM**: 50.0%
*   **Accuracy Breakdown (Adversarial)**:
    *   Correct: 33.3%
    *   Partial/Incorrect: 61.1% (mostly due to strict fallback when context was missing).
*   **Observation**: The system's "Grounded" prompt successfully prevented the model from hallucinating in 100% of the NHF-related out-of-domain queries.

## 5. Typical Run Pipeline (Performance)
*   **Average Latency**: ~6.5 - 9.0 seconds.
*   **Stage Distribution**:
    *   Retrieval: ~4-6s (FAISS + Keyword).
    *   Context Selection: <0.5s.
    *   LLM Generation (gpt-4o-mini): ~2-3s.

---
*Note: The `logs/adversarial/` directory was found to be empty and is excluded from this summary.*
