import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import salescodeLogo from '../assets/salescode-logo.png';
import './AdminLayout.css';

function Icon({ name }) {
    const common = {
        width: 18,
        height: 18,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
    };
    switch (name) {
        case 'content':
            return <svg {...common}><path d="M4 6h16M4 12h16M4 18h10"/></svg>;
        case 'images':
            return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>;
        case 'videos':
            return <svg {...common}><rect x="2" y="5" width="15" height="14" rx="2"/><path d="m17 9 5-3v12l-5-3z"/></svg>;
        case 'cards':
            return <svg {...common}><rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h6M7 16.5h6"/></svg>;
        case 'blogs':
            return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>;
        case 'seo':
            return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>;
        case 'pages':
            return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>;
        case 'products':
            return <svg {...common}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>;
        case 'landing':
            return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>;
        case 'sections':
            return <svg {...common}><rect x="3" y="3" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/></svg>;
        case 'chevron':
            return <svg {...common}><path d="m9 18 6-6-6-6"/></svg>;
        case 'preview':
            return <svg {...common}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>;
        case 'panel-collapse':
            return <svg {...common}><path d="m11 17-5-5 5-5"/><path d="m17 17-5-5 5-5"/></svg>;
        case 'panel-expand':
            return <svg {...common}><path d="m7 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/></svg>;
        default:
            return null;
    }
}

const NAV_ITEMS = [
    { to: '/editor',   label: 'Preview & Edit', icon: 'preview' },
    { to: '/landing',  label: 'Landing Page', icon: 'landing', section: 'Landing Page', children: [
        { to: '/content',  label: 'Content' },
        { to: '/sections', label: 'Sections' },
        { to: '/products', label: 'Products' }
    ] },
    { to: '/seo',      label: 'SEO',      icon: 'seo',     section: 'SEO', children: [
        { to: '/seo/landing',    label: 'Landing' },
        { to: '/seo/blog',       label: 'Blog' },
        { to: '/seo/contact-us', label: 'Contact Us' },
        { to: '/seo/client',     label: 'Client' },
        { to: '/seo/about-us',   label: 'About Us' }
    ] },
    { to: '/pages',    label: 'Other Pages',    icon: 'pages',   section: 'Pages', children: [
        { to: '/pages/blog',       label: 'Blog' },
        { to: '/pages/contact-us', label: 'Contact Us' },
        { to: '/pages/client',     label: 'Client' },
        { to: '/pages/about-us',   label: 'About Us' }
    ] }
];

function SidebarItem({ item, collapsed }) {
    const [open, setOpen] = useState(true);

    if (!item.children) {
        return (
            <NavLink to={item.to} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`} end={item.to === '/'}>
                <span className="admin-nav-icon"><Icon name={item.icon} /></span>
                {!collapsed && <span className="admin-nav-label">{item.label}</span>}
            </NavLink>
        );
    }

    return (
        <div className="admin-nav-group">
            <button
                type="button"
                className={`admin-nav-item admin-nav-parent ${open ? 'open' : ''}`}
                onClick={() => setOpen((v) => !v)}
            >
                <span className="admin-nav-icon"><Icon name={item.icon} /></span>
                {!collapsed && <span className="admin-nav-label">{item.label}</span>}
                {!collapsed && <span className="admin-nav-caret"><Icon name="chevron" /></span>}
            </button>
            {!collapsed && open && (
                <div className="admin-nav-children">
                    {item.children.map((child) => (
                        <NavLink
                            key={child.to}
                            to={child.to}
                            className={({ isActive }) => `admin-nav-child ${isActive ? 'active' : ''}`}
                        >
                            {child.label}
                        </NavLink>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    return (
        <div className={`admin-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    {!collapsed && <span className="admin-sidebar-title">Config Portal</span>}
                    <button
                        className="admin-sidebar-toggle"
                        onClick={() => setCollapsed((v) => !v)}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        aria-label="Toggle sidebar"
                    >
                        <Icon name={collapsed ? 'panel-expand' : 'panel-collapse'} />
                    </button>
                </div>
                <nav className="admin-sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <SidebarItem key={item.to} item={item} collapsed={collapsed} />
                    ))}
                </nav>
                {!collapsed && (
                    <div className="admin-sidebar-footer">
                        <span>Landing site</span>
                        <a href="https://salescode.ai/" target="_blank" rel="noreferrer">salescode.ai ↗</a>
                    </div>
                )}
            </aside>
            <section className="admin-content">
                <Outlet />
            </section>
        </div>
    );
}
