export function createSandpackFiles(appCode) {
  return {
    "/App.js": appCode,
    "/index.js": `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`,
    "/styles.css": `html,
body,
#root {
  min-height: 100%;
}

body {
  margin: 0;
  background: #ffffff;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
`,
    "/index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
  };
}
