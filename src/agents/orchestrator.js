import { analyzeRequirements } from "./requirementAnalyzer";
import { generateClarification } from "./clarificationAgent";
import { generateBlueprint } from "./blueprintGenerator";
import { generateReactCode } from "./codeGenerator";
import { updateReactCode } from "./updateAgent";
import { fallbackAppCode } from "../sandbox/fallbackAppCode";
import { formatConversationHistory } from "../utils/conversation";
import { resolveGenerationMode } from "../utils/intent";
import { createLlmClient, sleep } from "./llmClient";

export async function runClarificationPhase({
  userPrompt,
  conversationHistory = [],
  currentCode,
  currentBlueprint
}) {
  const steps = [];
  const llm = createLlmClient(steps, activity);
  const pauseBetweenAgents = () =>
    llm.usingGroq ? sleep(Number(process.env.GROQ_STEP_DELAY_MS || 2500)) : Promise.resolve();
  const historyText = formatConversationHistory(conversationHistory);
  const hasExistingApp = Boolean(currentCode?.trim() && currentBlueprint);

  const { mode, reason } = resolveGenerationMode({
    userPrompt,
    currentBlueprint,
    currentCode,
    hasExistingApp
  });

  steps.push(activity("Intent Router", reason));

  if (mode === "update" && hasExistingApp) {
    return {
      mode: "update",
      modeReason: reason,
      skipClarification: true,
      questions: [],
      requirements: null,
      steps
    };
  }

  steps.push(activity("Requirement Analyzer", "Extracting app type, domain, features, and components"));
  const requirements = await analyzeRequirements({ llm, userPrompt, conversationHistory: historyText });
  await pauseBetweenAgents();

  steps.push(activity("Clarification Agent", "Preparing questions before App.js generation"));
  const clarification = await generateClarification({
    llm,
    requirements,
    userPrompt,
    forceAsk: true
  });
  await pauseBetweenAgents();

  return {
    mode: "create",
    modeReason: reason,
    skipClarification: false,
    questions: clarification.questions,
    requirements,
    steps
  };
}

export async function runOrchestrator({
  userPrompt,
  conversationHistory = [],
  clarificationAnswer,
  requirements: precomputedRequirements,
  currentCode,
  currentBlueprint
}) {
  const steps = [];
  const llm = createLlmClient(steps, activity);
  const pauseBetweenAgents = () =>
    llm.usingGroq ? sleep(Number(process.env.GROQ_STEP_DELAY_MS || 2500)) : Promise.resolve();
  const historyText = formatConversationHistory(conversationHistory);
  const hasExistingApp = Boolean(currentCode?.trim() && currentBlueprint);

  const { mode, reason } = resolveGenerationMode({
    userPrompt,
    currentBlueprint,
    currentCode,
    hasExistingApp
  });

  steps.push(activity("Intent Router", reason));

  if (mode === "update" && hasExistingApp) {
    steps.push(activity("Update Agent", "Applying a related change with conversation memory"));
    const code = await updateReactCode({
      llm,
      currentCode,
      blueprint: currentBlueprint,
      userPrompt,
      conversationHistory: historyText
    });
    return {
      mode: "update",
      modeReason: reason,
      message: "I updated your app based on the latest request and conversation context.",
      code,
      blueprint: currentBlueprint,
      requirements: null,
      clarification: [],
      steps
    };
  }

  let requirements = precomputedRequirements;

  if (!requirements) {
    steps.push(activity("Requirement Analyzer", "Extracting app type, domain, features, and components"));
    requirements = await analyzeRequirements({ llm, userPrompt, conversationHistory: historyText });
    await pauseBetweenAgents();
  } else {
    steps.push(activity("Requirement Analyzer", "Using details from your clarification answers"));
  }

  if (!clarificationAnswer) {
    steps.push(activity("Clarification Agent", "Checking whether questions would improve the build"));
    await generateClarification({ llm, requirements, userPrompt });
    await pauseBetweenAgents();
  } else {
    steps.push(activity("Clarification Agent", "Applied your answers to the build spec"));
  }

  steps.push(activity("Blueprint Generator", "Converting requirements into a structured JSON app spec"));
  const blueprint = await generateBlueprint({
    llm,
    userPrompt,
    requirements,
    clarificationAnswer,
    conversationHistory: historyText,
    previousBlueprint: hasExistingApp ? currentBlueprint : null
  });
  await pauseBetweenAgents();

  steps.push(activity("Code Generator", "Generating one self-contained App.js file for Sandpack"));
  let code = await generateReactCode({
    llm,
    blueprint,
    userPrompt,
    requirements,
    conversationHistory: historyText,
    previousCode: hasExistingApp ? currentCode : null,
    clarificationAnswer
  });

  if (!code || code.length < 80) {
    code = fallbackAppCode(blueprint, userPrompt);
  }

  return {
    mode: "create",
    modeReason: reason,
    message: buildAssistantMessage(clarificationAnswer, reason),
    code,
    blueprint,
    requirements,
    clarification: [],
    steps
  };
}

function activity(agent, detail) {
  return {
    agent,
    detail,
    status: "complete",
    at: new Date().toISOString()
  };
}

function buildAssistantMessage(clarificationAnswer, modeReason) {
  if (clarificationAnswer?.trim()) {
    return `Built your app preview (${modeReason}) using the details you provided.`;
  }

  return `Built a fresh app preview (${modeReason}).`;
}
