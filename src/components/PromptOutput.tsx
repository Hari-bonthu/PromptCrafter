import React from 'react';
import { type PromptConfig, calculatePromptMetrics } from '../utils/compiler';
import { HistoryPanel, type PromptVersion } from './HistoryPanel';

interface PromptOutputProps {
    outputText: string;
    config: PromptConfig;
    activeTab: 'preview' | 'meta' | 'history';
    onChangeTab: (tab: 'preview' | 'meta' | 'history') => void;
    history: PromptVersion[];
    onRestoreHistory: (prompt: string) => void;
    onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onChangeOutputText: (val: string) => void;
}

export const PromptOutput: React.FC<PromptOutputProps> = ({
    outputText,
    config,
    activeTab,
    onChangeTab,
    history,
    onRestoreHistory,
    onToast,
    onChangeOutputText
}) => {
    const { tokens, score, tips } = calculatePromptMetrics(outputText, config);

    const handleCopy = async () => {
        if (!outputText.trim()) {
            onToast('Nothing to copy yet!', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(outputText);
            onToast('Copied to clipboard!', 'success');
        } catch {
            onToast('Failed to copy to clipboard', 'error');
        }
    };

    const handleDownload = () => {
        if (!outputText.trim()) {
            onToast('Nothing to download yet!', 'error');
            return;
        }

        const blob = new Blob([outputText], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `promptcraft_${config.role}_${Date.now()}.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onToast('Download started!', 'success');
    };

    return (
        <div className="output-container">
            <div className="output-header">
                <div className="output-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                        onClick={() => onChangeTab('preview')}
                    >
                        Final Prompt
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'meta' ? 'active' : ''}`}
                        onClick={() => onChangeTab('meta')}
                    >
                        Analysis & Tips
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => onChangeTab('history')}
                    >
                        History ({history.length})
                    </button>
                </div>

                <div className="output-actions">
                    <button className="btn btn-secondary btn-sm" onClick={handleCopy} title="Copy to Clipboard">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        Copy
                    </button>
                    <button className="btn btn-icon btn-sm" onClick={handleDownload} title="Download Markdown">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </button>
                </div>
            </div>

            <div className="tab-content">
                {/* Prompt Preview */}
                {activeTab === 'preview' && (
                    <div className="tab-pane active">
                        <div className="output-wrapper">
                            <textarea
                                value={outputText}
                                onChange={(e) => onChangeOutputText(e.target.value)}
                                placeholder="Your enhanced prompt will appear here..."
                            ></textarea>
                        </div>
                    </div>
                )}

                {/* Analysis Metadata */}
                {activeTab === 'meta' && (
                    <div className="tab-pane active">
                        <div className="metadata-wrapper">
                            <div className="tips-card">
                                <h4>💡 Why this prompt works</h4>
                                <ul>
                                    {tips.map((tip, idx) => (
                                        <li key={idx}>{tip}</li>
                                    ))}
                                    {tips.length === 0 && (
                                        <li>Provide a raw prompt and compile to see an analysis here.</li>
                                    )}
                                </ul>
                            </div>
                            <div className="metrics-grid">
                                <div className="metric-card">
                                    <span className="metric-title">Token Count (Est.)</span>
                                    <span className="metric-value">{tokens}</span>
                                </div>
                                <div className="metric-card">
                                    <span className="metric-title">Structure Score</span>
                                    <span className="metric-value">{score}/100</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Version history visual diff */}
                {activeTab === 'history' && (
                    <div className="tab-pane active" style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
                        <HistoryPanel
                            history={history}
                            currentPromptText={outputText}
                            onRestore={onRestoreHistory}
                            onToast={onToast}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
