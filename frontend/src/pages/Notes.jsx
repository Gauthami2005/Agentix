import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Tag, BookOpen, Code, Edit3, X, Eye, FileText, Check, Copy } from "lucide-react";

// Code highlighter function
function highlightCode(code, lang) {
  if (!code) return "";

  let escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Strings
  escaped = escaped.replace(/(["'`])(.*?)\1/g, '<span class="text-emerald-400">$1$2$1</span>');

  // Comments
  escaped = escaped.replace(/(\/\/.*|\/\*[\s\S]*?\*\/|#.*)/g, '<span class="text-gray-500 italic">$1</span>');

  // Keywords
  const keywords = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|import|export|class|new|this|typeof|instanceof|await|async|default|from|try|catch|finally|throw|def|print)\b/g;
  escaped = escaped.replace(keywords, '<span class="text-[#ff79c6] font-semibold">$1</span>');

  // Functions
  escaped = escaped.replace(/\b(\w+)(?=\()/g, '<span class="text-[#50fa7b]">$1</span>');

  // Numbers
  escaped = escaped.replace(/\b(\d+)\b/g, '<span class="text-[#bd93f9]">$1</span>');

  return escaped;
}

// Code Block with Copy
function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative border border-[#22252a] rounded-xl overflow-hidden bg-[#050608] my-3 font-mono">
      <div className="flex items-center justify-between px-4 py-2 bg-[#121316] border-b border-[#22252a] text-[10px] uppercase font-mono tracking-wider text-[#9ca3af]">
        <span>{lang || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-[#f3f4f6] transition cursor-pointer text-[#6366f1]"
        >
          <Copy className="h-3 w-3" />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed text-[#f3f4f6]">
        <code dangerouslySetInnerHTML={{ __html: highlightCode(code, lang) }} />
      </pre>
    </div>
  );
}

// Markdown Paragraph parser
function parseInlineStyles(text) {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\"/g, '<strong class="text-[#f3f4f6] font-semibold">$1</strong>')
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-[#1c1d22] border border-[#22252a] font-mono text-[10px] text-[#ff79c6]">$1</code>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function MarkdownParagraph({ text }) {
  if (!text.trim()) return null;

  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        if (line.startsWith("### ")) {
          return <h4 key={idx} className="text-sm font-bold text-[#f3f4f6] mt-4 mb-2">{line.slice(4)}</h4>;
        }
        if (line.startsWith("## ")) {
          return <h3 key={idx} className="text-base font-bold text-[#f3f4f6] mt-5 mb-2 border-b border-[#22252a] pb-1">{line.slice(3)}</h3>;
        }
        if (line.startsWith("# ")) {
          return <h2 key={idx} className="text-lg font-bold text-[#6366f1] mt-6 mb-3">{line.slice(2)}</h2>;
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <ul key={idx} className="list-disc pl-5 text-xs text-[#9ca3af] space-y-0.5">
              <li>{parseInlineStyles(line.slice(2))}</li>
            </ul>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          const content = line.replace(/^\d+\.\s/, "");
          return (
            <ol key={idx} className="list-decimal pl-5 text-xs text-[#9ca3af] space-y-0.5">
              <li>{parseInlineStyles(content)}</li>
            </ol>
          );
        }
        return <p key={idx} className="text-xs text-[#9ca3af] leading-relaxed">{parseInlineStyles(line)}</p>;
      })}
    </div>
  );
}

// Main NotePreview Component
function NotePreview({ content }) {
  if (!content) return null;

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-4 text-xs text-[#9ca3af]">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : "";
          const code = match ? match[2] : part.slice(3, -3);
          return <CodeBlock key={index} code={code.trim()} lang={lang} />;
        } else {
          return <MarkdownParagraph key={index} text={part} />;
        }
      })}
    </div>
  );
}

const CATEGORIES = [
  { name: "DSA", color: "from-[#10b981] to-[#059669]", border: "border-[#10b981]/30 hover:border-[#10b981]", text: "text-[#10b981]", bg: "bg-[#10b981]/10" },
  { name: "System Design", color: "from-[#6366f1] to-[#4f46e5]", border: "border-[#6366f1]/30 hover:border-[#6366f1]", text: "text-[#6366f1]", bg: "bg-[#6366f1]/10" },
  { name: "Project Idea", color: "from-[#f59e0b] to-[#d97706]", border: "border-[#f59e0b]/30 hover:border-[#f59e0b]", text: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
  { name: "General Notes", color: "from-[#ec4899] to-[#db2777]", border: "border-[#ec4899]/30 hover:border-[#ec4899]", text: "text-[#ec4899]", bg: "bg-[#ec4899]/10" }
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://agentix-backend-zvm0.onrender.com";

async function fetchFromApi(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/notes${endpoint}`, {
    ...options,
    headers,
    credentials: "include"
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  // Editor/Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("DSA");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await fetchFromApi("");
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      } else {
        throw new Error("Failed to load notes from backend");
      }
    } catch (err) {
      console.error(err);
      setError("Using offline local storage");
      const saved = localStorage.getItem("agentix_notes");
      if (saved) {
        setNotes(JSON.parse(saved));
      } else {
        // Fallback mock data if completely empty
        const defaultNotes = [
          {
            id: "1",
            title: "Dijkstra's Shortest Path Algorithm",
            category: "DSA",
            content: "Dijkstra's algorithm finds the shortest path from a source to all other vertices in a weighted graph.\n\n```javascript\n// Time Complexity: O((V + E) log V)\nfunction dijkstra(graph, start) {\n  let distances = {};\n  let pq = new PriorityQueue();\n  // ...\n}\n```",
            tags: ["graph", "shortest-path", "greedy"],
            createdAt: new Date("2026-07-20").toISOString()
          },
          {
            id: "2",
            title: "Scalable Notification System Architecture",
            category: "System Design",
            content: "### Components:\n1. **API Gateway**: Rate limiting & auth.\n2. **Message Queue**: Kafka/RabbitMQ for buffering notifications.\n3. **Notification Service**: Processing templates & sending.\n4. **Database**: Cache settings in Redis, store logs in PostgreSQL.",
            tags: ["scale", "kafka", "redis", "system-design"],
            createdAt: new Date("2026-07-21").toISOString()
          }
        ];
        setNotes(defaultNotes);
        localStorage.setItem("agentix_notes", JSON.stringify(defaultNotes));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingNote(null);
    setTitle("");
    setCategory("DSA");
    setContent("");
    setTagInput("");
    setPreviewMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setCategory(note.category);
    setContent(note.content);
    setTagInput(note.tags.join(", "));
    setPreviewMode(false);
    setIsModalOpen(true);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tagInput
      .split(",")
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const notePayload = {
      title,
      category,
      content,
      tags: parsedTags,
      ...(editingNote ? { id: editingNote.id, createdAt: editingNote.createdAt } : {})
    };

    try {
      const res = await fetchFromApi("", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notePayload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.notes) {
          setNotes(data.notes);
          localStorage.setItem("agentix_notes", JSON.stringify(data.notes));
        } else {
          fetchNotes();
        }
      } else {
        throw new Error("Failed to save note to backend");
      }
    } catch (err) {
      console.error(err);
      let updatedNotes;
      if (editingNote) {
        updatedNotes = notes.map(n => n.id === editingNote.id ? { ...n, ...notePayload } : n);
      } else {
        const newNote = { ...notePayload, id: Date.now().toString(), createdAt: new Date().toISOString() };
        updatedNotes = [newNote, ...notes];
      }
      setNotes(updatedNotes);
      localStorage.setItem("agentix_notes", JSON.stringify(updatedNotes));
    }

    setIsModalOpen(false);
  };

  const handleDeleteNote = async (id, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        const res = await fetchFromApi(`/${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          const updatedNotes = await res.json();
          setNotes(updatedNotes);
          localStorage.setItem("agentix_notes", JSON.stringify(updatedNotes));
        } else {
          throw new Error("Failed to delete note");
        }
      } catch (err) {
        console.error(err);
        const updatedNotes = notes.filter(n => n.id !== id);
        setNotes(updatedNotes);
        localStorage.setItem("agentix_notes", JSON.stringify(updatedNotes));
      }
    }
  };

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === "All" || note.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getCategoryDetails = (catName) => {
    return CATEGORIES.find(c => c.name === catName) || CATEGORIES[3];
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-[#0b0c0e]">
      {/* Header section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#22252a] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f3f4f6] flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[#6366f1]" />
            Notes & Code Snippets
          </h1>
          <p className="text-sm text-[#9ca3af] mt-1 font-mono">
            Your second brain for syntax, snippets, and system architecture.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-2.5 rounded-xl font-medium shadow-[0_0_15px_rgba(99,102,241,0.4)] transition cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Create New Note
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Search by keyword, tag, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#121316] border border-[#22252a] rounded-xl text-sm text-[#f3f4f6] placeholder-[#9ca3af] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]"
          />
        </div>

        <div className="flex gap-2">
          {["All", ...CATEGORIES.map(c => c.name)].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono tracking-wide border transition cursor-pointer ${selectedCategoryFilter === cat
                  ? "bg-[#6366f1]/20 border-[#6366f1] text-[#f3f4f6]"
                  : "bg-[#121316] border-[#22252a] text-[#9ca3af] hover:text-[#f3f4f6]"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of note cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-[#22252a] rounded-2xl bg-[#121316]/50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#22252a] border-t-[#6366f1] mb-3" />
          <p className="text-xs text-[#9ca3af] font-mono">Synchronizing knowledge base...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-[#22252a] rounded-2xl bg-[#121316]/50">
          <FileText className="h-10 w-10 text-[#9ca3af] mb-3 opacity-50" />
          <h3 className="text-base font-semibold text-[#f3f4f6]">No notes found</h3>
          <p className="text-xs text-[#9ca3af] mt-1 text-center max-w-sm">
            Try adjusting your search query, selecting another category, or creating a new note to start building your knowledge base.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => {
            const catInfo = getCategoryDetails(note.category);
            return (
              <div
                key={note.id}
                onClick={() => handleOpenEditModal(note)}
                className={`group relative flex flex-col justify-between h-[320px] bg-[#121316] border rounded-2xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.4)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] cursor-pointer ${catInfo.border}`}
              >
                {/* Header info */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase font-mono ${catInfo.text} ${catInfo.bg}`}>
                      {note.category}
                    </span>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-1.5 rounded-lg text-[#9ca3af] hover:text-red-400 hover:bg-red-950/20 transition cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-[#f3f4f6] line-clamp-1 group-hover:text-[#6366f1] transition mb-2">
                    {note.title}
                  </h3>

                  {/* Snippet text formatted */}
                  <div className="flex-1 overflow-y-auto text-[11px] scrollbar-none pr-1">
                    <NotePreview content={note.content} />
                  </div>
                </div>

                {/* Footer tags */}
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#22252a]/50 mt-3">
                  {note.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1c1d22] text-[#9ca3af] text-[10px] font-mono border border-[#22252a]"
                    >
                      <Tag className="h-2.5 w-2.5 text-[#6366f1]" />
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="text-[10px] font-mono text-[#9ca3af] self-center ml-1">
                      +{note.tags.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050608]/85 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-[#121316] border border-[#22252a] rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#22252a]">
              <h2 className="text-lg font-bold text-[#f3f4f6] flex items-center gap-2">
                {editingNote ? <Edit3 className="h-5 w-5 text-[#6366f1]" /> : <Plus className="h-5 w-5 text-[#6366f1]" />}
                {editingNote ? "Edit Note / Snippet" : "Create New Note / Snippet"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9ca3af] hover:text-[#f3f4f6] p-1 rounded-lg hover:bg-[#1c1d22] transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNote} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Title & Category Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-mono text-[#9ca3af] uppercase tracking-wider">Note Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a title..."
                    className="w-full px-4 py-2.5 bg-[#0b0c0e] border border-[#22252a] rounded-xl text-sm text-[#f3f4f6] focus:outline-none focus:border-[#6366f1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#9ca3af] uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0b0c0e] border border-[#22252a] rounded-xl text-sm text-[#f3f4f6] focus:outline-none focus:border-[#6366f1]"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tag input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#9ca3af] uppercase tracking-wider">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. dynamic-programming, graph, react"
                  className="w-full px-4 py-2.5 bg-[#0b0c0e] border border-[#22252a] rounded-xl text-sm text-[#f3f4f6] focus:outline-none focus:border-[#6366f1]"
                />
              </div>

              {/* Content area & Preview toggle */}
              <div className="space-y-1.5 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono text-[#9ca3af] uppercase tracking-wider">
                    Content (Markdown / Code Supported)
                  </label>

                  <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex items-center gap-1.5 text-xs font-mono text-[#6366f1] hover:text-[#4f46e5] px-2.5 py-1 bg-[#6366f1]/10 rounded-lg border border-[#6366f1]/20 cursor-pointer"
                  >
                    {previewMode ? (
                      <>
                        <Code className="h-3.5 w-3.5" />
                        Edit Mode
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        Preview Mode
                      </>
                    )}
                  </button>
                </div>

                {previewMode ? (
                  <div className="w-full h-80 p-5 bg-[#050608] border border-[#22252a] rounded-xl overflow-y-auto">
                    {content ? (
                      <NotePreview content={content} />
                    ) : (
                      <span className="text-xs text-[#9ca3af] italic font-mono">Empty buffer. Go back to Edit mode to write content.</span>
                    )}
                  </div>
                ) : (
                  <div className="relative border border-[#22252a] rounded-xl overflow-hidden bg-[#050608] flex flex-col">
                    {/* Mock OS Header bar inside active editor */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#121316] border-b border-[#22252a]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] opacity-80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] opacity-80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] opacity-80" />
                        <span className="ml-2 text-[10px] font-mono text-[#9ca3af] tracking-wide">notes_buffer.md</span>
                      </div>
                      <span className="text-[9px] font-mono text-[#6366f1] uppercase tracking-widest bg-[#6366f1]/15 px-2 py-0.5 rounded border border-[#6366f1]/25">
                        UTF-8
                      </span>
                    </div>

                    <textarea
                      required
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your note body or code snippets here... Use markdown or code blocks."
                      rows={12}
                      className="w-full p-4 bg-transparent text-xs text-[#f3f4f6] font-mono focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#22252a]/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#22252a] text-sm text-[#9ca3af] hover:text-[#f3f4f6] bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-[0_0_15px_rgba(99,102,241,0.4)] transition cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
