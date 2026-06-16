import React, { useState } from 'react';
import { computeLineDiff } from '../utils/diff';

export interface PromptVersion {
    id: string;
    timestamp: string;
    title: string;
    prompt: string;
    configSummary: string;
}

interface HistoryPanelProps {
    history: PromptVersion[];
    currentPromptText: string;
    onRestore: (prompt: string) => void;
    onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
    history,
    currentPromptText,
    onRestore,
    onToast
}) => {
    const [selectedVersionId, setSelectedVersionId] = useState<string>('');

    const selectedVersion = history.find(v => v.id === selectedVersionId);

    const handleRestore = () => {
        if (selectedVersion) {
            onRestore(selectedVersion.prompt);
            onToast('Restored selected version to output!', 'info');
        }
    };

    const diffParts = selectedVersion
        ? computeLineDiff(selectedVersion.prompt, currentPromptText)
        : [];

    return (
        <div className="history-pane">
            <div className="history-header-inline">
                <div className="form-group" style={{ flex: 1, marginRight: '1rem' }}>
                    <select
                        value={selectedVersionId}
                        onChange={(e) => setSelectedVersionId(e.target.value)}
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                    >
                        <option value="">-- Compare with a previous version --</option>
                        {history.map((version) => (
                            <option key={version.id} value={version.id}>
                                {version.timestamp} - {version.title} ({version.configSummary})
                            </option>
                        ))}
                    </select>
                </div>
                {selectedVersion && (
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleRestore}
                        title="Restore this version into output box"
                    >
                        Restore
                    </button>
                )}
            </div>

            {selectedVersion ? (
                <div className="diff-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        🟢 Additions (Current Prompt) | 🔴 Deletions (Previous Version)
                    </div>
                    <div className="diff-viewer">
                        {diffParts.map((part, index) => {
                            let className = 'diff-unchanged';
                            let prefix = '  ';
                            if (part.type === 'added') {
                                className = 'diff-added';
                                prefix = '+ ';
                            } else if (part.type === 'removed') {
                                className = 'diff-removed';
                                prefix = '- ';
                            }
                            return (
                                <span key={index} className={`diff-line ${className}`}>
                                    {prefix}{part.value || ' '}
                                </span>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="sim-placeholder" style={{ margin: 'auto', padding: '2rem' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <p style={{ marginTop: '0.5rem' }}>
                        {history.length > 0
                            ? 'Select a version above to view a visual diff comparison against your current prompt.'
                            : 'No versions in history yet. Compile a prompt to save your first revision.'}
                    </p>
                </div>
            )}
        </div>
    );
};
