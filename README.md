# ORIGIN

AI-native **Text to App** builder — describe an app in plain English, answer a few option-based questions, and get a live React preview powered by Sandpack.

## Stack

- Next.js 14
- React 18
- Tailwind CSS
- OpenAI / Groq (LLM)
- CodeSandbox Sandpack (live preview)

## Local setup

```bash
pnpm install
cp .env.example .env
# Add OPENAI_API_KEY or GROQ_API_KEY to .env
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Push this repo to [GitHub](https://github.com/shivachethanreddy/ORIGIN).
2. Import the project in [Vercel](https://vercel.com).
3. Framework preset: **Next.js**
4. Add environment variables:
   - `OPENAI_API_KEY` (or `GROQ_API_KEY` + `LLM_BASE_URL`)
   - Optional: `OPENAI_MODEL`, `GROQ_MODEL`
5. Deploy.

## Scripts

| Command       | Description          |
|---------------|----------------------|
| `pnpm dev`    | Development server   |
| `pnpm build`  | Production build     |
| `pnpm start`  | Start production     |
| `pnpm lint`   | ESLint               |
