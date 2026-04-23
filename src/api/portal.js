import axios from 'axios';

const api = axios.create({ baseURL: '/api/portal' });

export const getPortalConfig = (portalId) => api.get(`/${portalId}/config`);

export const updatePortalNavbar = (portalId, publicConfig) =>
    api.put(`/${portalId}/navbar`, { publicConfig });

export const updatePortalSidebar = (portalId, sidebar) =>
    api.put(`/${portalId}/sidebar`, { sidebar });

