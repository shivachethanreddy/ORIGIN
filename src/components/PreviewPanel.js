import { SandpackLayout, SandpackPreview, SandpackProvider } from "@codesandbox/sandpack-react";
import { motion } from "framer-motion";
import {
  Code2,
  ExternalLink,
  Eye,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { createSandpackFiles } from "../sandbox/sandpackFiles";
import { sanitizeGeneratedCode } from "../utils/sanitizeCode";
import StatusBar from "./StatusBar";

export default function PreviewPanel({
  code,
  blueprint,
  hasGeneratedApp,
  refreshKey,
  onForceRefresh,
}) {
  const [showCode, setShowCode] = useState(false);
  const [autoRevision, setAutoRevision] = useState(1);
  const [isBooting, setIsBooting] = useState(false);

  const hasPreview = hasGeneratedApp && Boolean(code?.trim());
  const codeSignature = useMemo(() => createSignature(code || ""), [code]);

  const files = useMemo(
    () =>
      hasPreview
        ? createSandpackFiles(sanitizeGeneratedCode(code))
        : null,
    [code, hasPreview]
  );

  useEffect(() => {
    if (!hasPreview) return;
    setAutoRevision((value) => value + 1);
    setShowCode(false);
    setIsBooting(true);
    const timer = window.setTimeout(() => setIsBooting(false), 1800);
    return () => window.clearTimeout(timer);
  }, [codeSignature, refreshKey, hasPreview]);

  function openFullPreviewTab() {
    if (!hasPreview) return;

    const html = createStandalonePreviewHtml({
      appCode: sanitizeGeneratedCode(code),
      title: blueprint?.name || "ORIGIN Preview",
    });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const previewWindow = window.open(blobUrl, "_blank");

    if (!previewWindow) {
      URL.revokeObjectURL(blobUrl);
      return;
    }

    previewWindow.addEventListener("load", () => {
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    });
  }

  const panel = (
    <section className="relative flex h-full w-full min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] bg-black/80 transition-all">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.06),transparent_32%)]" />

      <div className="scanlines pointer-events-none absolute inset-0 z-10" />

      <header className="relative z-20 flex shrink-0 flex-col gap-2 border-b border-white/10 bg-white/[0.055] px-5 py-3 backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white">
              <ScanLine className="h-4 w-4" />
              Live Sandbox
            </div>

            <h2 className="mt-1 text-2xl font-semibold text-white">
              {blueprint?.name || "Awaiting generation"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasPreview && (
            <span className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white sm:inline-flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              Rendering
            </span>
          )}

          <motion.button
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            disabled={!hasPreview}
            onClick={() => setShowCode((value) => !value)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-medium text-zinc-200 backdrop-blur-xl transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {showCode ? (
              <Eye className="h-4 w-4" />
            ) : (
              <Code2 className="h-4 w-4" />
            )}

            {showCode ? "Preview" : "Code"}
          </motion.button>

          <motion.button
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            disabled={!hasPreview || showCode}
            onClick={openFullPreviewTab}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-medium text-zinc-200 backdrop-blur-xl transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            title="Open full preview in new tab"
          >
            <ExternalLink className="h-4 w-4" />

            <span className="hidden sm:inline">
              Open tab
            </span>
          </motion.button>

          <motion.button
            whileHover={{ y: -1, scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={onForceRefresh}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black shadow-[0_0_28px_rgba(255,255,255,0.22)] transition hover:bg-zinc-200"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </motion.button>
        </div>
      </header>

      <StatusBar
        blueprint={blueprint}
        code={code}
        refreshKey={refreshKey}
      />

<motion.div className="relative z-20 flex h-full w-full min-h-0 flex-1 flex-col p-2 sm:p-3">
        {!hasPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-full min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#060606]/90 px-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            <Sparkles className="h-10 w-10 text-white/80" />

            <p className="mt-4 text-lg font-semibold text-white">
              No preview yet
            </p>

            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Enter a prompt above and click Generate App to build your first
              live preview.
            </p>
          </motion.div>
        )}

        {hasPreview && showCode && (
          <pre className="h-full overflow-auto rounded-2xl border border-white/15 bg-[#060606]/90 p-5 text-sm leading-6 text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_80px_rgba(0,0,0,0.36)] backdrop-blur-xl">
            <code>{code}</code>
          </pre>
        )}

        {hasPreview && !showCode && (
          <div className="sandpack-shell relative flex min-h-0 flex-1 flex-col rounded-2xl border border-white/15 bg-black p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_90px_rgba(0,0,0,0.42)]">
            <div className="pointer-events-none absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/75 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
              Controlled App.js
            </div>

            <SandpackProvider
              key={`${refreshKey}-${autoRevision}-${codeSignature}-${blueprint?.name || "app"}`}
              template="react"
              files={files}
              options={{
                autorun: true,
                recompileMode: "immediate",
                bundlerTimeOut: 90000,
                externalResources: ["https://cdn.tailwindcss.com"],
              }}
            >
              {isBooting ? <OriginPreviewLoader /> : null}
              <SandpackLayout>
                <SandpackPreview
                  className="sandpack-preview-frame"
                  showOpenInCodeSandbox={false}
                  showRefreshButton={false}
                />
              </SandpackLayout>
            </SandpackProvider>
          </div>
        )}
      </motion.div>
    </section>
  );

  return panel;
}

