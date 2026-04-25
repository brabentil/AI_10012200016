"use client";

import { useState } from "react";
import {
  DEFAULT_SETTINGS,
  type ChatSettings,
  type QueryResponse,
} from "@/lib/types";
import { BlackStarRuntimeProvider } from "@/lib/assistant-runtime";
import { Thread } from "@/components/thread";
import Image from "next/image";

export default function Home() {
  const [settings, setSettings] = useState<ChatSettings>({ ...DEFAULT_SETTINGS });
  const [latestRagData, setLatestRagData] = useState<QueryResponse | null>(null);

  return (
    <BlackStarRuntimeProvider 
      settings={settings} 
      onRagDataUpdate={setLatestRagData}
    >
      <div className="flex flex-col h-svh bg-background">
        <header className="flex items-center justify-between px-6 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image 
                src="/navbar-icon.png" 
                alt="BlackStar AI" 
                fill 
                priority
                sizes="32px"
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-lg">BlackStar AI</span>
          </div>
        </header>
        
        <main className="flex-1 overflow-hidden">
          <Thread />
        </main>
      </div>
    </BlackStarRuntimeProvider>
  );
}
