import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PublicConfigForm from '../components/PublicConfigForm';
import SidebarConfigForm from '../components/SidebarConfigForm';
import Toast from '../components/Toast';
import { getPortalConfig, updatePortalNavbar, updatePortalSidebar } from '../api/portal';
import './GenericPortal.css';

const TABS = [
    {
        id: 'navbar',
        label: 'Navbar',
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
        id: 'sidebar',
        label: 'Sidebar',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
        ),
        hint: 'Configure the sidebar menu items and their visibility'
    }
];

export default function GenericPortal() {
    const { portalId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [publicConfig, setPublicConfig] = useState(null);
    const [sidebar, setSidebar] = useState(null);
    const [savingNavbar, setSavingNavbar] = useState(false);
    const [savingSidebar, setSavingSidebar] = useState(false);
    const [toast, setToast] = useState(null);

    const portalName = portalId
        ? portalId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : '';

    const showToast = (message, type = 'success') => setToast({ message, type });

    const loadData = useCallback(async () => {
        try {
            const res = await getPortalConfig(portalId);
            setPublicConfig(res.data.publicConfig);
            setSidebar(res.data.sidebar);
        } catch {
            showToast('Failed to load configuration', 'error');
        }
    }, [portalId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSaveNavbar = async (data) => {
        setSavingNavbar(true);
        try {
            const res = await updatePortalNavbar(portalId, data);
            setPublicConfig(res.data.publicConfig);
            showToast('Navbar saved successfully');
        } catch {
            showToast('Failed to save navbar', 'error');
        } finally {
            setSavingNavbar(false);
        }
    };

    const handleSaveSidebar = async (data) => {
        setSavingSidebar(true);
        try {
            const res = await updatePortalSidebar(portalId, data.sidebar);
            setSidebar(res.data.sidebar);
            showToast('Sidebar saved successfully');
        } catch {
            showToast('Failed to save sidebar', 'error');
        } finally {
            setSavingSidebar(false);
        }
    };

    const pages = publicConfig?.navbar?.pages ?? [];
    const visiblePages = pages.filter((p) => p.isVisible).length;
    const sidebarItems = sidebar?.items ?? [];
    const visibleSidebarItems = sidebarItems.filter((i) => i.isVisible).length;

    return (
        <div className="gp-page">
            <button className="back-btn" onClick={() => navigate('/')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back
            </button>

            <div className="gp-hero-card">
                <div className="gp-hero-top">
                    <div className="gp-header-text">
                        <div className="gp-breadcrumb">
                            <span>Config Portal</span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"/>
                            </svg>
                            <span>{portalName}</span>
                        </div>
                        <h1 className="gp-title">{portalName}</h1>
                        <p className="gp-subtitle">Manage your portal's navigation, sidebar and SEO</p>
                    </div>
                </div>

                <div className="gp-stats-strip">
                    {publicConfig && (
                        <div className="gp-stat-chip">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="6" x2="21" y2="6"/>
                                <line x1="3" y1="12" x2="21" y2="12"/>
                                <line x1="3" y1="18" x2="21" y2="18"/>
                            </svg>
                            {pages.length} pages · {visiblePages} visible
                        </div>
                    )}
                    {sidebar && (
                        <div className="gp-stat-chip">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                <line x1="9" y1="3" x2="9" y2="21"/>
                            </svg>
                            {sidebarItems.length} sidebar items · {visibleSidebarItems} visible
                        </div>
                    )}
                </div>
            </div>

            <div className="tabs-container">
                <div className="tabs">
                    {TABS.map((tab, i) => (
                        <button
                            key={tab.id}
                            className={`tab ${activeTab === i ? 'tab-active' : ''}`}
                            onClick={() => setActiveTab(i)}
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
                        onSave={handleSaveNavbar}
                        loading={savingNavbar}
                    />
                )}
                {activeTab === 1 && (
                    <SidebarConfigForm
                        initialData={sidebar ? { sidebar } : null}
                        onSave={handleSaveSidebar}
                        loading={savingSidebar}
                    />
                )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
