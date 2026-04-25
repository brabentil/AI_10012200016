import type { QueryRequest, QueryResponse } from "./types";

/* All requests go through the Next.js proxy route to avoid CORS */
const PROXY = "/api/query";

export async function postQuery(req: QueryRequest): Promise<QueryResponse> {
  const res = await fetch(PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(detail || `HTTP ${res.status}`);
  }

  return res.json() as Promise<QueryResponse>;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch("/api/health", { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

/* Derive human-readable ms durations from stage_times ISO strings */
export function parseStageDurations(stageTimes: QueryResponse["stage_times"]) {
  const ms = (start: string, end: string) =>
    Math.round(new Date(end).getTime() - new Date(start).getTime());

  return [
    { label: "Retrieval",          ms: ms(stageTimes.retrieval_start,           stageTimes.retrieval_end) },
    { label: "Context selection",  ms: ms(stageTimes.context_selection_start,   stageTimes.context_selection_end) },
    { label: "Prompt construction",ms: ms(stageTimes.prompt_construction_start, stageTimes.prompt_construction_end) },
    { label: "LLM generation",     ms: ms(stageTimes.llm_generation_start,      stageTimes.llm_generation_end) },
  ];
}
