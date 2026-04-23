import { useNavigate } from 'react-router-dom';
import './Home.css';

const PORTALS = [
    {
        id: 'experiencePortal',
        route: '/experiencePortal',
        name: 'Experience Portal',
        description: 'Manage navigation menus, SEO settings, and which products are visible to users.',
        color: 'blue',
        icon: (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
        ),
        badge: 'Active',
        tags: ['Navbar', 'SEO', 'Products']
    },
    // {
    //     id: 'admin-portal',
    //     route: '/portal/admin-portal',
    //     name: 'Admin Portal',
    //     description: "Configure the admin portal's navigation, sidebar menu and SEO metadata.",
    //     color: 'emerald',
    //     icon: (
    //         <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    //             <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    //         </svg>
    //     ),
    //     badge: 'Active',
    //     tags: ['Navbar', 'Sidebar', 'SEO']
    // },
    // {
    //     id: 'dealer-portal',
    //     route: '/portal/dealer-portal',
    //     name: 'Dealer Portal',
    //     description: "Configure the dealer portal's navigation, sidebar menu and SEO metadata.",
    //     color: 'amber',
    //     icon: (
    //         <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    //             <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    //             <polyline points="9 22 9 12 15 12 15 22"/>
    //         </svg>
    //     ),
    //     badge: 'Active',
    //     tags: ['Navbar', 'Sidebar', 'SEO']
    // }
];

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="home-page">
            <div className="home-inner">
                <div className="home-hero">
                    <div className="home-hero-icon">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
                        </svg>
                    </div>
                    <h1 className="home-title">Config Portal</h1>
                    <p className="home-subtitle">A simple way to manage your portal settings — no code needed.<br/>Pick a portal below to get started.</p>
                </div>

                <div className="home-section-label">Your Portals</div>

                <div className="portals-grid">
                    {PORTALS.map((portal) => (
                        <button
                            key={portal.id}
                            className={`portal-card portal-card--${portal.color}`}
                            onClick={() => navigate(portal.route)}
                        >
                            <div className="portal-card-header">
                                <div className="portal-icon-wrap">{portal.icon}</div>
                                {portal.badge && (
                                    <span className="portal-badge">{portal.badge}</span>
                                )}
                            </div>

                            <div className="portal-card-body">
                                <div>
                                    <h2 className="portal-name">{portal.name}</h2>
                                    <p className="portal-desc">{portal.description}</p>
                                </div>
                                <div className="portal-tags">
                                    {portal.tags.map((tag) => (
                                        <span key={tag} className="portal-tag">{tag}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="portal-cta-row">
                                <span className="portal-cta">
                                    Open Portal
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12"/>
                                        <polyline points="12 5 19 12 12 19"/>
                                    </svg>
                                </span>
                                <span className="portal-cta-arrow">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6"/>
                                    </svg>
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="home-help">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Changes you make here are reflected live on your portal.
                </div>
            </div>
        </div>
    );
}
