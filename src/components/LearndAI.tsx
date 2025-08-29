// src/components/LearndAI.tsx
import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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

// Supabase (browser) — relies on Vite env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const sb = createClient(supabaseUrl, supabaseKey);

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
    // Load last messages (optional history)
    const load = async () => {
      const { data, error } = await sb
        .from("ai_messages_view")
        .select("id, role, content, created_at, action")
        .order("created_at", { ascending: true })
        .limit(40);

      if (!error && data) setMessages(data as AiMessage[]);
    };
    load();
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
      const res = await fetch("/functions/v1/ai-router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    }
  };

  const clear = async () => {
    setMessages([]);
    await fetch("/functions/v1/ai-router", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "clear" }),
    });
  };

  return (
    <TooltipProvider>
      <div className="fixed bottom-5 right-5 z-50 print:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-xl"
                  aria-label="Open LearndAI"
                >
                  <Sparkles className="h-6 w-6" />
                </Button>
              </SheetTrigger>
            </TooltipTrigger>
            {/* Keep tooltip short per your preference */}
            <TooltipContent>AI</TooltipContent>
          </Tooltip>

          <SheetContent side={anchor} className="p-0 w-[560px] max-w-[100vw]">
            <SheetHeader className="px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <SheetTitle>LearndAI</SheetTitle>
              </div>
            </SheetHeader>

            <div className="flex flex-col h-[calc(100vh-3.5rem)]">
              {/* History */}
              <ScrollArea className="flex-1 px-4" ref={scrollRef as any}>
                <div className="space-y-4 py-4">
                  {messages.map((m) => (
                    <div key={m.id} className="flex gap-3">
                      <div
                        className={`text-xs mt-1 font-medium ${
                          m.role === "assistant"
                            ? "text-primary"
                            : m.role === "system"
                            ? "text-yellow-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {m.role}
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed flex-1">
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Composer */}
              <div className="border-t p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="action">Action</Label>
                    <Select
                      value={action}
                      onValueChange={(v: AiAction) => setAction(v)}
                    >
                      <SelectTrigger id="action">
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ask">Ask / Explain</SelectItem>
                        <SelectItem value="data_pack">Build Data Pack</SelectItem>
                        <SelectItem value="trend">Trend Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="title">Optional title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Q3 Trends (Savencia)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="What do you want LearndAI to do? (It can query Supabase and return artifacts like CSV, JSON, or summaries.)"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button variant="secondary" size="sm" onClick={clear} disabled={loading}>
                    <Trash2 className="h-4 w-4 mr-1" /> Clear
                  </Button>
                  <Button onClick={submit} disabled={disabled}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Working…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
