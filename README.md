# PromptCraft Pro 🚀

[![CI Build Status](https://github.com/YOUR_USERNAME/promptcraft-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/promptcraft-pro/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React Version](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org)

**PromptCraft Pro** is a premium, client-side React + TypeScript prompt engineering workspace designed to compile, edit, and optimize prompts for Large Language Models (LLMs). Built with modern glassmorphism aesthetics, it functions as an advanced test bench and compiler for creating highly effective structured prompts.

---

## 📖 Table of Contents

- [🌟 Features](#-features)
- [📂 Project Directory Structure](#-project-directory-structure)
- [🚀 Quick Start](#-quick-start)
- [🛠️ Key Components](#️-key-components)
- [⚙️ Configuring Gemini AI Mode](#️-configuring-gemini-ai-mode)
- [🔬 Quality Assurance Pipeline](#-quality-assurance-pipeline)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Features

* **Choice Enums & Default Variable Parsing:** Supports advanced prompt template syntax. Defining `{{framework:react|vue|svelte=react}}` automatically renders a dropdown selector in the UI. Defining `{{language=python}}` configures standard text inputs with default placeholders.
* **Prompt Framework Frameworks:** Compiles prompts instantly conforming to industry structures:
  * **RTFC** (Role, Task, Format, Constraints)
  * **CO-STAR** (Context, Objective, Style, Tone, Audience, Response)
* **Prompt Version History & Diffing:** Logs draft iterations and generates line-by-line diff summaries highlighting additions (🟢) and deletions (🔴) using an LCS comparison algorithm.
* **Workspace Persistence:** Synchronizes current edits, configurations, variables, and histories to `localStorage` to ensure zero work loss across page refreshes.
* **Sandbox Simulation Testbed:** Connects directly to Gemini API endpoints to run and stream prompt outputs inside the simulator interface.
* **Precise Heuristic Metrics:** Analyzes prompt lengths, roles, formats, and rules, grading them with a dynamic "Structure Score" (0–100) and actionable improvement tips.

---

## 📂 Project Directory Structure

```
proud-chandrasekhar/
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI Configuration
├── public/                 # Static assets
├── src/
│   ├── assets/             # Brand logos
│   ├── components/         # Modular UI React components
│   │   ├── ConfigPanel.tsx
│   │   ├── Header.tsx
│   │   ├── HistoryPanel.tsx
│   │   ├── PromptEditor.tsx
│   │   ├── PromptOutput.tsx
│   │   ├── SettingsModal.tsx
│   │   └── TemplatesModal.tsx
│   ├── utils/              # Utility helpers
│   │   ├── compiler.ts     # Heuristics formatting & score compiler
│   │   └── diff.ts         # LCS character/line diff utility
│   ├── App.tsx             # Main layout and state coordinator
│   ├── index.css           # Global CSS variables & glassmorphism theme
│   └── main.tsx            # React bootstrap script
├── index.html              # HTML mount template
├── package.json            # Scripts & dependencies configuration
├── tsconfig.json           # TS compiling configurations
├── LICENSE                 # MIT Open-Source License
└── CONTRIBUTING.md         # Developers contributing guidelines
```

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/promptcraft-pro.git
cd promptcraft-pro
npm install
```

### 2. Launch Local Dev Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Production Build Compilation
```bash
npm run build
```

---

## 🛠️ Key Components

* **[src/utils/compiler.ts](src/utils/compiler.ts):** Powers the core compiler formatting, variable replacement, and quality scoring engine.
* **[src/utils/diff.ts](src/utils/diff.ts):** Computes line diff arrays using Longest Common Subsequence backtracking.
* **[src/App.tsx](src/App.tsx):** Coordinates overall state and event handlers.
* **[src/components/VariableManager.tsx](src/components/VariableManager.tsx):** Decides whether to render `<select>` dropdowns or text `<input>` boxes based on variable schemas.

---

## ⚙️ Configuring Gemini AI Mode

1. Click on the **Gear Icon** ⚙️ in the top right header.
2. Enter your **Gemini API Key** (generate one via [Google AI Studio](https://aistudio.google.com/)).
3. Select your model (e.g. `gemini-2.5-flash` or `gemini-2.5-pro`).
4. Click **Test Connection** to verify key validity.
5. Click **Save Config**. Your keys are kept securely inside your local browser memory.
6. Toggle **Gemini AI Enhancer** mode, compile your prompt, and run simulations directly!

---

## 🔬 Quality Assurance Pipeline

PromptCraft Pro implements automated status checks on every commit or PR:
* Code quality lint validation: `npm run lint`
* TypeScript compiler checks: `npx tsc --noEmit`
* Successful bundle compiler: `npm run build`

---

## 🤝 Contributing

Contributions are welcome! Please review [CONTRIBUTING.md](CONTRIBUTING.md) for detail guidelines on coding standards, naming branches, and submitting PRs.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for full details.
