import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    getSections, updateSections,
    listBlogs, updateBlog, getBlogsBgImage, updateBlogsBgImage,
    getPage, updatePage,
    listProducts, updateProduct,
    getAvailableBlogs,
    getContent, updateContent,
    BLOG_CATEGORIES, BLOG_CATEGORY_LABELS,
} from '../../api/site';
import Toast from '../../components/admin/Toast';
import FileUploadButton from '../../components/admin/FileUploadButton';
import SortableList, { SortableRow } from '../../components/admin/SortableList';
import VisualEditorLayout from '../../components/admin/VisualEditorLayout';
import '../../components/admin/adminShared.css';

const PREVIEW_URL = import.meta.env.VITE_PREVIEW_URL ?? 'http://localhost:3000';

const PAGE_TO_PATH = {
    landing:      '/',
    blog:         '/blog',
    about:        '/about',
    'contact-us': '/contact-us',
    clients:      '/clients',
};

// ─── Sections helpers ────────────────────────────────────────────────────────
function PointsEditor({ points, onChange }) {
    return (
        <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Bullet points</label>
            {points.map((pt, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <input
                        value={pt}
                        onChange={e => { const n = [...points]; n[i] = e.target.value; onChange(n); }}
                        placeholder={`Point ${i + 1}`}
                        style={{ flex: 1 }}
                    />
                    <button type="button" className="btn-remove" style={{ padding: '2px 7px' }}
                        onClick={() => onChange(points.filter((_, j) => j !== i))}>✕</button>
                </div>
            ))}
            <button type="button" className="btn-secondary" style={{ fontSize: 12, padding: '3px 10px' }}
                onClick={() => onChange([...points, ''])}>+ Add point</button>
        </div>
    );
}

