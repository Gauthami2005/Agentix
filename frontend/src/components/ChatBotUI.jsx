import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bot,
  Loader2,
  SendHorizonal,
  Sparkles,
  User,
  Zap,
} from "lucide-react";

import { sendMessageToAgent } from "../lib/api";

function tryParseRoadmap(roadmapStr) {
  if (!roadmapStr) return null;
  try {
    const data = JSON.parse(roadmapStr);
    if (data && data.roadmap_title && data.phases) {
      return data;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

const QUICK_PROMPTS = [
  "Create a 30-day roadmap to master Dynamic Programming from scratch",
  "Give me a roadmap to learn System Design for beginner developers",
  "Build a study plan for cracking FAANG technical interviews in 3 months"
];

const MAX_CHARS = 2000;

function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatTime(date) {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function WelcomeBanner() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-cyan-neon/20 bg-slate-900/40 px-6 py-8 text-center shadow-[0_0_15px_rgba(6,182,212,0.1)] backdrop-blur-md">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-neon/30 bg-cyan-neon/10 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
        <Sparkles className="h-6 w-6 text-cyan-neon" />
      </div>
      <h2 className="bg-gradient-to-r from-cyan-neon to-emerald-neon bg-clip-text text-lg font-semibold text-transparent">
        Agentix AI Chat
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        LangGraph + MCP agent powered by Groq/Llama. Ask for roadmaps, LeetCode
        problems, or today&apos;s study plan.
      </p>
    </div>
  );
}

function UserBubble({ message }) {
  return (
    <div className="flex justify-end gap-3">
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className="rounded-2xl rounded-br-md border border-slate-700/60 bg-slate-800/90 px-4 py-3 shadow-lg">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">
            {message.text}
          </p>
        </div>
        <p className="mt-1.5 text-right font-mono text-[0.65rem] text-slate-500">
          {formatTime(message.timestamp)}
        </p>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-600/50 bg-slate-800">
        <User className="h-4 w-4 text-slate-400" />
      </div>
    </div>
  );
}

function AgentBubble({ message }) {
  const parsedRoadmap = tryParseRoadmap(message.text);

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-neon/30 bg-teal-950/80 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
        <Bot className="h-4 w-4 text-emerald-neon" />
      </div>
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className="relative overflow-hidden rounded-2xl rounded-bl-md border border-teal-800/40 bg-teal-950/50 pl-4 pr-4 py-3 shadow-[0_0_15px_rgba(6,182,212,0.08)] backdrop-blur-sm">
          <div
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-cyan-neon to-emerald-neon shadow-[0_0_8px_rgba(6,182,212,0.6)]"
            aria-hidden
          />
          {parsedRoadmap ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-cyan-neon flex items-center gap-1.5">
                🗺️ {parsedRoadmap.roadmap_title} ({parsedRoadmap.duration})
              </h3>
              <p className="text-xs text-slate-400">
                Roadmap created successfully! Head over to the Roadmaps tab to view details and check off topics.
              </p>
              <div className="space-y-2 border-t border-slate-800 pt-2.5">
                {parsedRoadmap.phases.map((phase, idx) => (
                  <div key={idx} className="text-xs space-y-1">
                    <p className="font-bold text-emerald-neon">{phase.phase_title}</p>
                    {phase.description && <p className="text-slate-300 ml-2">{phase.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
              {message.text}
            </p>
          )}
        </div>
        <p className="mt-1.5 font-mono text-[0.65rem] text-slate-500">
          Agentix · {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-neon/30 bg-teal-950/80">
        <Bot className="h-4 w-4 text-emerald-neon" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-teal-800/40 bg-teal-950/50 px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-neon [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-neon [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-neon [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export default function ChatBotUI({ setHasNewRoadmapNotification }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState(null);
  const [chatMode, setChatMode] = useState("general_chat");

  const scrollAnchorRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const submitMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      setInput("");

      const userMessage = {
        id: createId(),
        role: "user",
        text: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const { reply, sessionId: nextSessionId } = await sendMessageToAgent(
          trimmed,
          sessionId,
          chatMode,
        );

        setSessionId(nextSessionId);

        if (chatMode === "generate_roadmap" && setHasNewRoadmapNotification) {
          setHasNewRoadmapNotification(true);
        }

        const agentMessage = {
          id: createId(),
          role: "assistant",
          text: reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, agentMessage]);
      } catch (err) {
        const detail = err instanceof Error ? err.message : "Something went wrong";
        setError(detail);
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "assistant",
            text: `⚠️ Agent unavailable. Ensure the FastAPI server is running on port 8000.\n\n${detail}`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        textareaRef.current?.focus();
      }
    },
    [isLoading, sessionId, chatMode],
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMessage(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage(input);
    }
  };

  const charCount = input.length;
  const nearLimit = charCount > MAX_CHARS * 0.85;

  return (
    <div className="flex h-full min-h-[600px] flex-col bg-void">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(6,182,212,0.06),transparent),radial-gradient(ellipse_50%_40%_at_100%_80%,rgba(139,92,246,0.04),transparent)]"
        aria-hidden
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <header className="shrink-0 border-b border-cyan-500/10 bg-slate-900/40 px-4 py-4 backdrop-blur-md sm:px-6">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-neon/30 bg-cyan-neon/10 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
              <Zap className="h-5 w-5 text-cyan-neon" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-100">Agentix Chat</h1>
              <p className="font-mono text-[0.65rem] uppercase tracking-wider text-slate-500">
                POST /api/chat · LangGraph MCP
              </p>
            </div>
            {sessionId && (
              <span className="ml-auto hidden rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 font-mono text-[0.6rem] text-purple-300 sm:inline">
                session · {sessionId.slice(0, 8)}…
              </span>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto flex max-w-4xl flex-col gap-6">
            {messages.length === 0 && !isLoading && <WelcomeBanner />}

            {messages.map((msg) =>
              msg.role === "user" ? (
                <UserBubble key={msg.id} message={msg} />
              ) : (
                <AgentBubble key={msg.id} message={msg} />
              ),
            )}

            {isLoading && <TypingIndicator />}

            <div ref={scrollAnchorRef} className="h-px shrink-0" aria-hidden />
          </div>
        </div>

        {/* Input dock */}
        <footer className="shrink-0 border-t border-cyan-500/10 bg-slate-900/40 px-4 py-4 backdrop-blur-md sm:px-6">
          <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
            {/* Quick-action chips */}
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isLoading}
                  onClick={() => submitMessage(prompt)}
                  className="rounded-full border border-cyan-500/20 bg-slate-800/60 px-3.5 py-1.5 text-xs font-medium text-slate-300 shadow-[0_0_15px_rgba(6,182,212,0.1)] transition hover:border-cyan-neon/40 hover:bg-cyan-neon/10 hover:text-cyan-neon hover:shadow-[0_0_18px_rgba(6,182,212,0.2)] disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Mode selection bar */}
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setChatMode("general_chat")}
                className={`rounded-lg border px-4.5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  chatMode === "general_chat"
                    ? "border-cyan-neon/30 bg-slate-900/60 text-cyan-neon shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                💬 General Chat
              </button>
              <button
                type="button"
                onClick={() => setChatMode("generate_roadmap")}
                className={`rounded-lg border px-4.5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  chatMode === "generate_roadmap"
                    ? "border-cyan-neon/30 bg-slate-900/60 text-cyan-neon shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                🗺️ Build Roadmap
              </button>
            </div>

            {/* Input container with focus glow */}
            <div
              className={`rounded-2xl border bg-slate-900/50 p-1 transition-all duration-300 backdrop-blur-md ${isFocused
                ? "border-cyan-neon/50 shadow-[0_0_20px_rgba(6,182,212,0.25),0_0_40px_rgba(139,92,246,0.08)]"
                : "border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                }`}
            >
              <div className="flex items-end gap-2 rounded-xl bg-void/60 p-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Agentix… (Shift+Enter for new line)"
                  rows={1}
                  disabled={isLoading}
                  className="max-h-36 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
                  style={{ fieldSizing: "content" }}
                />

                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-neon/40 bg-gradient-to-br from-cyan-neon/20 to-emerald-neon/20 text-cyan-neon shadow-[0_0_15px_rgba(6,182,212,0.2)] transition hover:border-emerald-neon/50 hover:from-cyan-neon/30 hover:to-emerald-neon/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizonal className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between px-3 pb-2 pt-1">
                <p className="font-mono text-[0.65rem] text-slate-500">
                  ~{Math.ceil(charCount / 4)} tokens · Enter to send
                </p>
                <p
                  className={`font-mono text-[0.65rem] ${nearLimit ? "text-amber-400" : "text-slate-500"
                    }`}
                >
                  {charCount}/{MAX_CHARS}
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-2 text-center text-xs text-amber-400/90">{error}</p>
            )}
          </form>
        </footer>
      </div>
    </div>
  );
}
