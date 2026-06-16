import React, { useState } from 'react';

interface Template {
    id: string;
    title: string;
    category: 'coding' | 'creative' | 'analysis' | 'business';
    tag: string;
    description: string;
    prompt: string;
}

const TEMPLATES: Template[] = [
    {
        id: 'coding-refactor',
        title: 'Refactor Legacy Code',
        category: 'coding',
        tag: 'Refactor',
        description: 'Clean up code structures, apply design patterns, and fix performance bottlenecks.',
        prompt: 'Refactor the following {{language}} code. The code is currently written in a legacy style. Improve its readability, apply standard design patterns, optimize performance bottlenecks, and ensure proper error handling.\n\nCode:\n```{{language}}\n{{code_block}}\n```'
    },
    {
        id: 'coding-unit-test',
        title: 'Generate Unit Tests',
        category: 'coding',
        tag: 'Testing',
        description: 'Draft thorough unit tests covering positive, negative, and edge test cases.',
        prompt: 'Create a comprehensive suite of unit tests for the following {{language}} function using the {{test_framework}} framework. Make sure to cover normal execution paths, edge cases, invalid inputs, and boundary values.\n\nFunction Code:\n```{{language}}\n{{code_block}}\n```'
    },
    {
        id: 'creative-story',
        title: 'Evocative Sci-Fi Scene',
        category: 'creative',
        tag: 'Creative',
        description: 'Generate rich speculative fiction story prompts with vivid sensory details.',
        prompt: 'Write a gripping sci-fi scene about a {{character_role}} arriving on a desolate planet named {{planet_name}}. The primary conflict is {{conflict_details}}. Focus on sensory descriptions (sounds, smells, atmosphere) and show, don\'t tell.'
    },
    {
        id: 'analysis-data-insights',
        title: 'Analyze Business Metrics',
        category: 'analysis',
        tag: 'Analytics',
        description: 'Evaluate business KPI trends, explain anomalies, and propose strategic actions.',
        prompt: 'Review the following data metrics for {{business_sector}}:\n- Revenue: {{revenue_metric}}\n- Customer Acquisition Cost: {{cac_metric}}\n- Retention Rate: {{retention_metric}}\n\nPerform a thorough analysis. Identify key trends, point out any anomalies, and suggest three actionable steps to optimize performance next quarter.'
    },
    {
        id: 'business-cold-email',
        title: 'High-Converting Cold Email',
        category: 'business',
        tag: 'Sales',
        description: 'Draft B2B cold outreach emails focusing on value propositions and clear calls to action.',
        prompt: 'Draft a short, highly persuasive cold email to a {{target_job_title}} at a {{company_type}} company. The objective is to introduce our solution: {{value_proposition}} and secure a 15-minute introductory call. Keep it under 150 words and include a clear, low-friction Call to Action (CTA).'
    },
    {
        id: 'business-social-post',
        title: 'LinkedIn Product Launch',
        category: 'business',
        tag: 'Marketing',
        description: 'Create engaging social media copy with hooks, bullet points, and hashtags.',
        prompt: 'Write an engaging LinkedIn post announcing the launch of our new product: {{product_name}}, which helps users to {{key_benefit}}. Structure the post with a strong hook, a bulleted list of 3 major features, a call to action, and 3 relevant hashtags.'
    }
];

interface TemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (prompt: string, role: string, tone: string, format: string, title: string) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
    isOpen,
    onClose,
    onSelectTemplate
}) => {
    const [activeCategory, setActiveCategory] = useState<'all' | 'coding' | 'creative' | 'analysis' | 'business'>('all');

    if (!isOpen) return null;

    const filtered = activeCategory === 'all'
        ? TEMPLATES
        : TEMPLATES.filter(t => t.category === activeCategory);

    const handleSelect = (template: Template) => {
        let role = 'general';
        let tone = 'professional';
        let format = 'markdown';

        if (template.category === 'coding') {
            role = 'software_engineer';
            format = 'code';
        } else if (template.category === 'creative') {
            tone = 'creative';
        } else if (template.category === 'analysis') {
            role = 'data_analyst';
        } else if (template.category === 'business') {
            role = 'copywriter';
        }

        onSelectTemplate(template.prompt, role, tone, format, template.title);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Prompt Templates Library</h3>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>
                <div className="templates-modal-body">
                    <div className="templates-sidebar">
                        <button
                            className={`template-cat-btn ${activeCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveCategory('all')}
                        >
                            All Templates
                        </button>
                        <button
                            className={`template-cat-btn ${activeCategory === 'coding' ? 'active' : ''}`}
                            onClick={() => setActiveCategory('coding')}
                        >
                            Coding & Development
                        </button>
                        <button
                            className={`template-cat-btn ${activeCategory === 'creative' ? 'active' : ''}`}
                            onClick={() => setActiveCategory('creative')}
                        >
                            Creative Writing
                        </button>
                        <button
                            className={`template-cat-btn ${activeCategory === 'analysis' ? 'active' : ''}`}
                            onClick={() => setActiveCategory('analysis')}
                        >
                            Data & Analysis
                        </button>
                        <button
                            className={`template-cat-btn ${activeCategory === 'business' ? 'active' : ''}`}
                            onClick={() => setActiveCategory('business')}
                        >
                            Business & Marketing
                        </button>
                    </div>
                    <div className="templates-grid-wrapper">
                        <div className="templates-grid">
                            {filtered.map((template) => (
                                <div
                                    key={template.id}
                                    className="template-card"
                                    onClick={() => handleSelect(template)}
                                >
                                    <div className="template-card-header">
                                        <h4>{template.title}</h4>
                                        <span className="template-tag">{template.tag}</span>
                                    </div>
                                    <p>{template.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
