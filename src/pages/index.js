import { motion } from "framer-motion";
import {
  ArrowUp,
  Bot,
  Boxes,
  Edit3,
  FolderKanban,
  Layers3,
  Loader2,
  Orbit,
  Settings2,
  Sparkles,
} from "lucide-react";
import Head from "next/head";
import { useCallback, useRef, useState } from "react";
import OriginBrand, { OriginSplash } from "../components/OriginBrand";
import ClarificationPanel from "../components/ClarificationPanel";
import { formatClarificationAnswer } from "../utils/clarification";
import dynamic from "next/dynamic";

const PreviewPanel = dynamic(() => import("../components/PreviewPanel"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-white/15 bg-black/80 text-sm text-zinc-400">
      Loading preview runtime…
    </div>
  )
});
const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  content: "What should we build?"
};

const PREVIEW_SCROLL_OFFSET = 112;

function getScrollParent(node) {
  let parent = node?.parentElement;

  while (parent) {
    const { overflowY } = window.getComputedStyle(parent);
    const canScroll =
      /(auto|scroll|overlay)/.test(overflowY) &&
      parent.scrollHeight > parent.clientHeight + 1;

    if (canScroll) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return document.scrollingElement || document.documentElement;
}

function scrollToPreviewSection() {
  const target =
    document.getElementById("live-preview") ||
    document.querySelector("[data-preview-section]");

  if (!target) return;

  const scrollParent = getScrollParent(target);
  const targetTop = target.getBoundingClientRect().top;

  if (scrollParent === document.documentElement || scrollParent === document.body) {
    const top = Math.max(0, targetTop + window.pageYOffset - PREVIEW_SCROLL_OFFSET);
    window.scrollTo({ top, behavior: "smooth" });
    return;
  }

  const top = Math.max(
    0,
    targetTop + scrollParent.scrollTop - PREVIEW_SCROLL_OFFSET
  );

  scrollParent.scrollTo({ top, behavior: "smooth" });
}

export default function Home() {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [blueprint, setBlueprint] = useState(null);
  const [steps, setSteps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(1);
  const [generationStatus, setGenerationStatus] = useState("");
  const [hasUserGeneratedApp, setHasUserGeneratedApp] = useState(false);
  const [cursor, setCursor] = useState({ x: 50, y: 18 });
  const [showSplash, setShowSplash] = useState(true);
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeMode, setActiveMode] = useState("component");
  const [clarificationSession, setClarificationSession] = useState(null);
  const previewSectionRef = useRef(null);
  const hasGeneratedApp = hasUserGeneratedApp && Boolean(code && blueprint);
  const lastStep = steps[steps.length - 1];
  const awaitingClarification = Boolean(clarificationSession?.questions?.length);

  const focusPreviewSection = useCallback(() => {
    scrollToPreviewSection();
    window.requestAnimationFrame(scrollToPreviewSection);
    window.setTimeout(scrollToPreviewSection, 120);
  }, []);

  async function runGenerate({
    userPrompt,
    conversationHistory,
    clarificationAnswer = "",
    requirements = null
  }) {
    setGenerationStatus(clarificationAnswer ? "Generating App.js" : hasGeneratedApp ? "Routing request" : "Building app");

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userPrompt,
        conversationHistory,
        clarificationAnswer: clarificationAnswer || undefined,
        requirements: requirements || undefined,
        ...(hasGeneratedApp ? { currentCode: code, currentBlueprint: blueprint } : {})
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Generation failed");
    }

    setCode(payload.code || "");
    setBlueprint(payload.blueprint || null);
    setSteps(payload.steps || []);
    setHasUserGeneratedApp(Boolean(payload.code?.trim()));
    setRefreshKey((value) => value + 1);
    setGenerationStatus(payload.mode === "update" ? "Updated" : "Rebuilt");
    setClarificationSession(null);

    const assistantMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: payload.message || "Preview refreshed."
    };
    const nextMessages = conversationHistory.concat(assistantMessage);
    const shouldCreateProject = !activeProjectId || payload.mode === "create";
    const projectId = shouldCreateProject ? crypto.randomUUID() : activeProjectId;
    const projectSnapshot = {
      id: projectId,
      title: payload.blueprint?.name || titleFromPrompt(userPrompt),
      prompt: userPrompt,
      code: payload.code || "",
      blueprint: payload.blueprint || null,
      steps: payload.steps || [],
      messages: nextMessages,
      updatedAt: Date.now(),
      mode: payload.mode || "create"
    };
    setActiveProjectId(projectId);
    setProjects((current) => upsertProject(current, projectSnapshot));
    setMessages(nextMessages);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || isLoading || awaitingClarification) return;

    const userMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const conversationHistory = messages
      .filter((message) => message.id !== "welcome")
      .concat(userMessage);

    setMessages((current) => [...current, userMessage]);
    setPrompt("");
    setIsLoading(true);
    setGenerationStatus("Understanding your idea");

    try {
      const clarifyResponse = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPrompt: trimmed,
          conversationHistory,
          ...(hasGeneratedApp ? { currentCode: code, currentBlueprint: blueprint } : {})
        })
      });

      const clarifyPayload = await clarifyResponse.json();
      if (!clarifyResponse.ok) {
        throw new Error(clarifyPayload.error || "Clarification failed");
      }

      if (clarifyPayload.skipClarification) {
        await runGenerate({ userPrompt: trimmed, conversationHistory });
        return;
      }

      setSteps(clarifyPayload.steps || []);
      setClarificationSession({
        userPrompt: trimmed,
        questions: clarifyPayload.questions,
        requirements: clarifyPayload.requirements,
        answers: clarifyPayload.questions.map(() => ""),
        conversationHistory
      });
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Before I generate App.js, pick options below that match your idea (or skip to use defaults)."
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `I couldn't continue: ${error.message}`
        }
      ]);
    } finally {
      setIsLoading(false);
      setGenerationStatus("");
    }
  }

  async function handleClarificationSubmit(event) {
    event.preventDefault();
    if (!clarificationSession || isLoading) return;

    const clarificationAnswer = formatClarificationAnswer(
      clarificationSession.questions,
      clarificationSession.answers
    );

    setIsLoading(true);
    try {
      await runGenerate({
        userPrompt: clarificationSession.userPrompt,
        conversationHistory: clarificationSession.conversationHistory,
        clarificationAnswer,
        requirements: clarificationSession.requirements
      });
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `I couldn't complete that generation: ${error.message}`
        }
      ]);
    } finally {
      setIsLoading(false);
      setGenerationStatus("");
    }
  }

  async function handleSkipClarification() {
    if (!clarificationSession || isLoading) return;

    setIsLoading(true);
    try {
      await runGenerate({
        userPrompt: clarificationSession.userPrompt,
        conversationHistory: clarificationSession.conversationHistory,
        clarificationAnswer: "User skipped clarification; infer reasonable defaults from the original prompt.",
        requirements: clarificationSession.requirements
      });
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `I couldn't complete that generation: ${error.message}`
        }
      ]);
    } finally {
      setIsLoading(false);
      setGenerationStatus("");
    }
  }

  function handleClarificationAnswerChange(index, value) {
    setClarificationSession((current) => {
      if (!current) return current;
      const answers = [...current.answers];
      answers[index] = value;
      return { ...current, answers };
    });
  }

  return (
    <>
      <Head>
        <title>ORIGIN</title>
        <meta
          name="description"
          content="Hackathon MVP for controlled component-level React generation with live Sandpack preview."
        />
      </Head>

      {showSplash ? <OriginSplash onFinish={() => setShowSplash(false)} /> : null}

      <main
        className="min-h-screen overflow-x-hidden bg-[#050711] text-white"
        onMouseMove={(event) => {
          setCursor({
            x: Math.round((event.clientX / window.innerWidth) * 100),
            y: Math.round((event.clientY / window.innerHeight) * 100)
          });
        }}
      >
        <div className="cosmic-grid fixed inset-0" />
        <div className="mesh-field fixed inset-0" />
        <div className="particle-field fixed inset-0" />
        <div
          className="pointer-events-none fixed inset-0 opacity-75 transition-[background] duration-300"
          style={{
            background: `radial-gradient(circle at ${cursor.x}% ${cursor.y}%, rgba(255, 255, 255, 0.16), transparent 26%)`
          }}
        />


        <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center px-4 pb-12 pt-28 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98, filter: "blur(18px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            className="flex flex-col items-center text-center"
          >
            {!showSplash ? <OriginBrand /> : null}

            <h1 className="max-w-5xl text-balance text-5xl font-semibold tracking-normal sm:text-7xl lg:text-8xl">
              <span className="hologram-text">Text to App</span>
              <span className="mt-2 block text-white/95">in Minutes</span>
            </h1>
            <p className="mt-7 max-w-3xl text-lg font-medium leading-8 text-slate-400 sm:text-xl">
              An AI-native command center that turns plain English into live Tools.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 32, filter: "blur(18px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.85, delay: 0.12, ease: "easeOut" }}
            onSubmit={handleSubmit}
            className="mt-12 w-full max-w-5xl"
          >
            <div className="glass-command group relative overflow-hidden rounded-[30px] border border-white/15 bg-black/45 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_40px_120px_rgba(0,0,0,0.52)] backdrop-blur-2xl">
              <div className="animated-border" />
              <div className="relative flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 gap-2">
                  <ModeTab
                    active={activeMode === "component"}
                    icon={Layers3}
                    label="Component App"
                    onClick={() => setActiveMode("component")}
                  />
                  <ModeTab
                    active={activeMode === "preview"}
                    icon={Boxes}
                    label="Live Preview"
                    onClick={() => {
                      setActiveMode("preview");
                      focusPreviewSection();
                    }}
                  />
                </div>
                <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Prompt
                </span>
              </div>

                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={
                    hasGeneratedApp
                      ? "Add export button... or: Build a BMI calculator instead"
                      : "Build a BMI calculator with height, weight, and category result..."
                  }
                  rows={5}
                  className="h-44 w-full resize-none bg-transparent px-6 py-7 text-xl font-semibold leading-8 text-white outline-none placeholder:text-slate-500 sm:px-8 sm:text-2xl"
                />

              <div className="relative flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <ToolPill icon={Bot} label="llama" active />
                  <ToolPill
                    icon={Settings2}
                    label={hasGeneratedApp ? "Smart update / rebuild" : "Create"}
                  />
                </div>

                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={isLoading || !prompt.trim() || awaitingClarification}
                  className="premium-button inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold text-black transition disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                  {isLoading
                    ? generationStatus || "Building"
                    : awaitingClarification
                      ? "Answer questions below"
                      : "Continue"}
                </motion.button>
              </div>
            </div>
          </motion.form>

          {clarificationSession ? (
            <ClarificationPanel
              userPrompt={clarificationSession.userPrompt}
              questions={clarificationSession.questions}
              answers={clarificationSession.answers}
              onAnswerChange={handleClarificationAnswerChange}
              onSubmit={handleClarificationSubmit}
              onSkip={handleSkipClarification}
              isLoading={isLoading}
            />
          ) : null}

          <AgentPulse isLoading={isLoading} lastStep={lastStep} generationStatus={generationStatus} />

          <div
            ref={previewSectionRef}
            id="live-preview"
            data-preview-section
            className="mt-9 w-full max-w-7xl scroll-mt-24"
          >
            <motion.div
              initial={{ opacity: 0, y: 36, filter: "blur(18px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.85, delay: 0.22, ease: "easeOut" }}
              className="flex h-[min(960px,calc(100vh-9.5rem))] min-h-[min(720px,calc(100vh-9.5rem))] w-full overflow-hidden rounded-[30px] border border-white/12 bg-white/[0.045] p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_48px_140px_rgba(0,0,0,0.58)] backdrop-blur-2xl"
            >
              <PreviewPanel
                code={code}
                blueprint={blueprint}
                hasGeneratedApp={hasGeneratedApp}
                refreshKey={refreshKey}
                onForceRefresh={() => setRefreshKey((value) => value + 1)}
              />
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );

  function openProject(project) {
    setActiveProjectId(project.id);
    setCode(project.code || "");
    setBlueprint(project.blueprint || null);
    setSteps(project.steps || []);
    setMessages(project.messages?.length ? project.messages : [welcomeMessage]);
    setHasUserGeneratedApp(Boolean(project.code?.trim()));
    setRefreshKey((value) => value + 1);
  }

  function editProject(project) {
    openProject(project);
    setPrompt(project.prompt || "");
  }
}

