import axios from 'axios';

const api = axios.create({ baseURL: '/api/site' });

// Content — single {title, description, image}
export const getContent = () => api.get('/content');
export const updateContent = (content) => api.put('/content', { content });

// Landing sections — unified container for image / video / card / blog sections.
// Each section declares its own `kind` and `cardinality`; item shape depends on
// the kind (image: url/alt/caption — video: url/title/description/thumbnail —
// card: title/subtitle/description/points/image — blog: blogId ref).
export const getSections = () => api.get('/sections');
export const updateSections = (sections) => api.put('/sections', { sections });

// Enabled catalog blogs that aren't already featured in any blog-kind section.
export const getAvailableBlogs = () => api.get('/sections/available-blogs');

// Blog catalog (authoritative, edited on Pages → Blog)
export const listBlogs = () => api.get('/blogs');
export const createBlog = (payload) => api.post('/blogs', payload);
export const reorderBlogs = (order) => api.put('/blogs/reorder', { order });
export const updateBlog = (blogId, payload) => api.put(`/blogs/${blogId}`, payload);
export const deleteBlog = (blogId) => api.delete(`/blogs/${blogId}`);

// Blog page bg image (shown above the public blog page)
export const getBlogsBgImage = () => api.get('/blogs/bg-image');
export const updateBlogsBgImage = (bgImage) => api.put('/blogs/bg-image', { bgImage });

// SEO
export const listSeo = () => api.get('/seo');
export const getSeo = (pageKey) => api.get(`/seo/${pageKey}`);
export const updateSeo = (pageKey, seo) => api.put(`/seo/${pageKey}`, { seo });

// Pages
export const listPages = () => api.get('/pages');
export const getPage = (pageKey) => api.get(`/pages/${pageKey}`);
export const updatePage = (pageKey, page) => api.put(`/pages/${pageKey}`, { page });

// Products (catalog) — seeded from DB; no create/delete from the UI
export const listProducts = () => api.get('/products');
export const reorderProducts = (order) => api.put('/products/reorder', { order });
export const getProduct = (productId) => api.get(`/products/${productId}`);
export const updateProduct = (productId, payload) => api.put(`/products/${productId}`, payload);
export const getProductSidebar = (productId) => api.get(`/products/${productId}/sidebar`);
export const updateProductSidebar = (productId, sidebar) =>
    api.put(`/products/${productId}/sidebar`, { sidebar });

// Upload
export const uploadAsset = (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// Page keys (kept in sync with backend)
export const SEO_PAGES = [
    { key: 'landing', label: 'Landing' },
    { key: 'blog', label: 'Blog' },
    { key: 'contact-us', label: 'Contact Us' },
    { key: 'client', label: 'Client' },
    { key: 'about-us', label: 'About Us' }
];

// Full set of pages shown in tab navigation. 'blog' renders a dedicated editor;
// the rest use the generic SitePageEditor.
export const SITE_PAGES = [
    { key: 'blog', label: 'Blog' },
    { key: 'contact-us', label: 'Contact Us' },
    { key: 'client', label: 'Client' },
    { key: 'about-us', label: 'About Us' }
];
