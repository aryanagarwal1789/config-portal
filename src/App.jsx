import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import ExperiencePortal from './pages/ExperiencePortal';
import ProductConfig from './pages/ProductConfig';
import GenericPortal from './pages/GenericPortal';
import AdminLayout from './layouts/AdminLayout';
import ContentPage from './pages/site/ContentPage';
import SectionsPage from './pages/site/SectionsPage';
import SeoPage from './pages/site/SeoPage';
import AboutUsPage from './pages/site/AboutUsPage';
import ClientPage from './pages/site/ClientPage';
import ContactUsPage from './pages/site/ContactUsPage';
import ProductsListPage from './pages/site/ProductsListPage';
import ProductDetailPage from './pages/site/ProductDetailPage';
import BlogsCatalogPage from './pages/site/BlogsCatalogPage';
import './App.css';

function SunIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
    );
}

export default function App() {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('cp-theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('cp-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

    return (
        <BrowserRouter>
            <div className="app-shell">
                <header className="app-topbar">
                    <div className="app-topbar-inner">
                        <div className="app-topbar-left">
                            <span className="app-topbar-logo">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3"/>
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
                                </svg>
                            </span>
                            <span className="app-topbar-brand">Config Portal</span>
                        </div>
                        <div className="app-topbar-right">
                            <button
                                className="theme-toggle"
                                onClick={toggleTheme}
                                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                                aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                            >
                                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                                <span className="theme-toggle-label">
                                    {theme === 'light' ? 'Dark' : 'Light'}
                                </span>
                            </button>
                        </div>
                    </div>
                </header>
                <main className="app-main">
                    <Routes>
                        <Route element={<AdminLayout />}>
                            <Route path="/" element={<Navigate to="/content" replace />} />
                            <Route path="/content" element={<ContentPage />} />
                            <Route path="/sections" element={<SectionsPage />} />
                            <Route path="/images" element={<Navigate to="/sections" replace />} />
                            <Route path="/videos" element={<Navigate to="/sections" replace />} />
                            <Route path="/cards" element={<Navigate to="/sections" replace />} />
                            <Route path="/blogs" element={<Navigate to="/sections" replace />} />
                            <Route path="/seo" element={<Navigate to="/seo/landing" replace />} />
                            <Route path="/seo/:pageKey" element={<SeoPage />} />
                            <Route path="/pages" element={<Navigate to="/pages/blog" replace />} />
                            <Route path="/pages/blog" element={<BlogsCatalogPage />} />
                            <Route path="/pages/contact-us" element={<ContactUsPage />} />
                            <Route path="/pages/client" element={<ClientPage />} />
                            <Route path="/pages/about-us" element={<AboutUsPage />} />
                            <Route path="/products" element={<ProductsListPage />} />
                            <Route path="/products/:productId" element={<ProductDetailPage />} />
                        </Route>

                        {/* Legacy routes kept intact */}
                        <Route path="/legacy" element={<Home />} />
                        <Route path="/experiencePortal" element={<ExperiencePortal />} />
                        <Route path="/experiencePortal/products/:productId" element={<ProductConfig />} />
                        <Route path="/portal/:portalId" element={<GenericPortal />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}
