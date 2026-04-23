import axios from 'axios';

const api = axios.create({ baseURL: '/api/experiencePortal' });

export const getPublicConfig = () => api.get('/publicConfig');
export const updatePublicConfig = (publicConfig) => api.put('/publicConfig', { publicConfig });

export const getSEO = () => api.get('/SEO');
export const updateSEO = (seo) => api.put('/SEO', { seo });

export const getProducts = () => api.get('/products');
export const updateProducts = (products) => api.put('/products', { products });

export const getProductSEO = (productId) => api.get(`/products/${productId}/SEO`);
export const updateProductSEO = (productId, seo) => api.put(`/products/${productId}/SEO`, { seo });

export const getProductPublicConfig = (productId) => api.get(`/products/${productId}/publicConfig`);
export const updateProductPublicConfig = (productId, publicConfig) =>
    api.put(`/products/${productId}/publicConfig`, { publicConfig });

export const uploadAsset = (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};
