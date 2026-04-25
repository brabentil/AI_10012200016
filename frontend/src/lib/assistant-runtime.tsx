"use client";

import { ReactNode, useState, useCallback, useMemo } from "react";
import { 
  AssistantRuntimeProvider, 
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { postQuery } from "@/lib/api";
import type { ChatMessage, ChatSettings, QueryResponse } from "@/lib/types";

// assistant-ui expects this shape for messages in external store
type ThreadMessage = {
  role: "user" | "assistant";
  content: { type: "text"; text: string }[];
  id: string;
  metadata?: any;
};

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

      // 4. Add assistant message to state with metadata
      const assistantMsg: ThreadMessage = {
        role: "assistant",
        content: [{ type: "text", text: ragData.response || "No response." }],
        id: `assistant-${Date.now()}`,
        metadata: { ragData },
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

  const runtime = useExternalStoreRuntime({
    messages,
    onNew,
    isRunning: isLoading,
    convertMessage,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
