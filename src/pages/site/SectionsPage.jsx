import { useEffect, useState } from 'react';
import { getSections, updateSections, getAvailableBlogs } from '../../api/site';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSection from '../../components/admin/AdminSection';
import Toast from '../../components/admin/Toast';
import FileUploadButton from '../../components/admin/FileUploadButton';
import SortableList, { SortableRow, DragHandle } from '../../components/admin/SortableList';
import '../../components/admin/adminShared.css';
import '../../components/forms.css';

const SECTION_ACCENT = 'indigo';

const KIND_LABELS = {
    image: 'Images',
    video: 'Videos',
    card: 'Cards',
    blog: 'Blogs'
};

const rand = () => Math.random().toString(36).slice(2, 7);

const newItemForKind = (kind, url = '') => {
    if (kind === 'image') {
        return { id: `img-${Date.now()}-${rand()}`, url, alt: '', order: 0 };
    }
    if (kind === 'video') {
        return {
            id: `vid-${Date.now()}-${rand()}`,
            url,
            title: '',
            description: '',
            thumbnail: '',
            order: 0
        };
    }
    if (kind === 'card') {
        return {
            id: `card-${Date.now()}-${rand()}`,
            title: '',
            subtitle: '',
            description: '',
            points: [],
            image: '',
            order: 0
        };
    }
    // blog — the payload-side creator; in practice blog items are added via
    // the picker (addBlogItem below), which uses catalog data directly.
    return { id: `blog-${Date.now()}-${rand()}`, blogId: '', order: 0 };
};

const newBlogItemFromCatalog = (blog) => ({
    id: blog.id,
    blogId: blog.id,
    title: blog.title || '',
    description: blog.description || '',
    image: blog.image || '',
    url: blog.link || '',
    enabled: true,
    order: 0
});

const newSection = (kind = 'card') => ({
    id: `sec-${Date.now()}-${rand()}`,
    label: 'New Section',
    kind,
    cardinality: 'multiple',
    items: [],
    order: 0,
    enabled: true
});

