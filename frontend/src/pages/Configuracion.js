import React, { useEffect, useState } from 'react';
import {
  getEmailsConfig,
  crearEmailConfig,
  actualizarEmailConfig,
  eliminarEmailConfig,
} from '../api/api';

export default function Configuracion() {
  const [emails, setEmails] = useState([]);
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargar = () => {
    setCargando(true);
    getEmailsConfig()
      .then(setEmails)
      .finally(() => setCargando(false));
  };

  useEffect(cargar, []);

  const handleAgregar = async (e) => {
    e.preventDefault();
    if (!nuevoEmail.trim()) return;
    try {
      await crearEmailConfig(nuevoEmail.trim());
      setNuevoEmail('');
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al agregar el correo');
    }
  };

  const toggleActivo = async (item) => {
    await actualizarEmailConfig(item.id_config_email, { activo: !item.activo });
    cargar();
  };

  const eliminar = async (item) => {
    if (!window.confirm(`¿Eliminar ${item.email}?`)) return;
    await eliminarEmailConfig(item.id_config_email);
    cargar();
  };

  return (
    <div className="pagina-configuracion">
      <h1>Configuración de notificaciones</h1>
      <p>Estas direcciones recibirán un correo cada vez que se cree o edite un evento.</p>

      <form onSubmit={handleAgregar} className="fila">
        <input
          type="email"
          placeholder="correo@ejemplo.com"
          value={nuevoEmail}
          onChange={(e) => setNuevoEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn-primario">Agregar</button>
      </form>

      {cargando ? (
        <p>Cargando…</p>
      ) : (
        <table className="tabla-emails">
          <thead>
            <tr>
              <th>Correo</th>
              <th>Activo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {emails.map((item) => (
              <tr key={item.id_config_email}>
                <td>{item.email}</td>
                <td>
                  <input type="checkbox" checked={item.activo} onChange={() => toggleActivo(item)} />
                </td>
                <td>
                  <button onClick={() => eliminar(item)} className="btn-peligro">Eliminar</button>
                </td>
              </tr>
            ))}
            {emails.length === 0 && (
              <tr><td colSpan={3}>No hay correos configurados todavía.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
