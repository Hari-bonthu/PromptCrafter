import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PromptEditor } from './components/PromptEditor';
import { VariableManager } from './components/VariableManager';
import { ConfigPanel } from './components/ConfigPanel';
import { PromptOutput } from './components/PromptOutput';
import { SettingsModal } from './components/SettingsModal';
import { TemplatesModal } from './components/TemplatesModal';
import { SandboxCompare } from './components/SandboxCompare';
import { CatalogPanel, type SavedTemplate } from './components/CatalogPanel';
import { PromptEvals } from './components/PromptEvals';
import type { PromptVersion } from './components/HistoryPanel';
import { 
    type PromptConfig, 
    compileLocalPrompt, 
    processRawPrompt, 
    parsePromptVariables, 
    type RoleId,
    type ToneId,
    type FormatId
} from './utils/compiler';

let versionCounter = 0;
const generateVersionId = () => {
    versionCounter++;
    return `${Date.now()}-${versionCounter}`;
};

export const App: React.FC = () => {
    // 1. Initial State Loading from LocalStorage for persistence
    const [rawPrompt, setRawPrompt] = useState<string>(() => {
        return localStorage.getItem('promptcraft_raw_prompt') || '';
    });
    
    const [config, setConfig] = useState<PromptConfig>(() => {
        const saved = localStorage.getItem('promptcraft_config');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                /* ignore parsing errors, fallback to default */
            }
        }
        return {
            rawPrompt: '',
            role: 'general',
            tone: 'professional',
            framework: 'rtfc',
            format: 'markdown',
            detailLevel: 2,
            noApologies: true,
            stepByStep: true,
            edgeCases: false,
            variables: {}
        };
    });

    const [outputText, setOutputText] = useState<string>(() => {
        return localStorage.getItem('promptcraft_output_text') || '';
    });

    const [history, setHistory] = useState<PromptVersion[]>(() => {
        const saved = localStorage.getItem('promptcraft_history');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                /* ignore parsing errors, fallback to default */
            }
        }
        return [];
    });

    const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>(() => {
        const saved = localStorage.getItem('promptcraft_saved_templates');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                /* ignore parsing errors, fallback to default */
            }
        }
        return [];
    });

    // Panel tabs, modes, and loading triggers
    const [activeTab, setActiveTab] = useState<'preview' | 'meta' | 'history'>('preview');
    const [mode, setMode] = useState<'local' | 'ai'>('local');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // API Configurations
    const [apiKey, setApiKey] = useState<string>(localStorage.getItem('promptcraft_gemini_api_key') || '');
    const [selectedModel, setSelectedModel] = useState<string>(localStorage.getItem('promptcraft_gemini_model') || 'gemini-2.5-flash');

    // Modals overlays
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);

    // Toasts notifier state
    const [toasts, setToasts] = useState<Array<{ id: string; msg: string; type: 'success' | 'error' | 'info' }>>([]);

    // Compute variable metadata dynamically on render
    const parsedMetas = parsePromptVariables(rawPrompt);

    // 2. Synchronize workspace updates to LocalStorage
    useEffect(() => {
        localStorage.setItem('promptcraft_raw_prompt', rawPrompt);
    }, [rawPrompt]);

    useEffect(() => {
        localStorage.setItem('promptcraft_config', JSON.stringify(config));
    }, [config]);

    useEffect(() => {
        localStorage.setItem('promptcraft_output_text', outputText);
    }, [outputText]);

    useEffect(() => {
        localStorage.setItem('promptcraft_history', JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        localStorage.setItem('promptcraft_saved_templates', JSON.stringify(savedTemplates));
    }, [savedTemplates]);

    // Toast triggers helper
    const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    // Handlers
    const handleRawPromptChange = (val: string) => {
        setRawPrompt(val);

        const metas = parsePromptVariables(val);
        const currentKeys = Object.keys(config.variables);
        const detectedKeys = metas.map(m => m.name);
        const keysChanged =
            detectedKeys.length !== currentKeys.length ||
            detectedKeys.some(k => !currentKeys.includes(k));

        if (keysChanged) {
            const nextVars: Record<string, string> = {};
            metas.forEach(meta => {
                nextVars[meta.name] = config.variables[meta.name] !== undefined
                    ? config.variables[meta.name]
                    : meta.defaultValue;
            });
            setConfig(prev => ({
                ...prev,
                rawPrompt: val,
                variables: nextVars
            }));
        } else {
            setConfig(prev => ({
                ...prev,
                rawPrompt: val
            }));
        }
    };

    const handleConfigChange = (updates: Partial<PromptConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
    };

    const handleVariableChange = (name: string, value: string) => {
        setConfig(prev => ({
            ...prev,
            variables: {
                ...prev.variables,
                [name]: value
            }
        }));
    };

    const handleClearPrompt = () => {
        setRawPrompt('');
        setOutputText('');
        setConfig(prev => ({
            ...prev,
            rawPrompt: '',
            variables: {}
        }));
        showToast('Input cleared', 'info');
    };

    const handleSelectTemplate = (templatePrompt: string, role: string, tone: string, format: string, title: string) => {
        setRawPrompt(templatePrompt);

        const metas = parsePromptVariables(templatePrompt);
        const nextVars: Record<string, string> = {};
        metas.forEach(meta => {
            nextVars[meta.name] = meta.defaultValue;
        });

        setConfig(prev => ({
            ...prev,
            rawPrompt: templatePrompt,
            role: role as RoleId,
            tone: tone as ToneId,
            format: format as FormatId,
            variables: nextVars
        }));
        showToast(`Loaded Template: ${title}`, 'info');
    };

    const handleSaveSettings = (key: string, model: string) => {
        setApiKey(key);
        setSelectedModel(model);
        localStorage.setItem('promptcraft_gemini_api_key', key);
        localStorage.setItem('promptcraft_gemini_model', model);
        showToast('Gemini API configuration saved!', 'success');
    };

    // Save current active config to saved templates catalog
    const handleSaveTemplate = (title: string, description: string) => {
        const newTemplate: SavedTemplate = {
            id: Math.random().toString(36).substring(2, 9),
            title,
            description,
            prompt: rawPrompt,
            role: config.role,
            tone: config.tone,
            format: config.format
        };
        setSavedTemplates(prev => [...prev, newTemplate]);
    };

    const handleDeleteTemplate = (id: string) => {
        setSavedTemplates(prev => prev.filter(t => t.id !== id));
        showToast('Template deleted', 'info');
    };

    const handleImportTemplates = (imported: SavedTemplate[]) => {
        setSavedTemplates(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const uniqueImported = imported.filter(t => !existingIds.has(t.id));
            return [...prev, ...uniqueImported];
        });
    };

    // Run compile / rewrite prompt logic
    const handleGenerate = async () => {
        const rawTrim = rawPrompt.trim();
        if (!rawTrim) {
            showToast('Please enter a raw prompt first!', 'error');
            return;
        }

        setIsLoading(true);

        try {
            let finalOutput = '';

            if (mode === 'local') {
                finalOutput = compileLocalPrompt(config);
                showToast('Prompt compiled locally!', 'success');
            } else {
                if (!apiKey) {
                    setIsSettingsOpen(true);
                    showToast('Please save a valid Gemini API Key first.', 'error');
                    setIsLoading(false);
                    return;
                }
                finalOutput = await generateWithGeminiAPI();
                showToast('Prompt optimized by Gemini AI!', 'success');
            }

            setOutputText(finalOutput);
            setActiveTab('preview');

            const newVersion: PromptVersion = {
                id: generateVersionId(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                title: rawTrim.length > 30 ? `${rawTrim.substring(0, 30)}...` : rawTrim,
                prompt: finalOutput,
                configSummary: `${config.framework.toUpperCase()} | ${config.role}`
            };
            setHistory(prev => [newVersion, ...prev]);

        } catch (e: unknown) {
            const err = e as Error;
            console.error(err);
            showToast(`Execution failed: ${err.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const generateWithGeminiAPI = async (): Promise<string> => {
        const processedPrompt = processRawPrompt(rawPrompt, config.variables);
        const constraintsText = [];
        if (config.noApologies) constraintsText.push("No conversational fluff or greetings");
        if (config.stepByStep) constraintsText.push("Explain logical steps / chain-of-thought");
        if (config.edgeCases) constraintsText.push("Analyze assumptions and edge cases");

        const systemInstruction = `You are a world-class prompt engineer. Your job is to transform a raw user prompt into an incredibly optimized, clear, structured, and context-rich prompt for Large Language Models. 
        
        Structure the final prompt in a clear hierarchy (e.g. using a system prompt/user instructions breakdown, or using the RTFC/CO-STAR framework).
        
        Ensure the following parameters are fully integrated into the prompt instructions:
        - Target Persona to Adopt: ${config.role}
        - Tone style: ${config.tone}
        - Output Format: ${config.format}
        - Detail constraint level: Slider index ${config.detailLevel} (1=Concise, 2=Balanced, 3=Elaborate)
        - Specific Rules: ${constraintsText.join(', ')}

        Your output must contain ONLY the final, ready-to-use enhanced prompt. Do NOT wrap it in conversational preambles like "Here is your enhanced prompt:", and do NOT include markdown backticks around the entire output unless the enhanced prompt itself requires code fences. Return the direct prompt itself.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: `${systemInstruction}\n\nRaw Prompt to Enhance:\n"${processedPrompt}"` }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.95,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            throw new Error(errJson.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error('API returned empty response or invalid format.');
        }

        return generatedText.trim();
    };

    return (
        <>
            <div className="glow-bg glow-1"></div>
            <div className="glow-bg glow-2"></div>

            <div className="app-container">
                <Header
                    onOpenTemplates={() => setIsTemplatesOpen(true)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                />

                <main className="dashboard-grid">
                    {/* Left Column Controls */}
                    <section className="panel panel-left">
                        <div className="panel-header">
                            <h2>Configure Input</h2>
                            <p className="panel-subtitle">Define your raw prompt and enhancement rules</p>
                        </div>
                        <div className="panel-body">
                            <PromptEditor
                                value={rawPrompt}
                                onChange={handleRawPromptChange}
                                onClear={handleClearPrompt}
                            />

                            <VariableManager
                                variables={config.variables}
                                parsedMetas={parsedMetas}
                                onChangeVariable={handleVariableChange}
                            />

                            <ConfigPanel
                                config={config}
                                onChange={handleConfigChange}
                            />

                            <CatalogPanel
                                savedTemplates={savedTemplates}
                                onLoadTemplate={handleSelectTemplate}
                                onSaveTemplate={handleSaveTemplate}
                                onDeleteTemplate={handleDeleteTemplate}
                                onImportTemplates={handleImportTemplates}
                                onToast={showToast}
                            />

                            <div className="actions-footer">
                                <div className="mode-selector">
                                    <button
                                        className={`mode-btn ${mode === 'local' ? 'active' : ''}`}
                                        onClick={() => setMode('local')}
                                        title="Structures prompt locally based on settings"
                                    >
                                        Local Heuristic Compiler
                                    </button>
                                    <button
                                        className={`mode-btn ${mode === 'ai' ? 'active' : ''}`}
                                        onClick={() => setMode('ai')}
                                        title="Uses live LLM (Gemini API) to expand and refine prompt"
                                    >
                                        Gemini AI Enhancer
                                    </button>
                                </div>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isLoading}
                                    className="btn btn-primary btn-lg"
                                    style={
                                        mode === 'ai'
                                            ? { background: 'linear-gradient(135deg, var(--accent-violet) 0%, #ec4899 100%)' }
                                            : undefined
                                    }
                                >
                                    <span className="btn-text">
                                        {isLoading ? 'Crafting...' : mode === 'ai' ? 'Craft with Gemini AI' : 'Craft Prompt'}
                                    </span>
                                    {isLoading && (
                                        <svg className="loading-spinner" width="20" height="20" viewBox="0 0 50 50">
                                            <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Right Column Outputs */}
                    <section className="panel panel-right">
                        <div className="panel-header">
                            <h2>Enhanced Prompt</h2>
                            <p className="panel-subtitle">Review, test, and copy the refined instructions</p>
                        </div>
                        <div className="panel-body output-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <PromptOutput
                                outputText={outputText}
                                config={config}
                                activeTab={activeTab}
                                onChangeTab={setActiveTab}
                                history={history}
                                onRestoreHistory={setOutputText}
                                onToast={showToast}
                                onChangeOutputText={setOutputText}
                            />

                            {/* Dual Model Playground comparison */}
                            <SandboxCompare
                                outputText={outputText}
                                apiKey={apiKey}
                                onToast={showToast}
                            />

                            {/* Interactive Test Suite Evals */}
                            <PromptEvals
                                rawPrompt={rawPrompt}
                                config={config}
                                parsedMetas={parsedMetas}
                                apiKey={apiKey}
                                selectedModel={selectedModel}
                                onToast={showToast}
                            />
                        </div>
                    </section>
                </main>
            </div>

            {/* API Settings Modal */}
            {isSettingsOpen && (
                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    initialApiKey={apiKey}
                    initialModel={selectedModel}
                    onSave={handleSaveSettings}
                    onToast={showToast}
                />
            )}

            {/* Presets templates library modal */}
            <TemplatesModal
                isOpen={isTemplatesOpen}
                onClose={() => setIsTemplatesOpen(false)}
                onSelectTemplate={handleSelectTemplate}
            />

            {/* Floating Toast Notification Containers */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div 
                        key={t.id} 
                        className={`toast ${t.type}`}
                        onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                        style={{ cursor: 'pointer' }}
                        title="Click to dismiss"
                    >
                        {t.type === 'success' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        )}
                        {t.type === 'error' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        )}
                        {t.type === 'info' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        )}
                        <span>{t.msg}</span>
                    </div>
                ))}
            </div>
        </>
    );
};