export default function VisualEditor() {
    const { search } = useLocation();
    const navigate = useNavigate();
    const startPath = new URLSearchParams(search).get('p') || '/';

    const iframeRef   = useRef(null);
    const previewReady = useRef(false);

    // Which Next.js page is currently visible in the iframe
    const [currentPage, setCurrentPage] = useState(null);

    const [toast, setToast] = useState(null);

    // ── Hero ────────────────────────────────────────────────────────────────
    const [heroContent, setHeroContent]         = useState({ title: '', description: '', image: '' });
    const [heroLoaded, setHeroLoaded]           = useState(false);
    const [heroSaving, setHeroSaving]           = useState(false);
    const [activeHeroField, setActiveHeroField] = useState(null);
    const heroRef = useRef({});
    useEffect(() => { heroRef.current = heroContent; }, [heroContent]);

    // ── Landing / Sections ──────────────────────────────────────────────────
    const [sections, setSections]               = useState([]);
    const [sectionsLoaded, setSectionsLoaded]   = useState(false);
    const [sectionsSaving, setSectionsSaving]   = useState(false);
    const [activeSection, setActiveSection]     = useState(null);
    const [activeFieldGroup, setActiveFieldGroup] = useState(null);
    const [activeItemId, setActiveItemId]       = useState(null);
    const [sidebarBlogPickerOpen, setSidebarBlogPickerOpen] = useState(false);
    const [availableBlogs, setAvailableBlogs]   = useState([]);
    const sectionsRef = useRef([]);
    useEffect(() => { sectionsRef.current = sections; }, [sections]);

    // ── Blog ────────────────────────────────────────────────────────────────
    const [blogs, setBlogs]             = useState([]);
    const [bgImage, setBgImage]         = useState('');
    const [savedBgImage, setSavedBgImage] = useState('');
    const [bgSaving, setBgSaving]       = useState(false);
    const [activeBlogField, setActiveBlogField] = useState(null);
    const [activeBlogId, setActiveBlogId]       = useState(null);
    const [sidebarBlogDraft, setSidebarBlogDraft] = useState(null);
    const [blogSaving, setBlogSaving]   = useState(false);
    const blogsRef  = useRef([]);
    const bgImgRef  = useRef('');
    useEffect(() => { blogsRef.current  = blogs;   }, [blogs]);
    useEffect(() => { bgImgRef.current  = bgImage; }, [bgImage]);

    // ── About ───────────────────────────────────────────────────────────────
    const [aboutPage, setAboutPage]     = useState({ title: '', description: '', bannerImage: '', video: '' });
    const [aboutSaving, setAboutSaving] = useState(false);
    const [activeAboutField, setActiveAboutField] = useState(null);
    const aboutRef = useRef({});
    useEffect(() => { aboutRef.current = aboutPage; }, [aboutPage]);

    // ── Contact ─────────────────────────────────────────────────────────────
    const [contactPage, setContactPage]   = useState({ title: '', description: '', image: '' });
    const [contactSaving, setContactSaving] = useState(false);
    const [activeContactField, setActiveContactField] = useState(null);
    const contactRef = useRef({});
    useEffect(() => { contactRef.current = contactPage; }, [contactPage]);

    // ── Clients ─────────────────────────────────────────────────────────────
    const [clientPage, setClientPage]     = useState({ title: '', description: '', bannerImage: '', images: [] });
    const [clientSaving, setClientSaving] = useState(false);
    const [activeClientField, setActiveClientField] = useState(null);
    const clientRef = useRef({});
    useEffect(() => { clientRef.current = clientPage; }, [clientPage]);

    // ── Products ─────────────────────────────────────────────────────────────
    const [products, setProducts]         = useState([]);
    const [productsLoaded, setProductsLoaded] = useState(false);
    const [activeProductId, setActiveProductId] = useState(null);
    const [productDraft, setProductDraft] = useState(null);
    const [productSaving, setProductSaving] = useState(false);
    const productsRef = useRef([]);
    useEffect(() => { productsRef.current = products; }, [products]);

    const fieldRefs = useRef({});

    // ── Refs for stale-closure-safe current page data ──────────────────────
    const currentPageRef = useRef(null);
    useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

    // ── postMessage helpers ─────────────────────────────────────────────────
    function post(msg) {
        iframeRef.current?.contentWindow?.postMessage(msg, '*');
    }
    function sendSections(secs) {
        post({ type: 'SECTIONS_ORDER', order: secs.map(s => ({ id: s.id, enabled: s.enabled !== false, label: s.label })) });
        for (const s of secs) post({ type: 'SECTION_UPDATE', sectionId: s.id, items: s.items, label: s.label });
    }

    // ── Data loaders (idempotent — skip if already loaded) ─────────────────
    async function loadSections() {
        if (sectionsLoaded) return;
        try {
            const { data } = await getSections();
            setSections(data.sections || []);
            setSectionsLoaded(true);
        } catch { setToast({ type: 'error', message: 'Failed to load sections' }); }
    }
    async function loadBlogs() {
        if (blogsRef.current.length) return;
        try {
            const [{ data: bd }, { data: bgd }] = await Promise.all([listBlogs(), getBlogsBgImage()]);
            setBlogs(bd.blogs || []);
            const bi = bgd.bgImage || '';
            setBgImage(bi); setSavedBgImage(bi);
        } catch { setToast({ type: 'error', message: 'Failed to load blogs' }); }
    }
    async function loadAbout() {
        if (aboutRef.current.title !== undefined && aboutRef.current._loaded) return;
        try {
            const { data } = await getPage('about-us');
            const p = { title: '', description: '', bannerImage: '', video: '', _loaded: true, ...(data.page || {}) };
            setAboutPage(p);
        } catch { setToast({ type: 'error', message: 'Failed to load About' }); }
    }
    async function loadContact() {
        if (contactRef.current._loaded) return;
        try {
            const { data } = await getPage('contact-us');
            setContactPage({ title: '', description: '', image: '', _loaded: true, ...(data.page || {}) });
        } catch { setToast({ type: 'error', message: 'Failed to load Contact' }); }
    }
    async function loadClients() {
        if (clientRef.current._loaded) return;
        try {
            const { data } = await getPage('client');
            setClientPage({ title: '', description: '', bannerImage: '', images: [], _loaded: true, ...(data.page || {}) });
        } catch { setToast({ type: 'error', message: 'Failed to load Clients' }); }
    }
    async function loadProducts() {
        if (productsLoaded) return;
        try {
            const { data } = await listProducts();
            setProducts(data.products || []);
            setProductsLoaded(true);
        } catch { setToast({ type: 'error', message: 'Failed to load products' }); }
    }
    async function loadHero() {
        if (heroLoaded) return;
        try {
            const { data } = await getContent();
            setHeroContent({ title: '', description: '', image: '', ...(data.content || {}) });
            setHeroLoaded(true);
        } catch { setToast({ type: 'error', message: 'Failed to load hero content' }); }
    }

    // ── Push data to iframe for current page ────────────────────────────────
    function pushCurrentPageData(page) {
        switch (page) {
            case 'landing':
                sendSections(sectionsRef.current);
                post({ type: 'PRODUCTS_UPDATE', products: productsRef.current });
                post({ type: 'HERO_UPDATE', content: heroRef.current });
                break;
            case 'blog':     post({ type: 'BLOGS_UPDATE', blogs: blogsRef.current, bgImage: bgImgRef.current }); break;
            case 'about':    post({ type: 'PAGE_UPDATE', pageId: 'about-us',  page: aboutRef.current }); break;
            case 'contact-us': post({ type: 'PAGE_UPDATE', pageId: 'contact-us', page: contactRef.current }); break;
            case 'clients':  post({ type: 'PAGE_UPDATE', pageId: 'client', page: clientRef.current }); break;
            case 'products': post({ type: 'PRODUCTS_UPDATE', products: productsRef.current }); break;
        }
    }

    // ── Load data when page becomes active ──────────────────────────────────
    useEffect(() => {
        if (!currentPage) return;
        (async () => {
            switch (currentPage) {
                case 'landing':    await Promise.all([loadSections(), loadProducts(), loadHero()]); break;
                case 'blog':       await loadBlogs(); break;
                case 'about':      await loadAbout(); break;
                case 'contact-us': await loadContact(); break;
                case 'clients':    await loadClients(); break;
                case 'products':   await loadProducts(); break;
            }
            if (previewReady.current) pushCurrentPageData(currentPage);
        })();
    }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Live updates → iframe ────────────────────────────────────────────────
    useEffect(() => {
        if (!previewReady.current || currentPage !== 'landing') return;
        sendSections(sections);
    }, [sections, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!previewReady.current || currentPage !== 'landing') return;
        post({ type: 'HERO_UPDATE', content: heroContent });
    }, [heroContent, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!previewReady.current || currentPage !== 'landing') return;
        const preview = (productDraft && activeProductId)
            ? products.map(p => p.productId === activeProductId ? { ...p, ...productDraft } : p)
            : products;
        post({ type: 'PRODUCTS_UPDATE', products: preview });
    }, [products, productDraft, activeProductId, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!previewReady.current || currentPage !== 'blog') return;
        const preview = sidebarBlogDraft
            ? blogs.map(b => b.id === sidebarBlogDraft.id ? { ...b, ...sidebarBlogDraft } : b)
            : blogs;
        post({ type: 'BLOGS_UPDATE', blogs: preview, bgImage });
    }, [blogs, bgImage, sidebarBlogDraft, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!previewReady.current || currentPage !== 'about') return;
        post({ type: 'PAGE_UPDATE', pageId: 'about-us', page: aboutPage });
    }, [aboutPage, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!previewReady.current || currentPage !== 'contact-us') return;
        post({ type: 'PAGE_UPDATE', pageId: 'contact-us', page: contactPage });
    }, [contactPage, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!previewReady.current || currentPage !== 'clients') return;
        post({ type: 'PAGE_UPDATE', pageId: 'client', page: clientPage });
    }, [clientPage, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps


    // ── Blog active id → draft ───────────────────────────────────────────────
    useEffect(() => {
        if (!activeBlogId) { setSidebarBlogDraft(null); return; }
        const found = blogs.find(b => b.id === activeBlogId);
        if (found) setSidebarBlogDraft({ ...found });
    }, [activeBlogId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Product active id → draft ────────────────────────────────────────────
    useEffect(() => {
        if (!activeProductId) { setProductDraft(null); return; }
        const found = products.find(p => p.productId === activeProductId);
        if (found) setProductDraft({ name: found.name || '', description: found.description || '', image: found.image || '', category: found.category || 'applications', highlight: found.highlight || '', status: found.status || '', timelineStage: found.timelineStage || '', liveDate: found.liveDate || '', enabled: found.enabled });
    }, [activeProductId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Message listener ────────────────────────────────────────────────────
    useEffect(() => {
        function onMessage(event) {
            const { type } = event.data ?? {};

            if (type === 'PREVIEW_READY') {
                previewReady.current = true;
                pushCurrentPageData(currentPageRef.current);
            }

            if (type === 'PAGE_CHANGED') {
                const page = event.data.page;
                setCurrentPage(page);
                // reset all active fields on navigation
                setActiveSection(null); setActiveFieldGroup(null); setActiveItemId(null);
                setActiveBlogField(null); setActiveBlogId(null);
                setActiveProductId(null);
                setActiveAboutField(null); setActiveContactField(null); setActiveClientField(null);
                setActiveHeroField(null);
                setSidebarBlogPickerOpen(false);
            }

            // Hero
            if (type === 'FIELD_CLICK' && (event.data.fieldId === 'hero-title' || event.data.fieldId === 'hero-description')) {
                setActiveHeroField(event.data.fieldId);
                setActiveSection(null); setActiveFieldGroup(null); setActiveItemId(null);
                setActiveProductId(null);
            }
            // Landing sections (must have a sectionId and not be products)
            if (type === 'FIELD_CLICK' && event.data.sectionId && event.data.sectionId !== 'products') {
                setActiveSection(event.data.sectionId);
                setActiveFieldGroup(event.data.fieldGroup);
                setActiveItemId(event.data.itemId ?? null);
                setActiveHeroField(null);
                setActiveProductId(null);
                setTimeout(() => {
                    const key = `${event.data.sectionId}-${event.data.fieldGroup}`;
                    fieldRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    fieldRefs.current[key]?.querySelector('input, textarea')?.focus();
                }, 60);
            }
            // Products
            if (type === 'FIELD_CLICK' && event.data.sectionId === 'products') {
                setActiveProductId(event.data.productId ?? null);
                setActiveHeroField(null);
                setActiveSection(null); setActiveFieldGroup(null); setActiveItemId(null);
            }
            // Blog
            if (type === 'FIELD_CLICK' && event.data.pageId === 'blog') {
                setActiveBlogField(event.data.fieldGroup || null);
                setActiveBlogId(event.data.blogId || null);
            }
            // About / Contact / Clients
            if (type === 'FIELD_CLICK' && event.data.pageId === 'about-us')   setActiveAboutField(event.data.fieldId);
            if (type === 'FIELD_CLICK' && event.data.pageId === 'contact-us') setActiveContactField(event.data.fieldId);
            if (type === 'FIELD_CLICK' && event.data.pageId === 'client')     setActiveClientField(event.data.fieldId);
        }
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Save functions ───────────────────────────────────────────────────────
    async function saveHero() {
        setHeroSaving(true);
        try {
            await updateContent(heroContent);
            setToast({ type: 'success', message: 'Hero saved' });
        } catch { setToast({ type: 'error', message: 'Save failed' }); }
        finally { setHeroSaving(false); }
    }
    async function saveSections() {
        setSectionsSaving(true);
        try {
            const payload = sections.map((s, i) => ({
                id: s.id, label: s.label, kind: s.kind, cardinality: s.cardinality,
                enabled: s.enabled !== false, order: i,
                items: s.items.map((it, j) =>
                    s.kind === 'blog'
                        ? { id: it.blogId || it.id, blogId: it.blogId || it.id, order: j }
                        : { ...it, order: j }
                ),
            }));
            const { data } = await updateSections(payload);
            setSections(data.sections || []);
            post({ type: 'RELOAD' });
            setToast({ type: 'success', message: 'Sections saved' });
        } catch { setToast({ type: 'error', message: 'Save failed' }); }
        finally { setSectionsSaving(false); }
    }
    async function saveBgImage() {
        setBgSaving(true);
        try {
            await updateBlogsBgImage(bgImage);
            setSavedBgImage(bgImage);
            setToast({ type: 'success', message: 'Background image saved' });
        } catch { setToast({ type: 'error', message: 'Save failed' }); }
        finally { setBgSaving(false); }
    }
    async function saveSidebarBlog() {
        if (!sidebarBlogDraft) return;
        setBlogSaving(true);
        try {
            await updateBlog(sidebarBlogDraft.id, sidebarBlogDraft);
            setBlogs(prev => prev.map(b => b.id === sidebarBlogDraft.id ? { ...b, ...sidebarBlogDraft } : b));
            setToast({ type: 'success', message: 'Blog saved' });
        } catch { setToast({ type: 'error', message: 'Save failed' }); }
        finally { setBlogSaving(false); }
    }
    async function saveAbout() {
        setAboutSaving(true);
        try {
            const { data } = await updatePage('about-us', aboutPage);
            setAboutPage(p => ({ ...p, ...(data.page || {}) }));
            setToast({ type: 'success', message: 'About saved' });
        } catch { setToast({ type: 'error', message: 'Save failed' }); }
        finally { setAboutSaving(false); }
    }
    async function saveContact() {
        setContactSaving(true);
        try {
            const { data } = await updatePage('contact-us', contactPage);
            setContactPage(p => ({ ...p, ...(data.page || {}) }));
            setToast({ type: 'success', message: 'Contact saved' });
        } catch { setToast({ type: 'error', message: 'Save failed' }); }
        finally { setContactSaving(false); }
    }
    async function saveClients() {
        setClientSaving(true);
        try {
            const { data } = await updatePage('client', clientPage);
            setClientPage(p => ({ ...p, ...(data.page || {}) }));
            setToast({ type: 'success', message: 'Clients saved' });
        } catch { setToast({ type: 'error', message: 'Save failed' }); }
        finally { setClientSaving(false); }
    }
    async function saveProduct() {
        if (!activeProductId || !productDraft) return;
        setProductSaving(true);
        try {
            await updateProduct(activeProductId, productDraft);
            setProducts(prev => prev.map(p => p.productId === activeProductId ? { ...p, ...productDraft } : p));
            setToast({ type: 'success', message: 'Product saved' });
        } catch { setToast({ type: 'error', message: 'Save failed' }); }
        finally { setProductSaving(false); }
    }

    // ── Section state helpers ────────────────────────────────────────────────
    const updateSection = (sIdx, patch) => setSections(prev => prev.map((s, i) => i === sIdx ? { ...s, ...patch } : s));
    const updateItem = (sIdx, iIdx, patch) => setSections(prev => prev.map((s, i) => i !== sIdx ? s : { ...s, items: s.items.map((it, j) => j === iIdx ? { ...it, ...patch } : it) }));
    const addItem = (sIdx, url) => setSections(prev => prev.map((s, i) => {
        if (i !== sIdx) return s;
        const rand = () => Math.random().toString(36).slice(2, 7);
        let item;
        if (s.kind === 'image') item = { id: `img-${Date.now()}-${rand()}`, url, alt: '', order: 0 };
        else if (s.kind === 'video') item = { id: `vid-${Date.now()}-${rand()}`, url, title: '', description: '', thumbnail: '', order: 0 };
        else item = { id: `card-${Date.now()}-${rand()}`, title: '', subtitle: '', description: '', points: [], image: '', order: 0 };
        return s.cardinality === 'single' ? { ...s, items: [item] } : { ...s, items: [...s.items, item] };
    }));
    const removeItem = (sIdx, iIdx) => setSections(prev => prev.map((s, i) => i === sIdx ? { ...s, items: s.items.filter((_, j) => j !== iIdx) } : s));
    const reorderItems = (sIdx, next) => setSections(prev => prev.map((s, i) => i === sIdx ? { ...s, items: next } : s));
    const addBlogItem = (sIdx, blog) => {
        const item = { id: blog.id, blogId: blog.id, title: blog.title || '', description: blog.description || '', image: blog.image || '', url: blog.link || '', enabled: true, order: 0 };
        setSections(prev => prev.map((s, i) => {
            if (i !== sIdx) return s;
            return s.cardinality === 'single' ? { ...s, items: [item] } : { ...s, items: [...s.items, item] };
        }));
        setSidebarBlogPickerOpen(false);
    };
    async function loadAvailableBlogs() {
        try {
            const { data } = await getAvailableBlogs();
            setAvailableBlogs(data.available || []);
        } catch { setToast({ type: 'error', message: 'Could not load blog catalog' }); }
    }

    // ── Current save handler + saving state for header ──────────────────────
    const { onSave, saving } = (() => {
        switch (currentPage) {
            case 'landing':    return { onSave: saveSections, saving: sectionsSaving };
            case 'blog':       return {
                onSave: activeBlogField === 'blog' && sidebarBlogDraft ? saveSidebarBlog : saveBgImage,
                saving: activeBlogField === 'blog' ? blogSaving : bgSaving,
            };
            case 'about':      return { onSave: saveAbout,   saving: aboutSaving };
            case 'contact-us': return { onSave: saveContact, saving: contactSaving };
            case 'clients':    return { onSave: saveClients, saving: clientSaving };
            case 'products':   return { onSave: productDraft ? saveProduct : null, saving: productSaving };
            default:           return { onSave: null, saving: false };
        }
    })();

    // ── Current save handler also needs hero/product awareness on landing ────
    const effectiveSaving = currentPage === 'landing' && activeHeroField ? heroSaving
        : currentPage === 'landing' && activeProductId ? productSaving
        : saving;
    const effectiveOnSave = currentPage === 'landing' && activeHeroField ? saveHero
        : currentPage === 'landing' && activeProductId ? (productDraft ? saveProduct : null)
        : onSave;

    // ── Sidebar content ──────────────────────────────────────────────────────
    const sidebar = (() => {
        // ── LANDING — but a hero field was clicked ────────────────────────────
        if (currentPage === 'landing' && activeHeroField) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div className="preview-sidebar-header">
                        <p className="preview-sidebar-title">Hero</p>
                        <p className="preview-sidebar-hint">Changes update live</p>
                    </div>
                    <div className="preview-sidebar-fields">
                        <div className={`form-group${activeHeroField === 'hero-title' ? ' is-active' : ''}`}>
                            <label>Title</label>
                            <input value={heroContent.title} onChange={e => setHeroContent(c => ({ ...c, title: e.target.value }))} placeholder="All your CPG Sales on One Platform." />
                            <span className="form-hint">Last two words appear in teal.</span>
                        </div>
                        <div className={`form-group${activeHeroField === 'hero-description' ? ' is-active' : ''}`}>
                            <label>Description</label>
                            <textarea rows={4} value={heroContent.description} onChange={e => setHeroContent(c => ({ ...c, description: e.target.value }))} placeholder="Supporting paragraph displayed under the title" />
                        </div>
                        <div className="form-group">
                            <label>Image</label>
                            {heroContent.image && <img src={heroContent.image} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 8, objectFit: 'cover', maxHeight: 120 }} />}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <FileUploadButton label={heroContent.image ? 'Replace' : 'Upload'} accept="image/*" onUploaded={url => setHeroContent(c => ({ ...c, image: url }))} onError={msg => setToast({ type: 'error', message: msg })} />
                                {heroContent.image && <button type="button" className="btn-remove" onClick={() => setHeroContent(c => ({ ...c, image: '' }))}>Clear</button>}
                            </div>
                        </div>
                        <button type="button" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={saveHero} disabled={heroSaving}>{heroSaving ? 'Saving…' : 'Save Hero'}</button>
                    </div>
                </div>
            );
        }

        // ── LANDING — but a product card was clicked ──────────────────────────
        if (currentPage === 'landing' && activeProductId) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div className="preview-sidebar-header">
                        <p className="preview-sidebar-title">{productDraft ? productDraft.name || activeProductId : 'Product'}</p>
                        <p className="preview-sidebar-hint">Changes update live</p>
                    </div>
                    {productDraft && (
                        <div className="preview-sidebar-fields">
                            <div className="form-group">
                                <label>Icon / Image</label>
                                {productDraft.image && <div style={{ width: 56, height: 56, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, marginBottom: 8 }}><img src={productDraft.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <FileUploadButton label={productDraft.image ? 'Replace' : 'Upload'} accept="image/*" onUploaded={url => setProductDraft(d => ({ ...d, image: url }))} onError={msg => setToast({ type: 'error', message: msg })} />
                                    {productDraft.image && <button type="button" className="btn-remove" onClick={() => setProductDraft(d => ({ ...d, image: '' }))}>Clear</button>}
                                </div>
                            </div>
                            <div className="form-group"><label>Name</label><input value={productDraft.name} onChange={e => setProductDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. NextGen SFA" /></div>
                            <div className="form-group"><label>Description</label><textarea rows={2} value={productDraft.description} onChange={e => setProductDraft(d => ({ ...d, description: e.target.value }))} placeholder="Short line" /></div>
                            <div className="form-group"><label>Highlight badge</label><input value={productDraft.highlight} onChange={e => setProductDraft(d => ({ ...d, highlight: e.target.value }))} placeholder="e.g. 5-18% Sales Uplift" /></div>
                            <div className="form-group">
                                <label>Status badge</label>
                                <select value={productDraft.status} onChange={e => setProductDraft(d => ({ ...d, status: e.target.value }))}>
                                    <option value="">None</option>
                                    <option value="live">Live</option>
                                    <option value="beta">Beta</option>
                                    <option value="upcoming">Coming Soon</option>
                                </select>
                            </div>
                            {(productDraft.status === 'beta' || productDraft.status === 'upcoming') && (
                                <>
                                    <div className="form-group">
                                        <label>Timeline stage</label>
                                        <select value={productDraft.timelineStage} onChange={e => setProductDraft(d => ({ ...d, timelineStage: e.target.value }))}>
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
                                        <input value={productDraft.liveDate} onChange={e => setProductDraft(d => ({ ...d, liveDate: e.target.value }))} placeholder="e.g. JUN 2026" />
                                    </div>
                                </>
                            )}
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <label style={{ margin: 0 }}>Visible on site</label>
                                <label className="admin-toggle"><input type="checkbox" checked={!!productDraft.enabled} onChange={e => setProductDraft(d => ({ ...d, enabled: e.target.checked }))} /><span className="admin-toggle-track"><span className="admin-toggle-thumb" /></span></label>
                            </div>
                            <button type="button" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={saveProduct} disabled={productSaving}>{productSaving ? 'Saving…' : 'Save Product'}</button>
                        </div>
                    )}
                </div>
            );
        }

        // ── LANDING ──────────────────────────────────────────────────────────
        if (currentPage === 'landing') {
            const sIdx = activeSection ? sections.findIndex(s => s.id === activeSection) : -1;
            const sec  = sIdx >= 0 ? sections[sIdx] : null;

            // Card detail view
            if (sec && sec.kind === 'card' && activeFieldGroup === 'card' && activeItemId) {
                const iIdx = sec.items.findIndex(it => it.id === activeItemId);
                const item = iIdx >= 0 ? sec.items[iIdx] : null;
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div className="preview-sidebar-header">
                            <button type="button" className="btn-secondary" style={{ fontSize: 12, padding: '4px 10px', marginBottom: 8 }} onClick={() => setActiveItemId(null)}>← Back to cards</button>
                            <p className="preview-sidebar-title">{item?.title || 'Untitled card'}</p>
                            <p className="preview-sidebar-hint">Changes update live</p>
                        </div>
                        {item && (
                            <div className="preview-sidebar-fields">
                                <div className="form-group">
                                    <label>Image</label>
                                    {item.image && <img src={item.image} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 8, objectFit: 'cover', maxHeight: 140 }} />}
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <FileUploadButton label={item.image ? 'Replace' : 'Upload'} accept="image/*" onUploaded={url => updateItem(sIdx, iIdx, { image: url })} onError={msg => setToast({ type: 'error', message: msg })} />
                                        {item.image && <button type="button" className="btn-remove" onClick={() => updateItem(sIdx, iIdx, { image: '' })}>Clear</button>}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Title</label>
                                    <input value={item.title || ''} onChange={e => updateItem(sIdx, iIdx, { title: e.target.value })} placeholder="Card title" />
                                </div>
                                <div className="form-group">
                                    <label>Read More URL</label>
                                    <input value={item.subtitle || ''} onChange={e => updateItem(sIdx, iIdx, { subtitle: e.target.value })} placeholder="https://…" />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea rows={3} value={item.description || ''} onChange={e => updateItem(sIdx, iIdx, { description: e.target.value })} placeholder="Short description" />
                                </div>
                                <PointsEditor points={item.points || []} onChange={next => updateItem(sIdx, iIdx, { points: next })} />
                            </div>
                        )}
                    </div>
                );
            }

            return (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div className="preview-sidebar-header">
                        <p className="preview-sidebar-title">{sec ? sec.label || 'Section' : 'Landing Page'}</p>
                        <p className="preview-sidebar-hint">{sec ? 'Changes update live' : 'Click any highlighted area to edit it'}</p>
                    </div>
                    {sec && (
                        <div className="preview-sidebar-fields">
                            <div ref={el => { fieldRefs.current[`${activeSection}-label`] = el; }} className={`form-group${activeFieldGroup === 'label' ? ' is-active' : ''}`}>
                                <label>Section Heading</label>
                                <input value={sec.label} onChange={e => updateSection(sIdx, { label: e.target.value })} placeholder="Section heading" />
                            </div>

                            {sec.kind === 'image' && sec.cardinality === 'single' && (
                                <div ref={el => { fieldRefs.current[`${activeSection}-images`] = el; }} className={`form-group${activeFieldGroup === 'images' ? ' is-active' : ''}`}>
                                    <label>Image</label>
                                    {sec.items[0]?.url && <img src={sec.items[0].url} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 8, objectFit: 'cover', maxHeight: 140 }} />}
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <FileUploadButton label={sec.items[0]?.url ? 'Replace' : 'Upload'} accept="image/*" onUploaded={url => { if (sec.items.length > 0) updateItem(sIdx, 0, { url }); else addItem(sIdx, url); }} onError={msg => setToast({ type: 'error', message: msg })} />
                                        {sec.items[0]?.url && <button type="button" className="btn-remove" onClick={() => updateItem(sIdx, 0, { url: '' })}>Clear</button>}
                                    </div>
                                </div>
                            )}

                            {sec.kind === 'image' && sec.cardinality !== 'single' && (
                                <div ref={el => { fieldRefs.current[`${activeSection}-images`] = el; }} className={`form-group${activeFieldGroup === 'images' ? ' is-active' : ''}`}>
                                    <label>Images ({sec.items.length})</label>
                                    <SortableList items={sec.items} getId={i => i.id} onReorder={next => reorderItems(sIdx, next)}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                                            {sec.items.map((item, iIdx) => (
                                                <SortableRow key={item.id} id={item.id}>
                                                    {({ attributes, listeners }) => (
                                                        <div style={{ position: 'relative' }}>
                                                            <div {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 56, minWidth: 60, maxWidth: 100, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: 4, boxSizing: 'border-box' }}>
                                                                {item.url && <img src={item.url} alt={item.alt || ''} style={{ height: '100%', width: 'auto', maxWidth: 92, objectFit: 'contain', pointerEvents: 'none' }} />}
                                                            </div>
                                                            <button type="button" className="btn-remove" style={{ position: 'absolute', top: -6, right: -6, padding: '1px 5px', fontSize: 10, lineHeight: 1.4 }} onClick={() => removeItem(sIdx, iIdx)}>✕</button>
                                                        </div>
                                                    )}
                                                </SortableRow>
                                            ))}
                                        </div>
                                    </SortableList>
                                    <FileUploadButton label="+ Upload image" accept="image/*" onUploaded={url => addItem(sIdx, url)} onError={msg => setToast({ type: 'error', message: msg })} />
                                </div>
                            )}

                            {sec.kind === 'card' && (
                                <div ref={el => { fieldRefs.current[`${activeSection}-card`] = el; }} className={`form-group${activeFieldGroup === 'card' ? ' is-active' : ''}`}>
                                    <label>Cards ({sec.items.length})</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {sec.items.length === 0 ? <div className="admin-empty" style={{ padding: 12 }}>No cards yet.</div> : sec.items.map(item => (
                                            <button key={item.id} type="button" onClick={() => setActiveItemId(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                                                {item.image && <img src={item.image} alt="" style={{ width: 40, height: 32, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />}
                                                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || <span style={{ color: 'var(--text-muted)' }}>Untitled card</span>}</span>
                                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Edit →</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {sec.kind === 'blog' && (
                                <div ref={el => { fieldRefs.current[`${activeSection}-blogs`] = el; }} className={`form-group${activeFieldGroup === 'blogs' ? ' is-active' : ''}`}>
                                    {sidebarBlogPickerOpen ? (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <label style={{ margin: 0 }}>Choose a blog</label>
                                                <button type="button" className="btn-remove" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => setSidebarBlogPickerOpen(false)}>✕ Close</button>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {availableBlogs.filter(b => !sec.items.some(it => it.blogId === b.id || it.id === b.id)).map(b => (
                                                    <button key={b.id} type="button" onClick={() => addBlogItem(sIdx, b)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                                                        {b.image && <img src={b.image} alt="" style={{ width: 40, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />}
                                                        <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title || 'Untitled blog'}</span>
                                                        <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>+ Add</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <label>Featured Blogs ({sec.items.length})</label>
                                            {sec.items.length === 0 ? <div className="admin-empty" style={{ padding: 12, fontSize: 12 }}>No blogs featured yet.</div> : (
                                                <SortableList items={sec.items} getId={i => i.id} onReorder={next => reorderItems(sIdx, next)}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                                                        {sec.items.map((item, iIdx) => (
                                                            <SortableRow key={item.id} id={item.id}>
                                                                {({ attributes, listeners }) => (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                                                                        <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-muted)', fontSize: 14, userSelect: 'none', lineHeight: 1 }}>⠿</div>
                                                                        {item.image && <img src={item.image} alt="" style={{ width: 40, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0, pointerEvents: 'none' }} />}
                                                                        <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || 'Untitled blog'}</span>
                                                                        <button type="button" className="btn-remove" style={{ padding: '2px 6px', fontSize: 11, flexShrink: 0 }} onClick={() => removeItem(sIdx, iIdx)}>✕</button>
                                                                    </div>
                                                                )}
                                                            </SortableRow>
                                                        ))}
                                                    </div>
                                                </SortableList>
                                            )}
                                            <button type="button" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={async () => { if (availableBlogs.length === 0) await loadAvailableBlogs(); setSidebarBlogPickerOpen(true); }}>+ Add blog</button>
                                        </>
                                    )}
                                </div>
                            )}

                            {sec.kind === 'video' && sec.cardinality === 'single' && (
                                <div ref={el => { fieldRefs.current[`${activeSection}-video`] = el; }} className={`form-group${activeFieldGroup === 'video' ? ' is-active' : ''}`}>
                                    <label>Video</label>
                                    {sec.items[0]?.thumbnail && <img src={sec.items[0].thumbnail} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 8, objectFit: 'cover', maxHeight: 120 }} />}
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                        <FileUploadButton label={sec.items[0]?.url ? 'Replace video' : 'Upload video'} accept="video/*" onUploaded={url => { if (sec.items.length > 0) updateItem(sIdx, 0, { url }); else addItem(sIdx, url); }} onError={msg => setToast({ type: 'error', message: msg })} />
                                    </div>
                                    <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Thumbnail</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <FileUploadButton label={sec.items[0]?.thumbnail ? 'Replace thumb' : 'Upload thumb'} accept="image/*" onUploaded={url => { if (sec.items.length > 0) updateItem(sIdx, 0, { thumbnail: url }); }} onError={msg => setToast({ type: 'error', message: msg })} />
                                        {sec.items[0]?.thumbnail && <button type="button" className="btn-remove" onClick={() => updateItem(sIdx, 0, { thumbnail: '' })}>Clear</button>}
                                    </div>
                                </div>
                            )}

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <label style={{ margin: 0 }}>Visible on page</label>
                                <label className="admin-toggle">
                                    <input type="checkbox" checked={sec.enabled !== false} onChange={e => updateSection(sIdx, { enabled: e.target.checked })} />
                                    <span className="admin-toggle-track"><span className="admin-toggle-thumb" /></span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // ── BLOG ─────────────────────────────────────────────────────────────
        if (currentPage === 'blog') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div className="preview-sidebar-header">
                        <p className="preview-sidebar-title">Blog</p>
                        <p className="preview-sidebar-hint">Click any highlighted area to edit it</p>
                    </div>
                    <div className="preview-sidebar-fields">
                        <div ref={el => { fieldRefs.current['bgImage'] = el; }} className={`form-group${activeBlogField === 'bgImage' ? ' is-active' : ''}`}>
                            <label>Background Image</label>
                            {bgImage && <img src={bgImage} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 8, objectFit: 'cover', maxHeight: 120 }} />}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <FileUploadButton label={bgImage ? 'Replace' : 'Upload'} accept="image/*" onUploaded={url => setBgImage(url)} onError={msg => setToast({ type: 'error', message: msg })} />
                                {bgImage && <button type="button" className="btn-remove" onClick={() => setBgImage('')}>Clear</button>}
                            </div>
                            {bgImage !== savedBgImage && <button type="button" className="btn-primary" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }} onClick={saveBgImage} disabled={bgSaving}>{bgSaving ? 'Saving…' : 'Save background'}</button>}
                        </div>

                        {activeBlogField === 'blog' && sidebarBlogDraft && (
                            <div ref={el => { fieldRefs.current['blog'] = el; }} className="form-group is-active">
                                <label style={{ marginBottom: 8, display: 'block', fontWeight: 600 }}>Editing: {sidebarBlogDraft.title || 'Untitled'}</label>
                                <div className="admin-field" style={{ marginBottom: 10 }}>
                                    <label>Thumbnail</label>
                                    {sidebarBlogDraft.image && <img src={sidebarBlogDraft.image} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 8, objectFit: 'cover', maxHeight: 120 }} />}
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <FileUploadButton label={sidebarBlogDraft.image ? 'Replace' : 'Upload'} accept="image/*" onUploaded={url => setSidebarBlogDraft(d => ({ ...d, image: url }))} onError={msg => setToast({ type: 'error', message: msg })} />
                                        {sidebarBlogDraft.image && <button type="button" className="btn-remove" onClick={() => setSidebarBlogDraft(d => ({ ...d, image: '' }))}>Clear</button>}
                                    </div>
                                </div>
                                <div className="admin-field" style={{ marginBottom: 10 }}>
                                    <label>Title</label>
                                    <input value={sidebarBlogDraft.title} onChange={e => setSidebarBlogDraft(d => ({ ...d, title: e.target.value }))} placeholder="Blog title" />
                                </div>
                                <div className="admin-field" style={{ marginBottom: 10 }}>
                                    <label>Description</label>
                                    <textarea rows={3} value={sidebarBlogDraft.description} onChange={e => setSidebarBlogDraft(d => ({ ...d, description: e.target.value }))} placeholder="Short summary" />
                                </div>
                                <div className="admin-field" style={{ marginBottom: 10 }}>
                                    <label>Type</label>
                                    <select value={sidebarBlogDraft.type || ''} onChange={e => setSidebarBlogDraft(d => ({ ...d, type: e.target.value }))}>
                                        <option value="">— Uncategorized —</option>
                                        {BLOG_CATEGORIES.map(k => <option key={k} value={k}>{BLOG_CATEGORY_LABELS[k]}</option>)}
                                    </select>
                                </div>
                                <div className="admin-field" style={{ marginBottom: 10 }}>
                                    <label>Link</label>
                                    <input value={sidebarBlogDraft.link} onChange={e => setSidebarBlogDraft(d => ({ ...d, link: e.target.value }))} placeholder="/blog/my-post" />
                                </div>
                                <div className="admin-field" style={{ marginBottom: 10 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={!!sidebarBlogDraft.enabled} onChange={e => setSidebarBlogDraft(d => ({ ...d, enabled: e.target.checked }))} />
                                        Visible on blog page
                                    </label>
                                </div>
                                <button type="button" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={saveSidebarBlog} disabled={blogSaving}>{blogSaving ? 'Saving…' : 'Save blog'}</button>
                            </div>
                        )}
                        {activeBlogField === 'blog' && !sidebarBlogDraft && <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>Click a blog card to edit it.</p>}
                        {!activeBlogField && <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>Click any highlighted area to edit it.</p>}
                    </div>
                </div>
            );
        }

        // ── ABOUT ─────────────────────────────────────────────────────────────
        if (currentPage === 'about') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div className="preview-sidebar-header">
                        <p className="preview-sidebar-title">About Us</p>
                        <p className="preview-sidebar-hint">Click any highlighted area to jump to its field</p>
                    </div>
                    <div className="preview-sidebar-fields">
                        <div ref={el => { fieldRefs.current['title'] = el; }} className={`form-group${activeAboutField === 'title' ? ' is-active' : ''}`}>
                            <label>Title</label>
                            <input value={aboutPage.title} onChange={e => setAboutPage(p => ({ ...p, title: e.target.value }))} placeholder="e.g. About SalesCode" />
                        </div>
                        <div ref={el => { fieldRefs.current['description'] = el; }} className={`form-group${activeAboutField === 'description' ? ' is-active' : ''}`}>
                            <label>Description</label>
                            <textarea rows={5} value={aboutPage.description} onChange={e => setAboutPage(p => ({ ...p, description: e.target.value }))} placeholder="Company description" />
                        </div>
                        <div ref={el => { fieldRefs.current['bannerImage'] = el; }} className={`form-group${activeAboutField === 'bannerImage' ? ' is-active' : ''}`}>
                            <label>Banner Image</label>
                            {aboutPage.bannerImage && <img src={aboutPage.bannerImage} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 8, objectFit: 'cover', maxHeight: 120 }} />}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <FileUploadButton label={aboutPage.bannerImage ? 'Replace' : 'Upload'} accept="image/*" onUploaded={url => setAboutPage(p => ({ ...p, bannerImage: url }))} onError={msg => setToast({ type: 'error', message: msg })} />
                                {aboutPage.bannerImage && <button type="button" className="btn-remove" onClick={() => setAboutPage(p => ({ ...p, bannerImage: '' }))}>Clear</button>}
                            </div>
                        </div>
                        <div ref={el => { fieldRefs.current['video'] = el; }} className={`form-group${activeAboutField === 'video' ? ' is-active' : ''}`}>
                            <label>Video</label>
                            {aboutPage.video && <video key={aboutPage.video} src={aboutPage.video} controls muted style={{ width: '100%', borderRadius: 8, marginBottom: 8, maxHeight: 120 }} />}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <FileUploadButton label={aboutPage.video ? 'Replace' : 'Upload'} accept="video/*" onUploaded={url => setAboutPage(p => ({ ...p, video: url }))} onError={msg => setToast({ type: 'error', message: msg })} />
                                {aboutPage.video && <button type="button" className="btn-remove" onClick={() => setAboutPage(p => ({ ...p, video: '' }))}>Clear</button>}
                            </div>
                        </div>
                        <button type="button" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={saveAbout} disabled={aboutSaving}>{aboutSaving ? 'Saving…' : 'Save About'}</button>
                    </div>
                </div>
            );
        }

        // ── CONTACT ───────────────────────────────────────────────────────────
        if (currentPage === 'contact-us') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div className="preview-sidebar-header">
                        <p className="preview-sidebar-title">Contact Us</p>
                        <p className="preview-sidebar-hint">Click any highlighted area to jump to its field</p>
                    </div>
                    <div className="preview-sidebar-fields">
                        <div ref={el => { fieldRefs.current['title'] = el; }} className={`form-group${activeContactField === 'title' ? ' is-active' : ''}`}>
                            <label>Title</label>
                            <input value={contactPage.title} onChange={e => setContactPage(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Let's Talk" />
                        </div>
                        <div ref={el => { fieldRefs.current['description'] = el; }} className={`form-group${activeContactField === 'description' ? ' is-active' : ''}`}>
                            <label>Description</label>
                            <textarea rows={4} value={contactPage.description} onChange={e => setContactPage(p => ({ ...p, description: e.target.value }))} placeholder="Supporting text" />
                        </div>
                        <div ref={el => { fieldRefs.current['image'] = el; }} className={`form-group${activeContactField === 'image' ? ' is-active' : ''}`}>
                            <label>Hero Image</label>
                            {contactPage.image && <img src={contactPage.image} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 8, objectFit: 'cover', maxHeight: 120 }} />}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <FileUploadButton label={contactPage.image ? 'Replace' : 'Upload'} accept="image/*" onUploaded={url => setContactPage(p => ({ ...p, image: url }))} onError={msg => setToast({ type: 'error', message: msg })} />
                                {contactPage.image && <button type="button" className="btn-remove" onClick={() => setContactPage(p => ({ ...p, image: '' }))}>Clear</button>}
                            </div>
                        </div>
                        <button type="button" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={saveContact} disabled={contactSaving}>{contactSaving ? 'Saving…' : 'Save Contact'}</button>
                    </div>
                </div>
            );
        }

        // ── CLIENTS ───────────────────────────────────────────────────────────
        if (currentPage === 'clients') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div className="preview-sidebar-header">
                        <p className="preview-sidebar-title">Clients</p>
                        <p className="preview-sidebar-hint">Click any highlighted area to jump to its field</p>
                    </div>
                    <div className="preview-sidebar-fields">
                        <div ref={el => { fieldRefs.current['title'] = el; }} className={`form-group${activeClientField === 'title' ? ' is-active' : ''}`}>
                            <label>Title</label>
                            <input value={clientPage.title} onChange={e => setClientPage(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Trusted by the world's best" />
                        </div>
                        <div ref={el => { fieldRefs.current['description'] = el; }} className={`form-group${activeClientField === 'description' ? ' is-active' : ''}`}>
                            <label>Description</label>
                            <textarea rows={4} value={clientPage.description} onChange={e => setClientPage(p => ({ ...p, description: e.target.value }))} placeholder="Introduction text" />
                        </div>
                        <div ref={el => { fieldRefs.current['bannerImage'] = el; }} className={`form-group${activeClientField === 'bannerImage' ? ' is-active' : ''}`}>
                            <label>Banner Image</label>
                            {clientPage.bannerImage && <img src={clientPage.bannerImage} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 8, objectFit: 'cover', maxHeight: 120 }} />}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <FileUploadButton label={clientPage.bannerImage ? 'Replace' : 'Upload'} accept="image/*" onUploaded={url => setClientPage(p => ({ ...p, bannerImage: url }))} onError={msg => setToast({ type: 'error', message: msg })} />
                                {clientPage.bannerImage && <button type="button" className="btn-remove" onClick={() => setClientPage(p => ({ ...p, bannerImage: '' }))}>Clear</button>}
                            </div>
                        </div>
                        <button type="button" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={saveClients} disabled={clientSaving}>{clientSaving ? 'Saving…' : 'Save Clients'}</button>
                    </div>
                </div>
            );
        }

        // ── PRODUCTS ──────────────────────────────────────────────────────────
        if (currentPage === 'products' || (currentPage === 'landing' && activeProductId)) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div className="preview-sidebar-header">
                        <p className="preview-sidebar-title">{productDraft ? productDraft.name || activeProductId : 'Products'}</p>
                        <p className="preview-sidebar-hint">{productDraft ? 'Changes update live' : 'Click any product card to edit it'}</p>
                    </div>
                    {productDraft && (
                        <div className="preview-sidebar-fields">
                            <div className="form-group">
                                <label>Icon / Image</label>
                                {productDraft.image && <div style={{ width: 56, height: 56, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, marginBottom: 8 }}><img src={productDraft.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <FileUploadButton label={productDraft.image ? 'Replace' : 'Upload'} accept="image/*" onUploaded={url => setProductDraft(d => ({ ...d, image: url }))} onError={msg => setToast({ type: 'error', message: msg })} />
                                    {productDraft.image && <button type="button" className="btn-remove" onClick={() => setProductDraft(d => ({ ...d, image: '' }))}>Clear</button>}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Name</label>
                                <input value={productDraft.name} onChange={e => setProductDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. NextGen SFA" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea rows={2} value={productDraft.description} onChange={e => setProductDraft(d => ({ ...d, description: e.target.value }))} placeholder="Short line" />
                            </div>
                            <div className="form-group">
                                <label>Highlight badge</label>
                                <input value={productDraft.highlight} onChange={e => setProductDraft(d => ({ ...d, highlight: e.target.value }))} placeholder="e.g. 5-18% Sales Uplift" />
                            </div>
                            <div className="form-group">
                                <label>Status badge</label>
                                <select value={productDraft.status} onChange={e => setProductDraft(d => ({ ...d, status: e.target.value }))}>
                                    <option value="">None</option>
                                    <option value="live">Live</option>
                                    <option value="beta">Beta</option>
                                    <option value="upcoming">Coming Soon</option>
                                </select>
                            </div>
                            {(productDraft.status === 'beta' || productDraft.status === 'upcoming') && (
                                <>
                                    <div className="form-group">
                                        <label>Timeline stage</label>
                                        <select value={productDraft.timelineStage} onChange={e => setProductDraft(d => ({ ...d, timelineStage: e.target.value }))}>
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
                                        <input value={productDraft.liveDate} onChange={e => setProductDraft(d => ({ ...d, liveDate: e.target.value }))} placeholder="e.g. JUN 2026" />
                                    </div>
                                </>
                            )}
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <label style={{ margin: 0 }}>Visible on site</label>
                                <label className="admin-toggle">
                                    <input type="checkbox" checked={!!productDraft.enabled} onChange={e => setProductDraft(d => ({ ...d, enabled: e.target.checked }))} />
                                    <span className="admin-toggle-track"><span className="admin-toggle-thumb" /></span>
                                </label>
                            </div>
                            <button type="button" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={saveProduct} disabled={productSaving}>{productSaving ? 'Saving…' : 'Save Product'}</button>
                        </div>
                    )}
                </div>
            );
        }

        // ── DEFAULT (no page detected yet) ───────────────────────────────────
        return (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div className="preview-sidebar-header">
                    <p className="preview-sidebar-title">Visual Editor</p>
                    <p className="preview-sidebar-hint">Navigate to any page in the preview and click highlighted areas to edit them.</p>
                </div>
            </div>
        );
    })();

    const pageLabel = {
        landing: 'Landing Page', blog: 'Blog', about: 'About Us',
        'contact-us': 'Contact Us', clients: 'Clients', products: 'Products',
    }[currentPage] || 'Visual Editor';

    return (
        <>
            <VisualEditorLayout
                title={pageLabel}
                iframeRef={iframeRef}
                src={`${PREVIEW_URL}${startPath}`}
                onSave={effectiveOnSave}
                saving={effectiveSaving}
                sidebarContent={sidebar}
                adminHref="/content"
            />
            <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
        </>
    );
}
