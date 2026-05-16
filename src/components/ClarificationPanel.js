import { motion } from "framer-motion";
import { ArrowUp, HelpCircle, Loader2, SkipForward } from "lucide-react";
import { getQuestionText } from "../utils/clarificationQuestions";

export default function ClarificationPanel({
  userPrompt,
  questions,
  answers,
  onAnswerChange,
  onSubmit,
  onSkip,
  isLoading
}) {
  const answeredCount = questions.filter((_, index) => String(answers[index] || "").trim()).length;
  const canSubmit = answeredCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 w-full max-w-5xl"
    >
      <div className="glass-command relative overflow-hidden rounded-[30px] border border-white/15 bg-black/45 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_40px_120px_rgba(0,0,0,0.52)] backdrop-blur-2xl">
        <motion.div
          initial={{ opacity: 0, y: 32, filter: "blur(18px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.85, delay: 0.12, ease: "easeOut" }}
          className="relative border-b border-white/10 px-6 py-5 sm:px-8"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10">
              <HelpCircle className="h-5 w-5 text-white" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-white sm:text-2xl">
                Pick options for your app
              </h2>
              <p className="mt-1 text-sm text-slate-400 sm:text-base">
                Choose one option per question — we use these to build a safer <code className="text-slate-300">App.js</code>.
              </p>
              <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                <span className="font-medium text-white">Your idea:</span> {userPrompt}
              </p>
            </div>
          </div>
        </motion.div>

        <form onSubmit={onSubmit} className="space-y-6 px-6 py-6 sm:px-8">
          {questions.map((question, index) => {
            const options = question?.options || [];
            const label = getQuestionText(question);

            return (
              <fieldset key={question?.id || `${index}-${label}`} className="block">
                <legend className="mb-3 text-sm font-semibold text-slate-300 sm:text-base">
                  {index + 1}. {label}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => {
                    const selected = answers[index] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={isLoading}
                        onClick={() => onAnswerChange(index, option)}
                        className={`rounded-2xl border px-4 py-2.5 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          selected
                            ? "border-white/30 bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.12)]"
                            : "border-white/12 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {answeredCount} of {questions.length} selected
              {!canSubmit ? " — pick at least one option" : ""}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onSkip}
                disabled={isLoading}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <SkipForward className="h-4 w-4" />
                Skip &amp; generate
              </button>
              <motion.button
                whileHover={{ y: -2, scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={isLoading || !canSubmit}
                className="premium-button inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                {isLoading ? "Generating App.js" : "Generate preview"}
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
