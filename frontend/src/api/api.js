import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

// --- Eventos ---
export const getEventosPorMes = (mes, anio) =>
  api.get('/eventos', { params: { mes, anio } }).then((r) => r.data);

export const getEvento = (id) => api.get(`/eventos/${id}`).then((r) => r.data);

export const crearEvento = (data) => api.post('/eventos', data).then((r) => r.data);

export const actualizarEvento = (id, data) => api.put(`/eventos/${id}`, data).then((r) => r.data);

export const eliminarEvento = (id) => api.delete(`/eventos/${id}`);

// --- Clientes ---
export const getClientes = () => api.get('/clientes').then((r) => r.data);
export const crearCliente = (data) => api.post('/clientes', data).then((r) => r.data);

// --- Configuracion de correos ---
export const getEmailsConfig = () => api.get('/config/emails').then((r) => r.data);
export const crearEmailConfig = (email) => api.post('/config/emails', { email }).then((r) => r.data);
export const actualizarEmailConfig = (id, data) => api.put(`/config/emails/${id}`, data).then((r) => r.data);
export const eliminarEmailConfig = (id) => api.delete(`/config/emails/${id}`);

export default api;
