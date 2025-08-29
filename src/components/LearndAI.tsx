// src/components/LearndAI.tsx
import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, MessageCircle, Send, Sparkles, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type AiAction = "ask" | "data_pack" | "trend";

type AiMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  action?: AiAction;
};

// --- Env & Supabase client (browser) ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const sb = createClient(supabaseUrl, supabaseKey);

// Functions base: https://<ref>.supabase.co  ->  https://<ref>.functions.supabase.co
const functionsBase =
  supabaseUrl?.includes(".supabase.co")
    ? supabaseUrl.replace(".supabase.co", ".functions.supabase.co")
    : "";

// Prefer the functions domain; fall back to the proxy path if needed (local dev)
const AI_ENDPOINT = functionsBase
  ? `${functionsBase}/ai-router`
  : "/functions/v1/ai-router";

export interface LearndAIProps {
  context?: Record<string, unknown>;
  anchor?: "right" | "left";
}

export default function LearndAI({ context, anchor = "right" }: LearndAIProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<AiAction>("ask");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [title, setTitle] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const { data, error } = await sb
        .from("ai_messages_view")
        .select("id, role, content, created_at, action")
        .order("created_at", { ascending: true })
        .limit(40);
      if (!error && data) setMessages(data as AiMessage[]);
    })();
  }, [open, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const disabled = !prompt.trim() || loading;

  const submit = async () => {
    if (!user) return;
    setLoading(true);

    const optimistic: AiMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      created_at: new Date().toISOString(),
      action,
    };
    setMessages((m) => [...m, optimistic]);

    try {
      const res = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey,
        },
        body: JSON.stringify({
          prompt,
          action,
          context: context ?? {},
          title: title || undefined,
        }),
      });

      if (!res.ok) throw new Error(`AI error: ${res.status}`);
      const payload = await res.json();
      const assistant: AiMessage = {
        id: payload.id ?? crypto.randomUUID(),
        role: "assistant",
        content: payload.result ?? "(No output)",
        created_at: new Date().toISOString(),
        action,
      };
      setMessages((m) => [...m, assistant]);
      setPrompt("");
    } catch (e: any) {
      const err: AiMessage = {
        id: crypto.randomUUID(),
        role: "system",
        content: e?.message || "Failed to reach AI service.",
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, err]);
    } finally {
      setLoading(false);