function ProjectRail({ projects, activeProjectId, onOpenProject, onEditProject, isLoading }) {
  const visibleProjects = projects.length
    ? projects.slice().sort((a, b) => b.updatedAt - a.updatedAt)
    : [
        {
          id: "starter",
          title: "build-a-hackathon-mvp...",
          prompt: "Build AI code co-pilot MVP",
          updatedAt: Date.now() - 1000 * 60 * 60 * 7,
          messages: []
        }
      ];
  const chatRows = visibleProjects.slice(0, 6);

  return (
    <motion.aside
      initial={{ opacity: 0, x: -24, filter: "blur(16px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.75, delay: 0.18, ease: "easeOut" }}
      className="fixed bottom-0 left-0 top-0 z-20 hidden w-[356px] flex-col border-r border-white/8 bg-[#1b2128]/95 px-2 py-4 shadow-[24px_0_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl xl:flex"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-8">
        <div>
          <p className="px-2 text-lg font-medium text-zinc-500">Projects</p>
          <div className="mt-3 space-y-1">
            {visibleProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => onOpenProject(project)}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition ${
                  project.id === activeProjectId ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <FolderKanban className="h-5 w-5 shrink-0 text-zinc-400" />
                <span className="min-w-0 flex-1 truncate text-base font-medium text-zinc-300">{project.title}</span>
                <span className="shrink-0 truncate text-sm text-zinc-400">sh...</span>
              </button>
            ))}
          </div>
          <p className="mt-2 px-10 text-base font-medium text-zinc-600">{projects.length ? `${projects.length} project${projects.length === 1 ? "" : "s"}` : "No chats"}</p>
        </div>

        <div className="min-h-0 flex-1">
          <p className="px-2 text-lg font-medium text-zinc-500">Chats</p>
          <div className="mt-3 space-y-1">
            {chatRows.map((project, index) => (
              <div
                key={`chat-${project.id}`}
                className={`group flex items-center gap-2 rounded-lg px-3 py-2 transition ${
                  project.id === activeProjectId || (!activeProjectId && index === 0) ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <button type="button" onClick={() => onOpenProject(project)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-base font-medium text-white">{project.prompt || project.title}</span>
                </button>
                <span className="shrink-0 text-sm text-zinc-400">{isLoading && project.id === activeProjectId ? "now" : relativeTime(project.updatedAt)}</span>
                {project.id !== "starter" ? (
                  <button
                    type="button"
                    onClick={() => onEditProject(project)}
                    className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-white group-hover:flex"
                    title="Edit prompt"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-xs text-zinc-500">
          {isLoading ? "ORIGIN is generating..." : projects.length ? "Click a project to reopen it" : "Ready"}
        </div>
      </div>
    </motion.aside>
  );
}

function upsertProject(projects, nextProject) {
  const existingIndex = projects.findIndex((project) => project.id === nextProject.id);
  if (existingIndex === -1) {
    return [nextProject, ...projects];
  }

  return projects.map((project) => (project.id === nextProject.id ? nextProject : project));
}

function titleFromPrompt(value) {
  return String(value || "Untitled app")
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .join(" ");
}

function relativeTime(updatedAt) {
  const diff = Math.max(0, Date.now() - Number(updatedAt || Date.now()));
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

function AgentPulse({ isLoading, lastStep, generationStatus }) {
  const text = isLoading ? generationStatus || "Orchestrating build" : lastStep ? `${lastStep.agent}: ${lastStep.detail}` : "Ready to generate";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.18 }}
      className="mt-5 flex w-full max-w-3xl items-center justify-center"
    >
      <div className="relative flex min-h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-full border border-white/10 bg-white/[0.045] px-5 text-sm font-medium text-slate-300 shadow-panel backdrop-blur-xl">
        <div className="agent-sweep absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Sparkles className="h-4 w-4 text-white" />}
        </span>
        <span className="relative truncate">{text}</span>
        <span className="relative ml-1 flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-300 [animation-delay:180ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 [animation-delay:360ms]" />
        </span>
      </div>
    </motion.div>
  );
}

function ModeTab({ active = false, icon: Icon, label, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={`flex min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
        active
          ? "border border-white/20 bg-white/10 text-white shadow-[0_0_24px_rgba(255,255,255,0.10)]"
          : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </motion.button>
  );
}

function ToolPill({ icon: Icon, label, active = false }) {
  return (
    <span
      className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold backdrop-blur-xl ${
        active ? "border-white/25 bg-white/10 text-white" : "border-white/10 bg-white/[0.045] text-zinc-300"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? "text-white" : "text-zinc-500"}`} />
      {label}
    </span>
  );
}
