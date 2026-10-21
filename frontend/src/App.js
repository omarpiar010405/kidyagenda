import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import CalendarioPage from './pages/CalendarioPage';
import Configuracion from './pages/Configuracion';
import './App.css';

// Wordmark "KidyLand" dibujado con CSS (sin imagenes).
// Colores por letra segun la guia de marca:
// K y i rosa/rojo, d verde, y celeste, L amarilla, a naranja, n rosa, d azul.
const LETRAS_KIDYLAND = [
  { letra: 'K', clase: 'l1' },
  { letra: 'i', clase: 'l2' },
  { letra: 'd', clase: 'l3' },
  { letra: 'y', clase: 'l4' },
  { letra: 'L', clase: 'l5' },
  { letra: 'a', clase: 'l6' },
  { letra: 'n', clase: 'l7' },
  { letra: 'd', clase: 'l8' },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="rayos-comic" aria-hidden="true" />
      <div className="rayos-comic izq" aria-hidden="true" />

      <div className="app-layout">
        <header className="app-header">
          <h1>
            <span className="marca-kidy" aria-label="KidyLand">
              {LETRAS_KIDYLAND.map(({ letra, clase }) => (
                <span key={clase} className={`marca-kidy-letra ${clase}`}>
                  {letra}
                </span>
              ))}
            </span>
            <span className="marca-tag">KidyEventos</span>
          </h1>
          <nav className="nav-escritorio">
            <NavLink to="/" end>Calendario</NavLink>
            <NavLink to="/configuracion">Configuración</NavLink>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<CalendarioPage />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Routes>
        </main>

        <div className="franja-confeti" aria-hidden="true" />

        <nav className="nav-movil">
          <NavLink to="/" end>
            <span className="nav-movil-icono">📅</span>
            <span>Calendario</span>
          </NavLink>
          <NavLink to="/configuracion">
            <span className="nav-movil-icono">⚙️</span>
            <span>Configuración</span>
          </NavLink>
        </nav>
      </div>
    </BrowserRouter>
  );
}
