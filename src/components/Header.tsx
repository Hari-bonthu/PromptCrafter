import React from 'react';

interface HeaderProps {
    onOpenTemplates: () => void;
    onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenTemplates, onOpenSettings }) => {
    return (
        <header className="app-header">
            <div className="logo-area">
                <div className="logo-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 22H22L12 2Z" stroke="url(#logo-grad)" strokeWidth="2" strokeLinejoin="round"/>
                        <path d="M12 8L18 18H6L12 8Z" fill="url(#logo-grad-inner)"/>
                        <defs>
                            <linearGradient id="logo-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#6366f1"/>
                                <stop offset="1" stopColor="#a855f7"/>
                            </linearGradient>
                            <linearGradient id="logo-grad-inner" x1="6" y1="8" x2="18" y2="18" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#a855f7" stopOpacity="0.6"/>
                                <stop offset="1" stopColor="#6366f1" stopOpacity="0.6"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <h1>PromptCraft <span className="gradient-text">Pro</span></h1>
                <span className="badge">v2.0.0-react</span>
            </div>

            <div className="header-actions">
                <button className="btn btn-secondary" onClick={onOpenTemplates}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    Templates Library
                </button>
                <button className="btn btn-icon" onClick={onOpenSettings} title="API Settings">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>
            </div>
        </header>
    );
};
