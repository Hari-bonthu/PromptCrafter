# Contributing to PromptCraft Pro

We welcome contributions to improve PromptCraft Pro! Please follow these guidelines to make the process smooth for everyone.

---

## 🛠️ Local Development Setup

1. Fork the repository and clone it locally.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the workspace at `http://localhost:5173`.

---

## 📐 Styling Guidelines

PromptCraft Pro uses a **Vanilla CSS styling system** located in `src/index.css`.
* Do not introduce CSS frameworks (e.g. Tailwind) unless requested.
* Use CSS custom properties (variables) defined in `:root` for themed properties.
* Support high performance by using CSS animations and grid overlays.
* Ensure responsive support for smaller viewports (handled via media queries at `1024px` and `768px`).

---

## 🛡️ Coding Standards

* **TypeScript**: Ensure strict type safety. Do not use `any` type casts; use explicit type declarations or `unknown` where applicable.
* **Imports**: The project enforces `verbatimModuleSyntax: true`. You must import types explicitly:
  ```typescript
  import type { PromptConfig } from '../utils/compiler';
  ```
* **Linting**: Run `npm run lint` before committing. Ensure 0 errors and 0 warnings are present.
* **Builds**: Verify compilation by running `npm run build`.

---

## 🚀 Pull Request Checklist

Before submitting a Pull Request, verify:
* [ ] Code compiles successfully via `npm run build`.
* [ ] No ESLint violations exist (`npm run lint` passes).
* [ ] CSS rules follow the theme color conventions.
* [ ] Standard tests have been run.