function Caret() {
    return (
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* ─────────────── Item editors (one per kind) ─────────────── */

function ImageItemEditor({ item, onChange, onReplaceUrl, onError }) {
    return (
        <div className="admin-item-expanded">
            {item.url && <img src={item.url} alt={item.alt || ''} className="admin-media-thumb" />}
            <div className="admin-field">
                <label>Image</label>
                <div className="admin-actions-bar">
                    <FileUploadButton
                        label={item.url ? 'Replace' : 'Upload'}
                        accept="image/*"
                        onUploaded={onReplaceUrl}
                        onError={onError}
                    />
                    {item.url && (
                        <button
                            type="button"
                            className="btn-remove"
                            onClick={() => onChange({ url: '' })}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>
            <div className="admin-field-row">
                <div className="admin-field">
                    <label>Alt text</label>
                    <input
                        value={item.alt || ''}
                        onChange={(e) => onChange({ alt: e.target.value })}
                        placeholder="Describe the image"
                    />
                </div>
                <div className="admin-field">
                    <label>Caption</label>
                    <input
                        value={item.caption || ''}
                        onChange={(e) => onChange({ caption: e.target.value })}
                        placeholder="Shown under the image"
                    />
                </div>
            </div>
        </div>
    );
}

function VideoItemEditor({ item, onChange, onReplaceUrl, onError, autoPlay }) {
    return (
        <div className="admin-item-expanded">
            {item.url && (
                <video
                    key={item.url}
                    src={item.url}
                    poster={item.thumbnail || undefined}
                    controls
                    autoPlay={autoPlay}
                    muted={autoPlay}
                    className="admin-video-thumb"
                />
            )}
            <div className="admin-field">
                <label>Video</label>
                <div className="admin-actions-bar">
                    <FileUploadButton
                        label={item.url ? 'Replace' : 'Upload'}
                        accept="video/*"
                        onUploaded={onReplaceUrl}
                        onError={onError}
                    />
                    {item.url && (
                        <button
                            type="button"
                            className="btn-remove"
                            onClick={() => onChange({ url: '' })}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>
            <div className="admin-field">
                <label>Thumbnail</label>
                <div className="admin-actions-bar">
                    {item.thumbnail && (
                        <img src={item.thumbnail} alt="" className="admin-item-thumb-sm" />
                    )}
                    <FileUploadButton
                        label={item.thumbnail ? 'Replace' : 'Upload thumb'}
                        accept="image/*"
                        onUploaded={(url) => onChange({ thumbnail: url })}
                        onError={onError}
                    />
                    {item.thumbnail && (
                        <button
                            type="button"
                            className="btn-remove"
                            onClick={() => onChange({ thumbnail: '' })}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>
            <div className="admin-field-row">
                <div className="admin-field">
                    <label>Title</label>
                    <input
                        value={item.title || ''}
                        onChange={(e) => onChange({ title: e.target.value })}
                        placeholder="e.g. Product walkthrough"
                    />
                </div>
                <div className="admin-field">
                    <label>Description</label>
                    <input
                        value={item.description || ''}
                        onChange={(e) => onChange({ description: e.target.value })}
                        placeholder="Short description"
                    />
                </div>
            </div>
        </div>
    );
}

function PointsEditor({ points, onChange }) {
    const patch = (i, change) => onChange(points.map((p, j) => (j === i ? { ...p, ...change } : p)));
    const remove = (i) => onChange(points.filter((_, j) => j !== i));
    const add = () => onChange([...points, { heading: '', description: '' }]);

    return (
        <div className="admin-field">
            <label>Points</label>
            {points.length === 0 ? (
                <div className="admin-empty" style={{ padding: 12, marginBottom: 8 }}>No points yet.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
                    {points.map((p, i) => (
                        <div
                            key={i}
                            style={{
                                border: '1px solid var(--color-border)',
                                borderRadius: 8,
                                padding: 12,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8
                            }}
                        >
                            <div className="admin-actions-bar">
                                <input
                                    value={p.heading}
                                    onChange={(e) => patch(i, { heading: e.target.value })}
                                    placeholder={`Point ${i + 1} heading`}
                                />
                                <button type="button" className="btn-remove" onClick={() => remove(i)}>Remove</button>
                            </div>
                            <textarea
                                rows={2}
                                value={p.description}
                                onChange={(e) => patch(i, { description: e.target.value })}
                                placeholder="Description for this point"
                            />
                        </div>
                    ))}
                </div>
            )}
            <button type="button" className="btn-add" onClick={add}>+ Add point</button>
        </div>
    );
}

function CardItemEditor({ item, onChange, onError }) {
    return (
        <div className="admin-item-expanded">
            {item.image && <img src={item.image} alt={item.title || ''} className="admin-media-thumb" />}
            <div className="admin-field">
                <label>Image</label>
                <div className="admin-actions-bar">
                    <FileUploadButton
                        label={item.image ? 'Replace' : 'Upload'}
                        accept="image/*"
                        onUploaded={(url) => onChange({ image: url })}
                        onError={onError}
                    />
                    {item.image && (
                        <button
                            type="button"
                            className="btn-remove"
                            onClick={() => onChange({ image: '' })}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>
            <div className="admin-field-row">
                <div className="admin-field">
                    <label>Title</label>
                    <input
                        value={item.title || ''}
                        onChange={(e) => onChange({ title: e.target.value })}
                        placeholder="e.g. Real-time insights"
                    />
                </div>
                <div className="admin-field">
                    <label>Subtitle</label>
                    <input
                        value={item.subtitle || ''}
                        onChange={(e) => onChange({ subtitle: e.target.value })}
                        placeholder="Optional short tagline"
                    />
                </div>
            </div>
            <div className="admin-field">
                <label>Description</label>
                <textarea
                    rows={3}
                    value={item.description || ''}
                    onChange={(e) => onChange({ description: e.target.value })}
                    placeholder="Longer description shown under the title"
                />
            </div>
            <PointsEditor
                points={item.points || []}
                onChange={(next) => onChange({ points: next })}
            />
        </div>
    );
}

/* ─────────────── Item row (compact head + expandable editor) ─────────────── */

function ItemRow({
    kind,
    item,
    index,
    isExpanded,
    onToggle,
    onChange,
    onReplaceUrl,
    onRemove,
    onError,
    autoPlay,
    dragHandle
}) {
    // Blog items are read-only refs — content is owned by the blog catalog,
    // edited under Pages → Blog. No expand / no edit button here.
    if (kind === 'blog') {
        const isOrphan = item.enabled === false;
        return (
            <div className={`admin-item-card is-compact ${isOrphan ? 'is-disabled' : ''}`}>
                <div className="admin-item-card-head">
                    {dragHandle}
                    {item.image ? (
                        <img src={item.image} alt="" className="admin-item-thumb-sm" />
                    ) : (
                        <div className="admin-item-thumb-sm" />
                    )}
                    <div className="admin-item-title">
                        {item.title || <span className="admin-item-title-placeholder">Untitled blog</span>}
                        {isOrphan && (
                            <span className="hint" style={{ marginLeft: 8, color: 'var(--text-danger)' }}>
                                (disabled in catalog)
                            </span>
                        )}
                    </div>
                    <button type="button" className="btn-remove" onClick={onRemove}>Remove</button>
                </div>
            </div>
        );
    }

    let thumb = null;
    let headTitle = '';
    if (kind === 'image') {
        thumb = item.url ? <img src={item.url} alt="" className="admin-item-thumb-sm" /> : <div className="admin-item-thumb-sm" />;
        headTitle = item.alt || '';
    } else if (kind === 'video') {
        thumb = item.thumbnail ? <img src={item.thumbnail} alt="" className="admin-item-thumb-sm is-video" /> : <div className="admin-item-thumb-sm is-video" />;
        headTitle = item.title || '';
    } else {
        thumb = item.image ? <img src={item.image} alt="" className="admin-item-thumb-sm" /> : <div className="admin-item-thumb-sm" />;
        headTitle = item.title || '';
    }
    const placeholder = kind === 'video' ? 'Untitled video' : kind === 'card' ? 'Untitled card' : `Image ${index + 1}`;

    return (
        <div className={`admin-item-card is-compact ${isExpanded ? 'is-expanded is-row-span' : ''}`}>
            <div className="admin-item-card-head">
                {dragHandle}
                {thumb}
                <div className="admin-item-title">
                    {headTitle || <span className="admin-item-title-placeholder">{placeholder}</span>}
                </div>
                <button
                    type="button"
                    className={`admin-item-edit-btn ${isExpanded ? 'is-active' : ''}`}
                    onClick={onToggle}
                >
                    <Caret />
                    {isExpanded ? 'Close' : 'Edit'}
                </button>
                <button type="button" className="btn-remove" onClick={onRemove}>Remove</button>
            </div>
            {isExpanded && kind === 'image' && (
                <ImageItemEditor item={item} onChange={onChange} onReplaceUrl={onReplaceUrl} onError={onError} />
            )}
            {isExpanded && kind === 'video' && (
                <VideoItemEditor item={item} onChange={onChange} onReplaceUrl={onReplaceUrl} onError={onError} autoPlay={autoPlay} />
            )}
            {isExpanded && kind === 'card' && (
                <CardItemEditor item={item} onChange={onChange} onError={onError} />
            )}
        </div>
    );
}

/* ─────────────── Section card ─────────────── */

function SectionCard({
    section,
    sIdx,
    accent,
    expandedItems,
    toggleExpanded,
    updateSection,
    updateItem,
    removeItem,
    reorderItems,
    addItem,
    openBlogPicker,
    removeSection,
    justUploadedId,
    onError,
    dragHandle
}) {
    const isSingle = section.cardinality === 'single';
    const hasItem = section.items.length > 0;
    const kindLabel = KIND_LABELS[section.kind] || 'Items';
    const uploadAccept = section.kind === 'image' ? 'image/*' : section.kind === 'video' ? 'video/*' : undefined;

    const handleUpload = (url) => addItem(sIdx, url);

    const titleInput = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            {dragHandle}
            <input
                className="admin-section-title-input"
                value={section.label}
                onChange={(e) => updateSection(sIdx, { label: e.target.value })}
                placeholder="Section label"
            />
        </div>
    );

    const badge = isSingle
        ? hasItem ? '1 / 1' : '0 / 1'
        : `${section.items.length} ${kindLabel.toLowerCase()}${section.items.length === 1 ? '' : ''}`;

    const enabled = section.enabled !== false;

    const actions = (
        <>
            <label
                className="admin-toggle"
                title={enabled ? 'Disable section (hide from public page)' : 'Enable section'}
            >
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => updateSection(sIdx, { enabled: e.target.checked })}
                />
                <span className="admin-toggle-track">
                    <span className="admin-toggle-thumb" />
                </span>
            </label>
            <span className={`admin-kind-pill admin-kind-${section.kind}`}>{kindLabel}</span>
            <select
                className="admin-section-select"
                value={section.kind}
                onChange={(e) => {
                    if (!window.confirm('Changing kind will clear the items in this section. Continue?')) return;
                    updateSection(sIdx, { kind: e.target.value, items: [] });
                }}
                title="Section kind"
            >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="card">Card</option>
                <option value="blog">Blog</option>
            </select>
            {section.kind !== 'blog' && (
                <select
                    className="admin-section-select"
                    value={section.cardinality}
                    onChange={(e) => {
                        const cardinality = e.target.value;
                        updateSection(sIdx, {
                            cardinality,
                            items:
                                cardinality === 'single' && section.items.length > 1
                                    ? section.items.slice(0, 1)
                                    : section.items
                        });
                    }}
                    title="Cardinality"
                >
                    <option value="multiple">Multiple</option>
                    <option value="single">Single</option>
                </select>
            )}
            {!isSingle && section.kind === 'card' && (
                <button type="button" className="btn-secondary" onClick={() => addItem(sIdx)}>+ Add card</button>
            )}
            {!isSingle && section.kind === 'blog' && (
                <button type="button" className="btn-secondary" onClick={() => openBlogPicker(sIdx)}>+ Add blog</button>
            )}
            {!isSingle && (section.kind === 'image' || section.kind === 'video') && (
                <FileUploadButton
                    label={`+ Upload ${section.kind}`}
                    className="btn-secondary"
                    accept={uploadAccept}
                    onUploaded={handleUpload}
                    onError={onError}
                />
            )}
            <button type="button" className="btn-remove" onClick={() => removeSection(sIdx)}>
                Remove section
            </button>
        </>
    );

    const renderItem = (item, iIdx, handle) => (
        <ItemRow
            kind={section.kind}
            item={item}
            index={iIdx}
            isExpanded={expandedItems.has(item.id)}
            onToggle={() => toggleExpanded(item.id)}
            onChange={(patch) => updateItem(sIdx, iIdx, patch)}
            onReplaceUrl={(url) => updateItem(sIdx, iIdx, { url })}
            onRemove={() => removeItem(sIdx, iIdx)}
            onError={onError}
            autoPlay={item.id === justUploadedId}
            dragHandle={handle}
        />
    );

    return (
        <AdminSection
            accent={accent}
            titleInput={titleInput}
            badge={badge}
            actions={actions}
            defaultOpen={false}
        >
            {isSingle ? (
                hasItem ? (
                    renderItem(section.items[0], 0, null)
                ) : section.kind === 'card' ? (
                    <div className="admin-empty" style={{ padding: 32 }}>
                        <div style={{ marginBottom: 14 }}>No card yet.</div>
                        <button type="button" className="btn-primary" onClick={() => addItem(sIdx)}>Add card</button>
                    </div>
                ) : section.kind === 'blog' ? (
                    <div className="admin-empty" style={{ padding: 32 }}>
                        <div style={{ marginBottom: 14 }}>No blog yet.</div>
                        <button type="button" className="btn-primary" onClick={() => openBlogPicker(sIdx)}>
                            Add blog
                        </button>
                    </div>
                ) : (
                    <div className="admin-empty" style={{ padding: 32 }}>
                        <div style={{ marginBottom: 14 }}>No {section.kind} yet.</div>
                        <FileUploadButton
                            label={`Upload ${section.kind}`}
                            className="btn-primary"
                            accept={uploadAccept}
                            onUploaded={handleUpload}
                            onError={onError}
                        />
                    </div>
                )
            ) : section.items.length === 0 ? (
                <div className="admin-empty" style={{ padding: 24 }}>
                    No {kindLabel.toLowerCase()} in this section yet.
                    {section.kind === 'blog' && (
                        <>
                            {' '}
                            <button
                                type="button"
                                className="btn-secondary"
                                style={{ marginLeft: 8 }}
                                onClick={() => openBlogPicker(sIdx)}
                            >
                                + Add blog
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <SortableList
                    items={section.items}
                    getId={(i) => i.id}
                    onReorder={(next) => reorderItems(sIdx, next)}
                >
                    <div className={section.kind === 'card' ? 'admin-list' : 'admin-list is-grid'}>
                        {section.items.map((item, iIdx) => (
                            <SortableRow key={item.id} id={item.id}>
                                {({ attributes, listeners }) =>
                                    renderItem(item, iIdx, <DragHandle attributes={attributes} listeners={listeners} />)
                                }
                            </SortableRow>
                        ))}
                    </div>
                </SortableList>
            )}
        </AdminSection>
    );
}

/* ─────────────── Page ─────────────── */

export default function SectionsPage() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [expandedItems, setExpandedItems] = useState(() => new Set());
    const [justUploadedId, setJustUploadedId] = useState(null);
    // When non-null, we render an inline blog picker above the section at this
    // index. Loaded lazily from /sections/available-blogs.
    const [blogPickerIdx, setBlogPickerIdx] = useState(null);
    const [availableBlogs, setAvailableBlogs] = useState([]);

    const onError = (msg) => setToast({ type: 'error', message: msg });

    const loadAvailableBlogs = async () => {
        try {
            const { data } = await getAvailableBlogs();
            setAvailableBlogs(data.available || []);
        } catch {
            onError('Could not load blog catalog');
        }
    };

    const openBlogPicker = async (sIdx) => {
        if (availableBlogs.length === 0) {
            await loadAvailableBlogs();
        }
        setBlogPickerIdx(sIdx);
    };

    const closeBlogPicker = () => setBlogPickerIdx(null);

    // Already-featured blogIds across ALL blog sections — the picker hides
    // these to prevent featuring the same blog twice.
    const featuredBlogIds = new Set();
    sections.forEach((s) => {
        if (s.kind !== 'blog') return;
        s.items.forEach((it) => it.blogId && featuredBlogIds.add(it.blogId));
    });
    const pickerOptions = availableBlogs.filter((b) => !featuredBlogIds.has(b.id));

    const addBlogItem = (sIdx, blog) => {
        const item = newBlogItemFromCatalog(blog);
        setSections((prev) =>
            prev.map((s, i) => {
                if (i !== sIdx) return s;
                if (s.cardinality === 'single') return { ...s, items: [item] };
                return { ...s, items: [...s.items, item] };
            })
        );
        setBlogPickerIdx(null);
    };

    const toggleExpanded = (id) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    useEffect(() => {
        (async () => {
            try {
                const { data } = await getSections();
                setSections(data.sections || []);
            } catch {
                setToast({ type: 'error', message: 'Failed to load sections' });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const updateSection = (sIdx, patch) =>
        setSections((prev) => prev.map((s, i) => (i === sIdx ? { ...s, ...patch } : s)));

    const updateItem = (sIdx, iIdx, patch) =>
        setSections((prev) =>
            prev.map((s, i) =>
                i === sIdx
                    ? { ...s, items: s.items.map((it, j) => (j === iIdx ? { ...it, ...patch } : it)) }
                    : s
            )
        );

    const removeItem = (sIdx, iIdx) =>
        setSections((prev) =>
            prev.map((s, i) => (i === sIdx ? { ...s, items: s.items.filter((_, j) => j !== iIdx) } : s))
        );

    const reorderItems = (sIdx, next) =>
        setSections((prev) => prev.map((s, i) => (i === sIdx ? { ...s, items: next } : s)));

    // Add item — for image/video we get a URL from upload; for cards we synthesize.
    const addItem = (sIdx, url) => {
        let createdId = null;
        setSections((prev) =>
            prev.map((s, i) => {
                if (i !== sIdx) return s;
                const item = newItemForKind(s.kind, url || '');
                createdId = item.id;
                if (s.cardinality === 'single') return { ...s, items: [item] };
                return { ...s, items: [...s.items, item] };
            })
        );
        if (createdId) {
            setExpandedItems((prev) => new Set(prev).add(createdId));
            setJustUploadedId(createdId);
        }
    };

    const reorderSections = (next) => setSections(next);

    const addSection = () => setSections((prev) => [...prev, newSection('card')]);

    const removeSection = (sIdx) => {
        if (!window.confirm('Remove this section and all its items?')) return;
        setSections((prev) => prev.filter((_, i) => i !== sIdx));
    };

    const save = async () => {
        setSaving(true);
        try {
            const payload = sections.map((s, i) => ({
                id: s.id,
                label: s.label,
                kind: s.kind,
                cardinality: s.cardinality,
                enabled: s.enabled !== false,
                order: i,
                // For blog items, persist only the ref — the catalog owns title/image.
                items: s.items.map((it, j) =>
                    s.kind === 'blog'
                        ? { id: it.blogId || it.id, blogId: it.blogId || it.id, order: j }
                        : { ...it, order: j }
                )
            }));
            const { data } = await updateSections(payload);
            setSections(data.sections || []);
            setToast({ type: 'success', message: 'Sections saved' });
        } catch {
            setToast({ type: 'error', message: 'Save failed' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="admin-loading">Loading…</div>;

    return (
        <>
            <AdminPageHeader
                title="Landing Sections"
                subtitle="Every block that renders on the salescode.ai landing page — images, videos and cards — managed together. Drag sections to reorder them as they should appear on the page."
            >
                {/* <button className="btn-secondary" onClick={addSection}>+ Add section</button> */}
                <button className="btn-primary" onClick={save} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </AdminPageHeader>

            {sections.length === 0 ? (
                <div className="admin-empty">
                    No sections yet. Click <strong>+ Add section</strong> to create one, or run{' '}
                    <code style={{ fontFamily: 'var(--font-mono)' }}>npm run seed:site</code> to populate defaults.
                </div>
            ) : (
                <SortableList
                    items={sections}
                    getId={(s) => s.id}
                    onReorder={reorderSections}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {sections.map((section, sIdx) => (
                            <div
                                key={section.id}
                                style={{ opacity: section.enabled === false ? 0.55 : 1 }}
                            >
                                <SortableRow id={section.id}>
                                    {({ attributes, listeners }) => (
                                        <SectionCard
                                            section={section}
                                            sIdx={sIdx}
                                            accent={SECTION_ACCENT}
                                            expandedItems={expandedItems}
                                            toggleExpanded={toggleExpanded}
                                            updateSection={updateSection}
                                            updateItem={updateItem}
                                            removeItem={removeItem}
                                            reorderItems={reorderItems}
                                            addItem={addItem}
                                            openBlogPicker={openBlogPicker}
                                            removeSection={removeSection}
                                            justUploadedId={justUploadedId}
                                            onError={onError}
                                            dragHandle={<DragHandle attributes={attributes} listeners={listeners} />}
                                        />
                                    )}
                                </SortableRow>
                                {blogPickerIdx === sIdx && (
                                    <div className="admin-item-card" style={{ marginTop: 8 }}>
                                        <div className="admin-item-card-head" style={{ marginBottom: 10 }}>
                                            <div className="admin-item-title">Choose a blog to feature</div>
                                            <button type="button" className="btn-remove" onClick={closeBlogPicker}>
                                                Close
                                            </button>
                                        </div>
                                        {pickerOptions.length === 0 ? (
                                            <div className="admin-empty" style={{ padding: 18 }}>
                                                No more enabled blogs available — add one under Pages → Blog,
                                                or enable an existing one.
                                            </div>
                                        ) : (
                                            <div className="admin-list is-grid">
                                                {pickerOptions.map((b) => (
                                                    <div key={b.id} className="admin-item-card is-compact" style={{ background: 'var(--bg-elevated)' }}>
                                                        <div className="admin-item-card-head">
                                                            {b.image ? (
                                                                <img src={b.image} alt="" className="admin-item-thumb-sm" />
                                                            ) : (
                                                                <div className="admin-item-thumb-sm" />
                                                            )}
                                                            <div className="admin-item-title">
                                                                {b.title || <span className="admin-item-title-placeholder">Untitled blog</span>}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="btn-primary"
                                                                onClick={() => addBlogItem(sIdx, b)}
                                                            >
                                                                Add
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </SortableList>
            )}

            <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
        </>
    );
}
