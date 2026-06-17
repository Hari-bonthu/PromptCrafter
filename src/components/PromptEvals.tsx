import React, { useState, useEffect } from 'react';
import { type VariableMeta, compileLocalPrompt, type PromptConfig } from '../utils/compiler';

export interface TestCase {
    id: string;
    name: string;
    variables: Record<string, string>;
    compiledPrompt?: string;
    output?: string;
    latency?: number;
    status: 'idle' | 'running' | 'success' | 'error';
    error?: string;
}

interface PromptEvalsProps {
    rawPrompt: string;
    config: PromptConfig;
    parsedMetas: VariableMeta[];
    apiKey: string;
    selectedModel: string;
    onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PromptEvals: React.FC<PromptEvalsProps> = ({
    rawPrompt,
    config,
    parsedMetas,
    apiKey,
    selectedModel,
    onToast
}) => {
    const [testCases, setTestCases] = useState<TestCase[]>(() => {
        const saved = localStorage.getItem('promptcraft_eval_test_cases');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return [];
            }
        }
        return [];
    });

    const [editingTestCaseId, setEditingTestCaseId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editVariables, setEditVariables] = useState<Record<string, string>>({});
    const [runMode, setRunMode] = useState<'local' | 'ai'>('local');
    const [isRunningSuite, setIsRunningSuite] = useState(false);
    const [expandedTestCaseId, setExpandedTestCaseId] = useState<string | null>(null);

    // Save test cases to localStorage when they change
    useEffect(() => {
        localStorage.setItem('promptcraft_eval_test_cases', JSON.stringify(testCases));
    }, [testCases]);

    // Handle adding a new testcase
    const handleAddTestCase = () => {
        const id = Math.random().toString(36).substring(2, 9);
        const defaultVars: Record<string, string> = {};
        parsedMetas.forEach(meta => {
            defaultVars[meta.name] = meta.defaultValue || '';
        });

        const newCase: TestCase = {
            id,
            name: `Test Case ${testCases.length + 1}`,
            variables: defaultVars,
            status: 'idle'
        };

        setTestCases(prev => [...prev, newCase]);
        setEditingTestCaseId(id);
        setEditName(newCase.name);
        setEditVariables(newCase.variables);
        onToast('New test case added', 'success');
    };

    // Handle editing a test case
    const handleStartEdit = (tc: TestCase) => {
        setEditingTestCaseId(tc.id);
        setEditName(tc.name);
        // Ensure all currently parsed variables exist in the edit object
        const mergedVars = { ...tc.variables };
        parsedMetas.forEach(meta => {
            if (mergedVars[meta.name] === undefined) {
                mergedVars[meta.name] = meta.defaultValue || '';
            }
        });
        setEditVariables(mergedVars);
    };

    const handleSaveEdit = () => {
        if (!editName.trim()) {
            onToast('Test case name is required', 'error');
            return;
        }

        setTestCases(prev => prev.map(tc => {
            if (tc.id === editingTestCaseId) {
                return {
                    ...tc,
                    name: editName.trim(),
                    variables: editVariables,
                    status: 'idle',
                    compiledPrompt: undefined,
                    output: undefined,
                    latency: undefined
                };
            }
            return tc;
        }));

        setEditingTestCaseId(null);
        onToast('Test case updated', 'success');
    };

    const handleDeleteTestCase = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTestCases(prev => prev.filter(tc => tc.id !== id));
        if (editingTestCaseId === id) {
            setEditingTestCaseId(null);
        }
        if (expandedTestCaseId === id) {
            setExpandedTestCaseId(null);
        }
        onToast('Test case deleted', 'info');
    };

    const handleVariableValueChange = (name: string, val: string) => {
        setEditVariables(prev => ({
            ...prev,
            [name]: val
        }));
    };

    // Run a single test case
    const runSingleTestCase = async (tc: TestCase): Promise<TestCase> => {
        const start = performance.now();
        
        // 1. Compile locally first
        const localConfig = {
            ...config,
            rawPrompt,
            variables: { ...config.variables, ...tc.variables }
        };
        const compiled = compileLocalPrompt(localConfig);

        if (runMode === 'local') {
            const end = performance.now();
            return {
                ...tc,
                status: 'success',
                compiledPrompt: compiled,
                latency: Math.round(end - start)
            };
        }

        // 2. Run through Gemini API
        if (!apiKey) {
            throw new Error('API Key is required for AI Mode');
        }

        const systemInstruction = `You are a world-class prompt execution simulator. Execute the prompt configured below and return the output response directly without wrapping in fluff.`;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: `${systemInstruction}\n\nCompiled Prompt to Execute:\n"${compiled}"` }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.95,
                    maxOutputTokens: 1024
                }
            })
        });

        if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            throw new Error(errJson.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const end = performance.now();

        if (!generatedText) {
            throw new Error('Empty API response');
        }

        return {
            ...tc,
            status: 'success',
            compiledPrompt: compiled,
            output: generatedText.trim(),
            latency: Math.round(end - start)
        };
    };

    // Run all test cases in batch
    const handleRunTestSuite = async () => {
        if (testCases.length === 0) {
            onToast('No test cases to run!', 'error');
            return;
        }

        if (runMode === 'ai' && !apiKey) {
            onToast('API Key is required to run test cases in AI Mode. Save key in settings.', 'error');
            return;
        }

        setIsRunningSuite(true);
        onToast(`Running ${testCases.length} test cases...`, 'info');

        // Set all to running
        setTestCases(prev => prev.map(tc => ({ ...tc, status: 'running', error: undefined })));

        const runPromises = testCases.map(async (tc) => {
            try {
                const updated = await runSingleTestCase(tc);
                setTestCases(prev => prev.map(item => item.id === tc.id ? updated : item));
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                setTestCases(prev => prev.map(item => item.id === tc.id ? {
                    ...item,
                    status: 'error',
                    error: msg
                } : item));
            }
        });

        await Promise.all(runPromises);
        setIsRunningSuite(false);
        onToast('Test suite execution completed!', 'success');
    };

    const handleClearSuiteResults = () => {
        setTestCases(prev => prev.map(tc => ({
            ...tc,
            status: 'idle',
            compiledPrompt: undefined,
            output: undefined,
            latency: undefined,
            error: undefined
        })));
        onToast('Test suite outputs cleared', 'info');
    };

    return (
        <div className="card settings-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title" style={{ marginBottom: 0 }}>Interactive Test Cases (Prompt Evals)</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div className="mode-selector" style={{ padding: '0.15rem' }}>
                        <button
                            className={`mode-btn ${runMode === 'local' ? 'active' : ''}`}
                            onClick={() => setRunMode('local')}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            title="Compiles templates locally for each test case"
                        >
                            Compile
                        </button>
                        <button
                            className={`mode-btn ${runMode === 'ai' ? 'active' : ''}`}
                            onClick={() => setRunMode('ai')}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            title="Runs prompts concurrently against Gemini API for each test case"
                        >
                            Run LLM
                        </button>
                    </div>
                </div>
            </div>

            {/* Test suite action controls */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={handleAddTestCase}
                    disabled={isRunningSuite || editingTestCaseId !== null}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add Test Case
                </button>
                <button
                    onClick={handleRunTestSuite}
                    disabled={isRunningSuite || testCases.length === 0 || editingTestCaseId !== null}
                    className="btn btn-primary btn-sm"
                    style={{ 
                        flex: 1.5,
                        background: runMode === 'ai' ? 'linear-gradient(135deg, var(--accent-indigo) 0%, #ec4899 100%)' : undefined
                    }}
                >
                    {isRunningSuite ? 'Running Suite...' : `Execute Suite (${runMode.toUpperCase()})`}
                </button>
                {testCases.some(tc => tc.compiledPrompt || tc.output) && (
                    <button
                        onClick={handleClearSuiteResults}
                        disabled={isRunningSuite}
                        className="btn btn-icon btn-sm"
                        title="Clear Outputs"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                )}
            </div>

            {/* Edit Test Case Form Overlay / Drawer */}
            {editingTestCaseId !== null && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-hover)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', animation: 'slideDown 0.2s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-indigo)' }}>Configure Test Case Variables</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditingTestCaseId(null)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>Apply</button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ fontSize: '0.7rem' }}>Test Case Name</label>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="e.g., Python Context Test"
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-primary)', padding: '0.4rem 0.65rem', fontSize: '0.8rem', outline: 'none' }}
                        />
                    </div>

                    {parsedMetas.length === 0 ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem 0' }}>
                            No bracket variables found in the raw prompt.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                            {parsedMetas.map(meta => (
                                <div key={meta.name} className="form-group" style={{ gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{meta.name}</label>
                                    {meta.type === 'boolean' ? (
                                        <label className="checkbox-container" style={{ paddingLeft: '1.75rem', height: '26px' }}>
                                            <input
                                                type="checkbox"
                                                checked={editVariables[meta.name] === 'true'}
                                                onChange={(e) => handleVariableValueChange(meta.name, e.target.checked ? 'true' : 'false')}
                                            />
                                            <span className="checkmark" style={{ height: '16px', width: '16px' }}></span>
                                            True
                                        </label>
                                    ) : meta.type === 'choice' && meta.choices ? (
                                        <select
                                            value={editVariables[meta.name] !== undefined ? editVariables[meta.name] : (meta.defaultValue || '')}
                                            onChange={(e) => handleVariableValueChange(meta.name, e.target.value)}
                                            className="select-sm"
                                        >
                                            {meta.choices.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={editVariables[meta.name] || ''}
                                            onChange={(e) => handleVariableValueChange(meta.name, e.target.value)}
                                            placeholder={`Default: ${meta.defaultValue || ''}`}
                                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-primary)', padding: '0.35rem 0.5rem', fontSize: '0.75rem', outline: 'none' }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Test cases list & comparison UI */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {testCases.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                        No test cases defined. Define test cases to compare prompt behavior across inputs.
                    </div>
                ) : (
                    testCases.map((tc) => {
                        const isExpanded = expandedTestCaseId === tc.id;
                        return (
                            <div 
                                key={tc.id}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    background: 'rgba(255,255,255,0.01)',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    transition: 'var(--transition-fast)'
                                }}
                            >
                                {/* Header block */}
                                <div 
                                    onClick={() => setExpandedTestCaseId(isExpanded ? null : tc.id)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.65rem 0.85rem',
                                        cursor: 'pointer',
                                        background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent'
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{tc.name}</span>
                                            {tc.status === 'running' && (
                                                <span className="badge" style={{ color: 'var(--accent-indigo)' }}>running...</span>
                                            )}
                                            {tc.status === 'success' && (
                                                <span className="badge" style={{ color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                                                    {tc.latency}ms
                                                </span>
                                            )}
                                            {tc.status === 'error' && (
                                                <span className="badge" style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.2)' }}>error</span>
                                            )}
                                        </div>
                                        {/* Summarized variables preview */}
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {Object.entries(tc.variables).length === 0 ? 'No variables' : 
                                                Object.entries(tc.variables)
                                                    .map(([k, v]) => `${k}=${v}`)
                                                    .join(', ')
                                            }
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartEdit(tc);
                                            }}
                                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn-danger-link"
                                            onClick={(e) => handleDeleteTestCase(tc.id, e)}
                                            style={{ fontSize: '0.7rem', padding: '0 0.2rem' }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Body block: Output comparison details */}
                                {isExpanded && (
                                    <div style={{ padding: '0.85rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.15)' }}>
                                        {tc.error && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(244, 63, 94, 0.15)' }}>
                                                Error: {tc.error}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-indigo)' }}>Compiled Prompt</div>
                                            <textarea
                                                readOnly
                                                value={tc.compiledPrompt || 'Not compiled yet.'}
                                                style={{ width: '100%', height: '100px', padding: '0.5rem', fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-primary)', fontFamily: 'monospace', resize: 'vertical', outline: 'none' }}
                                            />
                                        </div>

                                        {runMode === 'ai' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-violet)' }}>LLM Output Response</span>
                                                    {tc.output && (
                                                        <button 
                                                            className="btn btn-secondary btn-sm"
                                                            style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(tc.output || '');
                                                                onToast('Copied test case output!', 'success');
                                                            }}
                                                        >
                                                            Copy Output
                                                        </button>
                                                    )}
                                                </div>
                                                <textarea
                                                    readOnly
                                                    value={tc.output || (tc.status === 'running' ? 'Running simulation...' : 'Not executed against LLM yet.')}
                                                    style={{ width: '100%', height: '120px', padding: '0.5rem', fontSize: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-primary)', fontFamily: 'monospace', resize: 'vertical', outline: 'none' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
