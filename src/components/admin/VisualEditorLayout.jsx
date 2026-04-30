import { useNavigate } from 'react-router-dom';
import './VisualEditorLayout.css';

function GridIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    );
}

export default function VisualEditorLayout({ title, backTo, onBack, adminHref, iframeRef, src, onSave, saving, sidebarContent, iframeReady }) {
    const navigate = useNavigate();
    const handleBack = onBack ?? (() => backTo ? navigate(backTo) : navigate(-1));
    return (
        <div className="visual-editor">
            <div className="visual-editor-header">
                <button type="button" onClick={handleBack} className="visual-editor-back">← Back</button>
                <span className="visual-editor-title">{title}</span>
                <div className="visual-editor-actions">
                    {onSave && (
                        <button className="btn-primary btn-sm" onClick={onSave} disabled={saving}>
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    )}
                    {adminHref && (
                        <button
                            type="button"
                            className="visual-editor-admin-btn"
                            onClick={() => navigate(adminHref)}
                            title="Manage content"
                        >
                            <GridIcon />
                            <span>Manage</span>
                        </button>
                    )}
                </div>
            </div>
            <div className="visual-editor-body">
                <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
                    <iframe ref={iframeRef} src={src} className="visual-editor-iframe" title="Preview" />
                    {!iframeReady && (
                        <div style={{
                            position: 'absolute', inset: 0, background: '#f8f9fa',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 10,
                        }}>
                            <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#0d9488', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        </div>
                    )}
                </div>
                {sidebarContent && (
                    <div className="visual-editor-sidebar">
                        {sidebarContent}
                    </div>
                )}
            </div>
        </div>
    );
}
