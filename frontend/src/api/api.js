import axios from 'axios';
import { conCache, invalidar } from './cache';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

// --- Eventos ---
export const getEventosPorMes = (mes, anio) =>
  conCache(`eventos:mes:${mes}-${anio}`, () =>
    api.get('/eventos', { params: { mes, anio } }).then((r) => r.data)
  );

export const getEvento = (id) =>
  conCache(`eventos:id:${id}`, () => api.get(`/eventos/${id}`).then((r) => r.data));

export const crearEvento = (data) =>
  api.post('/eventos', data).then((r) => {
    invalidar('eventos:');
    return r.data;
  });

export const actualizarEvento = (id, data) =>
  api.put(`/eventos/${id}`, data).then((r) => {
    invalidar('eventos:');
    return r.data;
  });

export const eliminarEvento = (id) =>
  api.delete(`/eventos/${id}`).then((r) => {
    invalidar('eventos:');
    return r;
  });

// --- Clientes ---
export const getClientes = () =>
  conCache('clientes', () => api.get('/clientes').then((r) => r.data));

export const crearCliente = (data) =>
  api.post('/clientes', data).then((r) => {
    invalidar('clientes');
    return r.data;
  });

// --- Configuracion de correos ---
export const getEmailsConfig = () =>
  conCache('config:emails', () => api.get('/config/emails').then((r) => r.data));

export const crearEmailConfig = (email) =>
  api.post('/config/emails', { email }).then((r) => {
    invalidar('config:emails');
    return r.data;
  });

export const actualizarEmailConfig = (id, data) =>
  api.put(`/config/emails/${id}`, data).then((r) => {
    invalidar('config:emails');
    return r.data;
  });

export const eliminarEmailConfig = (id) =>
  api.delete(`/config/emails/${id}`).then((r) => {
    invalidar('config:emails');
    return r;
  });

export default api;
