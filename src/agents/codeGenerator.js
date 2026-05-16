import { CODE_GEN_SYSTEM, codeGenerationPrompt } from "../prompts/codeGeneration";
import { sanitizeGeneratedCode } from "../utils/sanitizeCode";
import { fallbackAppCode } from "../sandbox/fallbackAppCode";

export async function generateReactCode({
  llm,
  blueprint,
  userPrompt,
  requirements,
  conversationHistory = "",
  previousCode = null,
  clarificationAnswer = ""
}) {
  const content = await llm(
    codeGenerationPrompt({
      blueprint,
      userPrompt,
      requirements,
      conversationHistory,
      previousCode,
      clarificationAnswer
    }),
    {
      maxTokens: Number(process.env.LLM_CODE_MAX_TOKENS || 4500),
      temperature: 0.35,
      model: process.env.GROQ_CODE_MODEL || process.env.LLM_CODE_MODEL,
      system: CODE_GEN_SYSTEM
    }
  );
  const code = sanitizeGeneratedCode(content);
  return code || fallbackAppCode(blueprint, userPrompt);
}
