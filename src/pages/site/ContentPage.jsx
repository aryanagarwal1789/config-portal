import { useEffect, useRef, useState } from 'react';
import { getContent, updateContent } from '../../api/site';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSection from '../../components/admin/AdminSection';
import Toast from '../../components/admin/Toast';
import FileUploadButton from '../../components/admin/FileUploadButton';
import PreviewModal from '../../components/admin/PreviewModal';
import '../../components/admin/adminShared.css';
import '../../components/forms.css';
import './ContentPage.css';

const PREVIEW_URL = import.meta.env.VITE_PREVIEW_URL ?? 'http://localhost:3000';

function splitHeading(title) {
    const words = (title ?? '').trim().split(/\s+/).filter(Boolean);
    if (words.length <= 2) return { white: '', teal: words.join(' ') };
    return { white: words.slice(0, -2).join(' ') + ' ', teal: words.slice(-2).join(' ') };
}

export default function ContentPage() {
    const [content, setContent] = useState({ title: '', description: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [activeField, setActiveField] = useState(null);

    const iframeRef    = useRef(null);
    const previewReady = useRef(false);
    const pendingFields = useRef(null);
    const fieldRefs    = useRef({});

    useEffect(() => {
        (async () => {
            try {
                const { data } = await getContent();
                setContent({
                    title:       data.content?.title       ?? '',
                    description: data.content?.description ?? '',
                    image:       data.content?.image       ?? '',
                });
            } catch {
                setToast({ type: 'error', message: 'Failed to load content' });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        function onMessage(event) {
            if (event.data?.type === 'PREVIEW_READY') {
                previewReady.current = true;
                if (pendingFields.current) {
                    sendAllFields(pendingFields.current);
                    pendingFields.current = null;
                }
            }
            if (event.data?.type === 'FIELD_CLICK') {
                const fid = event.data.fieldId;
                setActiveField(fid);
                // slight delay so the sidebar has re-rendered with is-active class
                setTimeout(() => {
                    fieldRefs.current[fid]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    fieldRefs.current[fid]?.querySelector('input, textarea')?.focus();
                }, 60);
            }
        }
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    function postToIframe(msg) {
        iframeRef.current?.contentWindow?.postMessage(msg, '*');
    }

    function sendHeadingUpdate(title) {
        const { white, teal } = splitHeading(title);
        postToIframe({ type: 'FIELD_UPDATE', sectionId: 'hero', fieldName: 'heading', value: white });
        postToIframe({ type: 'FIELD_UPDATE', sectionId: 'hero', fieldName: 'heading-highlight', value: teal });
    }

    function sendAllFields(fields) {
        sendHeadingUpdate(fields.title ?? '');
        postToIframe({ type: 'FIELD_UPDATE', sectionId: 'hero', fieldName: 'subheading', value: fields.description ?? '' });
    }

    function openPreview() {
        previewReady.current = false;
        pendingFields.current = content;
        setActiveField(null);
        setPreviewOpen(true);
    }

    function closePreview() {
        setPreviewOpen(false);
        previewReady.current = false;
        pendingFields.current = null;
        setActiveField(null);
    }

    const update = (patch) => {
        setContent((prev) => {
            const next = { ...prev, ...patch };
            if (previewOpen && previewReady.current) {
                if ('title' in patch) sendHeadingUpdate(patch.title);
                if ('description' in patch)
                    postToIframe({ type: 'FIELD_UPDATE', sectionId: 'hero', fieldName: 'subheading', value: patch.description });
            }
            return next;
        });
    };

    const save = async () => {
        setSaving(true);
        try {
            await updateContent(content);
            setToast({ type: 'success', message: 'Content saved' });
            if (previewOpen) postToIframe({ type: 'RELOAD' });
        } catch {
            setToast({ type: 'error', message: 'Save failed' });
        } finally {
            setSaving(false);
        }
    };

    const sidebarContent = (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="preview-sidebar-header">
                <p className="preview-sidebar-title">Hero Section</p>
                <p className="preview-sidebar-hint">Click glowing text in the preview to jump to its field</p>
            </div>
            <div className="preview-sidebar-fields">
                <div
                    ref={(el) => { fieldRefs.current['hero-title'] = el; }}
                    className={`form-group${activeField === 'hero-title' ? ' is-active' : ''}`}
                >
                    <label>Title</label>
                    <input
                        value={content.title}
                        onChange={(e) => update({ title: e.target.value })}
                        placeholder="e.g. AI for Sales, eB2B and NextGen SFA for CPG Sales"
                    />
                    <span className="form-hint">Last two words will appear in teal.</span>
                </div>
                <div
                    ref={(el) => { fieldRefs.current['hero-description'] = el; }}
                    className={`form-group${activeField === 'hero-description' ? ' is-active' : ''}`}
                >
                    <label>Description</label>
                    <textarea
                        value={content.description}
                        onChange={(e) => update({ description: e.target.value })}
                        placeholder="Supporting paragraph displayed under the title"
                        rows={5}
                    />
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="admin-loading">Loading…</div>;

    return (
        <>
            <AdminPageHeader
                title="Landing Page Content"
                subtitle="The headline and description shown at the top of the salescode.ai landing page."
            >
                <button className="btn-secondary" onClick={openPreview}>
                    Preview &amp; Edit
                </button>
                <button className="btn-primary" onClick={save} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </AdminPageHeader>

            <form className="config-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
                <AdminSection title="Hero content" collapsible={false}>
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            value={content.title}
                            onChange={(e) => update({ title: e.target.value })}
                            placeholder="e.g. AI for Sales, eB2B and NextGen SFA for CPG Sales"
                        />
                        <span className="form-hint">Last two words will appear in teal.</span>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={content.description}
                            onChange={(e) => update({ description: e.target.value })}
                            placeholder="Supporting paragraph displayed under the title"
                            rows={4}
                        />
                    </div>
                </AdminSection>

            </form>

            <PreviewModal
                isOpen={previewOpen}
                onClose={closePreview}
                iframeRef={iframeRef}
                src={PREVIEW_URL}
                onSave={save}
                saving={saving}
                title="Hero Section — Live Preview"
                sidebarContent={sidebarContent}
            />

            <Toast
                message={toast?.message}
                type={toast?.type}
                onClose={() => setToast(null)}
            />
        </>
    );
}
