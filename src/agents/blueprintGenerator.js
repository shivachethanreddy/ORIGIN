import { blueprintPrompt } from "../prompts/blueprint";
import { extractJson } from "../utils/json";

export async function generateBlueprint({
  llm,
  userPrompt,
  requirements,
  clarificationAnswer,
  conversationHistory = "",
  previousBlueprint = null
}) {
  const fallback = {
    name: titleFrom(requirements?.appType || userPrompt),
    description: `A focused ${requirements?.domain || "productivity"} app generated from the user's request.`,
    theme: { mode: "dark", accent: "white" },
    layout: "split dashboard",
    components: (requirements?.components || ["Overview", "Workspace", "Actions"]).map((name) => ({
      name,
      purpose: `Render ${name}`,
      state: []
    })),
    sampleData: {
      rows: [
        { name: "Alpha", status: "On track", score: 92 },
        { name: "Beta", status: "Needs review", score: 74 },
        { name: "Gamma", status: "Improving", score: 83 }
      ]
    },
    interactions: requirements?.features || ["filter", "add item", "review status"]
  };

  const content = await llm(
    blueprintPrompt({
      userPrompt,
      requirements,
      clarificationAnswer,
      conversationHistory,
      previousBlueprint
    }),
    {
      maxTokens: 1800,
      temperature: 0.3
    }
  );
  return extractJson(content, fallback);
}

function titleFrom(value) {
  return String(value || "Generated App")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(" ");
}
