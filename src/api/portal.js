import axios from 'axios';
import { ApiConstants } from '../utils/constants';

const api = axios.create({ baseURL: `${ApiConstants.BaseURL}/portal` });

export const getPortalConfig = (portalId) => api.get(`/${portalId}/config`);

export const updatePortalNavbar = (portalId, publicConfig) =>
    api.put(`/${portalId}/navbar`, { publicConfig });

export const updatePortalSidebar = (portalId, sidebar) =>
    api.put(`/${portalId}/sidebar`, { sidebar });

