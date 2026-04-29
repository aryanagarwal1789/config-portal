import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPage, updatePage } from '../../api/site';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSection from '../../components/admin/AdminSection';
import Toast from '../../components/admin/Toast';
import FileUploadButton from '../../components/admin/FileUploadButton';
import SortableList, { SortableRow, DragHandle } from '../../components/admin/SortableList';
import VisualEditorLayout from '../../components/admin/VisualEditorLayout';
import '../../components/admin/adminShared.css';
import '../../components/forms.css';

const PREVIEW_URL = import.meta.env.VITE_PREVIEW_URL ?? 'http://localhost:3000';
const BLANK = { title: '', description: '', bannerImage: '', images: [] };

function Caret() {
    return (
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

const blankClientImage = (url = '') => ({
    id: `client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    url,
    alt: '',
    order: 0
});

export default function ClientPage() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const isEditMode = pathname.endsWith('/edit');

    const [page, setPage] = useState(BLANK);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [expandedImages, setExpandedImages] = useState(() => new Set());
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
                    { type: 'PAGE_UPDATE', pageId: 'client', page: currentPage.current },
                    '*'
                );
            }
            if (event.data?.type === 'FIELD_CLICK' && event.data?.pageId === 'client') {
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
            { type: 'PAGE_UPDATE', pageId: 'client', page },
            '*'
        );
    }, [page, isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        (async () => {
            try {
                const { data } = await getPage('client');
                setPage({
                    title: data.page?.title ?? '',
                    description: data.page?.description ?? '',
                    bannerImage: data.page?.bannerImage ?? '',
                    images: data.page?.images ?? []
                });
            } catch {
                setToast({ type: 'error', message: 'Failed to load Client page' });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const update = (patch) => setPage((p) => ({ ...p, ...patch }));

    const updateImage = (idx, patch) =>
        setPage((p) => ({
            ...p,
            images: p.images.map((img, i) => (i === idx ? { ...img, ...patch } : img))
        }));

    const removeImage = (idx) =>
        setPage((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));

    const addImageUploaded = (url) => {
        const created = blankClientImage(url);
        setPage((p) => ({ ...p, images: [...p.images, created] }));
        setExpandedImages((prev) => new Set(prev).add(created.id));
    };

    const reorderImages = (next) => setPage((p) => ({ ...p, images: next }));

    const toggleExpanded = (id) => {
        setExpandedImages((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                ...page,
                images: page.images.map((img, i) => ({ ...img, order: i }))
            };
            const { data } = await updatePage('client', payload);
            setPage({
                title: data.page?.title ?? '',
                description: data.page?.description ?? '',
                bannerImage: data.page?.bannerImage ?? '',
                images: data.page?.images ?? []
            });
            setToast({ type: 'success', message: 'Client page saved' });
        } catch {
            setToast({ type: 'error', message: 'Save failed' });
        } finally {
            setSaving(false);
        }
    };

    const sidebar = (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="preview-sidebar-header">
                <p className="preview-sidebar-title">Clients</p>
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
                        placeholder="e.g. Trusted by the world's best"
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
                        placeholder="Paragraph introducing the client section"
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
                    ref={el => { fieldRefs.current['images'] = el; }}
                    className={`form-group${activeField === 'images' ? ' is-active' : ''}`}
                >
                    <label>Client Logos ({page.images.length})</label>
                    <SortableList items={page.images} getId={i => i.id} onReorder={reorderImages}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                            {page.images.map((img, idx) => (
                                <SortableRow key={img.id} id={img.id}>
                                    {({ attributes, listeners }) => (
                                        <div style={{ position: 'relative' }}>
                                            <div
                                                {...attributes}
                                                {...listeners}
                                                style={{ cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 56, minWidth: 60, maxWidth: 100, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: 4, boxSizing: 'border-box' }}
                                            >
                                                {img.url && (
                                                    <img src={img.url} alt={img.alt || ''} style={{ height: '100%', width: 'auto', maxWidth: 92, objectFit: 'contain', pointerEvents: 'none' }} />
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                className="btn-remove"
                                                style={{ position: 'absolute', top: -6, right: -6, padding: '1px 5px', fontSize: 10, lineHeight: 1.4 }}
                                                onClick={() => removeImage(idx)}
                                            >✕</button>
                                        </div>
                                    )}
                                </SortableRow>
                            ))}
                        </div>
                    </SortableList>
                    <FileUploadButton
                        label="+ Upload logo"
                        accept="image/*"
                        onUploaded={addImageUploaded}
                        onError={msg => setToast({ type: 'error', message: msg })}
                    />
                </div>
            </div>
        </div>
    );

    if (isEditMode) {
        return (
            <>
                <VisualEditorLayout
                    title="Clients"
                    backTo="/pages/client"
                    iframeRef={iframeRef}
                    src={`${PREVIEW_URL}/clients`}
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
                title="Client"
                subtitle="Title, description, banner image, and client logos/images for the salescode.ai Client page."
            >
                <button className="btn-secondary" onClick={() => navigate('/editor?p=/clients')}>Preview &amp; Edit</button>
                <button className="btn-primary" onClick={save} disabled={saving || loading}>
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </AdminPageHeader>

            {loading ? (
                <div className="admin-loading">Loading…</div>
            ) : (
                <form className="config-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
                    <AdminSection title="Page info" accent="indigo">
                        <div className="form-group">
                            <label>Title</label>
                            <input
                                value={page.title}
                                onChange={(e) => update({ title: e.target.value })}
                                placeholder="e.g. Trusted by CPG leaders"
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={page.description}
                                onChange={(e) => update({ description: e.target.value })}
                                placeholder="Paragraph introducing the client section"
                                rows={3}
                            />
                        </div>
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
                    </AdminSection>

                    <AdminSection
                        title="Client images"
                        accent="purple"
                        description="Client logos or photos. Drag to reorder."
                        badge={`${page.images.length} image${page.images.length === 1 ? '' : 's'}`}
                        actions={
                            <FileUploadButton
                                label="+ Upload image"
                                className="btn-secondary"
                                accept="image/*"
                                onUploaded={addImageUploaded}
                                onError={(msg) => setToast({ type: 'error', message: msg })}
                            />
                        }
                    >
                        {page.images.length === 0 ? (
                            <div className="admin-empty">No client images yet. Upload one to start.</div>
                        ) : (
                            <SortableList items={page.images} getId={(i) => i.id} onReorder={reorderImages}>
                                <div className="admin-list is-grid">
                                    {page.images.map((img, idx) => {
                                        const isExpanded = expandedImages.has(img.id);
                                        return (
                                            <SortableRow key={img.id} id={img.id}>
                                                {({ attributes, listeners }) => (
                                                    <div className={`admin-item-card is-compact ${isExpanded ? 'is-expanded is-row-span' : ''}`}>
                                                        <div className="admin-item-card-head">
                                                            <DragHandle attributes={attributes} listeners={listeners} />
                                                            {img.url ? (
                                                                <img src={img.url} alt="" className="admin-item-thumb-sm" />
                                                            ) : (
                                                                <div className="admin-item-thumb-sm" />
                                                            )}
                                                            <div className="admin-item-title">
                                                                {img.alt || <span className="admin-item-title-placeholder">Client image {idx + 1}</span>}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className={`admin-item-edit-btn ${isExpanded ? 'is-active' : ''}`}
                                                                onClick={() => toggleExpanded(img.id)}
                                                            >
                                                                <Caret />
                                                                {isExpanded ? 'Close' : 'Edit'}
                                                            </button>
                                                            <button type="button" className="btn-remove" onClick={() => removeImage(idx)}>Remove</button>
                                                        </div>
                                                        {isExpanded && (
                                                            <div className="admin-item-expanded">
                                                                {img.url && <img src={img.url} alt={img.alt || ''} className="admin-media-thumb" />}
                                                                <div className="admin-field">
                                                                    <label>Image</label>
                                                                    <div className="admin-actions-bar">
                                                                        <FileUploadButton
                                                                            label={img.url ? 'Replace' : 'Upload'}
                                                                            accept="image/*"
                                                                            onUploaded={(url) => updateImage(idx, { url })}
                                                                            onError={(msg) => setToast({ type: 'error', message: msg })}
                                                                        />
                                                                        {img.url && (
                                                                            <button type="button" className="btn-remove" onClick={() => updateImage(idx, { url: '' })}>Clear</button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="admin-field">
                                                                    <label>Alt text</label>
                                                                    <input
                                                                        value={img.alt}
                                                                        onChange={(e) => updateImage(idx, { alt: e.target.value })}
                                                                        placeholder="e.g. Client logo"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </SortableRow>
                                        );
                                    })}
                                </div>
                            </SortableList>
                        )}
                    </AdminSection>

                    <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </form>
            )}

            <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
        </>
    );
}
