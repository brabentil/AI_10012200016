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

  const processQuery = useCallback(async (prompt: string, baseMessages: ThreadMessage[]) => {
    setIsLoading(true);
    
    // Add a temporary "typing" message to the UI
    const loadingId = "loading-" + Math.random().toString(36).slice(2, 9);
    setMessages([...baseMessages, {
      role: "assistant",
      content: [{ type: "text", text: "" }],
      id: loadingId,
      parentId: baseMessages[baseMessages.length - 1]?.id || null,
      metadata: { isTyping: true }
    }]);

    try {
      // 1. Call our RAG backend
      const ragData = await postQuery({
        query: prompt,
        top_k: settings.top_k,
        hybrid_alpha: settings.hybrid_alpha,
        llm_model: settings.llm_model,
        max_context_tokens: settings.max_context_tokens,
      });

      // 2. Update the global RAG panel data
      onRagDataUpdate(ragData);

      // 3. Add final assistant message to state (replacing the typing one)
      const assistantMsg: ThreadMessage = {
        role: "assistant",
        content: [{ type: "text", text: ragData.response || "No response." }],
        id: "asst-" + Math.random().toString(36).slice(2, 9) + Date.now(),
        parentId: baseMessages[baseMessages.length - 1]?.id || null,
        metadata: { ragData } // Persist for branch switching / history
      };
      setMessages([...baseMessages, assistantMsg]);
    } catch (err) {
      // Handle network errors (e.g. Render backend cold start)
      const errorMsg: ThreadMessage = {
        role: "assistant",
        content: [{ 
          type: "text", 
          text: `Error: ${err instanceof Error ? err.message : "Connection failed. Please wait for the backend to wake up."}` 
        }],
        id: `error-${Date.now()}`,
      };
      setMessages([...baseMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [settings, onRagDataUpdate]);

  const onNew = useCallback(async (message: any) => {
    const content = message.content[0]?.text || "";
    const userMsg: ThreadMessage = {
      role: "user",
      content: [{ type: "text", text: content }],
      id: "user-" + Math.random().toString(36).slice(2, 9) + Date.now(),
      parentId: messages[messages.length - 1]?.id || null,
    };
    
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    await processQuery(content, newMessages);
  }, [messages, processQuery]);

  const onReload = useCallback(async (messageId: string | null) => {
    if (!messageId) return;
    const index = messages.findIndex(m => m.id === messageId);
    if (index === -1) return;

    let prompt = "";
    let baseMessages: ThreadMessage[] = [];

    const targetMsg = messages[index];
    if (targetMsg.role === "assistant") {
      // Reloading Assistant: Remove it and find preceding User message
      const userMsg = messages[index - 1];
      if (!userMsg || userMsg.role !== "user") return;
      prompt = (userMsg.content[0]?.text as string) || "";
      baseMessages = messages.slice(0, index);
    } else {
      // Reloading User: Remove subsequent messages and redo this prompt
      prompt = (targetMsg.content[0]?.text as string) || "";
      baseMessages = messages.slice(0, index + 1);
    }

    setMessages(baseMessages);
    onRagDataUpdate(null);
    await processQuery(prompt, baseMessages);
  }, [messages, processQuery, onRagDataUpdate]);

  const onSwitchBranch = useCallback(async (messageId: string) => {
    const index = messages.findIndex(m => m.id === messageId);
    if (index === -1) return;
    
    // Reconstruct history up to this point
    const newPath = messages.slice(0, index + 1);
    setMessages(newPath);

    // Sync RAG Inspector with the metadata of the last assistant message in this branch
    const lastAssistantMsg = [...newPath].reverse().find(m => m.role === "assistant");
    if (lastAssistantMsg?.metadata?.ragData) {
      onRagDataUpdate(lastAssistantMsg.metadata.ragData);
    }
  }, [messages, onRagDataUpdate]);

  const convertMessage = useCallback((message: any) => {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      parentId: message.parentId || null,
      createdAt: message.createdAt || new Date(),
      ...(message.role === "assistant" 
        ? { status: { type: message.metadata?.isTyping ? "running" : "complete", reason: "stop" } as any } 
        : {}),
      metadata: { 
        ...message.metadata,
        custom: message.metadata || {} 
      },
    };
  }, []);

  const runtimeConfig = useMemo(() => ({
    messages,
    onNew,
    onReload,
    onSwitchBranch,
    isRunning: isLoading,
    convertMessage,
  }), [messages, onNew, onReload, onSwitchBranch, isLoading, convertMessage]);

  const runtime = useExternalStoreRuntime(runtimeConfig);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
