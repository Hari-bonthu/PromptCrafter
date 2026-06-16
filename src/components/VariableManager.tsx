import React from 'react';
import { type VariableMeta } from '../utils/compiler';

interface VariableManagerProps {
    variables: Record<string, string>;
    parsedMetas: VariableMeta[];
    onChangeVariable: (name: string, value: string) => void;
}

export const VariableManager: React.FC<VariableManagerProps> = ({
    variables,
    parsedMetas,
    onChangeVariable
}) => {
    if (parsedMetas.length === 0) return null;

    return (
        <div className="variables-section">
            <div className="section-title">
                <h3>Dynamic Variables</h3>
                <span className="info-tag">Detected from {"{{brackets}}"}</span>
            </div>
            <div className="variables-grid">
                {parsedMetas.map((meta) => {
                    const hasChoices = meta.choices && meta.choices.length > 0;
                    return (
                        <div key={meta.name} className="variable-card">
                            <label htmlFor={`var-input-${meta.name}`}>
                                {meta.name.replace(/_/g, ' ')}
                            </label>
                            
                            {hasChoices && meta.choices ? (
                                <select
                                    id={`var-input-${meta.name}`}
                                    value={variables[meta.name] !== undefined ? variables[meta.name] : (meta.defaultValue || '')}
                                    onChange={(e) => onChangeVariable(meta.name, e.target.value)}
                                >
                                    {meta.choices.map((choice) => (
                                        <option key={choice} value={choice}>
                                            {choice}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    id={`var-input-${meta.name}`}
                                    value={variables[meta.name] || ''}
                                    onChange={(e) => onChangeVariable(meta.name, e.target.value)}
                                    placeholder={meta.defaultValue ? `Default: ${meta.defaultValue}` : `Enter ${meta.name}...`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
