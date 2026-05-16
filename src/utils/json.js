export function extractJson(text, fallback) {
  if (!text || typeof text !== "string") {
    return fallback;
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    return fallback;
  }

  try {
    return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
  } catch {
    return fallback;
  }
}

export function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}
