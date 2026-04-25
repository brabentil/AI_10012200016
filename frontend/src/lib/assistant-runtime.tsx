"use client";

import { ReactNode, useState, useCallback, useMemo } from "react";
import { 
  AssistantRuntimeProvider, 
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { postQuery } from "@/lib/api";
import type { ThreadMessage, ChatSettings, QueryResponse } from "@/lib/types";

interface Props {
  children: ReactNode;
  settings: ChatSettings;
  onRagDataUpdate: (data: QueryResponse | null) => void;
}

/**
 * Bridges the BlackStar AI backend logic to assistant-ui's runtime.
 * This allows us to use assistant-ui's beautiful components while
 * maintaining our existing RAG pipeline and settings.
 */
export function BlackStarRuntimeProvider({ children, settings, onRagDataUpdate }: Props) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const onNew = useCallback(async (message: any) => {
    const content = message.content[0].text; // Simplify for now
    setIsLoading(true);
    
    // 1. Add user message to state
    const userMsg: ThreadMessage = {
      role: "user",
      content: [{ type: "text", text: content }],
      id: `user-${Date.now()}`,
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // 2. Call our RAG backend
      const ragData = await postQuery({
        query: content,
        top_k: settings.top_k,
        hybrid_alpha: settings.hybrid_alpha,
        llm_model: settings.llm_model,
        max_context_tokens: settings.max_context_tokens,
      });

      // 3. Update the global RAG panel data
      onRagDataUpdate(ragData);

      // 4. Add assistant message to state
      const assistantMsg: ThreadMessage = {
        role: "assistant",
        content: [{ type: "text", text: ragData.response || "No response." }],
        id: `assistant-${Date.now()}`,
        // Fix: Removed massive ragData object from metadata to prevent memory leaks
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ThreadMessage = {
        role: "assistant",
        content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : "Unknown error"}` }],
        id: `error-${Date.now()}`,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [settings, onRagDataUpdate]);

  const convertMessage = useCallback((message: any) => {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt || new Date(),
      ...(message.role === "assistant" ? { status: { type: "complete", reason: "stop" } as const } : {}),
      metadata: { custom: message.metadata || {} },
    };
  }, []);

  // Fix: Stabilize runtime config to prevent infinite re-render loops
  const runtimeConfig = useMemo(() => ({
    messages,
    onNew,
    isRunning: isLoading,
    convertMessage,
  }), [messages, onNew, isLoading, convertMessage]);

  const runtime = useExternalStoreRuntime(runtimeConfig);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
