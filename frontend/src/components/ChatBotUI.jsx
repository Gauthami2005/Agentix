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
import ReactMarkdown from 'react-markdown';

import { sendMessageToAgent } from "../lib/api";

function tryParseRoadmap(roadmapStr) {
  if (!roadmapStr) return null;
  try {
    const data = JSON.parse(roadmapStr);
    if (data && data.roadmap_title && data.phases) {
      return data;
    }
  } catch (e) {
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
    <div className="mx-auto max-w-lg rounded-2xl border border-[#22252a] bg-[#121316] px-6 py-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#22252a] bg-[#1c1d22]">
        <Sparkles className="h-6 w-6 text-[#6366f1]" />
      </div>
      <h2 className="text-[#f3f4f6] text-lg font-semibold">
        Agentix AI Chat
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">
        Inspect repos. Watch tutorials. Crush LeetCode. Ask anything      </p>
    </div>
  );
}

function UserBubble({ message }) {
  return (
    <div className="flex justify-end gap-3">
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className="rounded-2xl rounded-br-md border border-[#22252a] bg-[#1c1d22] px-4 py-3 shadow-md">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#f3f4f6]">
            {message.text}
          </p>
        </div>
        <p className="mt-1.5 text-right font-mono text-[0.65rem] text-[#9ca3af]">
          {formatTime(message.timestamp)}
        </p>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#22252a] bg-[#121316]">
        <User className="h-4 w-4 text-[#9ca3af]" />
      </div>
    </div>
  );
}

