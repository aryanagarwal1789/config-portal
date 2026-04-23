import { useState, useEffect, useRef } from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    rectSortingStrategy,
    arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SEOFieldsForm from './SEOFieldsForm';
import { uploadAsset } from '../api/experiencePortal';
import './NavbarPagesConfig.css';

/* ── Vertical draggable page pill ── */
function SortablePagePill({ page, isSelected, onSelect, onToggle, onLabelChange }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });

    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`page-pill ${isSelected ? 'selected' : ''} ${!page.isVisible ? 'pill-disabled' : ''}`}
            onClick={() => onSelect(page.id)}
        >
            <span className="pill-drag" {...attributes} {...listeners} title="Drag to reorder" onClick={(e) => e.stopPropagation()}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="3.5" cy="2.5" r="1" fill="currentColor"/>
                    <circle cx="8.5" cy="2.5" r="1" fill="currentColor"/>
                    <circle cx="3.5" cy="6" r="1" fill="currentColor"/>
                    <circle cx="8.5" cy="6" r="1" fill="currentColor"/>
                    <circle cx="3.5" cy="9.5" r="1" fill="currentColor"/>
                    <circle cx="8.5" cy="9.5" r="1" fill="currentColor"/>
                </svg>
            </span>
            <input
                className="pill-label-input"
                value={page.label}
                onChange={(e) => onLabelChange(page.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Page name"
            />
            <label className="pill-toggle" title={page.isVisible ? 'Enabled' : 'Disabled'} onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={page.isVisible} onChange={(e) => onToggle(page.id, e.target.checked)} />
                <span className="pill-toggle-track"><span className="pill-toggle-thumb" /></span>
            </label>
        </div>
    );
}

/* ── Icons for subsection headers ── */
const ICON_CONTENT = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
);
const ICON_IMAGE = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
    </svg>
);
const ICON_VIDEO = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="15" height="14" rx="2"/>
        <path d="M17 10l5-3v10l-5-3z"/>
    </svg>
);
const ICON_ATTR = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 7v5l3 2"/>
    </svg>
);
const ICON_PRODUCT = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7l9-4 9 4v10l-9 4-9-4z"/>
        <path d="M3 7l9 4 9-4M12 11v10"/>
    </svg>
);

/* ── Reusable subsection shell (header + body) ── */
function Subsection({ type, icon, title, count, actions, children }) {
    return (
        <div className={`subsection-block type-${type}`}>
            <div className="subsection-head">
                <span className="subsection-icon">{icon}</span>
                <span className="subsection-title">{title}</span>
                {typeof count === 'number' && (
                    <span className="subsection-count">{count}</span>
                )}
                <span className="subsection-head-spacer" />
                {actions}
            </div>
            <div className="subsection-body">{children}</div>
        </div>
    );
}

/* ── Sortable media tile (image / video card inside MediaUploader grid) ── */
function SortableMediaItem({ id, url, index, kind, canReorder, onUrlEdit, onRemove }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : 'auto'
    };

    return (
        <div ref={setNodeRef} style={style} className="section-media-item">
            {canReorder && (
                <span
                    className="section-media-drag"
                    {...attributes}
                    {...listeners}
                    title="Drag to reorder"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="3.5" cy="2.5" r="1" fill="currentColor"/>
                        <circle cx="8.5" cy="2.5" r="1" fill="currentColor"/>
                        <circle cx="3.5" cy="6" r="1" fill="currentColor"/>
                        <circle cx="8.5" cy="6" r="1" fill="currentColor"/>
                        <circle cx="3.5" cy="9.5" r="1" fill="currentColor"/>
                        <circle cx="8.5" cy="9.5" r="1" fill="currentColor"/>
                    </svg>
                </span>
            )}
            {canReorder && <span className="section-media-seq">{index + 1}</span>}
            {kind === 'video' ? (
                <video src={url} className="section-media-thumb" muted />
            ) : (
                <img src={url} alt="" className="section-media-thumb" />
            )}
            <input
                className="section-media-url"
                value={url}
                onChange={(e) => onUrlEdit(e.target.value)}
                placeholder="https://..."
            />
            <button
                type="button"
                className="section-media-remove"
                onClick={onRemove}
                title="Remove"
            >
                ×
            </button>
        </div>
    );
}

