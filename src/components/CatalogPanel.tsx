import React, { useState } from 'react';

export interface SavedTemplate {
    id: string;
    title: string;
    description: string;
    prompt: string;
    role: string;
    tone: string;
    format: string;
}

interface CatalogPanelProps {
    savedTemplates: SavedTemplate[];
    onLoadTemplate: (prompt: string, role: string, tone: string, format: string, title: string) => void;
    onSaveTemplate: (title: string, description: string) => void;
    onDeleteTemplate: (id: string) => void;
    onImportTemplates: (templates: SavedTemplate[]) => void;
    onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const CatalogPanel: React.FC<CatalogPanelProps> = ({
    savedTemplates,
    onLoadTemplate,
    onSaveTemplate,
    onDeleteTemplate,
    onImportTemplates,
    onToast
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            onToast('Template title cannot be empty', 'error');
            return;
        }
        onSaveTemplate(title.trim(), description.trim());
        setTitle('');
        setDescription('');
        onToast('Prompt template saved successfully!', 'success');
    };

    const handleExport = () => {
        if (savedTemplates.length === 0) {
            onToast('No templates to export yet!', 'error');
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedTemplates, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `promptcraft_catalog_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        onToast('Template catalog exported successfully!', 'success');
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string);
                if (Array.isArray(parsed) && parsed.every(item => item.id && item.title && item.prompt)) {
                    onImportTemplates(parsed);
                    onToast('Template catalog imported successfully!', 'success');
                } else {
                    throw new Error('Invalid JSON schema structure.');
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                onToast(`Import failed: ${message}`, 'error');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="card settings-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.1)' }}>
            <div className="card-title">Prompt Catalog manager</div>
            
            {/* Save Current Draft Form */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
                <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }}>Template Title</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Python Fast API Boilerplate"
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-primary)', padding: '0.45rem 0.75rem', fontSize: '0.85rem', outline: 'none' }}
                    />
                </div>
                <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }}>Short Description</label>
                    <input 
                        type="text" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Builds optimized REST APIs using Fast API..."
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-primary)', padding: '0.45rem 0.75rem', fontSize: '0.85rem', outline: 'none' }}
                    />
                </div>
                <button 
                    type="submit" 
                    className="btn btn-secondary btn-sm" 
                    style={{ alignSelf: 'flex-start', border: '1px solid var(--border-hover)' }}
                >
                    Save Current Draft as Template
                </button>
            </form>

            {/* Saved Templates Catalog */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                {savedTemplates.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
                        No custom saved templates. Use the form above to catalog your active draft.
                    </div>
                ) : (
                    savedTemplates.map((template) => (
                        <div 
                            key={template.id} 
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.65rem 0.85rem', transition: 'var(--transition-fast)' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, marginRight: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{template.title}</h4>
                                    <span className="badge" style={{ fontSize: '0.65rem', padding: '0.05rem 0.25rem' }}>{template.role}</span>
                                </div>
                                {template.description && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{template.description}</p>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button 
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => onLoadTemplate(template.prompt, template.role, template.tone, template.format, template.title)}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                >
                                    Load
                                </button>
                                <button 
                                    className="btn-danger-link"
                                    onClick={() => onDeleteTemplate(template.id)}
                                    style={{ fontSize: '0.75rem', padding: '0 0.25rem' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Import / Export Controls */}
            <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={handleExport}
                    style={{ flex: 1, fontSize: '0.75rem' }}
                >
                    Export Catalog
                </button>
                <label 
                    className="btn btn-secondary btn-sm" 
                    style={{ flex: 1, fontSize: '0.75rem', textAlign: 'center', cursor: 'pointer' }}
                >
                    Import Catalog
                    <input 
                        type="file" 
                        accept=".json" 
                        onChange={handleImport} 
                        style={{ display: 'none' }}
                    />
                </label>
            </div>
        </div>
    );
};
