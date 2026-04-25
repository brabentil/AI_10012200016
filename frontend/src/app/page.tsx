"use client";

import { useState, useRef, useCallback } from "react";
import {
  DEFAULT_SETTINGS,
  type ChatSettings,
  type QueryResponse,
} from "@/lib/types";
import { BlackStarRuntimeProvider } from "@/lib/assistant-runtime";
import { Thread } from "@/components/thread";
import { RagMetadataInspector } from "@/components/rag-metadata-inspector";
import Image from "next/image";

export default function Home() {
  const [settings] = useState<ChatSettings>({ ...DEFAULT_SETTINGS });
  
  const [ragData, setRagData] = useState<QueryResponse | null>(null);
  
  const handleRagDataUpdate = useCallback((data: QueryResponse | null) => {
    setRagData(data);
  }, []);

  return (
    <BlackStarRuntimeProvider 
      settings={settings} 
      onRagDataUpdate={handleRagDataUpdate}
    >
      <div className="flex flex-col h-svh bg-background">
        <header className="flex items-center justify-between px-8 py-6 border-b shrink-0 bg-background/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 transition-transform hover:scale-105 duration-300">
              <Image 
                src="/logo.png" 
                alt="BlackStar AI" 
                fill 
                priority
                sizes="64px"
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-2xl tracking-tight leading-none text-foreground">BlackStar AI</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium mt-1">Intelligence Portal</span>
            </div>
          </div>
        </header>

        {/* PROOF OF RAG: Inspector component for exam requirements */}
        <RagMetadataInspector data={ragData} />
        
        <main className="flex-1 overflow-hidden relative">
          <Thread />
        </main>
      </div>
    </BlackStarRuntimeProvider>
  );
}
