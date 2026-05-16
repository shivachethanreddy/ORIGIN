const DOMAIN_KEYWORDS = [
  "bmi",
  "calculator",
  "todo",
  "habit",
  "grade",
  "grades",
  "marks",
  "mark",
  "fitness",
  "inventory",
  "crm",
  "chat",
  "weather",
  "budget",
  "timer",
  "graph",
  "graphing",
  "math",
  "student",
  "expense",
  "portfolio",
  "recipe",
  "workout"
];

const REBUILD_PATTERNS = [
  /\b(build|create|make|design|generate)\s+(me\s+)?(a|an)\s+/i,
  /\bnew\s+app\b/i,
  /\bfrom\s+scratch\b/i,
  /\bstart\s+over\b/i,
  /\breplace\s+(this|the|it)\b/i,
  /\binstead\s+of\b/i,
  /\brather\s+than\b/i,
  /\bswitch\s+to\b/i,
  /\bconvert\s+(this\s+)?(to|into)\b/i,
  /\bturn\s+(this\s+)?(to|into)\b/i,
  /\bchange\s+(this\s+)?to\s+(a|an)\b/i,
  /\bnow\s+(build|make|create)\b/i
];

export function resolveGenerationMode({ userPrompt, currentBlueprint, currentCode, hasExistingApp }) {
  if (!hasExistingApp || !currentCode?.trim()) {
    return { mode: "create", reason: "First app build" };
  }

  const prompt = String(userPrompt || "").toLowerCase();
  const blueprintText = `${currentBlueprint?.name || ""} ${currentBlueprint?.description || ""}`.toLowerCase();

  if (REBUILD_PATTERNS.some((pattern) => pattern.test(prompt))) {
    return { mode: "create", reason: "New app requested — rebuilding from scratch" };
  }

  const promptDomains = DOMAIN_KEYWORDS.filter((keyword) => prompt.includes(keyword));
  const blueprintDomains = DOMAIN_KEYWORDS.filter((keyword) => blueprintText.includes(keyword));

  if (promptDomains.length && blueprintDomains.length) {
    const overlap = promptDomains.filter((keyword) => blueprintDomains.includes(keyword));
    if (!overlap.length) {
      return {
        mode: "create",
        reason: `Different app type (${promptDomains.join(", ")} vs ${blueprintDomains.join(", ")})`
      };
    }
  }

  if (promptDomains.length && !blueprintDomains.length) {
    return { mode: "create", reason: "New app domain in prompt" };
  }

  const promptTokens = tokenize(prompt);
  const blueprintTokens = new Set(tokenize(blueprintText));
  const novelTokens = promptTokens.filter((token) => !blueprintTokens.has(token) && token.length > 4);

  if (novelTokens.length >= 2 && promptDomains.length >= 1) {
    return { mode: "create", reason: "Prompt describes a different product" };
  }

  return { mode: "update", reason: "Related change — updating existing app" };
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}
