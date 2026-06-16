import React from 'react';
import type { PromptConfig, RoleId, ToneId, FrameworkId, FormatId } from '../utils/compiler';

interface ConfigPanelProps {
    config: PromptConfig;
    onChange: (updates: Partial<PromptConfig>) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange }) => {
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ detailLevel: parseInt(e.target.value) });
    };

    const getDetailLabel = (level: number) => {
        const labels = ['Concise', 'Balanced', 'Elaborate'];
        return labels[level - 1] || 'Balanced';
    };

    return (
        <div className="card settings-card">
            <div className="card-title">Enhancement Parameters</div>

            <div className="settings-grid">
                {/* Role Persona */}
                <div className="form-group">
                    <label>Role/Persona</label>
                    <select
                        value={config.role}
                        onChange={(e) => onChange({ role: e.target.value as RoleId })}
                    >
                        <option value="general">General Assistant</option>
                        <option value="software_engineer">Senior Software Engineer</option>
                        <option value="copywriter">Expert Copywriter</option>
                        <option value="educator">Socratic Teacher / Educator</option>
                        <option value="data_analyst">Data Analyst & Scientist</option>
                        <option value="ux_designer">UX/UI Design Strategist</option>
                        <option value="seo_expert">SEO & Content Strategist</option>
                    </select>
                </div>

                {/* Tone Style */}
                <div className="form-group">
                    <label>Tone</label>
                    <select
                        value={config.tone}
                        onChange={(e) => onChange({ tone: e.target.value as ToneId })}
                    >
                        <option value="professional">Professional & Objective</option>
                        <option value="creative">Creative & Evocative</option>
                        <option value="academic">Academic & Analytical</option>
                        <option value="casual">Casual & Conversational</option>
                        <option value="assertive">Direct & Assertive</option>
                    </select>
                </div>

                {/* Framework Selector */}
                <div className="form-group">
                    <label>Prompt Framework</label>
                    <select
                        value={config.framework}
                        onChange={(e) => onChange({ framework: e.target.value as FrameworkId })}
                    >
                        <option value="rtfc">RTFC (Role, Task, Format, Constraints)</option>
                        <option value="costar">CO-STAR (Context, Objective, Style, Tone, Audience, Response)</option>
                        <option value="none">Standard Structured Expansion</option>
                    </select>
                </div>

                {/* Target Format */}
                <div className="form-group">
                    <label>Target Output Format</label>
                    <select
                        value={config.format}
                        onChange={(e) => onChange({ format: e.target.value as FormatId })}
                    >
                        <option value="markdown">Markdown Document</option>
                        <option value="code">Code Block / Script</option>
                        <option value="json">JSON / Structured Data</option>
                        <option value="bullet_points">Detailed Bullet Points</option>
                        <option value="qa">Interactive Q&A Session</option>
                    </select>
                </div>
            </div>

            {/* Detail Slider */}
            <div className="form-group slider-group">
                <div className="slider-header">
                    <label>Detail & Context Level</label>
                    <span>{getDetailLabel(config.detailLevel)}</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="3"
                    value={config.detailLevel}
                    onChange={handleSliderChange}
                    className="range-slider"
                />
                <div className="slider-ticks">
                    <span>Concise</span>
                    <span>Balanced</span>
                    <span>Elaborate</span>
                </div>
            </div>

            {/* Heuristics Toggles */}
            <div className="toggles-list">
                <label className="checkbox-container">
                    <input
                        type="checkbox"
                        checked={config.noApologies}
                        onChange={(e) => onChange({ noApologies: e.target.checked })}
                    />
                    <span className="checkmark"></span>
                    Prevent conversational fluff (no apologies, no intros)
                </label>
                <label className="checkbox-container">
                    <input
                        type="checkbox"
                        checked={config.stepByStep}
                        onChange={(e) => onChange({ stepByStep: e.target.checked })}
                    />
                    <span className="checkmark"></span>
                    Force step-by-step thinking ("Chain of Thought")
                </label>
                <label className="checkbox-container">
                    <input
                        type="checkbox"
                        checked={config.edgeCases}
                        onChange={(e) => onChange({ edgeCases: e.target.checked })}
                    />
                    <span className="checkmark"></span>
                    Instruct to identify assumptions and edge cases
                </label>
            </div>
        </div>
    );
};
