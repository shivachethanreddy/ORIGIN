import { clarificationPrompt } from "../prompts/clarification";
import { normalizeClarificationQuestions } from "../utils/clarificationQuestions";
import { extractJson } from "../utils/json";

export async function generateClarification({ llm, requirements, userPrompt = "", forceAsk = false }) {
  const fallback = {
    questions: normalizeClarificationQuestions([], userPrompt, requirements),
    canProceed: false
  };

  if (forceAsk) {
    const content = await llm(clarificationPrompt({ requirements, userPrompt, forceAsk: true }), {
      maxTokens: 700
    });
    const parsed = extractJson(content, fallback);
    return {
      questions: normalizeClarificationQuestions(parsed, userPrompt, requirements),
      canProceed: false
    };
  }

  if (!shouldAsk(requirements)) {
    return { questions: [], canProceed: true };
  }

  const content = await llm(clarificationPrompt({ requirements, userPrompt }), { maxTokens: 500 });
  const parsed = extractJson(content, fallback);
  return {
    questions: normalizeClarificationQuestions(parsed, userPrompt, requirements),
    canProceed: true
  };
}

function shouldAsk(requirements) {
  return !requirements?.features?.length || requirements?.missingInfo?.length > 0;
}
