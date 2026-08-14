# Tutorial: Ejecución local y despliegue en Render

## ⚠️ Nota de seguridad importante

Este proyecto usa una base de datos MySQL real cuyas credenciales me compartiste en el chat.
Las dejé únicamente en `backend/.env` (que está en `.gitignore`, así que **nunca se sube a GitHub**),
y en Render se configuran como variables de entorno del servicio, no como texto en el código.

Aun así, como esa contraseña ya quedó escrita en esta conversación, te recomiendo **rotarla** desde
el panel de Clever Cloud (Bases de datos → tu instancia → Credenciales → regenerar contraseña) una vez
termines de hacer pruebas, y actualizarla en Render y en tu `.env` local.

---

## Parte 1: Ejecución en local

### Requisitos previos

- Node.js 18 o superior (`node -v`)
- Una cuenta de SendGrid con una API Key (para el envío de correos) — opcional para probar el resto del sistema
- Acceso a internet, ya que la base de datos MySQL está alojada en Clever Cloud (no es local)

### 1. Backend

```bash
cd backend
npm install
```

El archivo `backend/.env` ya viene con las credenciales de conexión a MySQL. Solo te falta completar tu API Key de SendGrid:

```
SENDGRID_API_KEY=TU_API_KEY_DE_SENDGRID
SENDGRID_FROM_EMAIL=notificaciones@tudominio.com
```

> Si no configuras SendGrid, la aplicación funciona igual: simplemente no se enviarán correos
> (queda registrado en consola un aviso, sin romper la creación/edición de eventos).

Levanta el servidor:

```bash
npm run dev
```

Deberías ver en consola:

```
✅ Conexion a MySQL establecida correctamente.
✅ Modelos sincronizados con la base de datos.
🚀 Servidor escuchando en el puerto 4000
```

`sequelize.sync({ alter: true })` crea automáticamente las tablas (`clientes`, `eventos`,
`detalles_operativos`, `tareas_evento`, `extras_mobiliario`, `pagos`, `config_emails`) la primera vez que
arranca el servidor — no necesitas ejecutar SQL manualmente.

Prueba rápida: abre `http://localhost:4000/api/health` — deberías ver `{"status":"ok"}`.

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm start
```

Se abrirá `http://localhost:3000`. El archivo `frontend/.env` ya apunta al backend local
(`REACT_APP_API_URL=http://localhost:4000/api`).

### 3. Primer uso

1. Ve a la pestaña **Configuración** y agrega al menos un correo (para recibir notificaciones).
2. Vuelve a **Calendario**, haz clic en cualquier día y crea un evento de prueba.
3. Si configuraste SendGrid correctamente, revisa la bandeja del correo agregado.

---

## Parte 2: Despliegue en Render (un solo servicio)

Vamos a desplegar **un solo Web Service** en Render: Express sirve la API y, al mismo tiempo,
los archivos estáticos del build de React (`frontend/build`). Así solo pagas/administras un
servicio y no necesitas configurar CORS entre servicios. La base de datos MySQL ya existe en
Clever Cloud, así que no hace falta crear nada de base de datos en Render.

### Paso 0: Sube el proyecto a GitHub

```bash
cd proyecto-eventos
git init
git add .
git commit -m "KidyAgenda: sistema de eventos"
```

Crea un repositorio en GitHub y súbelo:

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

Verifica que **`backend/.env` no esté en el repositorio** (revisa en GitHub que no aparezca el
archivo). Si por accidente lo subiste, elimínalo del repo y rota la contraseña de la base de datos.

### Paso 1: Crear el Web Service en Render

