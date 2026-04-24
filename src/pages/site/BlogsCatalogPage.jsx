import { useEffect, useMemo, useState } from 'react';
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

export default function BlogsCatalogPage() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState(null);
    const [savingId, setSavingId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [toast, setToast] = useState(null);
    const [bgImage, setBgImage] = useState('');
    const [savedBgImage, setSavedBgImage] = useState('');
    const [savingBg, setSavingBg] = useState(false);
    const [bgExpanded, setBgExpanded] = useState(false);
    // 'all' = show every blog; otherwise a BLOG_CATEGORIES key. Filter is
    // admin-only — reorder (drag) is disabled while a filter is active to
    // avoid ambiguous ordering between the filtered view and full list.
    const [activeType, setActiveType] = useState('all');

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

    const handleAdd = async () => {
        setCreating(true);
        try {
            const { data } = await createBlog({
                title: '',
                description: '',
                image: '',
                video: '',
                link: '',
                // If a filter is active, pre-select that type for the new blog —
                // matches the filter tab the admin is currently viewing.
                type: activeType === 'all' ? '' : activeType,
                enabled: true
            });
            setBlogs((prev) => [...prev, data.blog]);
            startEdit(data.blog);
        } catch {
            setToast({ type: 'error', message: 'Could not add blog' });
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

    return (
        <>
            <AdminPageHeader
                title="Blogs"
                subtitle="All blog posts for salescode.ai. Any blog added here can be featured on the landing page via Landing → Blogs."
            >
                <button className="btn-primary" onClick={handleAdd} disabled={creating}>
                    {creating ? 'Adding…' : '+ Add blog'}
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
                <BlogGrid
                    canDrag={activeType === 'all'}
                    visibleBlogs={visibleBlogs}
                    editingId={editingId}
                    draft={draft}
                    setDraft={setDraft}
                    savingId={savingId}
                    onReorder={handleReorder}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveEdit={saveEdit}
                    toggleEnabled={toggleEnabled}
                    handleDelete={handleDelete}
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
