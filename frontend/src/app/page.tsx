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
        <header className="flex h-20 items-center justify-between px-8 border-b shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 transition-transform hover:scale-105 duration-300">
              <Image 
                src="/logo.png" 
                alt="BlackStar AI" 
                fill 
                priority
                sizes="48px"
                className="object-contain"
              />
            </div>
            <span className="font-heading font-bold text-2xl tracking-tighter bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              BlackStar AI
            </span>
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
