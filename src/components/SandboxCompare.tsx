import React, { useState } from 'react';

interface SandboxCompareProps {
    outputText: string;
    apiKey: string;
    onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SandboxCompare: React.FC<SandboxCompareProps> = ({
    outputText,
    apiKey,
    onToast
}) => {
    const [flashResponse, setFlashResponse] = useState<string>('');
    const [proResponse, setProResponse] = useState<string>('');
    const [flashTime, setFlashTime] = useState<number | null>(null);
    const [proTime, setProTime] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleRunCompare = async () => {
        if (!outputText) {
            onToast('Please craft a prompt first!', 'error');
            return;
        }
        if (!apiKey) {
            onToast('Please save a valid Gemini API Key in settings first.', 'error');
            return;
        }

        setIsLoading(true);
        setFlashResponse('');
        setProResponse('');
        setFlashTime(null);
        setProTime(null);

        const fetchModel = async (
            model: string,
            setResponse: (val: string) => void,
            setTime: (val: number) => void
        ) => {
            const start = performance.now();
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: outputText }] }],
                        generationConfig: { maxOutputTokens: 1024 }
                    })
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error?.message || `HTTP ${res.status}`);
                }

                const data = await res.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error('API returned empty content');

                const end = performance.now();
                setTime(Math.round(end - start));
                setResponse(text.trim());
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                setResponse(`Execution Failed:\n${message}`);
            }
        };

        try {
            await Promise.all([
                fetchModel('gemini-2.5-flash', setFlashResponse, setFlashTime),
                fetchModel('gemini-2.5-pro', setProResponse, setProTime)
            ]);
            onToast('Dual-model run complete!', 'success');
        } catch {
            onToast('One or more model executions failed.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const countTokensEst = (text: string) => {
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        return Math.ceil(words * 1.35);
    };

    return (
        <div className="simulator-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem', background: 'rgba(0,0,0,0.2)' }}>
            <div className="simulator-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <div className="sim-dots">
                    <span></span><span></span><span></span>
                </div>
                <div className="sim-title">Dual Model Comparison Playground</div>
                <button
                    onClick={handleRunCompare}
                    disabled={isLoading || !outputText}
                    className="btn btn-secondary btn-sm"
                    style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-violet) 100%)', color: 'white', border: 'none' }}
                >
                    {isLoading ? 'Running Comparison...' : 'Compare Models'}
                </button>
            </div>

            <div className="compare-grid" style={{ flex: 1, padding: '1rem' }}>
                
                {/* Column 1: Gemini 2.5 Flash */}
                <div className="compare-column" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-indigo)' }}>Gemini 2.5 Flash</span>
                        {flashTime !== null && (
                            <span className="badge" style={{ color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                                {flashTime}ms | {countTokensEst(flashResponse)} tokens
                            </span>
                        )}
                    </div>
                    <textarea
                        style={{ width: '100%', height: '220px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical', outline: 'none' }}
                        value={isLoading && !flashResponse ? 'Sending prompt request to Flash...' : flashResponse}
                        placeholder="Response from Gemini 2.5 Flash will appear here..."
                        readOnly
                    />
                </div>

                {/* Column 2: Gemini 2.5 Pro */}
                <div className="compare-column" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-violet)' }}>Gemini 2.5 Pro</span>
                        {proTime !== null && (
                            <span className="badge" style={{ color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                                {proTime}ms | {countTokensEst(proResponse)} tokens
                            </span>
                        )}
                    </div>
                    <textarea
                        style={{ width: '100%', height: '220px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical', outline: 'none' }}
                        value={isLoading && !proResponse ? 'Sending prompt request to Pro...' : proResponse}
                        placeholder="Response from Gemini 2.5 Pro will appear here..."
                        readOnly
                    />
                </div>
                
            </div>
        </div>
    );
};
