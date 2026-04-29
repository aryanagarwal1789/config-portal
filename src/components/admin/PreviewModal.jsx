import './PreviewModal.css';

/**
 * Shared preview modal — renders a full-page iframe overlay.
 *
 * Props:
 *   isOpen        – boolean
 *   onClose       – () => void
 *   iframeRef     – React ref forwarded to the <iframe>
 *   src           – URL for the iframe
 *   onSave        – optional () => void; when provided a Save button appears in the header
 *   saving        – optional boolean; disables the Save button while true
 *   title         – optional string (default "Live Preview")
 *   sidebarContent – optional React node; when provided the modal splits into
 *                    iframe (left) + sidebar panel (right)
 */
export default function PreviewModal({ isOpen, onClose, iframeRef, src, onSave, saving, title, sidebarContent }) {
    if (!isOpen) return null;

    return (
        <div className="preview-overlay" onClick={onClose}>
            <div className={`preview-modal${sidebarContent ? ' has-sidebar' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="preview-modal-header">
                    <span className="preview-modal-title">{title ?? 'Live Preview'}</span>
                    <div className="preview-modal-actions">
                        {onSave && (
                            <button className="btn-primary btn-sm" onClick={onSave} disabled={saving}>
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                        )}
                        <button className="preview-close-btn" onClick={onClose} aria-label="Close preview">
                            ✕
                        </button>
                    </div>
                </div>
                <div className="preview-modal-body">
                    <iframe
                        ref={iframeRef}
                        src={src}
                        className="preview-iframe"
                        title="Landing page preview"
                    />
                    {sidebarContent && (
                        <div className="preview-sidebar">
                            {sidebarContent}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
