// Types for Prompt Configurations

export type RoleId = 'general' | 'software_engineer' | 'copywriter' | 'educator' | 'data_analyst' | 'ux_designer' | 'seo_expert';
export type ToneId = 'professional' | 'creative' | 'academic' | 'casual' | 'assertive';
export type FormatId = 'markdown' | 'code' | 'json' | 'bullet_points' | 'qa';
export type FrameworkId = 'rtfc' | 'costar' | 'none';

export interface PromptConfig {
    rawPrompt: string;
    role: RoleId;
    tone: ToneId;
    framework: FrameworkId;
    format: FormatId;
    detailLevel: number; // 1 = Concise, 2 = Balanced, 3 = Elaborate
    noApologies: boolean;
    stepByStep: boolean;
    edgeCases: boolean;
    variables: Record<string, string>;
}

// Variables metadata structure
export interface VariableMeta {
    key: string;            // Exact inner text, e.g. "framework:react|vue|svelte"
    name: string;           // Clean name, e.g. "framework"
    defaultValue: string;   // Default value
    choices?: string[];     // Options list if any
    type: 'text' | 'choice' | 'boolean'; // Type discriminator
}

// Presets Dictionaries
export const ROLES: Record<RoleId, { title: string; desc: string }> = {
    general: {
        title: "Expert Assistant",
        desc: "You are a highly capable, logical, and structured assistant. Your objective is to address queries with complete accuracy, helpful explanations, and optimal formatting."
    },
    software_engineer: {
        title: "Senior Software Architect",
        desc: "You are an expert Senior Software Architect and Engineer. Your code is clean, well-documented, highly performant, scalable, and secure. You carefully consider system constraints, algorithmic complexity (Big O), and design patterns."
    },
    copywriter: {
        title: "Elite Conversion Copywriter",
        desc: "You are a world-class copywriter specializing in conversion rate optimization and persuasive writing. You craft content that captures attention instantly, maintains high readability, and evokes strong emotional triggers, leading to action."
    },
    educator: {
        title: "Socratic Teacher & Educator",
        desc: "You are an engaging Socratic educator. Instead of merely providing direct answers, you focus on guided learning, asking conceptual follow-up questions, breaking down complex theories into simple analogies, and encouraging critical thinking."
    },
    data_analyst: {
        title: "Principal Data Scientist",
        desc: "You are a Principal Data Scientist and Business Analyst. You inspect data sets with complete mathematical rigor, look for statistical correlations, identify anomalous trends, explain causality, and present findings in readable tables or clear summaries."
    },
    ux_designer: {
        title: "UX/UI Design Strategist",
        desc: "You are a lead UX/UI Designer and accessibility advocate. You structure interactions with heuristics-driven guidelines, prioritizing usability, aesthetic consistency, interactive flow, responsive layouts, and user accessibility (WCAG)."
    },
    seo_expert: {
        title: "Master SEO & Growth Strategist",
        desc: "You are an SEO Growth Master. You optimize articles and text for keyword relevance, structural headings, searcher intent, domain authority factors, and click-through rates while ensuring that content feels engaging and natural to read."
    }
};

export const TONES: Record<ToneId, string> = {
    professional: "Maintain a highly professional, objective, direct, and authoritative tone. Avoid subjective embellishments and focus on factual correctness.",
    creative: "Maintain an engaging, narrative-driven, imaginative, and highly descriptive style. Use metaphors, rich imagery, and vibrant vocabulary.",
    academic: "Adopt an academic, formal, analytical, and highly structured writing style. Use domain-specific terminology and objective synthesis.",
    casual: "Keep the tone warm, friendly, conversational, and lighthearted. Write as if you are talking to a peer, using simple language.",
    assertive: "Adopt a direct, assertive, decisive, and outcome-oriented tone. Highlight core commands, use active voice, and avoid passive hesitation."
};

export const FORMATS: Record<FormatId, string> = {
    markdown: "Provide the output formatted as a clean GitHub-Flavored Markdown document. Use clear hierarchical headers (#, ##, ###), bold highlights, bullet lists, and code sections where applicable.",
    code: "Format the output strictly inside a markdown code block (e.g., ```python, ```js). The output should contain clean code and in-line comment documentation only, without external introductory remarks.",
    json: "Format the output strictly as a single, valid, and clean JSON object conforming to RFC 8259. Do not wrap the JSON object in conversational preambles. Ensure keys and values are double-quoted.",
    bullet_points: "Structure the response as an organized, nested bulleted list. Each bullet should represent a single cohesive thought, starting with a bold keyword representing the category.",
    qa: "Structure the output in an interactive Q&A format. Present key points as questions, followed immediately by detailed, structured responses."
};