1. Entra a [render.com](https://render.com) e inicia sesión.
2. Clic en **New +** → **Web Service**.
3. Conecta tu cuenta de GitHub y selecciona el repositorio del proyecto.
4. Configura:
   - **Name:** `kidyagenda` (o el que prefieras)
   - **Root Directory:** `backend`
   - **Region:** la más cercana a tus usuarios
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build:frontend`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (para pruebas) o el plan que necesites

   > El comando de build instala las dependencias del backend, luego las del frontend y
   > compila React en `frontend/build`. El arranque (`node server.js`) sirve la API y el build.

5. En la sección **Environment Variables**, agrega estas variables (sin comillas):

   | Key | Value |
   |---|---|
   | `DB_HOST` | `bdp0u7zylrjftzbm7ww5-mysql.services.clever-cloud.com` |
   | `DB_NAME` | `bdp0u7zylrjftzbm7ww5` |
   | `DB_USER` | `udsfoceigykoyqt0` |
   | `DB_PASSWORD` | `2iTgCOmvY9dBXbrrCQY1` (idealmente ya rotada) |
   | `DB_PORT` | `3306` |
   | `NODE_ENV` | `production` |
   | `SENDGRID_API_KEY` | tu API key de SendGrid |
   | `SENDGRID_FROM_EMAIL` | tu correo remitente verificado en SendGrid |
   | `FRONTEND_URL` | la URL de tu propio servicio (ej. `https://kidyagenda.onrender.com`) — es para CORS, con un solo servicio no es estrictamente necesario, pero déjala por seguridad |

6. Clic en **Create Web Service**. Render instalará dependencias, compilará el frontend y
   arrancará el backend.
7. Cuando termine, copia la URL pública, algo como `https://kidyagenda.onrender.com`.

### Paso 2: Prueba final

1. Abre `https://kidyagenda.onrender.com` — deberías ver el calendario (el frontend compilado).
2. Visita `https://kidyagenda.onrender.com/api/health` — deberías ver `{"status":"ok"}`.
3. Entra a **Configuración** y agrega un correo real.
4. Crea un evento desde el calendario y confirma que llegue el correo de notificación.
5. Prueba una ruta interna (ej. `https://kidyagenda.onrender.com/configuracion`) — debe cargar
   la vista (React Router funciona porque Express devuelve `index.html` para rutas no-API).

### Paso 3: Configurar SendGrid en producción

1. En [sendgrid.com](https://sendgrid.com), verifica un remitente (Single Sender Verification) o
   tu dominio completo, en **Settings → Sender Authentication**.
2. Usa ese correo verificado como `SENDGRID_FROM_EMAIL`.
3. Genera una API Key en **Settings → API Keys** con permiso de "Mail Send" y colócala en
   `SENDGRID_API_KEY` en Render.

### Notas sobre el plan gratuito de Render

- Los servicios Free "duermen" tras un periodo de inactividad; la primera petición después de
  dormir puede tardar unos segundos en responder (cold start). Esto es normal.
- Si necesitas que el servicio esté siempre activo, considera un plan de pago o un servicio externo
  de "ping" periódico.

### Solución de problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| El backend no conecta a MySQL | Firewall/whitelist de Clever Cloud | Verifica en Clever Cloud que se permitan conexiones externas (revisa "Network"/"Add-on" settings) |
| El build falla en Render | Falta memoria en el plan Free | Repite el deploy; si persiste, revisa los logs. El build de React puede requerir ~2GB; si falla, usa el plan Starter |
| No llegan los correos | API Key inválida o remitente no verificado | Revisa logs del backend en Render y el panel de actividad de SendGrid |
| La URL raíz da error pero `/api/health` funciona | El build del frontend no se generó | Revisa los logs del build en Render; confirma que `npm run build:frontend` terminó y creó `frontend/build` |
| Cambios en el frontend no se ven | El build no se recompiló | Render hace build automático en cada deploy; si pruebas en local, ejecuta `npm run build` en `frontend` |

### Para probar el modo producción en local

```bash
cd frontend && npm run build
cd ../backend && npm start
```

Abre `http://localhost:4000` — Express sirve el build de React y la API en el mismo puerto.
