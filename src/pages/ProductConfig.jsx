import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarConfigForm from '../components/SidebarConfigForm';
import Toast from '../components/Toast';
import { getProductPublicConfig, updateProductPublicConfig } from '../api/experiencePortal';
import './ProductConfig.css';

export default function ProductConfig() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [publicConfig, setPublicConfig] = useState(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [productName, setProductName] = useState('');

    const showToast = (message, type = 'success') => setToast({ message, type });

    const loadData = useCallback(async () => {
        try {
            const res = await getProductPublicConfig(productId);
            setPublicConfig(res.data.publicConfig);
            const formatted = productId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            setProductName(formatted);
        } catch {
            showToast('Failed to load product configuration', 'error');
        }
    }, [productId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSaveSidebar = async (data) => {
        setSaving(true);
        try {
            const res = await updateProductPublicConfig(productId, data);
            setPublicConfig(res.data.publicConfig);
            showToast('Sidebar saved successfully');
        } catch {
            showToast('Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    };

    const items = publicConfig?.sidebar?.items ?? [];
    const enabledCount = items.filter((i) => i.isVisible).length;

    return (
        <div className="product-config-page">
            <button className="back-btn" onClick={() => navigate('/experiencePortal?tab=products')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back
            </button>

            <div className="pc-hero-card">
                <div className="pc-hero-top">
                    {productName && (
                        <div className="pc-product-avatar">
                            {productName[0].toUpperCase()}
                        </div>
                    )}
                    <div className="pc-header-text">
                        <div className="pc-breadcrumb">
                            <span>Config Portal</span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"/>
                            </svg>
                            <span>Experience Portal</span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"/>
                            </svg>
                            <span>Products</span>
                        </div>
                        <h1 className="pc-title">{productName || productId}</h1>
                        <p className="pc-subtitle">Configure the sidebar menu for this product</p>
                    </div>
                </div>

                {publicConfig && (
                    <div className="pc-stats-strip">
                        <div className="pc-stat-chip">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="6" x2="21" y2="6"/>
                                <line x1="3" y1="12" x2="15" y2="12"/>
                                <line x1="3" y1="18" x2="18" y2="18"/>
                            </svg>
                            {items.length} sidebar items
                        </div>
                        <div className="pc-stat-chip">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                            {enabledCount} enabled
                        </div>
                        {items.length - enabledCount > 0 && (
                            <div className="pc-stat-chip">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                                </svg>
                                {items.length - enabledCount} hidden
                            </div>
                        )}
                    </div>
                )}
            </div>

            <SidebarConfigForm initialData={publicConfig} onSave={handleSaveSidebar} loading={saving} />

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
        </div>
    );
}
