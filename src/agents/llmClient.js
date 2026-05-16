import OpenAI from "openai";

export function createLlmClient(steps, activity) {
  const apiKey =
    process.env.LLM_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  const baseURL =
    process.env.LLM_BASE_URL ||
    (apiKey === process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1" : undefined);
  const usingGroq = Boolean(baseURL?.includes("groq.com"));
  const model =
    process.env.LLM_MODEL ||
    process.env.GROQ_MODEL ||
    process.env.OPENAI_MODEL ||
    (usingGroq ? "llama-3.1-8b-instant" : "gpt-4o-mini");
  const providerLabel = usingGroq ? "Groq" : "OpenAI";
  const requestTimeoutMs = Number(
    process.env.LLM_REQUEST_TIMEOUT_MS || (usingGroq ? 20000 : 3500)
  );
  const rateLimitRetries = Number(process.env.LLM_RATE_LIMIT_RETRIES || 3);

  if (!apiKey) {
    const noop = async () => {
      steps.push(
        activity(
          "Demo Fallback",
          "LLM_API_KEY / GROQ_API_KEY / OPENAI_API_KEY is not set, using deterministic local generation"
        )
      );
      return "";
    };
    noop.usingGroq = false;
    return noop;
  }

  const client = new OpenAI({
    apiKey,
    baseURL,
    timeout: requestTimeoutMs + 2000,
    maxRetries: 0
  });

  const defaultSystem =
    "You are part of a controlled hackathon MVP. Follow the requested output shape exactly. Never generate backend code.";

  async function callLlm(prompt, options = {}) {
    const maxTokens = options.maxTokens ?? 2800;
    const temperature = options.temperature ?? 0.25;
    const modelForCall = options.model || model;
    const systemContent = options.system || defaultSystem;
    let lastError;

    for (let attempt = 0; attempt <= rateLimitRetries; attempt += 1) {
      try {
        const response = await withTimeout(
          client.chat.completions.create({
            model: modelForCall,
            temperature,
            max_tokens: maxTokens,
            messages: [
              { role: "system", content: systemContent },
              { role: "user", content: prompt }
            ]
          }),
          requestTimeoutMs
        );

        return response.choices?.[0]?.message?.content || "";
      } catch (error) {
        lastError = error;

        if (isRateLimitError(error) && attempt < rateLimitRetries) {
          const waitMs = retryAfterMs(error) ?? Math.min(4000 * 2 ** attempt, 20000);
          steps.push(
            activity(
              `${providerLabel} Integration`,
              `Rate limited, waiting ${Math.round(waitMs / 1000)}s before retry (${attempt + 1}/${rateLimitRetries})`
            )
          );
          await sleep(waitMs);
          continue;
        }

        break;
      }
    }

    steps.push(
      activity(
        `${providerLabel} Integration`,
        `${providerLabel} unavailable, continuing with local fallback: ${lastError?.message || "Unknown error"}`
      )
    );
    return "";
  }

  callLlm.usingGroq = usingGroq;
  return callLlm;
}

function isRateLimitError(error) {
  const status = error?.status ?? error?.response?.status;
  if (status === 429) {
    return true;
  }

  const message = String(error?.message || "").toLowerCase();
  return message.includes("429") || message.includes("rate limit");
}

function retryAfterMs(error) {
  const retryAfter = error?.headers?.["retry-after"] ?? error?.headers?.get?.("retry-after");
  const seconds = Number(retryAfter);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null;
}

export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`LLM request exceeded ${timeoutMs}ms demo timeout`)), timeoutMs);
    })
  ]);
}
