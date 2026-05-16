import { asArray } from "./json";

export function getQuestionText(question) {
  if (typeof question === "string") {
    return question;
  }

  return question?.question || question?.text || "Preference";
}

export function normalizeClarificationQuestions(raw, userPrompt = "", requirements = {}) {
  const items = asArray(raw?.questions ?? raw);
  const normalized = items
    .map((item, index) => normalizeOneQuestion(item, index, userPrompt))
    .filter((item) => item.options.length >= 2);

  if (normalized.length >= 2) {
    return normalized.slice(0, 3);
  }

  return buildPromptBasedQuestions(userPrompt, requirements);
}

function normalizeOneQuestion(item, index, userPrompt) {
  if (typeof item === "string") {
    return {
      id: `q${index}`,
      question: item,
      options: defaultOptionsForPrompt(userPrompt, index)
    };
  }

  const options = asArray(item?.options).map(String).filter(Boolean).slice(0, 5);
  return {
    id: item?.id || `q${index}`,
    question: item?.question || item?.text || "Choose an option",
    options: options.length >= 2 ? options : defaultOptionsForPrompt(userPrompt, index)
  };
}

export function buildPromptBasedQuestions(userPrompt, requirements = {}) {
  const lower = String(userPrompt || "").toLowerCase();
  const appType = String(requirements?.appType || "").toLowerCase();
  const domain = String(requirements?.domain || "").toLowerCase();

  if (lower.includes("bmi") || domain.includes("health") || domain.includes("fitness")) {
    return [
      {
        id: "units",
        question: "Which units should the BMI calculator use?",
        options: ["Metric (kg, cm)", "Imperial (lb, ft/in)", "Both with a toggle", "Simple number inputs only"]
      },
      {
        id: "result",
        question: "How should the BMI result be displayed?",
        options: ["Number + category (Underweight/Normal/...)", "Color band + short tip", "Large score card + chart", "Minimal one-line result"]
      },
      {
        id: "inputs",
        question: "What inputs do you need?",
        options: ["Height + weight only", "Height + weight + age", "Height + weight + gender", "Height + weight + reset button"]
      }
    ];
  }

  if (lower.includes("todo") || lower.includes("task") || lower.includes("habit")) {
    return [
      {
        id: "layout",
        question: "What layout fits your task app?",
        options: ["Simple checklist", "Kanban columns", "Calendar + list", "Priority groups"]
      },
      {
        id: "actions",
        question: "Which actions matter most?",
        options: ["Add + complete only", "Add + edit + delete", "Add + filter + search", "Add + due dates + tags"]
      },
      {
        id: "style",
        question: "Visual style preference?",
        options: ["Dark minimal", "Colorful cards", "Compact list", "Dashboard with stats"]
      }
    ];
  }

  if (
    lower.includes("grade") ||
    lower.includes("student") ||
    lower.includes("mark") ||
    domain.includes("education")
  ) {
    return [
      {
        id: "view",
        question: "Primary view for the grading app?",
        options: ["Student table + averages", "Subject breakdown cards", "Chart + filterable list", "Form to add marks"]
      },
      {
        id: "metrics",
        question: "Which metrics should appear?",
        options: ["Score % only", "Score + grade letter", "Score + rank + pass/fail", "Score + attendance"]
      },
      {
        id: "extras",
        question: "Extra features to include?",
        options: ["Search/filter only", "Export button", "Sort by score", "No extras"]
      }
    ];
  }

  if (lower.includes("dashboard") || appType.includes("dashboard")) {
    return [
      {
        id: "widgets",
        question: "What should the dashboard highlight?",
        options: ["KPI metric cards", "Table + filters", "Charts (simple bars)", "Activity feed + stats"]
      },
      {
        id: "data",
        question: "Sample data focus?",
        options: ["Sales / revenue", "Users / signups", "Tasks / projects", "Generic placeholders"]
      },
      {
        id: "interaction",
        question: "Main interaction?",
        options: ["Search + filter list", "Add record form", "Tabbed sections", "Read-only overview"]
      }
    ];
  }

  if (lower.includes("calculator") || domain.includes("calculator")) {
    return [
      {
        id: "type",
        question: "Calculator style?",
        options: ["Single-purpose (one formula)", "Keypad style", "Multi-field form", "Step-by-step wizard"]
      },
      {
        id: "output",
        question: "How to show the result?",
        options: ["Live update as you type", "Calculate button", "Result + explanation text", "Result + history list"]
      },
      {
        id: "theme",
        question: "Look and feel?",
        options: ["Dark professional", "Light clean", "Colorful accent", "Compact mobile-first"]
      }
    ];
  }

  return [
    {
      id: "layout",
      question: "Which layout best matches your app idea?",
      options: ["Single-column form/tool", "Split panel (inputs + results)", "Dashboard with cards", "List + detail sidebar"]
    },
    {
      id: "interaction",
      question: "What is the main interaction?",
      options: ["Search or filter a list", "Fill a form and submit", "Toggle tabs or modes", "View stats only"]
    },
    {
      id: "theme",
      question: "Visual theme?",
      options: ["Dark (default)", "Light", "High contrast accent", "Minimal monochrome"]
    }
  ];
}

function defaultOptionsForPrompt(userPrompt, index) {
  const sets = buildPromptBasedQuestions(userPrompt);
  return sets[index % sets.length]?.options || ["Option A", "Option B", "Surprise me"];
}
