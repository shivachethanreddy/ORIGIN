import { CODE_GEN_SYSTEM } from "../prompts/codeGeneration";
import { incrementalUpdatePrompt } from "../prompts/incrementalUpdate";
import { sanitizeGeneratedCode } from "../utils/sanitizeCode";
import { fallbackAppCode } from "../sandbox/fallbackAppCode";

export async function updateReactCode({ llm, currentCode, blueprint, userPrompt, conversationHistory = "" }) {
  const content = await llm(
    incrementalUpdatePrompt({ currentCode, blueprint, userPrompt, conversationHistory }),
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