function createSignature(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return `${value.length}-${hash.toString(36)}`;
}

function OriginPreviewLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute inset-1 z-30 flex items-center justify-center rounded-[14px] bg-black/90 backdrop-blur-xl"
    >
      <div className="relative flex h-52 w-52 items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-white/15"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 5.2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-6 rounded-full border border-dashed border-white/20"
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.85, 0.35] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute h-24 w-24 rounded-full bg-white/10 blur-xl"
        />
        <div className="relative text-center">
          <p className="text-2xl font-semibold tracking-[0.28em] text-white">ORIGIN</p>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">loading world</p>
        </div>
      </div>
    </motion.div>
  );
}

function prepareStandaloneAppCode(appCode) {
  let executableCode = appCode
    .replace(/import\s+React\s*,?\s*\{([^}]*)\}\s+from\s+['"]react['"];?\s*/g, "const {$1} = React;\n")
    .replace(/import\s+\{([^}]*)\}\s+from\s+['"]react['"];?\s*/g, "const {$1} = React;\n")
    .replace(/import\s+React\s+from\s+['"]react['"];?\s*/g, "")
    .replace(/export\s+default\s+function\s+App\s*\(/g, "function App(")
    .replace(/export\s+default\s+App\s*;?\s*/g, "")
    .replace(/^export\s+default\s+/gm, "")
    .trim();

  if (!/createRoot\s*\(/.test(executableCode)) {
    executableCode += `\n\nconst root = ReactDOM.createRoot(document.getElementById("root"));\nroot.render(<App />);`;
  }

  return executableCode;
}

function createStandalonePreviewHtml({ appCode, title }) {
  const executableCode = prepareStandaloneAppCode(appCode);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
      html, body, #root { min-height: 100%; margin: 0; }
      body { background: #ffffff; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .origin-loader { position: fixed; inset: 0; display: grid; place-items: center; background: #050505; color: white; z-index: 9999; transition: opacity .35s ease; }
      .origin-world { width: 180px; height: 180px; border: 1px solid rgba(255,255,255,.18); border-radius: 999px; display: grid; place-items: center; animation: spin 3.8s linear infinite; }
      .origin-core { animation: pulse 2s ease-in-out infinite; text-align: center; letter-spacing: .28em; font-weight: 700; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse { 50% { opacity: .45; transform: scale(.96); } }
    </style>
  </head>
  <body>
    <div id="origin-loader" class="origin-loader">
      <div class="origin-world"><div class="origin-core">ORIGIN<br /><span style="font-size:10px;color:#888;letter-spacing:.22em">LOADING WORLD</span></div></div>
    </div>
    <div id="root"></div>
    <script type="text/babel" data-presets="react">
      try {
${executableCode}
      } catch (error) {
        const root = document.getElementById("root");
        if (root) {
          root.innerHTML =
            '<div style="padding:24px;font-family:system-ui,sans-serif;color:#b91c1c">' +
            '<h1 style="margin:0 0 8px;font-size:18px">Preview failed to load</h1>' +
            '<pre style="white-space:pre-wrap;font-size:13px;line-height:1.5">' +
            error.message +
            "</pre></div>";
        }
        console.error(error);
      } finally {
        setTimeout(() => {
          const loader = document.getElementById('origin-loader');
          if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 380);
          }
        }, 700);
      }
    </script>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
