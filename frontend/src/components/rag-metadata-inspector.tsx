import { QueryResponse } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, Database, Code, Activity } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  data: QueryResponse | null;
}

/**
 * RAG Metadata Inspector
 * 
 * Specifically designed to meet Part D requirements of the AI exam:
 * - Display retrieved documents
 * - Display similarity scores
 * - Show final prompt sent to LLM
 */
export function RagMetadataInspector({ data }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (!data) return null;

  return (
    <div className="border-t bg-muted/20 border-b">
      <Collapsible open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <CollapsibleTrigger 
          className="flex w-full items-center justify-between px-6 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-primary" />
              <span><span className="font-bold text-foreground">{data.retrieved_documents.length}</span> Evidence Chunks</span>
            </div>
            <div className="flex items-center gap-1.5 border-l pl-6">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span>Top Score: <span className="font-bold text-foreground">{data.retrieved_documents[0]?.similarity_scores.hybrid_score.toFixed(4)}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">
              {isOpen ? "Close Inspector" : "Inspect Reasoning"}
            </span>
            <ChevronRight className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-90")} />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="px-6 pb-6 pt-2 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[450px]">
            
            {/* PART D: Retrieved Documents & Similarity Scores */}
            <div className="flex flex-col gap-4 overflow-hidden border rounded-xl bg-background/50">
              <div className="px-4 py-3 border-b bg-muted/30 flex justify-between items-center">
                <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">Retrieved Knowledge base</h4>
                <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold">FAISS + HYBRID</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {data.retrieved_documents.map((doc, i) => (
                  <div key={`${doc.chunk_id}-${i}`} className="group relative rounded-lg border bg-background p-4 transition-all hover:border-primary/50 hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-[10px] font-bold text-primary">
                        [{doc.chunk_id}]
                      </span>
                      <div className="flex gap-2">
                        <span className="text-[9px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-full">
                          V: {doc.similarity_scores.vector_score.toFixed(3)}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-full">
                          K: {doc.similarity_scores.keyword_score.toFixed(3)}
                        </span>
                        <span className="text-[9px] font-bold text-foreground font-mono bg-primary/20 px-2 py-0.5 rounded-full">
                          H: {doc.similarity_scores.hybrid_score.toFixed(3)}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-foreground/80 leading-relaxed line-clamp-4 font-serif italic">
                      "{doc.text_preview}..."
                    </p>
                    <div className="mt-3 pt-2 border-t text-[9px] text-muted-foreground/60 flex justify-between items-center">
                      <span className="truncate max-w-[200px]">Source: {doc.source}</span>
                      <span className="font-bold">Rank #{doc.rank}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PART D: Final Prompt Sent to LLM */}
            <div className="flex flex-col gap-4 overflow-hidden border rounded-xl bg-background/50">
              <div className="px-4 py-3 border-b bg-muted/30 flex justify-between items-center">
                <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">Internal Pipeline Prompt</h4>
                <Code className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 overflow-y-auto p-0">
                <pre className="text-[11px] font-mono whitespace-pre-wrap p-6 leading-relaxed text-muted-foreground/90 selection:bg-primary/30 selection:text-foreground">
                  {data.final_prompt_sent_to_llm}
                </pre>
              </div>
            </div>

          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
