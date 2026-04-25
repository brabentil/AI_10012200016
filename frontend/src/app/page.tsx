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
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        <header className="flex h-20 items-center justify-between px-8 border-b border-white/10 shrink-0 bg-black/50 backdrop-blur-md z-50">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 transition-transform hover:scale-105 duration-300 shrink-0">
              <Image 
                src="/logo.png" 
                alt="BlackStar AI" 
                fill 
                priority
                sizes="48px"
                className="object-contain"
              />
            </div>
            <span className="font-heading font-bold text-3xl tracking-tighter bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent">
              BlackStar AI
            </span>
          </div>
        </header>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* PROOF OF RAG: Inspector component for exam requirements */}
          <div className="shrink-0 border-b bg-muted/20">
            <RagMetadataInspector data={ragData} />
          </div>
          <div className="flex-1 overflow-hidden">
            <Thread />
          </div>
        </main>
      </div>
    </BlackStarRuntimeProvider>
  );
}
