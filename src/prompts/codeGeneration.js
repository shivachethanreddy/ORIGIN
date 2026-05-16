export const CODE_GEN_SYSTEM = `You are an expert React UI engineer building polished demo apps for a live preview sandbox.
Output a single valid App.js file only. No markdown fences. No explanations.
The app must run immediately with React 18 and Tailwind CSS (CDN).
CRITICAL: Every variable must be defined before use — especially useState for inputs (value={searchQuery} requires const [searchQuery, setSearchQuery] = useState('') in the SAME component) and const arrays before .filter/.map.
Every onChange={handleX} handler must be defined in that component. Pass shared data via props when subcomponents need it.`;

export const codeGenerationPrompt = ({
  blueprint,
  userPrompt,
  requirements,
  conversationHistory,
  previousCode,
  clarificationAnswer
}) => `
Build a complete, visually polished React app as one file: App.js.

## Conversation memory
${conversationHistory}

## Latest user request (highest priority)
${userPrompt}

${clarificationAnswer ? `## User clarification (apply these details)\n${clarificationAnswer}\n` : ""}

${previousCode ? `## Previous App.js (replace entirely unless user asked for a tiny tweak)\nDo NOT keep the old app name, copy, or features unless the latest request says to.\n` : ""}

## Requirements summary
${JSON.stringify(requirements || {}, null, 2)}

## Blueprint (follow closely)
${JSON.stringify(blueprint, null, 2)}

## Quality bar (required)
- Implement the request faithfully — not a generic dashboard unless the user asked for one.
- Use 3–6 named subcomponents in the same file (e.g. AppHeader, MetricGrid, ItemList, SidebarPanel).
- Include realistic sample data from blueprint.sampleData (at least 5 rows/items where applicable).
- Dark theme by default: bg-slate-950, cards bg-slate-900 border-slate-800, text-slate-100/400.
- Layout: full-width min-h-screen, max-w-6xl mx-auto, consistent spacing (gap-4/gap-6, p-4/p-6).
- Header with app name, short description, and one primary CTA button.
- At least one interactive feature: search/filter, add form, tabs, or toggle — wired with useState/useMemo.
- Empty states and hover states on buttons/cards.
- Responsive: stack on mobile, grid on md+.

## Technical rules
- Define seed data first: \`const seedItems = [...]\` with inline arrays — never use \`sampleData.items\` unless you also define \`const sampleData = { items: [...] }\` in the same file.
- Do not reference blueprint/requirements objects unless you define them as const in App.js.
- For controlled inputs: always pair \`value={field}\` with \`const [field, setField] = useState('')\` and \`onChange={(e) => setField(e.target.value)}\` in the same function component.
- If a subcomponent filters a list, either define the list in that component or receive it as a prop — never use an undefined variable.
- import React, { useState, useMemo } from 'react' (add useEffect only if needed).
- Functional components only. export default App at the end.
- Do NOT import react-dom, call ReactDOM.render, or call createRoot — mounting is handled outside App.js.
- Tailwind classes only — NEVER import App.css, styles.css, or any .css file.
- No @tailwindui, lucide, heroicons, or any npm UI/icon/chart packages — inline SVG or emoji only if needed.
- Simple bar/line visuals: divs with width % or flex, not chart libraries.
- No fetch, axios, localStorage, routes, or external imports.
- Never use reserved words as identifiers (use fn not function, className not class).
- Use lowercase HTML only: div, header, section, main, button, input, form, p, ul, li.
- Do NOT use PascalCase layout tags (Section, Container, Card, Box) unless you define them in this file.
- Valid JSX — close all tags, escape strings in template literals carefully.

Output the full App.js source code only.
`;