export const DETAIL_GUIDELINES = [
    "Keep the output highly concise, direct, and minimal. Focus on raw answers and eliminate background context or explanations.",
    "Provide a balanced response. Balance brief, easy-to-digest summaries with necessary technical or background explanations.",
    "Provide a comprehensive, highly detailed response. Offer extensive background context, step-by-step breakdowns, code/concept examples, and list assumptions made."
];

/**
 * Parses a raw prompt string and extracts all variables matching the {{name}} syntax,
 * including defaults ({{name=val}}), options enums ({{name:opt1|opt2|opt3}}), and
 * conditional blocks ({% if name %}).
 */
export function parsePromptVariables(rawPrompt: string): VariableMeta[] {
    const variables: VariableMeta[] = [];
    const seenNames = new Set<string>();
    
    // 1. Parse conditional blocks: {% if name %}
    const condRegex = /{%\s*if\s+([a-zA-Z0-9_-]+)\s*%}/g;
    let condMatch;
    while ((condMatch = condRegex.exec(rawPrompt)) !== null) {
        const name = condMatch[1].trim();
        if (!seenNames.has(name)) {
            seenNames.add(name);
            variables.push({
                key: condMatch[0],
                name,
                defaultValue: 'false',
                type: 'boolean'
            });
        }
    }

    // 2. Parse standard variables: {{name}}
    const varRegex = /\{\{([^}]+)\}\}/g;
    let varMatch;
    while ((varMatch = varRegex.exec(rawPrompt)) !== null) {
        const fullContent = varMatch[1].trim();
        
        let name: string;
        let defaultValue = '';
        let choices: string[] | undefined = undefined;
        let type: 'text' | 'choice' = 'text';

        // 2a. Check for default values (e.g., {{language=python}})
        const eqIndex = fullContent.indexOf('=');
        let configPart = fullContent;
        if (eqIndex !== -1) {
            defaultValue = fullContent.substring(eqIndex + 1).trim();
            configPart = fullContent.substring(0, eqIndex).trim();
        }

        // 2b. Check for option enums (e.g., {{framework:react|vue|svelte}})
        const colonIndex = configPart.indexOf(':');
        if (colonIndex !== -1) {
            name = configPart.substring(0, colonIndex).trim();
            const choicesStr = configPart.substring(colonIndex + 1).trim();
            choices = choicesStr.split('|').map(c => c.trim()).filter(Boolean);
            type = 'choice';
            
            // Default to first choice if no default is explicitly configured
            if (!defaultValue && choices.length > 0) {
                defaultValue = choices[0];
            }
        } else {
            name = configPart;
        }

        if (!seenNames.has(name)) {
            seenNames.add(name);
            variables.push({
                key: varMatch[1],
                name,
                defaultValue,
                choices,
                type
            });
        }
    }

    return variables;
}

/**
 * Replaces variable markers in the prompt with user inputs or default values.
 */
export function processRawPrompt(rawPrompt: string, variables: Record<string, string>): string {
    let text = rawPrompt;
    
    // 1. Process conditional blocks first: {% if key %} ... {% endif %}
    const condBlockRegex = /{%\s*if\s+([a-zA-Z0-9_-]+)\s*%}([\s\S]*?){%\s*endif\s*%}/g;
    text = text.replace(condBlockRegex, (_, name, innerContent) => {
        const isTrue = variables[name] === 'true';
        return isTrue ? innerContent : '';
    });
    
    // 2. Process standard variables by matching all variations of their clean name
    const metas = parsePromptVariables(rawPrompt).filter(m => m.type !== 'boolean');
    
    metas.forEach(meta => {
        const value = variables[meta.name]?.trim() !== undefined && variables[meta.name]?.trim() !== ''
            ? variables[meta.name].trim()
            : (meta.defaultValue || `[${meta.name}]`);
        
        // Escape name and target raw, default, or enum occurrences
        const escapedName = meta.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const pattern = new RegExp(`\\{\\{\\s*${escapedName}\\s*(?:=[^}]+|:[^}]+)?\\}\\}`, 'g');
        text = text.replace(pattern, value);
    });
    
    return text;
}

