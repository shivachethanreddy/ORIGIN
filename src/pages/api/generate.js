import { runOrchestrator } from "../../agents/orchestrator";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      userPrompt,
      conversationHistory,
      clarificationAnswer,
      requirements,
      currentCode,
      currentBlueprint
    } = req.body || {};

    if (!userPrompt || typeof userPrompt !== "string") {
      return res.status(400).json({ error: "A userPrompt string is required." });
    }

    const result = await runOrchestrator({
      userPrompt,
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
      clarificationAnswer,
      requirements: requirements && typeof requirements === "object" ? requirements : undefined,
      currentCode,
      currentBlueprint
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Generation failed. Check your OpenAI key, model, and prompt constraints.",
      detail: error?.message || "Unknown error"
    });
  }
}