function AgentBubble({ message }) {
  const parsedRoadmap = tryParseRoadmap(message.text);

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#22252a] bg-[#121316]">
        <Bot className="h-4 w-4 text-[#6366f1]" />
      </div>
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className="relative overflow-hidden rounded-2xl rounded-bl-md border border-[#22252a] bg-[#121316] pl-5 pr-4 py-3 shadow-md">
          <div
            className="absolute inset-y-0 left-0 w-1 bg-[#6366f1]"
            aria-hidden
          />
          {parsedRoadmap ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#6366f1] flex items-center gap-1.5">
                🗺️ {parsedRoadmap.roadmap_title} ({parsedRoadmap.duration})
              </h3>
              <p className="text-xs text-[#9ca3af]">
                Roadmap created successfully! Head over to the Roadmaps tab to view details and check off topics.
              </p>
              <div className="space-y-2 border-t border-[#22252a] pt-2.5">
                {parsedRoadmap.phases.map((phase, idx) => (
                  <div key={idx} className="text-xs space-y-1">
                    <p className="font-bold text-[#6366f1]">{phase.phase_title}</p>
                    {phase.description && <p className="text-slate-300 ml-2">{phase.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : message.chatMode === "youtube_recommendation" && message.youtubeMetadata ? (
            <div className="space-y-4">
              <div className="prose prose-invert max-w-none text-gray-100 text-sm leading-relaxed space-y-2">
                <ReactMarkdown
                  components={{
                    h3: ({ node, ...props }) => <h3 className="text-blue-400 font-bold text-base mt-4 mb-2" {...props} />,
                    strong: ({ node, ...props }) => <strong className="text-purple-400 font-semibold" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-2 text-gray-300" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 my-2 text-gray-300" {...props} />,
                    li: ({ node, ...props }) => <li className="marker:text-purple-500" {...props} />
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
              <div className="space-y-4 pt-2">
                {message.youtubeMetadata.map((video, idx) => (
                  <div key={idx} className="rounded-2xl border border-[#22252a] bg-[#141519] p-3.5 shadow-lg space-y-2">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.video_id}`}
                      className="w-full aspect-video rounded-xl border border-[#22252a]"
                      allowFullScreen
                      title={video.video_title}
                    />
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 leading-relaxed">
                        {video.video_title}
                      </h4>
                      <p className="font-mono text-[0.65rem] uppercase tracking-wider text-[#6366f1]">
                        📺 {video.channel_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-gray-100 text-sm leading-relaxed space-y-2">
              <ReactMarkdown
                components={{
                  h3: ({ node, ...props }) => <h3 className="text-blue-400 font-bold text-base mt-4 mb-2" {...props} />,
                  strong: ({ node, ...props }) => <strong className="text-purple-400 font-semibold" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-2 text-gray-300" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 my-2 text-gray-300" {...props} />,
                  li: ({ node, ...props }) => <li className="marker:text-purple-500" {...props} />
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <p className="mt-1.5 font-mono text-[0.65rem] text-[#9ca3af]">
          Agentix · {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#22252a] bg-[#121316]">
        <Bot className="h-4 w-4 text-[#6366f1]" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-[#22252a] bg-[#121316] px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-[#6366f1] [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[#6366f1] [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[#6366f1] [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export default function ChatBotUI({ user, setHasNewRoadmapNotification }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState(null);
  const [chatMode, setChatMode] = useState("general_chat");
  const [activePersona, setActivePersona] = useState("hackathon_partner");
  const [browserStatus, setBrowserStatus] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [expressRepos, setExpressRepos] = useState([]);

  const scrollAnchorRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    const fetchExpressRepos = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/repos");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.repositories)) {
            setExpressRepos(data.repositories);
          }
        }
      } catch (err) {
        console.error("Failed to fetch repositories from Express:", err);
      }
    };
    fetchExpressRepos();
  }, []);


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
        const { reply, sessionId: nextSessionId, chatMode: resChatMode, youtubeMetadata, status, problemName } = await sendMessageToAgent(
          trimmed,
          sessionId,
          chatMode,
          activePersona,
          selectedRepo,
        );

        setSessionId(nextSessionId);

        if (chatMode === "generate_roadmap" && setHasNewRoadmapNotification) {
          setHasNewRoadmapNotification(true);
        }

        if (status === "launching_browser") {
          setBrowserStatus(problemName || "LeetCode Problem");
          setTimeout(() => {
            setBrowserStatus(null);
          }, 6000);
        }

        const agentMessage = {
          id: createId(),
          role: "assistant",
          text: reply,
          timestamp: new Date(),
          chatMode: resChatMode,
          youtubeMetadata: youtubeMetadata,
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
    [isLoading, sessionId, chatMode, activePersona, selectedRepo],
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

  console.log("ChatBotUI User profile context:", user);

  return (
    <div className="relative flex h-full min-h-[600px] flex-col bg-void">
      {browserStatus && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none">
          <div className="rounded-xl border border-[#6366f1] bg-[#121316] p-4 text-center shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <p className="font-mono text-xs font-bold text-[#6366f1] uppercase tracking-widest">
              ⚡ Agentic Browser Hook Triggered
            </p>
            <p className="mt-1.5 text-sm font-semibold text-[#f3f4f6] leading-relaxed">
              Launching Chromium Window for "{browserStatus}"...
            </p>
          </div>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col">
        { }
        <header className="shrink-0 border-b border-[#22252a] bg-[#121316]/50 px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#22252a] bg-[#1c1d22]">
              <Zap className="h-5 w-5 text-[#6366f1]" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[#f3f4f6]">Agentix Chat</h1>
              <p className="font-mono text-[0.65rem] uppercase tracking-wider text-[#9ca3af]">
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

        { }
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

        { }
        <footer className="shrink-0 border-t border-[#22252a] bg-[#121316]/50 px-4 py-4 sm:px-6">
          <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
            { }
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isLoading}
                  onClick={() => submitMessage(prompt)}
                  className="rounded-full border border-[#22252a] bg-[#141519] px-3.5 py-1.5 text-xs font-medium text-[#9ca3af] transition hover:border-[#6366f1]/30 hover:bg-[#1c1e22] hover:text-[#f3f4f6] disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>

            { }
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setChatMode("general_chat")}
                className={`rounded-lg border px-4.5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${chatMode === "general_chat"
                  ? "border-[#6366f1]/30 bg-[#6366f1]/5 text-[#f3f4f6]"
                  : "border-[#22252a] bg-[#121316]/30 text-[#9ca3af] hover:border-[#6366f1]/30 hover:text-[#f3f4f6]"
                  }`}
              >
                💬 General Chat
              </button>
              <button
                type="button"
                onClick={() => setChatMode("generate_roadmap")}
                className={`rounded-lg border px-4.5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${chatMode === "generate_roadmap"
                  ? "border-[#6366f1]/30 bg-[#6366f1]/5 text-[#f3f4f6]"
                  : "border-[#22252a] bg-[#121316]/30 text-[#9ca3af] hover:border-[#6366f1]/30 hover:text-[#f3f4f6]"
                  }`}
              >
                🗺️ Build Roadmap
              </button>
              <button
                type="button"
                onClick={() => setChatMode("persona")}
                className={`rounded-lg border px-4.5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${chatMode === "persona"
                  ? "border-[#6366f1]/30 bg-[#6366f1]/5 text-[#f3f4f6]"
                  : "border-[#22252a] bg-[#121316]/30 text-[#9ca3af] hover:border-[#6366f1]/30 hover:text-[#f3f4f6]"
                  }`}
              >
                🎭 Agent Persona
              </button>
            </div>

            {chatMode === "persona" && (
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActivePersona("hackathon_partner")}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-300 cursor-pointer ${activePersona === "hackathon_partner"
                    ? "border-[#6366f1] bg-[#6366f1]/5 shadow-[0_0_15px_rgba(99,102,241,0.2)] text-[#f3f4f6]"
                    : "border-[#22252a] bg-[#121316]/30 text-[#9ca3af] hover:border-[#6366f1]/30 hover:text-[#f3f4f6]"
                    }`}
                >
                  🎭 Hackathon Partner
                </button>
                <button
                  type="button"
                  onClick={() => setActivePersona("brutally_honest")}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-300 cursor-pointer ${activePersona === "brutally_honest"
                    ? "border-[#6366f1] bg-[#6366f1]/5 shadow-[0_0_15px_rgba(99,102,241,0.2)] text-[#f3f4f6]"
                    : "border-[#22252a] bg-[#121316]/30 text-[#9ca3af] hover:border-[#6366f1]/30 hover:text-[#f3f4f6]"
                    }`}
                >
                  🔥 Honest Reviewer
                </button>
                <button
                  type="button"
                  onClick={() => setActivePersona("cyberpunk_os")}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-300 cursor-pointer ${activePersona === "cyberpunk_os"
                    ? "border-[#6366f1] bg-[#6366f1]/5 shadow-[0_0_15px_rgba(99,102,241,0.2)] text-[#f3f4f6]"
                    : "border-[#22252a] bg-[#121316]/30 text-[#9ca3af] hover:border-[#6366f1]/30 hover:text-[#f3f4f6]"
                    }`}
                >
                  🌐 Cyberpunk OS
                </button>
              </div>
            )}

            { }
            {/* Repo Selection Dropdown */}
            {chatMode === "persona" && activePersona === "hackathon_partner" && (
              <div className="mb-3 flex items-center gap-2">
                <label htmlFor="repo-select" className="text-xs font-mono text-[#9ca3af] flex items-center gap-1.5">
                  🎯 Focus Context:
                </label>
                <div className="relative">
                  <select
                    id="repo-select"
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="appearance-none rounded-lg border border-[#22252a] bg-[#141519] px-3.5 py-1.5 pr-8 text-xs font-semibold text-[#f3f4f6] shadow-md transition-all duration-300 hover:border-[#6366f1]/50 focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] focus:shadow-[0_0_10px_rgba(99,102,241,0.2)] focus:outline-none cursor-pointer"
                  >
                    {(() => {
                      const userRepos = expressRepos.length > 0
                        ? expressRepos
                        : Array.isArray(user?.github?.repositories)
                          ? user.github.repositories
                          : Array.isArray(user?.repositories)
                            ? user.repositories
                            : [];
                      const activeRepos = userRepos
                        .map(r => typeof r === "string" ? r : r?.name)
                        .filter(Boolean);
                      if (activeRepos.length === 0) {
                        return <option disabled>No repositories found</option>;
                      }
                      return (
                        <>
                          <option value="">All Projects</option>
                          {activeRepos.map((repoName) => (
                            <option key={repoName} value={repoName}>
                              {repoName}
                            </option>
                          ))}
                        </>
                      );
                    })()}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#9ca3af]">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            <div
              className={`rounded-2xl border bg-[#141519]/50 p-1 transition-all duration-300 ${isFocused
                ? "border-[#6366f1] shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                : "border-[#22252a] shadow-md"
                }`}
            >
              <div className="flex items-end gap-2 rounded-xl bg-void/40 p-2">
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
                  className="max-h-36 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-[#f3f4f6] placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
                  style={{ fieldSizing: "content" }}
                />

                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#22252a] bg-[#121316] text-[#9ca3af] hover:border-[#6366f1]/50 hover:text-[#f3f4f6] hover:bg-[#1c1e22] disabled:cursor-not-allowed disabled:opacity-40"
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
