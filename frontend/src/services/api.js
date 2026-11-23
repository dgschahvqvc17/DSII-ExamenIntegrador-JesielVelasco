import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    error.mensaje = data?.error || 'No se pudo conectar con el servidor LabCare';
    error.detalles = data?.details || null;
    return Promise.reject(error);
  },
);

export default api;
