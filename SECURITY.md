# SECURITY.md — EduSticker (Stikerry) | MIT Lab Red-Team Standard

## 1. Zero-Key Exposure via Vercel Serverless & Relative Routing
- `META_API_KEY` is stored strictly in Vercel Environment Variables (`process.env.META_API_KEY`).
- The React frontend calls the relative endpoint `fetch("/api/story")` over HTTPS, completely eliminating client-side API key exposure and cross-domain CORS mismatches.

## 2. Multi-Layer Prompt Injection Defense
- **Layer 1 (15-Char Regex + English Keyword Blacklist):** `sanitizeName` strips control keywords (`ignore`, `system`, `prompt`, `rule`, `instruction`, `admin`, `hack`, `kill`, `blood`, `sex`, `nsfw`), removes non-alphanumeric characters, and enforces a strict 15-character limit.
- **Layer 2 (Strict Enum Whitelisting):** `safeLang` (`"en" | "vi"`) and `safeMode` (`"funny" | "teasing" | "magic"`) are strictly whitelisted on the server to prevent parameter injection.
- **Layer 3 (Role & Delimiter Isolation):** User inputs are isolated inside `<<<USER_DATA>>>` blocks and output is constrained via `response_format: { type: "json_object" }`.

## 3. Parallel Safety Gate (`Promise.all`) & Background OCR Lock
- **Parallel Execution:** `Llama-Guard-3-11B-Vision` (S1–S11 safety audit) and `Llama-4-Maverick-17B-128E-Instruct-FP8` execute concurrently via `Promise.all`, cutting latency to ~4 seconds while validating safety before rendering.
- **Plain-Text Guard Parsing:** Parses Llama Guard's native plain-text output (`startsWith("unsafe")`) to prevent JSON syntax crashes.
- **Background OCR Lock:** System prompt explicitly instructs Maverick to ignore printed or handwritten background text (blocking visual prompt injection via newspapers/notes) and only analyze cartoon stickers within normalized `0-1000` bounding boxes.

## 4. US COPPA Compliance & Dual-Mode Client Storage
- **Zero-Image-Retention:** Photos are compressed client-side to 800px JPEG (~80KB), processed transiently in Serverless RAM, and immediately discarded.
- **Dual-Mode Storage Adapter:** Seamlessly falls back between `FBInstant.player.setDataAsync` and browser `localStorage`, preventing `ReferenceError: FBInstant is not defined` on standalone web deployments.