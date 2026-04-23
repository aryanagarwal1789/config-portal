import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PublicConfigForm from '../components/PublicConfigForm';
import Toast from '../components/Toast';
import { getPublicConfig, updatePublicConfig, getProducts, updateProducts } from '../api/experiencePortal';
import './ExperiencePortal.css';

const TABS = [
    {
        id: 'navbar',
        label: 'Topbar',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
        ),
        hint: 'Configure pages, sections and per-page SEO'
    },
    {
        id: 'products',
        label: 'Products',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
        ),
        hint: 'Show or hide products and configure each one'
    }
];

const TAB_IDS = TABS.map((t) => t.id);

export default function ExperiencePortal() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = Math.max(0, TAB_IDS.indexOf(searchParams.get('tab')));
    const [activeTab, setActiveTab] = useState(initialTab);

    const selectTab = (i) => {
        setActiveTab(i);
        setSearchParams({ tab: TAB_IDS[i] }, { replace: true });
    };
    const [publicConfig, setPublicConfig] = useState(null);
    const [products, setProducts] = useState([]);
    const [saving, setSaving] = useState(false);
    const [savingProducts, setSavingProducts] = useState(false);
    const [savedProducts, setSavedProducts] = useState([]);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type });

    const loadAll = useCallback(async () => {
        try {
            const [pcRes, prodRes] = await Promise.all([getPublicConfig(), getProducts()]);
            setPublicConfig(pcRes.data.publicConfig);
            setProducts(prodRes.data.products);
            setSavedProducts(prodRes.data.products);
        } catch {
            showToast('Failed to load configuration', 'error');
        }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    const handleSavePublicConfig = async (data) => {
        setSaving(true);
        try {
            const res = await updatePublicConfig(data);
            setPublicConfig(res.data.publicConfig);
            showToast('Navbar saved successfully');
        } catch {
            showToast('Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleProduct = (productId, isVisible) => {
        setProducts((prev) => prev.map((p) => p.productId === productId ? { ...p, isVisible } : p));
    };

    const handleSaveProducts = async () => {
        setSavingProducts(true);
        try {
            await updateProducts(products.map((p) => ({ productId: p.productId, isVisible: p.isVisible })));
            setSavedProducts(products);
            showToast('Products saved successfully');
        } catch {
            showToast('Failed to save products', 'error');
        } finally {
            setSavingProducts(false);
        }
    };

    const productsHaveChanges = products.some((p) => {
        const saved = savedProducts.find((s) => s.productId === p.productId);
        return saved && saved.isVisible !== p.isVisible;
    });

    const pages = publicConfig?.navbar?.pages ?? [];
    const visiblePages = pages.filter((p) => p.isVisible).length;
    const totalSections = pages.reduce((acc, p) => acc + (p.sections?.length ?? 0), 0);
    const visibleCount = products.filter((p) => p.isVisible).length;

    return (
        <div className="ep-page">
            <button className="back-btn" onClick={() => navigate('/')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back
            </button>

            {/* ── Hero Header ── */}
            <div className="ep-hero-card">
                <div className="ep-hero-top">
                    <div className="ep-header-text">
                        <div className="ep-breadcrumb">
                            <span>Config Portal</span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"/>
                            </svg>
                            <span>Experience Portal</span>
                        </div>
                        <h1 className="ep-title">Experience Portal</h1>
                        <p className="ep-subtitle">Manage your portal's navigation and products</p>
                    </div>
                </div>

                <div className="ep-stats-strip">
                    {publicConfig && (
                    <div className="ep-stat-chip">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <line x1="3" y1="12" x2="21" y2="12"/>
                            <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                        {pages.length} pages · {visiblePages} visible
                    </div>
                    )}
                    {/* {totalSections > 0 && (
                        <div className="ep-stat-chip">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                            </svg>
                            {totalSections} sections total
                        </div>
                    )} */}
                    {products.length > 0 && (
                        <div className="ep-stat-chip">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2"/>
                                <line x1="8" y1="21" x2="16" y2="21"/>
                                <line x1="12" y1="17" x2="12" y2="21"/>
                            </svg>
                            {visibleCount}/{products.length} products active
                        </div>
                    )}
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="tabs-container">
                <div className="tabs">
                    {TABS.map((tab, i) => (
                        <button
                            key={tab.id}
                            className={`tab ${activeTab === i ? 'tab-active' : ''}`}
                            onClick={() => selectTab(i)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    ))}
                </div>
                <p className="tab-hint">{TABS[activeTab].hint}</p>
            </div>

            <div className="tab-content">
                {activeTab === 0 && (
                    <PublicConfigForm
                        initialData={publicConfig}
                        onSave={handleSavePublicConfig}
                        loading={saving}
                        allProducts={savedProducts}
                    />
                )}
                {activeTab === 1 && (
                    <div className="products-section">
                        <div className="products-header">
                            <div>
                                <h3 className="products-title">
                                    <span className="products-title-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="3" width="20" height="14" rx="2"/>
                                            <line x1="8" y1="21" x2="16" y2="21"/>
                                            <line x1="12" y1="17" x2="12" y2="21"/>
                                        </svg>
                                    </span>
                                    Products
                                </h3>
                                <p className="products-hint">
                                    Turn products on or off to control what users see. Click <strong>Configure</strong> to set up a product's sidebar.
                                </p>
                            </div>
                            {products.length > 0 && (
                                <div className="products-count-badge">{visibleCount} of {products.length} visible</div>
                            )}
                        </div>
                        <div className="products-list">
                            {products.length === 0 && (
                                <div className="products-empty">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                                        <line x1="8" y1="21" x2="16" y2="21"/>
                                        <line x1="12" y1="17" x2="12" y2="21"/>
                                    </svg>
                                    <span>No products found</span>
                                </div>
                            )}
                            {products.map((product) => (
                                <div key={product.productId} className={`product-row ${product.isVisible ? '' : 'product-hidden'}`}>
                                    <div className="product-row-left">
                                        <div className="product-avatar">
                                            {product.productName?.[0]?.toUpperCase() ?? 'P'}
                                        </div>
                                        <div>
                                            <div className="product-name">{product.productName}</div>
                                            <div className="product-status">
                                                {product.isVisible
                                                    ? <span className="status-on">Visible to users</span>
                                                    : <span className="status-off">Hidden from users</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="product-row-right">
                                        <label className="switch">
                                            <input type="checkbox" checked={product.isVisible} onChange={(e) => handleToggleProduct(product.productId, e.target.checked)} />
                                            <span className="slider" />
                                        </label>
                                        <button className="btn-configure" onClick={() => navigate(`/experiencePortal/products/${product.productId}`)}>
                                            Configure
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12"/>
                                                <polyline points="12 5 19 12 12 19"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {products.length > 0 && (
                            <div className="products-save-row">
                                {productsHaveChanges && (
                                    <span className="products-unsaved-hint">You have unsaved changes</span>
                                )}
                                <button
                                    className="btn-save"
                                    onClick={handleSaveProducts}
                                    disabled={savingProducts || !productsHaveChanges}
                                >
                                    {savingProducts ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
