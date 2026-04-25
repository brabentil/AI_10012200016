/* ── Request ──────────────────────────────────────────────────── */

export interface QueryRequest {
  query: string;
  top_k?: number;           // 1–20, default 5
  hybrid_alpha?: number;    // 0.0–1.0, default 0.55
  llm_model?: string;       // default "gpt-4o-mini"
  max_context_tokens?: number; // 200–4000, default 1200
}

/* ── Response sub-shapes (matching run_full_pipeline.py output) ─ */

export interface SimilarityScores {
  vector_score: number;
  keyword_score: number;
  hybrid_score: number;
}

export interface RetrievedDocument {
  rank: number;
  chunk_id: string;
  source: string;
  doc_id: string;
  similarity_scores: SimilarityScores;
  text_preview: string;     // first 300 chars of the chunk
}

export interface SelectedChunk {
  rank: number;
  chunk_id: string;
  source: string;
  doc_id: string;
  vector_score: number;
  keyword_score: number;
  hybrid_score: number;
  used_tokens: number;
  truncated: boolean;
}

export interface ContextSelection {
  used_context_tokens: number;
  selected_chunks: SelectedChunk[];
}

/* ISO-8601 timestamps for each pipeline stage */
export interface StageTimes {
  retrieval_start: string;
  retrieval_end: string;
  context_selection_start: string;
  context_selection_end: string;
  prompt_construction_start: string;
  prompt_construction_end: string;
  llm_generation_start: string;
  llm_generation_end: string;
}

/* ── Full API response ────────────────────────────────────────── */

export interface QueryResponse {
  run_id: string;
  query: string;
  retrieved_documents: RetrievedDocument[];
  context_selection: ContextSelection;
  final_prompt_sent_to_llm: string;
  response: string;
  stage_times: StageTimes;
  run_log_path: string;
}

/* ── Chat message (local UI state, not from backend) ─────────── */

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  ragData?: QueryResponse;  // only on assistant messages
  timestamp: Date;
}

/* ── Settings (local UI state) ───────────────────────────────── */

export interface ChatSettings {
  top_k: number;
  hybrid_alpha: number;
  llm_model: string;
  max_context_tokens: number;
}

export const DEFAULT_SETTINGS: ChatSettings = {
  top_k: 5,
  hybrid_alpha: 0.55,
  llm_model: "gpt-4o-mini",
  max_context_tokens: 1200,
};

export const LLM_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4o",      label: "GPT-4o" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
];
