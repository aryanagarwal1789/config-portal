import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProducts, updateProduct } from '../../api/site';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Toast from '../../components/admin/Toast';
import '../../components/admin/adminShared.css';

const CATEGORIES = [
    { id: 'applications', label: 'Applications' },
    { id: 'ai-agents', label: 'AI Agents' },
    { id: 'plugins', label: 'Plugins' },
    { id: 'integrations', label: '3rd Party Integrations' }
];

export default function ProductsListPage() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

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

    const toggleEnabled = async (p) => {
        const nextEnabled = !p.enabled;
        setProducts((prev) =>
            prev.map((x) => (x.productId === p.productId ? { ...x, enabled: nextEnabled } : x))
        );
        try {
            await updateProduct(p.productId, { enabled: nextEnabled });
        } catch {
            setProducts((prev) =>
                prev.map((x) => (x.productId === p.productId ? { ...x, enabled: p.enabled } : x))
            );
            setToast({ type: 'error', message: 'Update failed' });
        }
    };

    if (loading) return <div className="admin-loading">Loading…</div>;

    return (
        <>
            <AdminPageHeader
                title="Products"
                subtitle="All products defined in the backend, grouped by category. Toggle visibility here, click Edit to configure details and sidebar."
            />

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
