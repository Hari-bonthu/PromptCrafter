# PromptCraft Pro 🚀

An industry-grade, developer-first prompt engineering workspace. **PromptCraft Pro** allows you to structure, optimize, catalog, compare, and evaluate prompts for Large Language Models (specifically optimized for Google Gemini models) directly in your browser.

Built with a premium dark glassmorphism theme, vanilla CSS variables, React, TypeScript, and Vite.

---

## ✨ Features

### 1. 🧬 Lightweight Template Compiler
* Supports dynamic variable replacements via `{{variable}}`.
* Supports **Default Values** (e.g. `{{language=python}}`).
* Supports **Choice Enums** (e.g. `{{framework:react|vue|svelte}}`), which automatically render as select dropdowns.

### 2. 🔀 Conditional Compilation Blocks
* Supports conditional text rendering using `{% if variable %} ... {% endif %}` tags.
* Conditional keys render as interactive checkbox toggles in the variable manager.
* Compiles out or renders blocks instantly based on toggle states.

### 3. 📂 Prompt Catalog manager (Import/Export)
* A sidebar manager to save your current active drafts as reusable templates.
* Export your entire template catalog as a single backup `.json` file.
* Import catalogs to restore or share setups across environments.

### 4. ⚖️ Dual Model comparison Playground
* Side-by-side execution interface to compare prompt behaviors.
* Run prompts concurrently against `gemini-2.5-flash` and `gemini-2.5-pro`.
* Measures actual latency (ms) and estimates response token sizes.

### 5. 🧪 Interactive Test Cases (Prompt Evals)
* Maintain a test suite for each prompt.
* Add multiple test cases with distinct values for your variables.
* Batch execute the entire test suite locally (compiling all outputs) or against live LLMs concurrently to review output consistency.

---

## 🛠️ Architecture

* **Frontend**: React 19 + TypeScript + Vite.
* **Styling**: Vanilla CSS with HSL-based color tokens, dynamic animation frames, and media query breakpoint overlays.
* **API Connectivity**: Client-side direct fetches to Google Generative Language API (using your secure, locally-stored API key).
* **Storage**: LocalStorage browser persistence for raw drafts, configurations, history revisions, template catalogs, and evaluation test cases.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* npm (v9+)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/promptcraft-pro.git
   cd promptcraft-pro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Build production assets:
   ```bash
   npm run build
   ```

---

## 📄 License
Distributed under the MIT License. See [LICENSE](file:///LICENSE) for details.
