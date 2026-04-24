import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProduct, updateProduct, updateProductSidebar } from '../../api/site';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSection from '../../components/admin/AdminSection';
import Toast from '../../components/admin/Toast';
import FileUploadButton from '../../components/admin/FileUploadButton';
import SortableList, { SortableRow, DragHandle } from '../../components/admin/SortableList';
import '../../components/admin/adminShared.css';

const CATEGORIES = [
    { id: 'applications', label: 'Applications' },
    { id: 'ai-agents', label: 'AI Agents' },
    { id: 'plugins', label: 'Plugins' },
    { id: 'integrations', label: '3rd Party Integrations' }
];

const blank = () => ({
    id: `side-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: '',
    route: '',
    icon: '',
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

export default function ProductDetailPage() {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [details, setDetails] = useState({ name: '', description: '', image: '', category: 'applications' });
    const [items, setItems] = useState([]);
    const [showRoute, setShowRoute] = useState(() => new Set());
    const [expanded, setExpanded] = useState(() => new Set());
    const [loading, setLoading] = useState(true);
    const [savingDetails, setSavingDetails] = useState(false);
    const [savingSidebar, setSavingSidebar] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await getProduct(productId);
                setProduct(data.product);
                setDetails({
                    name: data.product?.name || '',
                    description: data.product?.description || '',
                    image: data.product?.image || '',
                    category: data.product?.category || 'applications'
                });
                setItems(data.product?.sidebar || []);
            } catch (e) {
                setToast({ type: 'error', message: e?.response?.data?.error || 'Failed to load' });
            } finally {
                setLoading(false);
            }
        })();
    }, [productId]);

    const saveDetails = async () => {
        setSavingDetails(true);
        try {
            const { data } = await updateProduct(productId, {
                name: details.name,
                description: details.description,
                image: details.image,
                category: details.category
            });
            setProduct(data.product);
            setToast({ type: 'success', message: 'Product details saved' });
        } catch (e) {
            setToast({ type: 'error', message: e?.response?.data?.error || 'Save failed' });
        } finally {
            setSavingDetails(false);
        }
    };

    const update = (idx, patch) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    const remove = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
    const add = () => {
        const item = blank();
        setItems((prev) => [...prev, item]);
        setExpanded((prev) => new Set(prev).add(item.id));
    };

    const toggleExpanded = (id) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleRoute = (id) => {
        setShowRoute((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const saveSidebar = async () => {
        setSavingSidebar(true);
        try {
            const payload = items.map((it, i) => ({ ...it, order: i }));
            await updateProductSidebar(productId, payload);
            setToast({ type: 'success', message: 'Sidebar saved' });
        } catch {
            setToast({ type: 'error', message: 'Save failed' });
        } finally {
            setSavingSidebar(false);
        }
    };

    if (loading) return <div className="admin-loading">Loading…</div>;
    if (!product) return <div className="admin-empty">Product not found.</div>;

    return (
        <>
            <AdminPageHeader
                title={details.name || product.productId}
                subtitle="Edit the product details below. The sidebar section configures the menu items shown inside the product's page."
            >
                <Link to="/products" className="btn-secondary">← All products</Link>
            </AdminPageHeader>

            <AdminSection
                title="Product details"
                collapsible={false}
                accent="indigo"
                actions={
                    <button className="btn-primary" onClick={saveDetails} disabled={savingDetails}>
                        {savingDetails ? 'Saving…' : 'Save details'}
                    </button>
                }
            >
                <div className="product-details-grid">
                    <div className="product-details-media">
                        {details.image ? (
                            <img src={details.image} alt="" className="product-details-thumb" />
                        ) : (
                            <div className="product-details-thumb is-empty">No image</div>
                        )}
                        <div className="product-details-media-actions">
                            <FileUploadButton
                                label={details.image ? 'Replace' : 'Upload'}
                                accept="image/*"
                                onUploaded={(url) => setDetails({ ...details, image: url })}
                                onError={(msg) => setToast({ type: 'error', message: msg })}
                            />
                            {details.image && (
                                <button
                                    type="button"
                                    className="btn-remove"
                                    onClick={() => setDetails({ ...details, image: '' })}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="product-details-fields">
                        <div className="admin-field">
                            <label>Title</label>
                            <input
                                value={details.name}
                                onChange={(e) => setDetails({ ...details, name: e.target.value })}
                                placeholder="e.g. NextGen SFA"
                            />
                        </div>

                        <div className="admin-field">
                            <label>Description</label>
                            <textarea
                                value={details.description}
                                onChange={(e) => setDetails({ ...details, description: e.target.value })}
                                placeholder="Short line shown under the title on the card"
                            />
                        </div>

                        <div className="admin-field">
                            <label>Category</label>
                            <select
                                value={details.category}
                                onChange={(e) => setDetails({ ...details, category: e.target.value })}
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </AdminSection>

            <AdminSection
                title="Sidebar"
                collapsible={false}
                accent="purple"
                description="Menu items shown inside this product's page. Drag to reorder."
                badge={items.length ? `${items.length} ${items.length === 1 ? 'item' : 'items'}` : null}
                actions={
                    <>
                        <button className="btn-secondary" onClick={add}>+ Add item</button>
                        <button className="btn-primary" onClick={saveSidebar} disabled={savingSidebar}>
                            {savingSidebar ? 'Saving…' : 'Save sidebar'}
                        </button>
                    </>
                }
            >
                {items.length === 0 ? (
                    <div className="admin-empty">No sidebar items yet. Add one to start building the product menu.</div>
                ) : (
                    <SortableList items={items} getId={(i) => i.id} onReorder={setItems}>
                        <div className="admin-list">
                            {items.map((item, idx) => {
                                const isOpen = expanded.has(item.id);
                                return (
                                    <SortableRow key={item.id} id={item.id}>
                                        {({ attributes, listeners }) => (
                                            <div className={`admin-item-card is-compact ${isOpen ? 'is-expanded' : ''} ${!item.enabled ? 'is-disabled' : ''}`}>
                                                <div className="admin-item-card-head">
                                                    <DragHandle attributes={attributes} listeners={listeners} />
                                                    <div className="admin-item-title">
                                                        {item.label || <span className="admin-item-title-placeholder">Untitled item</span>}
                                                    </div>
                                                    <label className="admin-toggle" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={item.enabled}
                                                            onChange={(e) => update(idx, { enabled: e.target.checked })}
                                                        />
                                                        <span className="admin-toggle-track">
                                                            <span className="admin-toggle-thumb" />
                                                        </span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        className={`admin-item-edit-btn ${isOpen ? 'is-active' : ''}`}
                                                        onClick={() => toggleExpanded(item.id)}
                                                    >
                                                        <Caret />
                                                        {isOpen ? 'Close' : 'Edit'}
                                                    </button>
                                                    <button type="button" className="btn-remove" onClick={() => remove(idx)}>Remove</button>
                                                </div>

                                                {isOpen && (
                                                    <div className="admin-item-expanded">
                                                        <div className="admin-field-row">
                                                            <div className="admin-field">
                                                                <label>Label</label>
                                                                <input value={item.label} onChange={(e) => update(idx, { label: e.target.value })} placeholder="e.g. Overview" />
                                                            </div>
                                                            <div className="admin-field">
                                                                <label>Icon <span className="hint">name or URL (optional)</span></label>
                                                                <input value={item.icon} onChange={(e) => update(idx, { icon: e.target.value })} placeholder="e.g. dashboard" />
                                                            </div>
                                                        </div>

                                                        <div className="admin-field">
                                                            <label className="admin-field-inline">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={showRoute.has(item.id)}
                                                                    onChange={() => toggleRoute(item.id)}
                                                                />
                                                                <span>Customize route</span>
                                                            </label>
                                                            {showRoute.has(item.id) && (
                                                                <input
                                                                    value={item.route}
                                                                    onChange={(e) => update(idx, { route: e.target.value })}
                                                                    placeholder={`/products/${productId}/overview`}
                                                                />
                                                            )}
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

            <Toast
                message={toast?.message}
                type={toast?.type}
                onClose={() => setToast(null)}
            />
        </>
    );
}