/* ── Media uploader (images / videos) ── */
function MediaUploader({ kind, items, limit, onChange }) {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const mediaSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
    const atLimit = typeof limit === 'number' && items.length >= limit;
    const accept = kind === 'video' ? 'video/*' : 'image/*';
    const label = kind === 'video' ? 'Videos' : 'Images';
    const icon = kind === 'video' ? ICON_VIDEO : ICON_IMAGE;
    const type = kind === 'video' ? 'video' : 'image';

    const handlePick = () => {
        if (atLimit) return;
        setError(null);
        inputRef.current?.click();
    };

    const handleFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const remaining = typeof limit === 'number' ? Math.max(0, limit - items.length) : files.length;
        const toUpload = files.slice(0, remaining);
        setUploading(true);
        try {
            const uploaded = [];
            for (const file of toUpload) {
                const res = await uploadAsset(file);
                if (res?.data?.path) uploaded.push(res.data.path);
            }
            if (uploaded.length) onChange([...items, ...uploaded]);
        } catch {
            setError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const handleRemove = (idx) => onChange(items.filter((_, i) => i !== idx));

    const handleUrlEdit = (idx, value) =>
        onChange(items.map((url, i) => (i === idx ? value : url)));

    const itemIds = items.map((url, i) => `media-${i}-${url}`);

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIdx = itemIds.indexOf(active.id);
        const newIdx = itemIds.indexOf(over.id);
        if (oldIdx < 0 || newIdx < 0) return;
        onChange(arrayMove(items, oldIdx, newIdx));
    };

    const actions = (
        <>
            <button
                type="button"
                className="section-media-add"
                onClick={handlePick}
                disabled={atLimit || uploading}
            >
                {uploading ? 'Uploading…' : `+ Add ${kind === 'video' ? 'video' : 'image'}`}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple
                style={{ display: 'none' }}
                onChange={handleFiles}
            />
        </>
    );

    return (
        <Subsection type={type} icon={icon} title={label} count={items.length} actions={actions}>
            {error && <div className="section-media-error">{error}</div>}
            {items.length === 0 ? (
                <div className="subsection-empty">
                    <span className="subsection-empty-icon">{icon}</span>
                    No {label.toLowerCase()} yet
                </div>
            ) : (
                <DndContext
                    sensors={mediaSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={itemIds} strategy={rectSortingStrategy}>
                        <div className="section-media-grid">
                            {items.map((url, i) => (
                                <SortableMediaItem
                                    key={itemIds[i]}
                                    id={itemIds[i]}
                                    url={url}
                                    index={i}
                                    kind={kind}
                                    canReorder={items.length > 1}
                                    onUrlEdit={(v) => handleUrlEdit(i, v)}
                                    onRemove={() => handleRemove(i)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </Subsection>
    );
}

/* ── Attributes editor ── */
function AttributesEditor({ items, limit, onChange }) {
    const atLimit = typeof limit === 'number' && items.length >= limit;
    const inputRefs = useRef({});
    const [uploadingIdx, setUploadingIdx] = useState(null);

    const update = (idx, patch) =>
        onChange(items.map((a, i) => (i === idx ? { ...a, ...patch } : a)));

    const add = () => {
        if (atLimit) return;
        onChange([...items, { image: '', title: '', description: '', link: '', isVisible: true }]);
    };

    const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

    const pickImage = (idx) => inputRefs.current[idx]?.click();

    const handleFile = async (idx, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingIdx(idx);
        try {
            const res = await uploadAsset(file);
            if (res?.data?.path) update(idx, { image: res.data.path });
        } finally {
            setUploadingIdx(null);
            if (inputRefs.current[idx]) inputRefs.current[idx].value = '';
        }
    };

    const actions = (
        <button
            type="button"
            className="section-media-add"
            onClick={add}
            disabled={atLimit}
        >
            + Add attribute
        </button>
    );

    return (
        <Subsection type="attr" icon={ICON_ATTR} title="Attributes" count={items.length} actions={actions}>
            {items.length === 0 ? (
                <div className="subsection-empty">
                    <span className="subsection-empty-icon">{ICON_ATTR}</span>
                    No attributes yet
                </div>
            ) : (
                <div className="section-attrs-list">
                    {items.map((attr, i) => (
                        <div key={i} className={`section-attr-card ${attr.isVisible ? '' : 'attr-hidden'}`}>
                            <div className="section-attr-head">
                                <span className="section-attr-num">#{i + 1}</span>
                                <label className="pill-toggle" title={attr.isVisible ? 'Enabled' : 'Disabled'}>
                                    <input
                                        type="checkbox"
                                        checked={attr.isVisible}
                                        onChange={(e) => update(i, { isVisible: e.target.checked })}
                                    />
                                    <span className="pill-toggle-track"><span className="pill-toggle-thumb" /></span>
                                </label>
                                <button
                                    type="button"
                                    className="section-attr-remove"
                                    onClick={() => remove(i)}
                                >
                                    Remove
                                </button>
                            </div>
                            <div className="section-attr-grid">
                                <div className="section-attr-field">
                                    <label>Image</label>
                                    <div className="section-attr-image-row">
                                        {attr.image ? (
                                            <img src={attr.image} alt="" className="section-attr-thumb" />
                                        ) : (
                                            <div className="section-attr-thumb placeholder">IMG</div>
                                        )}
                                        <input
                                            value={attr.image ?? ''}
                                            onChange={(e) => update(i, { image: e.target.value })}
                                            placeholder="https://..."
                                        />
                                        <button
                                            type="button"
                                            className="section-media-add"
                                            onClick={() => pickImage(i)}
                                            disabled={uploadingIdx === i}
                                        >
                                            {uploadingIdx === i ? 'Uploading…' : 'Upload'}
                                        </button>
                                        <input
                                            ref={(el) => { inputRefs.current[i] = el; }}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleFile(i, e)}
                                        />
                                    </div>
                                </div>
                                <div className="section-attr-field">
                                    <label>Title</label>
                                    <input
                                        value={attr.title ?? ''}
                                        onChange={(e) => update(i, { title: e.target.value })}
                                        placeholder="Attribute title"
                                    />
                                </div>
                                <div className="section-attr-field">
                                    <label>Description</label>
                                    <textarea
                                        value={attr.description ?? ''}
                                        onChange={(e) => update(i, { description: e.target.value })}
                                        placeholder="Short description"
                                        rows={2}
                                    />
                                </div>
                                <div className="section-attr-field">
                                    <label>Link</label>
                                    <input
                                        value={attr.link ?? ''}
                                        onChange={(e) => update(i, { link: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Subsection>
    );
}

/* ── Products editor (opt-in: admin explicitly picks which products are featured) ── */
function ProductsEditor({ allProducts, entries, onChange }) {
    const inputRefs = useRef({});
    const [uploadingId, setUploadingId] = useState(null);

    const productsById = new Map(allProducts.map((p) => [p.productId, p]));
    const availableToAdd = allProducts.filter((p) => !entries.some((e) => e.productId === p.productId));

    const update = (productId, patch) => {
        onChange(entries.map((e) => (e.productId === productId ? { ...e, ...patch } : e)));
    };

    const add = (productId) => {
        if (!productId) return;
        if (entries.some((e) => e.productId === productId)) return;
        onChange([...entries, { productId, isVisible: true }]);
    };

    const remove = (productId) => {
        onChange(entries.filter((e) => e.productId !== productId));
    };

    const pickImage = (productId) => inputRefs.current[productId]?.click();

    const handleFile = async (productId, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingId(productId);
        try {
            const res = await uploadAsset(file);
            if (res?.data?.path) update(productId, { image: res.data.path });
        } finally {
            setUploadingId(null);
            if (inputRefs.current[productId]) inputRefs.current[productId].value = '';
        }
    };

    const handleAddChange = (e) => {
        add(e.target.value);
        e.target.value = '';
    };

    const actions = allProducts.length === 0 ? null : availableToAdd.length === 0 ? (
        <span className="section-products-hint">All added</span>
    ) : (
        <select
            className="section-products-picker"
            value=""
            onChange={handleAddChange}
        >
            <option value="" disabled>+ Add product…</option>
            {availableToAdd.map((p) => (
                <option key={p.productId} value={p.productId}>{p.productName}</option>
            ))}
        </select>
    );

    return (
        <Subsection type="product" icon={ICON_PRODUCT} title="Products" count={entries.length} actions={actions}>
            {allProducts.length === 0 && (
                <div className="subsection-empty">
                    <span className="subsection-empty-icon">{ICON_PRODUCT}</span>
                    No products configured yet. Add products in the Products tab first.
                </div>
            )}
            {entries.length === 0 && allProducts.length > 0 && (
                <div className="subsection-empty">
                    <span className="subsection-empty-icon">{ICON_PRODUCT}</span>
                    Pick products from the dropdown above to feature them here.
                </div>
            )}
            {entries.length > 0 && (
                <div className="section-attrs-list">
                    {entries.map((entry) => {
                        const product = productsById.get(entry.productId);
                        const displayName = product?.productName ?? entry.productId;
                        const isOrphan = !product;
                        return (
                            <div key={entry.productId} className={`section-attr-card ${entry.isVisible ? '' : 'attr-hidden'}`}>
                                <div className="section-attr-head">
                                    <span className="section-attr-num">
                                        {displayName}
                                        {isOrphan && <span className="section-products-orphan"> · product no longer exists</span>}
                                    </span>
                                    <label className="pill-toggle" title={entry.isVisible ? 'Shown in this section' : 'Hidden in this section'}>
                                        <input
                                            type="checkbox"
                                            checked={entry.isVisible}
                                            onChange={(e) => update(entry.productId, { isVisible: e.target.checked })}
                                        />
                                        <span className="pill-toggle-track"><span className="pill-toggle-thumb" /></span>
                                    </label>
                                    <button
                                        type="button"
                                        className="section-attr-remove"
                                        onClick={() => remove(entry.productId)}
                                    >
                                        Remove
                                    </button>
                                </div>
                                <div className="section-attr-grid">
                                    <div className="section-attr-field">
                                        <label>Image</label>
                                        <div className="section-attr-image-row">
                                            {entry.image ? (
                                                <img src={entry.image} alt="" className="section-attr-thumb" />
                                            ) : (
                                                <div className="section-attr-thumb placeholder">IMG</div>
                                            )}
                                            <input
                                                value={entry.image ?? ''}
                                                onChange={(e) => update(entry.productId, { image: e.target.value })}
                                                placeholder="https://..."
                                            />
                                            <button
                                                type="button"
                                                className="section-media-add"
                                                onClick={() => pickImage(entry.productId)}
                                                disabled={uploadingId === entry.productId}
                                            >
                                                {uploadingId === entry.productId ? 'Uploading…' : 'Upload'}
                                            </button>
                                            <input
                                                ref={(el) => { inputRefs.current[entry.productId] = el; }}
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={(e) => handleFile(entry.productId, e)}
                                            />
                                        </div>
                                    </div>
                                    <div className="section-attr-field">
                                        <label>Title</label>
                                        <input
                                            value={entry.title ?? ''}
                                            onChange={(e) => update(entry.productId, { title: e.target.value })}
                                            placeholder={displayName}
                                        />
                                    </div>
                                    <div className="section-attr-field">
                                        <label>Description</label>
                                        <textarea
                                            value={entry.description ?? ''}
                                            onChange={(e) => update(entry.productId, { description: e.target.value })}
                                            placeholder="Short description shown in this section"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Subsection>
    );
}

/* ── Vertical draggable section row ── */
function SortableSection({ section, allProducts, onToggle, onUpdate }) {
    const [open, setOpen] = useState(false);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 'auto', opacity: isDragging ? 0.4 : 1 };

    const hasTitle = 'title' in section;
    const hasDescription = 'description' in section;
    const hasImages = Array.isArray(section.images);
    const hasVideos = Array.isArray(section.videos);
    const hasAttributes = Array.isArray(section.attributes);
    const hasProducts = Array.isArray(section.products);

    return (
        <div ref={setNodeRef} style={style} className={`section-row-wrap ${!section.isVisible ? 'section-disabled' : ''}`}>
            <div className="section-row">
                <span className="section-drag" {...attributes} {...listeners} title="Drag to reorder">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="4" cy="3" r="1.2" fill="currentColor"/>
                        <circle cx="10" cy="3" r="1.2" fill="currentColor"/>
                        <circle cx="4" cy="7" r="1.2" fill="currentColor"/>
                        <circle cx="10" cy="7" r="1.2" fill="currentColor"/>
                        <circle cx="4" cy="11" r="1.2" fill="currentColor"/>
                        <circle cx="10" cy="11" r="1.2" fill="currentColor"/>
                    </svg>
                </span>
                <span className={`section-label ${!section.isVisible ? 'label-muted' : ''}`}>{section.label}</span>
                <button type="button" className={`section-expand-btn ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)} title="Edit section content">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <label className="toggle-switch">
                    <input type="checkbox" checked={section.isVisible} onChange={(e) => onToggle(section.id, e.target.checked)} />
                    <span className="toggle-track"><span className="toggle-thumb" /></span>
                </label>
            </div>
            {open && (
                <div className="section-meta-fields">
                    {(hasTitle || hasDescription) && (
                        <Subsection type="content" icon={ICON_CONTENT} title="Content">
                            {hasTitle && (
                                <div className="section-meta-field">
                                    <label>Title</label>
                                    <input
                                        value={section.title ?? ''}
                                        onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                                        placeholder={`e.g. ${section.label}`}
                                    />
                                </div>
                            )}
                            {hasDescription && (
                                <div className="section-meta-field">
                                    <label>Description</label>
                                    <textarea
                                        value={section.description ?? ''}
                                        onChange={(e) => onUpdate(section.id, { description: e.target.value })}
                                        placeholder={`Short description for the ${section.label} section`}
                                        rows={2}
                                    />
                                </div>
                            )}
                        </Subsection>
                    )}
                    {hasImages && (
                        <MediaUploader
                            kind="image"
                            items={section.images}
                            limit={section.imageLimit}
                            onChange={(images) => onUpdate(section.id, { images })}
                        />
                    )}
                    {hasVideos && (
                        <MediaUploader
                            kind="video"
                            items={section.videos}
                            limit={section.videoLimit}
                            onChange={(videos) => onUpdate(section.id, { videos })}
                        />
                    )}
                    {hasAttributes && (
                        <AttributesEditor
                            items={section.attributes}
                            limit={section.attributesLimit}
                            onChange={(attrs) => onUpdate(section.id, { attributes: attrs })}
                        />
                    )}
                    {hasProducts && (
                        <ProductsEditor
                            allProducts={allProducts}
                            entries={section.products}
                            onChange={(products) => onUpdate(section.id, { products })}
                        />
                    )}
                </div>
            )}
        </div>
    );
}


/* ── Main component ── */
export default function NavbarPagesConfig({ pages, onChange, allProducts = [] }) {
    const [selectedId, setSelectedId] = useState(pages?.[0]?.id ?? null);
    const [activeDragId, setActiveDragId] = useState(null);

    useEffect(() => {
        if (!selectedId && pages?.length) setSelectedId(pages[0].id);
    }, [pages]);

    const pageSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
    const sectionSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    const selectedPage = pages.find((p) => p.id === selectedId) ?? pages[0];

    const updatePage = (pageId, patch) =>
        onChange(pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p)));

    const handlePageDragEnd = ({ active, over }) => {
        setActiveDragId(null);
        if (!over || active.id === over.id) return;
        const oldIdx = pages.findIndex((p) => p.id === active.id);
        const newIdx = pages.findIndex((p) => p.id === over.id);
        onChange(arrayMove(pages, oldIdx, newIdx));
    };

    const handleSectionDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id || !selectedPage) return;
        const secs = selectedPage.sections;
        const oldIdx = secs.findIndex((s) => s.id === active.id);
        const newIdx = secs.findIndex((s) => s.id === over.id);
        updatePage(selectedPage.id, { sections: arrayMove(secs, oldIdx, newIdx) });
    };

    const handleSectionToggle = (sectionId, isVisible) => {
        updatePage(selectedPage.id, {
            sections: selectedPage.sections.map((s) => (s.id === sectionId ? { ...s, isVisible } : s))
        });
    };

    const handleSectionUpdate = (sectionId, patch) => {
        updatePage(selectedPage.id, {
            sections: selectedPage.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s))
        });
    };

    const activePage = pages.find((p) => p.id === activeDragId);

    return (
        <div className="navbar-pages-config">
            {/* ── Left: Page list ── */}
            <div>
                <div className="pages-strip-label">Topbar Pages</div>
                <DndContext
                    sensors={pageSensors}
                    collisionDetection={closestCenter}
                    onDragStart={({ active }) => setActiveDragId(active.id)}
                    onDragEnd={handlePageDragEnd}
                    onDragCancel={() => setActiveDragId(null)}
                >
                    <SortableContext items={pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                        <div className="pages-strip">
                            {pages.map((page) => (
                                <SortablePagePill
                                    key={page.id}
                                    page={page}
                                    isSelected={selectedId === page.id}
                                    onSelect={setSelectedId}
                                    onToggle={(pageId, isVisible) => updatePage(pageId, { isVisible })}
                                    onLabelChange={(pageId, label) => updatePage(pageId, { label })}
                                />
                            ))}
                        </div>
                    </SortableContext>
                    <DragOverlay>
                        {activePage && (
                            <div className="page-pill selected pill-overlay">
                                <span className="pill-label-input">{activePage.label}</span>
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* ── Right: Page detail panel ── */}
            {selectedPage && (
                <div className="sections-panel">
                    <div className="sections-header">
                        <div className="sections-header-left">
                            <span className="sections-label-badge">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                                    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                                </svg>
                                Sections
                            </span>
                            <span className="sections-page-context">for <strong>{selectedPage.label}</strong></span>
                        </div>
                        <span className="sections-hint">Drag to reorder · toggle to show/hide</span>
                    </div>

                    <DndContext sensors={sectionSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                        <SortableContext items={selectedPage.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                            <div className="sections-list">
                                {selectedPage.sections.length === 0 && (
                                    <div className="sections-empty">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                                            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                                        </svg>
                                        No sections for this page
                                    </div>
                                )}
                                {selectedPage.sections.map((section) => (
                                    <SortableSection
                                        key={section.id}
                                        section={section}
                                        allProducts={allProducts}
                                        onToggle={handleSectionToggle}
                                        onUpdate={handleSectionUpdate}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {/* Per-page SEO */}
                    <div className="page-seo-panel">
                        <div className="seo-panel-header">
                            <span className="seo-panel-title">
                                <span className="seo-panel-title-icon">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"/>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                    </svg>
                                </span>
                                SEO
                            </span>
                            <span className="seo-panel-hint">Search engine settings for this page</span>
                        </div>
                        <div className="seo-fields">
                            <SEOFieldsForm
                                seo={selectedPage.seo}
                                onChange={(seo) => updatePage(selectedPage.id, { seo })}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
