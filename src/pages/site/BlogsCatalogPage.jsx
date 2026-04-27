import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    listBlogs,
    createBlog,
    updateBlog,
    deleteBlog,
    reorderBlogs,
    getBlogsBgImage,
    updateBlogsBgImage,
    BLOG_CATEGORIES,
    BLOG_CATEGORY_LABELS
} from '../../api/site';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Toast from '../../components/admin/Toast';
import FileUploadButton from '../../components/admin/FileUploadButton';
import SortableList, { SortableRow, DragHandle } from '../../components/admin/SortableList';
import '../../components/admin/adminShared.css';

function Caret() {
    return (
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function BlogCard({
    blog,
    dragHandle,
    isEditing,
    draft,
    setDraft,
    busy,
    onStartEdit,
    onCancelEdit,
    onSave,
    onToggleEnabled,
    onDelete,
    onToastError
}) {
    const current = isEditing ? draft : blog;
    const typeLabel = current.type ? BLOG_CATEGORY_LABELS[current.type] : '';
    return (
        <div className={`admin-item-card is-compact ${!current.enabled ? 'is-disabled' : ''} ${isEditing ? 'is-expanded is-row-span' : ''}`}>
            <div className="admin-item-card-head">
                {dragHandle}
                {current.image ? (
                    <img src={current.image} alt="" className="admin-item-thumb-sm" />
                ) : (
                    <div className="admin-item-thumb-sm" />
                )}
                <div className="admin-item-title">
                    <span className="admin-item-title-text" title={current.title || ''}>
                        {current.title || <span className="admin-item-title-placeholder">Untitled blog</span>}
                    </span>
                    {typeLabel && <span className="admin-blog-type-pill">{typeLabel}</span>}
                </div>
                <label className="admin-toggle" title={current.enabled ? 'Disable' : 'Enable'}>
                    <input
                        type="checkbox"
                        checked={current.enabled}
                        onChange={() =>
                            isEditing
                                ? setDraft({ ...draft, enabled: !draft.enabled })
                                : onToggleEnabled(blog)
                        }
                    />
                    <span className="admin-toggle-track">
                        <span className="admin-toggle-thumb" />
                    </span>
                </label>
                {!isEditing ? (
                    <>
                        <button type="button" className="admin-item-edit-btn" onClick={() => onStartEdit(blog)}>
                            <Caret />
                            Edit
                        </button>
                        <button className="btn-remove" onClick={() => onDelete(blog)}>Delete</button>
                    </>
                ) : (
                    <>
                        <button className="btn-primary" onClick={onSave} disabled={busy}>
                            {busy ? 'Saving…' : 'Save'}
                        </button>
                        <button className="btn-secondary" onClick={onCancelEdit} disabled={busy}>Cancel</button>
                    </>
                )}
            </div>

            {isEditing && (
                <div className="admin-item-expanded">
                    <div className="admin-field-row">
                        <div className="admin-field">
                            <label>Thumbnail image</label>
                            {draft.image && <img src={draft.image} alt="" className="admin-media-thumb" />}
                            <div className="admin-actions-bar">
                                <FileUploadButton
                                    label={draft.image ? 'Replace' : 'Upload'}
                                    accept="image/*"
                                    onUploaded={(url) => setDraft({ ...draft, image: url })}
                                    onError={onToastError}
                                />
                                {draft.image && (
                                    <button
                                        type="button"
                                        className="btn-remove"
                                        onClick={() => setDraft({ ...draft, image: '' })}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="admin-field">
                            <label>Video</label>
                            {draft.video && (
                                <video
                                    src={draft.video}
                                    className="admin-video-thumb"
                                    muted
                                    playsInline
                                    controls
                                />
                            )}
                            <div className="admin-actions-bar">
                                <FileUploadButton
                                    label={draft.video ? 'Replace' : 'Upload'}
                                    accept="video/*"
                                    onUploaded={(url) => setDraft({ ...draft, video: url })}
                                    onError={onToastError}
                                />
                                {draft.video && (
                                    <button
                                        type="button"
                                        className="btn-remove"
                                        onClick={() => setDraft({ ...draft, video: '' })}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="admin-field">
                        <label>Title</label>
                        <input
                            value={draft.title}
                            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                            placeholder="Blog title"
                            autoFocus
                        />
                    </div>
                    <div className="admin-field">
                        <label>Description</label>
                        <textarea
                            value={draft.description}
                            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                            placeholder="Short summary"
                        />
                    </div>
                    <div className="admin-field-row">
                        <div className="admin-field">
                            <label>Type</label>
                            <select
                                value={draft.type || ''}
                                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                            >
                                <option value="">— Uncategorized —</option>
                                {BLOG_CATEGORIES.map((key) => (
                                    <option key={key} value={key}>{BLOG_CATEGORY_LABELS[key]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="admin-field">
                            <label>Link</label>
                            <input
                                value={draft.link}
                                onChange={(e) => setDraft({ ...draft, link: e.target.value })}
                                placeholder="/blog/my-post"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BlogGrid({
    canDrag,
    visibleBlogs,
    editingId,
    draft,
    setDraft,
    savingId,
    onReorder,
    startEdit,
    cancelEdit,
    saveEdit,
    toggleEnabled,
    handleDelete,
    onToastError
}) {
    const cardProps = (b) => ({
        blog: b,
        isEditing: editingId === b.id,
        draft,
        setDraft,
        busy: savingId === b.id,
        onStartEdit: startEdit,
        onCancelEdit: cancelEdit,
        onSave: saveEdit,
        onToggleEnabled: toggleEnabled,
        onDelete: handleDelete,
        onToastError
    });

    // Drag-reorder is only well-defined against the full list. When a filter
    // is active, arrayMove on the filtered subset would drop the hidden blogs
    // on save — so we render a plain grid with no drag handles in that case.
    if (!canDrag) {
        return (
            <div className="admin-list is-grid">
                {visibleBlogs.map((b) => (
                    <BlogCard key={b.id} dragHandle={null} {...cardProps(b)} />
                ))}
            </div>
        );
    }

    return (
        <SortableList items={visibleBlogs} getId={(b) => b.id} onReorder={onReorder}>
            <div className="admin-list is-grid">
                {visibleBlogs.map((b) => (
                    <SortableRow key={b.id} id={b.id}>
                        {({ attributes, listeners }) => (
                            <BlogCard
                                dragHandle={<DragHandle attributes={attributes} listeners={listeners} />}
                                {...cardProps(b)}
                            />
                        )}
                    </SortableRow>
                ))}
            </div>
        </SortableList>
    );
}

const EMPTY_BLOG_DRAFT = { title: '', description: '', image: '', video: '', link: '', type: '', enabled: true };

function AddBlogModal({ defaultType, onSave, onClose, onToastError }) {
    const [draft, setDraft] = useState({ ...EMPTY_BLOG_DRAFT, type: defaultType === 'all' ? '' : defaultType });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await onSave(draft);
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="add-blog-modal-title">
                <div className="admin-modal-header">
                    <h2 id="add-blog-modal-title">Add blog</h2>
                    <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>
                <div className="admin-modal-body">
                    <div className="admin-field-row">
                        <div className="admin-field">
                            <label>Thumbnail image</label>
                            {draft.image && <img src={draft.image} alt="" className="admin-media-thumb" />}
                            <div className="admin-actions-bar">
                                <FileUploadButton
                                    label={draft.image ? 'Replace' : 'Upload'}
                                    accept="image/*"
                                    onUploaded={(url) => setDraft((d) => ({ ...d, image: url }))}
                                    onError={onToastError}
                                />
                                {draft.image && (
                                    <button type="button" className="btn-remove" onClick={() => setDraft((d) => ({ ...d, image: '' }))}>
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="admin-field">
                            <label>Video</label>
                            {draft.video && (
                                <video src={draft.video} className="admin-video-thumb" muted playsInline controls />
                            )}
                            <div className="admin-actions-bar">
                                <FileUploadButton
                                    label={draft.video ? 'Replace' : 'Upload'}
                                    accept="video/*"
                                    onUploaded={(url) => setDraft((d) => ({ ...d, video: url }))}
                                    onError={onToastError}
                                />
                                {draft.video && (
                                    <button type="button" className="btn-remove" onClick={() => setDraft((d) => ({ ...d, video: '' }))}>
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="admin-field">
                        <label>Title</label>
                        <input
                            value={draft.title}
                            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                            placeholder="Blog title"
                            autoFocus
                        />
                    </div>
                    <div className="admin-field">
                        <label>Description</label>
                        <textarea
                            value={draft.description}
                            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                            placeholder="Short summary"
                        />
                    </div>
                    <div className="admin-field-row">
                        <div className="admin-field">
                            <label>Type</label>
                            <select value={draft.type || ''} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}>
                                <option value="">— Uncategorized —</option>
                                {BLOG_CATEGORIES.map((key) => (
                                    <option key={key} value={key}>{BLOG_CATEGORY_LABELS[key]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="admin-field">
                            <label>Link</label>
                            <input
                                value={draft.link}
                                onChange={(e) => setDraft((d) => ({ ...d, link: e.target.value }))}
                                placeholder="/blog/my-post"
                            />
                        </div>
                    </div>
                </div>
                <div className="admin-modal-footer">
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="button" className="btn-primary" onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Adding…' : 'Add blog'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

const PAGE_SIZE = 12;

export default function BlogsCatalogPage() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState(null);
    const [savingId, setSavingId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [pendingBlogIds, setPendingBlogIds] = useState(new Set());
    const [toast, setToast] = useState(null);
    const [bgImage, setBgImage] = useState('');
    const [savedBgImage, setSavedBgImage] = useState('');
    const [savingBg, setSavingBg] = useState(false);
    const [bgExpanded, setBgExpanded] = useState(false);
    // 'all' = show every blog; otherwise a BLOG_CATEGORIES key. Filter is
    // admin-only — reorder (drag) is disabled while a filter is active to
    // avoid ambiguous ordering between the filtered view and full list.
    const [activeType, setActiveType] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const load = async () => {
        try {
            const { data } = await listBlogs();
            setBlogs(data.blogs || []);
            if (typeof data.bgImage === 'string') {
                setBgImage(data.bgImage);
                setSavedBgImage(data.bgImage);
            }
        } catch {
            setToast({ type: 'error', message: 'Failed to load blogs' });
        } finally {
            setLoading(false);
        }
    };

    const loadBgImage = async () => {
        try {
            const { data } = await getBlogsBgImage();
            const bi = data.bgImage || '';
            setBgImage(bi);
            setSavedBgImage(bi);
        } catch {
            // Don't block the list if this endpoint isn't available yet.
        }
    };

    useEffect(() => { load(); loadBgImage(); }, []);

    const saveBg = async () => {
        setSavingBg(true);
        try {
            const { data } = await updateBlogsBgImage(bgImage);
            const bi = data.bgImage || '';
            setBgImage(bi);
            setSavedBgImage(bi);
            setToast({ type: 'success', message: 'Blog page bg image saved' });
        } catch {
            setToast({ type: 'error', message: 'Save failed' });
        } finally {
            setSavingBg(false);
        }
    };

    const startEdit = (b) => {
        setEditingId(b.id);
        setDraft({ ...b });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDraft(null);
    };

    const saveEdit = async () => {
        if (!draft) return;
        setSavingId(draft.id);
        try {
            const { data } = await updateBlog(draft.id, {
                image: draft.image,
                video: draft.video,
                link: draft.link,
                title: draft.title,
                description: draft.description,
                type: draft.type || '',
                enabled: draft.enabled
            });
            setBlogs((prev) => prev.map((b) => (b.id === draft.id ? { ...b, ...data.blog } : b)));
            setToast({ type: 'success', message: 'Blog saved' });
            cancelEdit();
        } catch {
            setToast({ type: 'error', message: 'Save failed' });
        } finally {
            setSavingId(null);
        }
    };

    const toggleEnabled = async (b) => {
        const next = !b.enabled;
        setBlogs((prev) => prev.map((x) => (x.id === b.id ? { ...x, enabled: next } : x)));
        try {
            await updateBlog(b.id, { enabled: next });
        } catch {
            setBlogs((prev) => prev.map((x) => (x.id === b.id ? { ...x, enabled: b.enabled } : x)));
            setToast({ type: 'error', message: 'Update failed' });
        }
    };

    const handleAdd = () => setShowAddModal(true);

    const handleModalSave = (newDraft) => {
        const tempId = `pending-${Date.now()}`;
        const newBlog = { ...newDraft, id: tempId, type: newDraft.type || '' };
        const newBlogs = [...blogs, newBlog];
        setBlogs(newBlogs);
        setPendingBlogIds((prev) => new Set(prev).add(tempId));
        setShowAddModal(false);
        const newTotal = Math.max(1, Math.ceil(
            (activeType === 'all' ? newBlogs : newBlogs.filter((b) => b.type === activeType)).length / PAGE_SIZE
        ));
        setCurrentPage(newTotal);
    };

    const saveNewBlogs = async () => {
        if (pendingBlogIds.size === 0) return;
        setCreating(true);
        try {
            const saved = [];
            for (const tempId of pendingBlogIds) {
                const blog = blogs.find((b) => b.id === tempId);
                if (!blog) continue;
                const { data } = await createBlog({
                    title: blog.title,
                    description: blog.description,
                    image: blog.image,
                    video: blog.video,
                    link: blog.link,
                    type: blog.type || '',
                    enabled: blog.enabled
                });
                saved.push({ tempId, realBlog: data.blog });
            }
            setBlogs((prev) => prev.map((b) => {
                const match = saved.find((s) => s.tempId === b.id);
                return match ? { ...b, ...match.realBlog } : b;
            }));
            setPendingBlogIds(new Set());
            setToast({ type: 'success', message: `${saved.length} blog${saved.length !== 1 ? 's' : ''} saved` });
        } catch {
            setToast({ type: 'error', message: 'Could not save blogs' });
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (b) => {
        if (!window.confirm(`Delete "${b.title || 'this blog'}"? It will also be removed from the landing page.`)) return;
        const prev = blogs;
        setBlogs((curr) => curr.filter((x) => x.id !== b.id));
        try {
            await deleteBlog(b.id);
            setToast({ type: 'success', message: 'Blog deleted' });
        } catch {
            setBlogs(prev);
            setToast({ type: 'error', message: 'Delete failed' });
        }
    };

    const handleReorder = async (next) => {
        const prev = blogs;
        setBlogs(next);
        try {
            await reorderBlogs(next.map((b) => b.id));
        } catch {
            setBlogs(prev);
            setToast({ type: 'error', message: 'Reorder failed' });
        }
    };

    const typeCounts = useMemo(() => {
        const counts = { all: blogs.length };
        for (const key of BLOG_CATEGORIES) counts[key] = 0;
        for (const b of blogs) {
            if (b.type && counts[b.type] !== undefined) counts[b.type] += 1;
        }
        return counts;
    }, [blogs]);

    const visibleBlogs = useMemo(
        () => (activeType === 'all' ? blogs : blogs.filter((b) => b.type === activeType)),
        [blogs, activeType]
    );

    const totalPages = Math.max(1, Math.ceil(visibleBlogs.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pageStart = (safePage - 1) * PAGE_SIZE;
    const pagedBlogs = visibleBlogs.slice(pageStart, pageStart + PAGE_SIZE);

    // Reset to page 1 whenever the filter changes
    useEffect(() => { setCurrentPage(1); }, [activeType]);

    const handlePagedReorder = (newPageOrder) => {
        // Reconstruct the full list, replacing only the current page's slice
        const fullReordered = [
            ...blogs.slice(0, pageStart),
            ...newPageOrder,
            ...blogs.slice(pageStart + PAGE_SIZE)
        ];
        handleReorder(fullReordered);
    };

    return (
        <>
            <AdminPageHeader
                title="Blogs"
                subtitle="All blog posts for salescode.ai. Any blog added here can be featured on the landing page via Landing → Blogs."
            >
                {pendingBlogIds.size > 0 && (
                    <button className="btn-primary" onClick={saveNewBlogs} disabled={creating}>
                        {creating ? 'Saving…' : 'Save Changes'}
                    </button>
                )}
                <button className="btn-primary" onClick={handleAdd} disabled={creating || showAddModal}>
                    + Add blog
                </button>
            </AdminPageHeader>

            {!loading && (
                <div className={`admin-item-card is-compact ${bgExpanded ? 'is-expanded' : ''}`} style={{ marginBottom: 20 }}>
                    <div className="admin-item-card-head">
                        {bgImage ? (
                            <img src={bgImage} alt="" className="admin-item-thumb-sm" />
                        ) : (
                            <div className="admin-item-thumb-sm" />
                        )}
                        <div className="admin-item-title">Blog page background image</div>
                        <button
                            type="button"
                            className={`admin-item-edit-btn ${bgExpanded ? 'is-active' : ''}`}
                            onClick={() => setBgExpanded((v) => !v)}
                        >
                            <Caret />
                            {bgExpanded ? 'Close' : 'Edit'}
                        </button>
                    </div>

                    {bgExpanded && (
                        <div className="admin-item-expanded">
                            <div className="hint">
                                Image shown above the blog list on the public /blog page.
                            </div>
                            {bgImage && <img src={bgImage} alt="" className="admin-media-thumb" />}
                            <div className="admin-actions-bar">
                                <FileUploadButton
                                    label={bgImage ? 'Replace' : 'Upload'}
                                    accept="image/*"
                                    onUploaded={(url) => setBgImage(url)}
                                    onError={(msg) => setToast({ type: 'error', message: msg })}
                                />
                                {bgImage && (
                                    <button
                                        type="button"
                                        className="btn-remove"
                                        onClick={() => setBgImage('')}
                                    >
                                        Clear
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={saveBg}
                                    disabled={savingBg || bgImage === savedBgImage}
                                >
                                    {savingBg ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!loading && blogs.length > 0 && (
                <div className="admin-filter-tabs" role="tablist" aria-label="Filter blogs by type">
                    <span className="admin-filter-tabs-label">Filter</span>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeType === 'all'}
                        className={`admin-filter-tab ${activeType === 'all' ? 'is-active' : ''}`}
                        onClick={() => setActiveType('all')}
                    >
                        All
                        <span className="admin-filter-tab-count">{typeCounts.all}</span>
                    </button>
                    {BLOG_CATEGORIES.map((key) => (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={activeType === key}
                            className={`admin-filter-tab ${activeType === key ? 'is-active' : ''}`}
                            onClick={() => setActiveType(key)}
                        >
                            {BLOG_CATEGORY_LABELS[key]}
                            <span className="admin-filter-tab-count">{typeCounts[key] || 0}</span>
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="admin-loading">Loading…</div>
            ) : blogs.length === 0 ? (
                <div className="admin-empty">
                    No blogs yet. Click "+ Add blog" to create the first one.
                </div>
            ) : visibleBlogs.length === 0 ? (
                <div className="admin-empty">
                    No blogs in <strong>{BLOG_CATEGORY_LABELS[activeType] || activeType}</strong> yet.{' '}
                    <button
                        type="button"
                        className="btn-secondary"
                        style={{ marginLeft: 8 }}
                        onClick={() => setActiveType('all')}
                    >
                        Show all
                    </button>
                </div>
            ) : (
                <>
                    <BlogGrid
                        canDrag={activeType === 'all'}
                        visibleBlogs={pagedBlogs}
                        editingId={editingId}
                        draft={draft}
                        setDraft={setDraft}
                        savingId={savingId}
                        onReorder={handlePagedReorder}
                        startEdit={startEdit}
                        cancelEdit={cancelEdit}
                        saveEdit={saveEdit}
                        toggleEnabled={toggleEnabled}
                        handleDelete={handleDelete}
                        onToastError={(msg) => setToast({ type: 'error', message: msg })}
                    />
                    {totalPages > 1 && (
                        <div className="admin-pagination">
                            <span className="admin-pagination-info">
                                {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, visibleBlogs.length)} of {visibleBlogs.length}
                            </span>
                            <button
                                type="button"
                                className="admin-pagination-btn"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={safePage === 1}
                            >
                                ‹ Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                                <button
                                    key={pg}
                                    type="button"
                                    className={`admin-pagination-btn ${safePage === pg ? 'is-active' : ''}`}
                                    onClick={() => setCurrentPage(pg)}
                                >
                                    {pg}
                                </button>
                            ))}
                            <button
                                type="button"
                                className="admin-pagination-btn"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={safePage === totalPages}
                            >
                                Next ›
                            </button>
                        </div>
                    )}
                </>
            )}

            {showAddModal && (
                <AddBlogModal
                    defaultType={activeType}
                    onSave={handleModalSave}
                    onClose={() => setShowAddModal(false)}
                    onToastError={(msg) => setToast({ type: 'error', message: msg })}
                />
            )}

            <Toast
                message={toast?.message}
                type={toast?.type}
                onClose={() => setToast(null)}
            />
        </>
    );
}