// Local Compiler
export function compileLocalPrompt(config: PromptConfig): string {
    const raw = processRawPrompt(config.rawPrompt, config.variables);
    
    // Constraints builder
    const constraints: string[] = [];
    if (config.noApologies) {
        constraints.push("DO NOT apologize, repeat the question, or add conversational fluff (e.g., 'Sure, I can help with that'). Start directly with the answer.");
    }
    if (config.stepByStep) {
        constraints.push("Apply chain-of-thought reasoning. Explain your step-by-step thinking or write out a logical plan before delivering the final response.");
    }
    if (config.edgeCases) {
        constraints.push("Identify potential edge cases, hidden assumptions, constraints, and alternative scenarios in your response, and explain how to mitigate them.");
    }
    constraints.push(DETAIL_GUIDELINES[config.detailLevel - 1]);
    
    let compiled = '';
    
    if (config.framework === 'rtfc') {
        compiled += `# ROLE\n${ROLES[config.role].desc}\n\n`;
        compiled += `# TASK / OBJECTIVE\n${raw}\n\n`;
        compiled += `# FORMAT SPECIFICATION\n${FORMATS[config.format]}\n\n`;
        compiled += `# CONSTRAINTS & RULES\n`;
        constraints.forEach(c => {
            compiled += `- ${c}\n`;
        });
        compiled += `- Tone instructions: ${TONES[config.tone]}`;
        
    } else if (config.framework === 'costar') {
        compiled += `# CONTEXT\n${ROLES[config.role].desc}\n\n`;
        compiled += `# OBJECTIVE\n${raw}\n\n`;
        compiled += `# STYLE\n${TONES[config.tone]}\n\n`;
        compiled += `# TONE\n${TONES[config.tone].split('.')[0]}.\n\n`;
        compiled += `# AUDIENCE\nTarget audience for this request includes users seeking high-quality, professional, and accurate output relevant to ${ROLES[config.role].title}.\n\n`;
        compiled += `# RESPONSE FORMAT\n${FORMATS[config.format]}\n\n`;
        compiled += `# CONSTRAINTS\n`;
        constraints.forEach(c => {
            compiled += `- ${c}\n`;
        });
        
    } else {
        // Standard Structured
        compiled += `You are a ${ROLES[config.role].title}.\n`;
        compiled += `Persona Context: ${ROLES[config.role].desc}\n\n`;
        compiled += `Instructions: ${raw}\n\n`;
        compiled += `Format details: ${FORMATS[config.format]}\n`;
        compiled += `Tone: ${TONES[config.tone]}\n\n`;
        compiled += `Specific guidelines you must follow:\n`;
        constraints.forEach(c => {
            compiled += `- ${c}\n`;
        });
    }
    
    return compiled;
}

// Calculate Heuristic Score & Quality Evaluation
export function calculatePromptMetrics(promptText: string, config: PromptConfig) {
    const wordCount = promptText.trim().split(/\s+/).filter(Boolean).length;
    const charCount = promptText.length;
    
    // Estimate Token Count: approx 1.35 tokens per word
    const estTokens = Math.ceil(wordCount * 1.35);
    
    let score = 20; // base score for writing anything
    const tips: string[] = [];
    
    if (charCount > 100) {
        score += 15;
        tips.push("Good length: Prompt has sufficient text for depth.");
    } else {
        tips.push("Relatively short prompt. Consider adding more context.");
    }
    
    if (promptText.includes('# ROLE') || promptText.includes('You are a') || promptText.includes('# CONTEXT')) {
        score += 20;
        tips.push("Persona Assigned: The LLM will adopt a clear perspective/role.");
    } else {
        tips.push("Add a specific Role framework to improve persona alignment.");
    }
    
    if (promptText.includes('# FORMAT') || promptText.includes('Format details') || promptText.includes('# RESPONSE')) {
        score += 20;
        tips.push("Formatting Specified: Explicit output format reduces formatting errors.");
    } else {
        tips.push("Outline how you want the AI to structure its output.");
    }
    
    if (config.noApologies || config.stepByStep || config.edgeCases) {
        score += 15;
        tips.push("Constraints applied: Extra guidelines help block hallucinations and fluff.");
    } else {
        tips.push("Apply checkboxes to reduce apology chatter and enforce step-by-step thinking.");
    }
    
    if (parsePromptVariables(config.rawPrompt).length > 0) {
        score += 10;
        tips.push("Reusable Template: Variable fields allow dynamic configurations.");
    }
    
    return {
        tokens: estTokens,
        score: Math.min(score, 100),
        tips
    };
}
