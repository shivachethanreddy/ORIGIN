import { ArrowUp, Bot, Loader2, Sparkles, UserRound, Wand2 } from "lucide-react";
import AgentActivity from "./AgentActivity";

export default function ChatPanel({
  messages,
  prompt,
  setPrompt,
  onSubmit,
  isLoading,
  steps,
  generationStatus,
  hasGeneratedApp
}) {
  return (
    <aside className="flex min-h-0 flex-col border-r border-white/10 bg-panel/95">
      <header className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-signal via-violet to-coral text-white shadow-panel">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Co-Pilot</h1>
              <p className="text-xs text-slate-500">React app builder</p>
            </div>
          </div>
          <span className="rounded-full border border-limewash/30 bg-limewash/10 px-2.5 py-1 text-[11px] font-medium text-limewash">
            Live
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-signal/20 bg-signal/10 px-3 py-2 text-sm text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin text-signal" />
              {generationStatus || "Working"}
            </div>
          ) : null}
        </div>
      </div>

      <AgentActivity steps={steps} isLoading={isLoading} />

      <form onSubmit={onSubmit} className="border-t border-white/10 bg-panel px-4 py-4">
        <div className="rounded-2xl border border-white/10 bg-ink/90 p-2 shadow-panel">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={
              hasGeneratedApp
                ? "Add export, dark mode, charts..."
                : "Build student grading dashboard..."
            }
            rows={4}
            className="max-h-36 min-h-20 w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-slate-600"
          />
          <div className="flex items-center justify-between gap-3 px-1 pb-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Wand2 className="h-3.5 w-3.5" />
              <span>{hasGeneratedApp ? "Update" : "Create"}</span>
            </div>
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-ink transition hover:bg-signal disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              title="Generate"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </form>
    </aside>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-signal/20 bg-signal/10 text-signal">
          <Bot className="h-4 w-4" />
        </div>
      ) : null}
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm ${
          isUser ? "bg-white text-ink" : "border border-white/10 bg-white/[0.04] text-slate-200"
        }`}
      >
        {message.content}
      </div>
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet/20 text-violet">
          <UserRound className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  );
}
