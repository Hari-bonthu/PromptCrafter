import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PromptEditor } from './components/PromptEditor';
import { VariableManager } from './components/VariableManager';
import { ConfigPanel } from './components/ConfigPanel';
import { PromptOutput } from './components/PromptOutput';
import { SettingsModal } from './components/SettingsModal';
import { TemplatesModal } from './components/TemplatesModal';
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

    // Sidebar & Navigation states
    const [activeTab, setActiveTab] = useState<'preview' | 'meta' | 'history'>('preview');
    const [mode, setMode] = useState<'local' | 'ai'>('local');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    // Sandbox states
    const [sandboxResponse, setSandboxResponse] = useState<string>('');
    const [isSandboxLoading, setIsSandboxLoading] = useState<boolean>(false);

    // API credentials
    const [apiKey, setApiKey] = useState<string>(localStorage.getItem('promptcraft_gemini_api_key') || '');
    const [selectedModel, setSelectedModel] = useState<string>(localStorage.getItem('promptcraft_gemini_model') || 'gemini-2.5-flash');

    // Modals
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);

    // Toasts queues
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

    // Toast triggers helper
    const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    // Config updating helper
    const handleConfigChange = (updates: Partial<PromptConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
    };

    // Update specific variables values
    const handleVariableChange = (name: string, value: string) => {
        setConfig(prev => ({
            ...prev,
            variables: {
                ...prev.variables,
                [name]: value
            }
        }));
    };

    // Clear editing panel
    const handleClearPrompt = () => {
        setRawPrompt('');
        setSandboxResponse('');
        setOutputText('');
        
        setConfig(prev => ({
            ...prev,
            rawPrompt: '',
            variables: {}
        }));
        showToast('Input cleared', 'info');
    };

    // Load templates preset
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

    // API credentials save callback
    const handleSaveSettings = (key: string, model: string) => {
        setApiKey(key);
        setSelectedModel(model);
        localStorage.setItem('promptcraft_gemini_api_key', key);
        localStorage.setItem('promptcraft_gemini_model', model);
        showToast('Gemini API configuration saved!', 'success');
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
                // Instant Local Compile
                finalOutput = compileLocalPrompt(config);
                showToast('Prompt compiled locally!', 'success');
            } else {
                // Gemini API Call
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

            // Save revision to history log
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

    // Sandbox execution simulation run
    const handleRunSandbox = async () => {
        if (!outputText) {
            showToast('Please compile a prompt first!', 'error');
            return;
        }
        if (!apiKey) {
            setIsSettingsOpen(true);
            showToast('API key is required to run simulation.', 'error');
            return;
        }

        setIsSandboxLoading(true);
        setSandboxResponse('');

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: outputText }] }],
                    generationConfig: { maxOutputTokens: 1024 }
                })
            });

            if (!response.ok) {
                const errJson = await response.json().catch(() => ({}));
                throw new Error(errJson.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error('API returned empty response');

            setSandboxResponse(text.trim());
            showToast('Sandbox simulation run successful!', 'success');
        } catch (err: unknown) {
            const error = err as Error;
            showToast(`Sandbox run failed: ${error.message}`, 'error');
        } finally {
            setIsSandboxLoading(false);
        }
    };

    // Gemini API Call
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
            {/* Glowing Accent Orbs */}
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
                                    className={`btn btn-primary btn-lg ${mode === 'ai' ? 'ai-btn-style' : ''}`}
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
                        <div className="panel-body output-panel-body">
                            <PromptOutput
                                outputText={outputText}
                                config={config}
                                activeTab={activeTab}
                                onChangeTab={setActiveTab}
                                history={history}
                                onRestoreHistory={setOutputText}
                                onToast={showToast}
                            />

                            {/* Direct Sandbox Simulator & Runner */}
                            <div className="simulator-card">
                                <div className="simulator-header">
                                    <div className="sim-dots">
                                        <span></span><span></span><span></span>
                                    </div>
                                    <div className="sim-title">Prompt Engine Sandbox</div>
                                    {outputText && (
                                        <button
                                            onClick={handleRunSandbox}
                                            disabled={isSandboxLoading}
                                            className="btn btn-secondary btn-sm"
                                            style={{ marginLeft: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                        >
                                            {isSandboxLoading ? 'Running...' : 'Run Simulation'}
                                        </button>
                                    )}
                                </div>
                                <div className="simulator-body" style={{ minHeight: '120px', justifyContent: 'flex-start', textAlign: 'left', display: 'flex', flexDirection: 'column', width: '100%' }}>
                                    {isSandboxLoading ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto', gap: '0.5rem' }}>
                                            <svg className="loading-spinner" width="24" height="24" viewBox="0 0 50 50">
                                                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" stroke="var(--accent-indigo)"></circle>
                                            </svg>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Executing prompt against model...</span>
                                        </div>
                                    ) : sandboxResponse ? (
                                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>Response:</span>
                                                <button
                                                    onClick={() => setSandboxResponse('')}
                                                    className="btn-text-link"
                                                    style={{ fontSize: '0.7rem' }}
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                            <textarea
                                                style={{ width: '100%', height: '150px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontStyle: 'normal', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical', padding: 0 }}
                                                value={sandboxResponse}
                                                readOnly
                                            />
                                        </div>
                                    ) : (
                                        <div className="sim-placeholder" style={{ margin: 'auto' }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                            </svg>
                                            <p>Click "Run Simulation" above to execute this prompt directly against Gemini and preview the output.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
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
                    <div key={t.id} className={`toast ${t.type}`}>
                        {t.type === 'success' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        )}
                        {t.type === 'error' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        )}
                        {t.type === 'info' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
