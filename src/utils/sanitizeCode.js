const BLOCKED_PATTERNS = [
  /fetch\s*\(/gi,
  /axios/gi,
  /XMLHttpRequest/gi,
  /localStorage/gi,
  /sessionStorage/gi,
  /document\.cookie/gi,
  /require\s*\(/gi
];

const REACT_IMPORT_PATTERN = /^import\s+(?:type\s+)?[\s\S]*\bfrom\s+['"]react['"]\s*;?\s*$/;

export function sanitizeGeneratedCode(code) {
  if (!code || typeof code !== "string") {
    return "";
  }

  let cleaned = code
    .replace(/```(?:jsx|javascript|js|react)?/gi, "")
    .replace(/```/g, "")
    .trim();

  cleaned = stripInvalidImports(cleaned);
  cleaned = stripMountingBoilerplate(cleaned);

  if (!hasReactImport(cleaned)) {
    cleaned = `import React, { useState, useMemo } from 'react';\n\n${cleaned}`;
  }

  for (const pattern of BLOCKED_PATTERNS) {
    cleaned = cleaned.replace(pattern, "(()=>{})(");
  }

  cleaned = fixReservedIdentifiers(cleaned);
  cleaned = fixUndefinedComponents(cleaned);
  cleaned = fixUndefinedReferences(cleaned);

  if (!cleaned.includes("export default")) {
    cleaned += "\n\nexport default App;";
  }

  return cleaned;
}

function hasReactImport(code) {
  return code.split("\n").some((line) => REACT_IMPORT_PATTERN.test(line.trim()));
}

function stripInvalidImports(code) {
  const lines = code.split("\n");
  const kept = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("import ")) {
      return !trimmed.includes("/* blocked */");
    }
    return REACT_IMPORT_PATTERN.test(trimmed);
  });

  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function stripMountingBoilerplate(code) {
  let cleaned = code
    .replace(/ReactDOM\.render\s*\([\s\S]*?\)\s*;?/g, "")
    .replace(/ReactDOM\.createRoot\s*\([\s\S]*?\)\s*\.render\s*\([\s\S]*?\)\s*;?/g, "")
    .replace(/createRoot\s*\([\s\S]*?\)\s*\.render\s*\([\s\S]*?\)\s*;?/g, "")
    .replace(
      /(?:const|let|var)\s+\w+\s*=\s*(?:ReactDOM\.)?createRoot\s*\([\s\S]*?\)\s*;?\s*\n\s*\w+\.render\s*\([\s\S]*?\)\s*;?/g,
      ""
    );

  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
}

function fixReservedIdentifiers(code) {
  let fixed = code;

  fixed = fixed.replace(/\bfunction\s*=/g, "fn=");
  fixed = fixed.replace(/\bclass\s*=/g, "className=");
  fixed = fixed.replace(/\bdefault\s*=/g, "defaultValue=");

  fixed = fixed.replace(/\{\s*function\s*\}/g, "{ fn }");
  fixed = fixed.replace(/\{\s*function\s*,/g, "{ fn,");
  fixed = fixed.replace(/,\s*function\s*\}/g, ", fn }");
  fixed = fixed.replace(/,\s*function\s*,/g, ", fn,");
  fixed = fixed.replace(/\{\s*class\s*\}/g, "{ className }");
  fixed = fixed.replace(/\{\s*class\s*,/g, "{ className,");
  fixed = fixed.replace(/,\s*class\s*\}/g, ", className }");
  fixed = fixed.replace(/,\s*class\s*,/g, ", className,");

  fixed = fixed.replace(/\(\s*\{\s*function\s*\}\s*\)/g, "({ fn })");
  fixed = fixed.replace(/\b(const|let|var)\s+function\b/g, "$1 fn");
  fixed = fixed.replace(/(?<![\w.$])\bfunction\s*\(/g, "fn(");
  fixed = fixed.replace(/(?<![\w.$])\bfunction\./g, "fn.");

  return fixed;
}

const COMPONENT_FALLBACKS = {
  Container: "div",
  Box: "div",
  Wrapper: "div",
  Layout: "div",
  Card: "section",
  CardBody: "div",
  CardHeader: "div",
  CardFooter: "div",
  Row: "div",
  Col: "div",
  Grid: "div",
  Stack: "div",
  Flex: "div",
  Header: "header",
  Footer: "footer",
  Main: "main",
  Navbar: "nav",
  Sidebar: "aside",
  Button: "button",
  Input: "input",
  Form: "form",
  Label: "label",
  Text: "p",
  Title: "h1",
  Subtitle: "p",
  Icon: "span",
  Badge: "span",
  Modal: "div",
  Dialog: "div",
  Panel: "section",
  Content: "div",
  Section: "section"
};

const HTML_TAGS = new Set([
  "a",
  "article",
  "aside",
  "button",
  "div",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "img",
  "input",
  "label",
  "li",
  "main",
  "nav",
  "ol",
  "option",
  "p",
  "section",
  "select",
  "span",
  "table",
  "tbody",
  "td",
  "textarea",
  "th",
  "thead",
  "tr",
  "ul"
]);

function getDefinedComponents(code) {
  const names = new Set(["App"]);
  const patterns = [/function\s+([A-Z]\w*)\s*\(/g, /const\s+([A-Z]\w*)\s*=\s*(?:\(|function)/g];

  for (const pattern of patterns) {
    let match = pattern.exec(code);
    while (match) {
      names.add(match[1]);
      match = pattern.exec(code);
    }
  }

  return names;
}

function pascalToHtmlTag(name) {
  if (COMPONENT_FALLBACKS[name]) {
    return COMPONENT_FALLBACKS[name];
  }

  const lower = name.toLowerCase();
  if (HTML_TAGS.has(lower)) {
    return lower;
  }

  return "div";
}

function replaceJsxTag(code, name, htmlTag) {
  const open = new RegExp(`<${name}(\\s|>|/)`, "g");
  const close = new RegExp(`</${name}>`, "g");
  return code.replace(open, `<${htmlTag}$1`).replace(close, `</${htmlTag}>`);
}

function collectPascalCaseJsxTags(code) {
  const tags = new Set();
  const pattern = /<([A-Z][A-Za-z0-9]*)(\s|>|\/)/g;
  let match = pattern.exec(code);

  while (match) {
    tags.add(match[1]);
    match = pattern.exec(code);
  }

  return tags;
}

function fixUndefinedComponents(code) {
  const defined = getDefinedComponents(code);
  const usedTags = collectPascalCaseJsxTags(code);
  let fixed = code;

  for (const name of usedTags) {
    if (defined.has(name)) {
      continue;
    }

    fixed = replaceJsxTag(fixed, name, pascalToHtmlTag(name));
  }

  return fixed;
}

const GLOBAL_NAMES = new Set([
  "React",
  "useState",
  "useMemo",
  "useEffect",
  "useCallback",
  "useRef",
  "Math",
  "Date",
  "Array",
  "Object",
  "String",
  "Number",
  "JSON",
  "console",
  "undefined",
  "null",
  "true",
  "false",
  "event",
  "props",
  "children"
]);

const DATA_METHOD_PATTERN =
  /\b([a-z][a-zA-Z0-9]*)\s*\.\s*(?:filter|map|reduce|find|some|every|sort|slice|flatMap|includes)\s*\(/g;

const PROPERTY_ROOT_PATTERN = /\b([a-z][a-zA-Z0-9]*)\s*\./g;

const SAFE_PROPERTY_ROOTS = new Set([
  "event",
  "e",
  "props",
  "math",
  "object",
  "array",
  "string",
  "number",
  "json",
  "console",
  "react",
  "window",
  "document",
  "target",
  "style",
  "classlist"
]);

const JSX_BINDING_PATTERN = /=\{([a-z][a-zA-Z0-9]*)\}/g;
const JSX_EXPR_PATTERN = /\{([a-z][a-zA-Z0-9]*)\}/g;

const IGNORED_IDENTIFIERS = new Set([
  "item",
  "index",
  "i",
  "j",
  "k",
  "e",
  "el",
  "elem",
  "row",
  "col",
  "acc",
  "prev",
  "next",
  "sum",
  "val",
  "key",
  "ref",
  "fn",
  "err",
  "data",
  "props"
]);

function getDefinedIdentifiers(code) {
  const names = new Set(GLOBAL_NAMES);

  const patterns = [
    /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g,
    /\bconst\s+([A-Za-z_$][\w$]*)\s*=/g,
    /\blet\s+([A-Za-z_$][\w$]*)\s*=/g,
    /\bvar\s+([A-Za-z_$][\w$]*)\s*=/g,
    /\b(?:const|let|var)\s+\[\s*([A-Za-z_$][\w$]*)\s*,/g,
    /\b(?:const|let|var)\s+\{\s*([A-Za-z_$][\w$]*)\s*[,}]/g,
    /\(\s*\{\s*([A-Za-z_$][\w$]*)\s*[,}]/g,
    /\bimport\s+(?:\{([^}]+)\}|([A-Za-z_$][\w$]*))\b/g
  ];

  for (const pattern of patterns) {
    let match = pattern.exec(code);
    while (match) {
      if (match[1]?.includes(",")) {
        match[1].split(",").forEach((part) => {
          const cleaned = part.trim().split(/\s+as\s+/)[0].trim();
          if (cleaned) names.add(cleaned);
        });
      } else {
        const value = match[1] || match[2];
        if (value) names.add(value.trim());
      }
      match = pattern.exec(code);
    }
  }

  return names;
}

function collectUndefinedDataRefs(code, defined) {
  const missing = new Set();
  let match = DATA_METHOD_PATTERN.exec(code);

  while (match) {
    const name = match[1];
    if (isFixableReference(name, defined)) {
      missing.add(name);
    }
    match = DATA_METHOD_PATTERN.exec(code);
  }

  return [...missing];
}

function collectUndefinedPropertyRoots(code, defined) {
  const missing = new Set();
  let match = PROPERTY_ROOT_PATTERN.exec(code);

  while (match) {
    const root = match[1];
    if (SAFE_PROPERTY_ROOTS.has(root.toLowerCase())) {
      match = PROPERTY_ROOT_PATTERN.exec(code);
      continue;
    }
    if (isFixableReference(root, defined)) {
      missing.add(root);
    }
    match = PROPERTY_ROOT_PATTERN.exec(code);
  }

  return [...missing];
}

function collectUndefinedJsxBindings(code, defined) {
  const missing = new Set();

  for (const pattern of [JSX_BINDING_PATTERN, JSX_EXPR_PATTERN]) {
    let match = pattern.exec(code);
    while (match) {
      const name = match[1];
      const after = code.slice(match.index + match[0].length, match.index + match[0].length + 1);
      if (after === "." || after === "(") {
        match = pattern.exec(code);
        continue;
      }
      if (isFixableReference(name, defined)) {
        missing.add(name);
      }
      match = pattern.exec(code);
    }
  }

  return [...missing];
}

function isFixableReference(name, defined) {
  if (!name || defined.has(name)) {
    return false;
  }
  if (IGNORED_IDENTIFIERS.has(name)) {
    return false;
  }
  if (name.endsWith("Props") || name.startsWith("set")) {
    return false;
  }
  return /^[a-z][a-zA-Z0-9]*$/.test(name);
}

function isStateVariable(name) {
  if (isHandlerName(name)) {
    return false;
  }

  const lower = name.toLowerCase();
  if (/^(is|has|show|can|should)[A-Z]/.test(name)) {
    return true;
  }
  return /(query|input|text|value|name|email|title|label|term|prompt|height|weight|age|score|amount|count|tab|mode|selected|active|open|message|note|date)/.test(
    lower
  ) || /searchquery|searchterm|filtertext/.test(lower);
}

function isHandlerName(name) {
  return /^handle[A-Z]/.test(name) || /^on[A-Z][a-zA-Z0-9]*$/.test(name);
}

function stateSetterName(name) {
  return `set${name[0].toUpperCase()}${name.slice(1)}`;
}

function defaultStateValue(name) {
  const lower = name.toLowerCase();
  if (lower.startsWith("is") || lower.startsWith("has") || lower.startsWith("show") || lower.startsWith("can")) {
    return "false";
  }
  if (/(count|index|age|score|amount|height|weight|total|qty)/.test(lower)) {
    return "0";
  }
  return "''";
}

function findMatchingBrace(code, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < code.length; i += 1) {
    if (code[i] === "{") depth += 1;
    if (code[i] === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return code.length - 1;
}

function findComponentBlocks(code) {
  const blocks = [];
  const patterns = [
    /function\s+([A-Z][A-Za-z0-9_]*)\s*\([^)]*\)\s*\{/g,
    /const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*\([^)]*\)\s*=>\s*\{/g,
    /const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*function\s*\([^)]*\)\s*\{/g
  ];

  for (const pattern of patterns) {
    let match = pattern.exec(code);
    while (match) {
      const braceIndex = match.index + match[0].length - 1;
      const end = findMatchingBrace(code, braceIndex);
      blocks.push({
        name: match[1],
        bodyStart: braceIndex + 1,
        bodyEnd: end,
        body: code.slice(braceIndex + 1, end)
      });
      match = pattern.exec(code);
    }
  }

  return blocks.sort((a, b) => a.bodyStart - b.bodyStart);
}

function collectMissingInBody(body, defined) {
  const missing = new Set();
  for (const name of collectUndefinedDataRefs(body, defined)) missing.add(name);
  for (const name of collectUndefinedJsxBindings(body, defined)) missing.add(name);
  return missing;
}

function buildStateDeclaration(name) {
  const setter = stateSetterName(name);
  return `const [${name}, ${setter}] = useState(${defaultStateValue(name)});`;
}

function buildHandlerDeclaration(name, stateNames) {
  const lower = name.toLowerCase();
  const queryState = stateNames.find((state) => /query|search|term|input|filter|prompt/i.test(state));

  if (queryState && /search|query|input|change|filter|type/i.test(lower)) {
    const setter = stateSetterName(queryState);
    return `const ${name} = (event) => ${setter}(event.target.value);`;
  }

  if (/submit|save|add|create/i.test(lower)) {
    return `const ${name} = (event) => { event?.preventDefault?.(); };`;
  }

  return `const ${name} = (event) => { event?.preventDefault?.(); };`;
}

function injectAfterBrace(code, insertAt, lines) {
  if (!lines.length) return code;
  const injection = `\n  ${lines.join("\n  ")}\n`;
  return `${code.slice(0, insertAt)}${injection}${code.slice(insertAt)}`;
}

function injectAtModuleScope(code, lines) {
  if (!lines.length) return code;
  const importEnd = code.lastIndexOf("from 'react';");
  if (importEnd !== -1) {
    const insertAt = code.indexOf("\n", importEnd);
    if (insertAt !== -1) {
      return `${code.slice(0, insertAt + 1)}\n${lines.join("\n")}\n${code.slice(insertAt + 1)}`;
    }
  }
  return `${lines.join("\n")}\n\n${code}`;
}

function ensureUseStateImport(code) {
  if (!/\buseState\b/.test(code)) {
    return code;
  }
  if (/\{\s*[^}]*\buseState\b[^}]*\}\s*from\s+['"]react['"]/.test(code)) {
    return code;
  }
  if (/import\s+React\s*,\s*\{/.test(code)) {
    return code.replace(
      /import\s+React\s*,\s*\{([^}]*)\}\s*from\s+['"]react['"]\s*;?/,
      (full, hooks) => {
        const parts = hooks.split(",").map((part) => part.trim()).filter(Boolean);
        if (!parts.includes("useState")) parts.unshift("useState");
        return `import React, { ${parts.join(", ")} } from 'react';`;
      }
    );
  }
  return code.replace(
    /import\s+React\s+from\s+['"]react['"]\s*;?/,
    "import React, { useState } from 'react';"
  );
}

function isModuleDataObject(name) {
  return /^(sampleData|mockData|seedData|blueprint|requirements)$/i.test(name) || name === "data";
}

function buildModuleDataDeclaration(name) {
  const items = sampleArrayLiteral("items");

  if (name === "blueprint") {
    return `const blueprint = {
  name: "Generated App",
  description: "Demo app",
  sampleData: {
    items: ${items}
  }
};`;
  }

  if (name === "requirements") {
    return `const requirements = {
  features: ["overview", "list", "form"],
  sampleData: { items: ${items} }
};`;
  }

  return `const ${name} = {
  items: ${items}
};`;
}

function sampleArrayLiteral(name) {
  const lower = name.toLowerCase();

  if (lower.includes("user") || lower.includes("student")) {
    return `[
  { id: 1, name: "Alex Rivera", status: "Active", score: 92 },
  { id: 2, name: "Jordan Lee", status: "Review", score: 78 },
  { id: 3, name: "Sam Taylor", status: "Active", score: 85 }
]`;
  }

  if (lower.includes("task") || lower.includes("todo")) {
    return `[
  { id: 1, title: "Draft outline", done: false, priority: "High" },
  { id: 2, title: "Review notes", done: true, priority: "Medium" },
  { id: 3, title: "Ship MVP", done: false, priority: "High" }
]`;
  }

  return `[
  { id: 1, name: "Sample A", status: "Active", value: 42 },
  { id: 2, name: "Sample B", status: "Pending", value: 37 },
  { id: 3, name: "Sample C", status: "Done", value: 91 }
]`;
}

function fixUndefinedReferences(code) {
  let fixed = ensureUseStateImport(code);
  const defined = getDefinedIdentifiers(fixed);

  const moduleNames = new Set([
    ...collectUndefinedDataRefs(fixed, defined),
    ...collectUndefinedPropertyRoots(fixed, defined)
  ]);

  const moduleDeclarations = [...moduleNames]
    .filter((name) => !isStateVariable(name) && !isHandlerName(name))
    .map((name) => {
      defined.add(name);
      if (isModuleDataObject(name)) {
        return buildModuleDataDeclaration(name);
      }
      return `const ${name} = ${sampleArrayLiteral(name)};`;
    });

  if (moduleDeclarations.length) {
    fixed = injectAtModuleScope(fixed, moduleDeclarations);
  }

  const blocks = findComponentBlocks(fixed).sort((a, b) => b.bodyStart - a.bodyStart);

  for (const block of blocks) {
    const body = fixed.slice(block.bodyStart, block.bodyEnd);
    const localDefined = getDefinedIdentifiers(body);
    for (const name of defined) localDefined.add(name);

    const missing = collectMissingInBody(body, localDefined);
    if (!missing.size) {
      continue;
    }

    const jsxOnly = new Set(collectUndefinedJsxBindings(body, localDefined));
    const handlerNames = [...missing].filter((name) => isHandlerName(name));
    const stateNames = [...missing].filter(
      (name) => !isHandlerName(name) && (isStateVariable(name) || jsxOnly.has(name))
    );

    const lines = [];
    for (const name of stateNames) {
      if (!localDefined.has(name)) {
        lines.push(buildStateDeclaration(name));
        localDefined.add(name);
        localDefined.add(stateSetterName(name));
      }
    }
    for (const name of handlerNames) {
      if (!localDefined.has(name)) {
        lines.push(buildHandlerDeclaration(name, stateNames));
        localDefined.add(name);
      }
    }

    if (!lines.length) {
      continue;
    }

    fixed = injectAfterBrace(fixed, block.bodyStart, lines);
    for (const line of lines) {
      const stateMatch = line.match(/const \[(\w+),/);
      if (stateMatch) defined.add(stateMatch[1]);
      const fnMatch = line.match(/const (\w+) = /);
      if (fnMatch) defined.add(fnMatch[1]);
    }
  }

  return ensureUseStateImport(fixed);
}
