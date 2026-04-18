import axios from 'axios';
import API_BASE_URL from '../config';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔥 Universal Unwrap (أهم حاجة هنا)
const unwrap = (res) => {
  const data = res?.data;

  if (!data) return null;

  // case 1: { data: { data: [] } }
  if (data.data?.data) return data.data.data;

  // case 2: { data: [] }
  if (Array.isArray(data.data)) return data.data;

  // case 3: { data: {...} }
  if (data.data) return data.data;

  // case 4: raw
  return data;
};

const milkCollectionsService = {

  // 📄 Get All
  getAll: async (page = 1, pageSize = 10) => {
    const res = await apiClient.get(
      `/MilkCollections?page=${page}&pageSize=${pageSize}`
    );

    const payload = res?.data?.data || {};

    return {
      data: payload.data || [],
      total: payload.total || 0,
      page: payload.page || page,
      pageSize: payload.pageSize || pageSize,
    };
  },

  // ➕ Create
  create: async (data) => {
    const res = await apiClient.post('/MilkCollections', data);
    return unwrap(res);
  },

  // 🔍 Get By Id
  getById: async (id) => {
    const res = await apiClient.get(`/MilkCollections/${id}`);
    return unwrap(res);
  },

  // 📊 Daily
  getDaily: async (date) => {
    const res = await apiClient.get(`/MilkCollections/daily?date=${date}`);
    return unwrap(res) || {
      totalQuantity: 0,
      totalAmount: 0,
      count: 0,
    };
  },

  // 👨‍🌾 Suppliers 🔥 (دي كانت المشكلة)
  getSuppliers: async () => {
    const res = await apiClient.get('/Suppliers');
    return unwrap(res) || [];
  },

  // 🥛 Products
  getProducts: async () => {
    const res = await apiClient.get('/Products/lookup');
    return unwrap(res) || [];
  },
};

export default milkCollectionsService;