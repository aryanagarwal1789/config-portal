import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPage, updatePage } from '../../api/site';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Toast from '../../components/admin/Toast';
import FileUploadButton from '../../components/admin/FileUploadButton';
import VisualEditorLayout from '../../components/admin/VisualEditorLayout';
import '../../components/admin/adminShared.css';
import '../../components/forms.css';

const PREVIEW_URL = import.meta.env.VITE_PREVIEW_URL ?? 'http://localhost:3000';
const BLANK = { title: '', description: '', image: '' };

export default function ContactUsPage() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const isEditMode = pathname.endsWith('/edit');

    const [page, setPage] = useState(BLANK);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [activeField, setActiveField] = useState(null);

    const iframeRef    = useRef(null);
    const previewReady = useRef(false);
    const currentPage  = useRef(BLANK);
    const fieldRefs    = useRef({});

    useEffect(() => { currentPage.current = page; }, [page]);

    useEffect(() => {
        if (!isEditMode) return;
        function onMessage(event) {
            if (event.data?.type === 'PREVIEW_READY') {
                previewReady.current = true;
                iframeRef.current?.contentWindow?.postMessage(
                    { type: 'PAGE_UPDATE', pageId: 'contact-us', page: currentPage.current },
                    '*'
                );
            }
            if (event.data?.type === 'FIELD_CLICK' && event.data?.pageId === 'contact-us') {
                const fieldId = event.data.fieldId;
                setActiveField(fieldId);
                setTimeout(() => {
                    fieldRefs.current[fieldId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    fieldRefs.current[fieldId]?.querySelector('input, textarea')?.focus();
                }, 60);
            }
        }
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [isEditMode]);

    useEffect(() => {
        if (!isEditMode || !previewReady.current) return;
        iframeRef.current?.contentWindow?.postMessage(
            { type: 'PAGE_UPDATE', pageId: 'contact-us', page },
            '*'
        );
    }, [page, isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        (async () => {
            try {
                const { data } = await getPage('contact-us');
                setPage({ ...BLANK, ...(data.page || {}) });
            } catch {
                setToast({ type: 'error', message: 'Failed to load Contact Us' });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const update = (patch) => setPage((p) => ({ ...p, ...patch }));

    const save = async () => {
        setSaving(true);
        try {
            const { data } = await updatePage('contact-us', page);
            setPage({ ...BLANK, ...(data.page || {}) });
            setToast({ type: 'success', message: 'Contact Us saved' });
        } catch {
            setToast({ type: 'error', message: 'Save failed' });
        } finally {
            setSaving(false);
        }
    };

    const sidebar = (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="preview-sidebar-header">
                <p className="preview-sidebar-title">Contact Us</p>
                <p className="preview-sidebar-hint">Click any highlighted area to jump to its field</p>
            </div>
            <div className="preview-sidebar-fields">
                <div
                    ref={el => { fieldRefs.current['title'] = el; }}
                    className={`form-group${activeField === 'title' ? ' is-active' : ''}`}
                >
                    <label>Title</label>
                    <input
                        value={page.title}
                        onChange={e => update({ title: e.target.value })}
                        placeholder="e.g. Let's Talk"
                    />
                </div>
                <div
                    ref={el => { fieldRefs.current['description'] = el; }}
                    className={`form-group${activeField === 'description' ? ' is-active' : ''}`}
                >
                    <label>Description</label>
                    <textarea
                        rows={4}
                        value={page.description}
                        onChange={e => update({ description: e.target.value })}
                        placeholder="Supporting text, contact hours, response SLA, etc."
                    />
                </div>
                <div
                    ref={el => { fieldRefs.current['image'] = el; }}
                    className={`form-group${activeField === 'image' ? ' is-active' : ''}`}
                >
                    <label>Hero Image</label>
                    {page.image && (
                        <img src={page.image} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 8, objectFit: 'cover', maxHeight: 120 }} />
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <FileUploadButton
                            label={page.image ? 'Replace' : 'Upload'}
                            accept="image/*"
                            onUploaded={url => update({ image: url })}
                            onError={msg => setToast({ type: 'error', message: msg })}
                        />
                        {page.image && (
                            <button type="button" className="btn-remove" onClick={() => update({ image: '' })}>Clear</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (isEditMode) {
        return (
            <>
                <VisualEditorLayout
                    title="Contact Us"
                    backTo="/pages/contact-us"
                    iframeRef={iframeRef}
                    src={`${PREVIEW_URL}/contact-us`}
                    onSave={save}
                    saving={saving}
                    sidebarContent={loading ? null : sidebar}
                />
                <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
            </>
        );
    }

    return (
        <>
            <AdminPageHeader
                title="Contact Us"
                subtitle="Title, description and image for the salescode.ai Contact Us page."
            >
                <button className="btn-secondary" onClick={() => navigate('/editor?p=/contact-us')}>
                    Preview &amp; Edit
                </button>
                <button className="btn-primary" onClick={save} disabled={saving || loading}>
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </AdminPageHeader>

            {loading ? (
                <div className="admin-loading">Loading…</div>
            ) : (
                <form className="config-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            value={page.title}
                            onChange={(e) => update({ title: e.target.value })}
                            placeholder="e.g. Get in touch"
                        />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={page.description}
                            onChange={(e) => update({ description: e.target.value })}
                            placeholder="Supporting text, contact hours, response SLA, etc."
                            rows={3}
                        />
                    </div>
                    <div className="form-group">
                        <label>Image</label>
                        {page.image && (
                            <img src={page.image} alt="" className="admin-media-thumb" />
                        )}
                        <div className="admin-actions-bar">
                            <FileUploadButton
                                label={page.image ? 'Replace' : 'Upload'}
                                accept="image/*"
                                onUploaded={(url) => update({ image: url })}
                                onError={(msg) => setToast({ type: 'error', message: msg })}
                            />
                            {page.image && (
                                <button type="button" className="btn-remove" onClick={() => update({ image: '' })}>Clear</button>
                            )}
                        </div>
                    </div>
                    <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </form>
            )}

            <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
        </>
    );
}
