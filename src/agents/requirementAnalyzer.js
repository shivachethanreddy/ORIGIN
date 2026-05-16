import { requirementExtractionPrompt } from "../prompts/requirementExtraction";
import { extractJson } from "../utils/json";

export async function analyzeRequirements({ llm, userPrompt, conversationHistory = "" }) {
  const fallback = {
    appType: "dashboard",
    domain: inferDomain(userPrompt),
    features: inferFeatures(userPrompt),
    components: ["HeroSummary", "MetricCards", "MainWorkspace", "ActionPanel"],
    dataModel: ["name", "status", "score", "owner"],
    tone: "modern SaaS utility",
    missingInfo: ["primary user goal"]
  };

  const content = await llm(requirementExtractionPrompt({ userPrompt, conversationHistory }), {
    maxTokens: 700
  });
  return extractJson(content, fallback);
}

function inferDomain(prompt) {
  const lower = String(prompt).toLowerCase();
  if (lower.includes("bmi")) return "health and fitness";
  if (lower.includes("student") || lower.includes("grading") || lower.includes("marks")) return "education";
  if (lower.includes("fitness")) return "health and fitness";
  if (lower.includes("calculator") || lower.includes("math")) return "calculator";
  if (lower.includes("sales") || lower.includes("crm")) return "sales operations";
  if (lower.includes("inventory")) return "inventory";
  return "productivity";
}

function inferFeatures(prompt) {
  const lower = String(prompt).toLowerCase();
  const features = ["overview metrics", "editable form", "status list"];
  if (lower.includes("chart") || lower.includes("dashboard")) features.push("visual chart");
  if (lower.includes("export")) features.push("export action");
  if (lower.includes("dark")) features.push("dark mode styling");
  return features;
}
