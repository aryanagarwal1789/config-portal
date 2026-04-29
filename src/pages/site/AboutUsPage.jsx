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
const BLANK = { title: '', description: '', bannerImage: '', video: '' };

export default function AboutUsPage() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const isEditMode = pathname.endsWith('/edit');

    const [page, setPage] = useState(BLANK);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [justUploadedVideo, setJustUploadedVideo] = useState(false);
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
                    { type: 'PAGE_UPDATE', pageId: 'about-us', page: currentPage.current },
                    '*'
                );
            }
            if (event.data?.type === 'FIELD_CLICK' && event.data?.pageId === 'about-us') {
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
            { type: 'PAGE_UPDATE', pageId: 'about-us', page },
            '*'
        );
    }, [page, isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        (async () => {
            try {
                const { data } = await getPage('about-us');
                setPage({ ...BLANK, ...(data.page || {}) });
            } catch {
                setToast({ type: 'error', message: 'Failed to load About Us' });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const update = (patch) => setPage((p) => ({ ...p, ...patch }));

    const save = async () => {
        setSaving(true);
        try {
            const { data } = await updatePage('about-us', page);
            setPage({ ...BLANK, ...(data.page || {}) });
            setToast({ type: 'success', message: 'About Us saved' });
        } catch {
            setToast({ type: 'error', message: 'Save failed' });
        } finally {
            setSaving(false);
        }
    };

    const sidebar = (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="preview-sidebar-header">
                <p className="preview-sidebar-title">About Us</p>
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
                        placeholder="e.g. About SalesCode"
                    />
                </div>
                <div
                    ref={el => { fieldRefs.current['description'] = el; }}
                    className={`form-group${activeField === 'description' ? ' is-active' : ''}`}
                >
                    <label>Description</label>
                    <textarea
                        rows={5}
                        value={page.description}
                        onChange={e => update({ description: e.target.value })}
                        placeholder="Paragraph describing the company, mission and team"
                    />
                </div>
                <div
                    ref={el => { fieldRefs.current['bannerImage'] = el; }}
                    className={`form-group${activeField === 'bannerImage' ? ' is-active' : ''}`}
                >
                    <label>Banner Image</label>
                    {page.bannerImage && (
                        <img src={page.bannerImage} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 8, objectFit: 'cover', maxHeight: 120 }} />
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <FileUploadButton
                            label={page.bannerImage ? 'Replace' : 'Upload'}
                            accept="image/*"
                            onUploaded={url => update({ bannerImage: url })}
                            onError={msg => setToast({ type: 'error', message: msg })}
                        />
                        {page.bannerImage && (
                            <button type="button" className="btn-remove" onClick={() => update({ bannerImage: '' })}>Clear</button>
                        )}
                    </div>
                </div>
                <div
                    ref={el => { fieldRefs.current['video'] = el; }}
                    className={`form-group${activeField === 'video' ? ' is-active' : ''}`}
                >
                    <label>Video</label>
                    {page.video && (
                        <video key={page.video} src={page.video} controls muted style={{ width: '100%', borderRadius: 8, marginBottom: 8, maxHeight: 120 }} />
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <FileUploadButton
                            label={page.video ? 'Replace' : 'Upload'}
                            accept="video/*"
                            onUploaded={url => { update({ video: url }); setJustUploadedVideo(true); }}
                            onError={msg => setToast({ type: 'error', message: msg })}
                        />
                        {page.video && (
                            <button type="button" className="btn-remove" onClick={() => { update({ video: '' }); setJustUploadedVideo(false); }}>Clear</button>
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
                    title="About Us"
                    backTo="/pages/about-us"
                    iframeRef={iframeRef}
                    src={`${PREVIEW_URL}/about`}
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
                title="About Us"
                subtitle="Title, description, banner image and video for the salescode.ai About Us page."
            >
                <button className="btn-secondary" onClick={() => navigate('/editor?p=/about')}>
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
                            placeholder="e.g. About SalesCode"
                        />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={page.description}
                            onChange={(e) => update({ description: e.target.value })}
                            placeholder="Paragraph describing the company, mission and team"
                            rows={3}
                        />
                    </div>
                    <div className="form-row form-row--media-pair">
                        <div className="form-group">
                            <label>Banner image</label>
                            {page.bannerImage && (
                                <img src={page.bannerImage} alt="" className="admin-media-thumb" />
                            )}
                            <div className="admin-actions-bar">
                                <FileUploadButton
                                    label={page.bannerImage ? 'Replace' : 'Upload'}
                                    accept="image/*"
                                    onUploaded={(url) => update({ bannerImage: url })}
                                    onError={(msg) => setToast({ type: 'error', message: msg })}
                                />
                                {page.bannerImage && (
                                    <button type="button" className="btn-remove" onClick={() => update({ bannerImage: '' })}>Clear</button>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Video</label>
                            {page.video && (
                                <video
                                    key={page.video}
                                    src={page.video}
                                    controls
                                    autoPlay={justUploadedVideo}
                                    muted={justUploadedVideo}
                                    className="admin-video-thumb"
                                />
                            )}
                            <div className="admin-actions-bar">
                                <FileUploadButton
                                    label={page.video ? 'Replace' : 'Upload'}
                                    accept="video/*"
                                    onUploaded={(url) => { update({ video: url }); setJustUploadedVideo(true); }}
                                    onError={(msg) => setToast({ type: 'error', message: msg })}
                                />
                                {page.video && (
                                    <button type="button" className="btn-remove" onClick={() => { update({ video: '' }); setJustUploadedVideo(false); }}>Clear</button>
                                )}
                            </div>
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
