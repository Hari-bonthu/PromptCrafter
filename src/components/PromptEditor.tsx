import React from 'react';

interface PromptEditorProps {
    value: string;
    onChange: (val: string) => void;
    onClear: () => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ value, onChange, onClear }) => {
    return (
        <div className="form-group">
            <label htmlFor="raw-prompt">Raw Prompt</label>
            <div className="textarea-wrapper">
                <textarea
                    id="raw-prompt"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Type or paste your basic prompt here... Use {{variable}} to create custom dynamic fields."
                    rows={6}
                ></textarea>
                <div className="textarea-footer">
                    <span>{value.length} characters</span>
                    <button className="btn-text-link" onClick={onClear}>
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
};
