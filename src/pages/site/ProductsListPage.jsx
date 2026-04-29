import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listProducts, updateProduct } from '../../api/site';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Toast from '../../components/admin/Toast';
import FileUploadButton from '../../components/admin/FileUploadButton';
import VisualEditorLayout from '../../components/admin/VisualEditorLayout';
import '../../components/admin/adminShared.css';

const PREVIEW_URL = import.meta.env.VITE_PREVIEW_URL ?? 'http://localhost:3000';

const CATEGORIES = [
    { id: 'applications', label: 'Applications' },
    { id: 'ai-agents',    label: 'AI Agents' },
    { id: 'plugins',      label: 'Plugins' },
    { id: 'integrations', label: '3rd Party Integrations' },
];

export default function ProductsListPage() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const isEditMode = pathname.endsWith('/edit');

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [activeProductId, setActiveProductId] = useState(null);
    const [sidebarDetails, setSidebarDetails] = useState(null);
    const [sidebarSaving, setSidebarSaving] = useState(false);

    const iframeRef    = useRef(null);
    const previewReady = useRef(false);
    const currentProducts = useRef([]);

    useEffect(() => { currentProducts.current = products; }, [products]);

    useEffect(() => {
        if (!isEditMode) return;
        function onMessage(event) {
            if (event.data?.type === 'PREVIEW_READY') {
                previewReady.current = true;
                iframeRef.current?.contentWindow?.postMessage({ type: 'PRODUCTS_UPDATE', products: currentProducts.current }, '*');
            }
            if (event.data?.type === 'FIELD_CLICK' && event.data?.sectionId === 'products') {
                setActiveProductId(event.data.productId ?? null);
            }
        }
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!isEditMode || !previewReady.current) return;
        iframeRef.current?.contentWindow?.postMessage({ type: 'PRODUCTS_UPDATE', products }, '*');
    }, [products, isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        (async () => {
            try {
                const { data } = await listProducts();
                setProducts(data.products || []);
            } catch {
                setToast({ type: 'error', message: 'Failed to load products' });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const grouped = useMemo(() => {
        const bucket = Object.fromEntries(CATEGORIES.map((c) => [c.id, []]));
        for (const p of products) {
            const key = bucket[p.category] ? p.category : 'applications';
            bucket[key].push(p);
        }
        for (const key of Object.keys(bucket)) {
            bucket[key].sort((a, b) => a.order - b.order);
        }
        return bucket;
    }, [products]);

    // Sync editable fields whenever the selected product changes.
    useEffect(() => {
        if (!activeProductId) { setSidebarDetails(null); return; }
        const prod = products.find(p => p.productId === activeProductId);
        if (prod) setSidebarDetails({
            name:          prod.name          || '',
            description:   prod.description   || '',
            image:         prod.image         || '',
            category:      prod.category      || 'applications',
            highlight:     prod.highlight     || '',
            status:        prod.status        || '',
            timelineStage: prod.timelineStage || '',
            liveDate:      prod.liveDate      || '',
            enabled:       prod.enabled,
        });
    }, [activeProductId]); // eslint-disable-line react-hooks/exhaustive-deps

    function updateSidebarDetail(patch) {
        setSidebarDetails(prev => {
            const next = { ...prev, ...patch };
            if (isEditMode && previewReady.current) {
                const updated = products.map(p => p.productId === activeProductId ? { ...p, ...next } : p);
                iframeRef.current?.contentWindow?.postMessage({ type: 'PRODUCTS_UPDATE', products: updated }, '*');
            }
            return next;
        });
    }

    async function saveSidebarProduct() {
        if (!activeProductId || !sidebarDetails) return;
        setSidebarSaving(true);
        try {
            await updateProduct(activeProductId, sidebarDetails);
            setProducts(prev => prev.map(p => p.productId === activeProductId ? { ...p, ...sidebarDetails } : p));
            setToast({ type: 'success', message: 'Product saved' });
        } catch {
            setToast({ type: 'error', message: 'Save failed' });
        } finally {
            setSidebarSaving(false);
        }
    }

    const toggleEnabled = async (p) => {
        const nextEnabled = !p.enabled;
        const next = products.map((x) => (x.productId === p.productId ? { ...x, enabled: nextEnabled } : x));
        setProducts(next);
        try {
            await updateProduct(p.productId, { enabled: nextEnabled });
        } catch {
            setProducts(products);
            setToast({ type: 'error', message: 'Update failed' });
        }
    };

    if (loading) return <div className="admin-loading">Loading…</div>;

    const productsSidebar = (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="preview-sidebar-header">
                <p className="preview-sidebar-title">
                    {sidebarDetails ? sidebarDetails.name || activeProductId : 'Products Editor'}
                </p>
                <p className="preview-sidebar-hint">
                    {sidebarDetails
                        ? 'Changes update live in the preview'
                        : 'Click any product card in the preview to edit it'}
                </p>
            </div>
            {sidebarDetails && (
                <div className="preview-sidebar-fields">
                    <div className="form-group">
                        <label>Icon / Image</label>
                        {sidebarDetails.image && (
                            <div style={{ width: 56, height: 56, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, marginBottom: 8 }}>
                                <img src={sidebarDetails.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <FileUploadButton
                                label={sidebarDetails.image ? 'Replace' : 'Upload'}
                                accept="image/*"
                                onUploaded={url => updateSidebarDetail({ image: url })}
                                onError={msg => setToast({ type: 'error', message: msg })}
                            />
                            {sidebarDetails.image && (
                                <button type="button" className="btn-remove" onClick={() => updateSidebarDetail({ image: '' })}>Clear</button>
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            value={sidebarDetails.name}
                            onChange={e => updateSidebarDetail({ name: e.target.value })}
                            placeholder="e.g. NextGen SFA"
                        />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            rows={2}
                            value={sidebarDetails.description}
                            onChange={e => updateSidebarDetail({ description: e.target.value })}
                            placeholder="Short line shown under the title"
                        />
                    </div>
                    <div className="form-group">
                        <label>Highlight badge</label>
                        <input
                            value={sidebarDetails.highlight}
                            onChange={e => updateSidebarDetail({ highlight: e.target.value })}
                            placeholder="e.g. 5-18% Sales Uplift"
                        />
                    </div>
                    <div className="form-group">
                        <label>Status badge</label>
                        <select
                            value={sidebarDetails.status}
                            onChange={e => updateSidebarDetail({ status: e.target.value })}
                        >
                            <option value="">None</option>
                            <option value="live">Live</option>
                            <option value="beta">Beta</option>
                            <option value="upcoming">Coming Soon</option>
                        </select>
                    </div>
                    {(sidebarDetails.status === 'beta' || sidebarDetails.status === 'upcoming') && (
                        <>
                            <div className="form-group">
                                <label>Timeline stage</label>
                                <select
                                    value={sidebarDetails.timelineStage}
                                    onChange={e => updateSidebarDetail({ timelineStage: e.target.value })}
                                >
                                    <option value="">— Select stage —</option>
                                    <option value="planning">Planning</option>
                                    <option value="in-development">In Development</option>
                                    <option value="uat">UAT</option>
                                    <option value="beta">Beta</option>
                                    <option value="live">Live</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Expected live date</label>
                                <input
                                    value={sidebarDetails.liveDate}
                                    onChange={e => updateSidebarDetail({ liveDate: e.target.value })}
                                    placeholder="e.g. JUN 2026"
                                />
                            </div>
                        </>
                    )}
                    <div className="form-group">
                        <label>Category</label>
                        <select
                            value={sidebarDetails.category}
                            onChange={e => updateSidebarDetail({ category: e.target.value })}
                        >
                            {CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <label style={{ margin: 0 }}>Visible on site</label>
                        <label className="admin-toggle">
                            <input
                                type="checkbox"
                                checked={sidebarDetails.enabled}
                                onChange={e => updateSidebarDetail({ enabled: e.target.checked })}
                            />
                            <span className="admin-toggle-track">
                                <span className="admin-toggle-thumb" />
                            </span>
                        </label>
                    </div>
                    <button
                        type="button"
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={saveSidebarProduct}
                        disabled={sidebarSaving}
                    >
                        {sidebarSaving ? 'Saving…' : 'Save Product'}
                    </button>
                </div>
            )}
        </div>
    );

    if (isEditMode) {
        return (
            <>
                <VisualEditorLayout
                    title="Products"
                    backTo="/products"
                    iframeRef={iframeRef}
                    src={PREVIEW_URL}
                    sidebarContent={productsSidebar}
                />
                <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
            </>
        );
    }

    return (
        <>
            <AdminPageHeader
                title="Products"
                subtitle="All products defined in the backend, grouped by category. Toggle visibility here, click Edit to configure details and sidebar."
            >
                <button className="btn-secondary" onClick={() => navigate('/editor?p=/')}>Preview &amp; Edit</button>
            </AdminPageHeader>

            {products.length === 0 && (
                <div className="admin-empty">
                    No products found in the database.
                    <br />
                    Run <code style={{ fontFamily: 'var(--font-mono)' }}>npm run seed:site</code> in the backend to add the initial catalog.
                </div>
            )}

            <div className="products-categories">
                {CATEGORIES.map((cat) => {
                    const items = grouped[cat.id];
                    if (!items || items.length === 0) return null;
                    return (
                        <section key={cat.id}>
                            <div className="products-category-header">
                                <span className="products-category-bar" />
                                <span className="products-category-label">{cat.label}</span>
                            </div>
                            <div className="products-grid">
                                {items.map((p) => (
                                    <div
                                        key={p.productId}
                                        className={`product-card ${!p.enabled ? 'is-disabled' : ''}`}
                                    >
                                        {p.image ? (
                                            <img src={p.image} alt="" className="product-card-icon" />
                                        ) : (
                                            <div className="product-card-icon">
                                                {(p.name || p.productId).slice(0, 1).toUpperCase()}
                                            </div>
                                        )}

                                        <div className="product-card-body">
                                            <div className="product-card-name">{p.name || p.productId}</div>
                                            {p.description && (
                                                <div className="product-card-subtitle">{p.description}</div>
                                            )}
                                        </div>

                                        <div className="product-card-actions">
                                            <label
                                                className="admin-toggle"
                                                onClick={(e) => e.stopPropagation()}
                                                title={p.enabled ? 'Hide on site' : 'Show on site'}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={p.enabled}
                                                    onChange={() => toggleEnabled(p)}
                                                />
                                                <span className="admin-toggle-track">
                                                    <span className="admin-toggle-thumb" />
                                                </span>
                                            </label>
                                            <button
                                                type="button"
                                                className="product-card-edit"
                                                onClick={() => navigate(`/products/${p.productId}`)}
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>


            <Toast
                message={toast?.message}
                type={toast?.type}
                onClose={() => setToast(null)}
            />
        </>
    );
}
