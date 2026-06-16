import React, { useState } from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialApiKey: string;
    initialModel: string;
    onSave: (apiKey: string, model: string) => void;
    onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    initialApiKey,
    initialModel,
    onSave,
    onToast
}) => {
    const [apiKey, setApiKey] = useState(initialApiKey);
    const [model, setModel] = useState(initialModel);
    const [showKey, setShowKey] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [statusMsg, setStatusMsg] = useState('Not tested');

    if (!isOpen) return null;

    const handleTestConnection = async () => {
        if (!apiKey.trim()) {
            setTestStatus('error');
            setStatusMsg('Please enter a key');
            onToast('API key is empty', 'error');
            return;
        }

        setTestStatus('loading');
        setStatusMsg('Testing API key connection...');

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'Respond with the single word "Verified".' }] }]
                    })
                }
            );

            if (response.ok) {
                setTestStatus('success');
                setStatusMsg('Connection success! Model verified.');
                onToast('Gemini API connection verified!', 'success');
            } else {
                const err = await response.json().catch(() => ({}));
                const errMsg = err.error?.message || `HTTP ${response.status}`;
                setTestStatus('error');
                setStatusMsg(`Verification failed: ${errMsg}`);
                onToast('Gemini connection failed.', 'error');
            }
        } catch (e: unknown) {
            const err = e as Error;
            setTestStatus('error');
            setStatusMsg(`Network error: ${err.message}`);
            onToast('Network error during API test.', 'error');
        }
    };

    const handleSave = () => {
        onSave(apiKey, model);
        onClose();
    };

    const handleClear = () => {
        setApiKey('');
        localStorage.removeItem('promptcraft_gemini_api_key');
        setTestStatus('idle');
        setStatusMsg('Key deleted');
        onToast('API key cleared from local storage', 'info');
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h3>Gemini API Configuration</h3>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <p className="modal-desc">
                        To use the <strong>Gemini AI Enhancer</strong>, paste your Gemini API Key below. Your key is stored securely inside your browser's local storage and is never sent to any server except the official Google Gemini API endpoint.
                    </p>

                    <div className="form-group">
                        <label>Gemini API Key</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                            />
                            <button onClick={() => setShowKey(!showKey)}>
                                {showKey ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <span className="input-tip">
                            Don't have a key? You can get a free one from the{' '}
                            <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer">
                                Google AI Studio
                            </a>.
                        </span>
                    </div>

                    <div className="form-group">
                        <label>Gemini Model</label>
                        <select value={model} onChange={(e) => setModel(e.target.value)}>
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Fast & Creative)</option>
                            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Best for Complex Prompts)</option>
                        </select>
                    </div>

                    <div className={`api-status-box ${testStatus}`}>
                        <span className="status-indicator"></span>
                        <span className="status-text">{statusMsg}</span>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={handleTestConnection}>
                        Test Connection
                    </button>
                    <div className="action-buttons">
                        <button className="btn btn-danger-link" onClick={handleClear}>
                            Clear Key
                        </button>
                        <button className="btn btn-primary" onClick={handleSave}>
                            Save Config
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
