# Contributing to PromptCraft Pro 🚀

Thank you for your interest in contributing to PromptCraft Pro! To maintain high code quality and consistency, please review and follow these guidelines.

---

## 🛠️ Local Development Setup

1. **Fork & Clone:** Fork the repository on GitHub and clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/promptcraft-pro.git
   cd promptcraft-pro
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 📐 Coding Standards & Guidelines

* **TypeScript:** Write strict type-safe code. Avoid using `any` type casts; specify interfaces, unions, or types instead.
* **Component Modularity:** Keep React components small, focused, and stored inside the `src/components/` directory.
* **Purity Rules:** Adhere to React 19 component purity guidelines. Do not execute side-effects or synchronous `setState` calls directly during component render sweeps. Use event handler callbacks or custom hooks.
* **Styling:** Add visual updates directly to [src/index.css](file:///C:/Users/ADMIN/Documents/antigravity/proud-chandrasekhar/src/index.css) using the custom CSS custom properties (variables) for theme consistency.

---

## 🔬 Quality Assurance Checklists

Before opening a pull request, ensure your code compiles and passes all checks:

1. **Format & Lint checks:**
   ```bash
   npm run lint
   ```
2. **TypeScript Compilation Check:**
   ```bash
   npx tsc --noEmit
   ```
3. **Production Build Compilation:**
   ```bash
   npm run build
   ```

---

## 📨 Pull Request Process

1. **Branch Naming:** Create a feature branch matching this syntax: `feature/short-description` or `bugfix/issue-description`.
2. **Commit Messages:** Follow standard semantic formatting (e.g., `feat: add markdown visual diff panel` or `fix: resolve settings synchronous setState effect`).
3. **Open PR:** Submit your pull request targeting the `main` branch. Ensure that all automated GitHub Action CI status tests pass.
