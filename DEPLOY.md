# 🚀 Guía de Deployment a Producción

## 📋 Checklist Pre-Deploy

### ✅ Cambios Recientes que Afectan Producción

Los cambios realizados son **seguros para producción**, pero requieren configuración adicional:

1. **✅ CORS Configurado**: Backend permite orígenes específicos en producción
2. **✅ API_URL Dinámica**: Frontend usa variables de entorno
3. **✅ AuthMiddleware**: Permite solicitudes OPTIONS (necesario para CORS)
4. **✅ Rutas Corregidas**: Todos los componentes usan configuración dinámica

---

## 🌐 Backend - Deploy a Render

### 1. Preparación

**Verifica que el archivo `.env` en tu repositorio esté en `.gitignore`:**
```bash
# Asegúrate de que .gitignore contenga:
.env
node_modules/
```

### 2. Configurar Variables de Entorno en Render

Ve a tu dashboard de Render → Tu servicio → Environment

Agrega estas variables:
```env
NODE_ENV=production
PORT=4000
SUPABASE_URL=tu_url_de_supabase
SUPABASE_ANON_KEY=tu_clave_anon
JWT_SECRET=tu_secreto_jwt
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_contraseña_de_app
```

### 3. Actualizar CORS para GitHub Pages

**IMPORTANTE**: Antes de hacer push, actualiza [server.js](asesur-backend/server.js#L58-L60) con tu usuario real de GitHub:

```javascript
const allowedOrigins = [
  'https://asesur-platform.onrender.com',
  'https://TU-USUARIO.github.io'  // ⚠️ REEMPLAZAR
];
```

Para encontrar tu usuario:
```bash
git config user.name
# O verifica la URL de tu repositorio:
git remote get-url origin
# github.com/TU-USUARIO/asesur-platform
```

### 4. Deploy

```bash
cd asesur-backend
git add .
git commit -m "feat: configuración para producción"
git push origin main
```

Render detectará el push y desplegará automáticamente.

---

## 🎨 Frontend - Deploy a GitHub Pages

### 1. Verificar Configuración

El archivo [.env.production](asesur-frontend/.env.production) ya está creado con:
```env
VITE_API_URL=https://asesur-platform.onrender.com/api
```

### 2. Construir y Desplegar

```bash
cd asesur-frontend

# Construir versión de producción
npm run build

# Desplegar a GitHub Pages
npm run deploy
```

El frontend estará disponible en:
```
https://TU-USUARIO.github.io/asesur-platform/
```

### 3. Verificar Build

Antes de desplegar, verifica que el build no tenga errores:
```bash
npm run build

# Previsualizar localmente
npm run preview
```

---

## 🔍 Verificación Post-Deploy

### Backend (Render)

1. **Health Check**:
```bash
curl https://asesur-platform.onrender.com/
# Debe responder: "Servidor Asesur Seguro funcionando en proceso XXXX"
```

2. **Verificar CORS**:
```bash
curl -I https://asesur-platform.onrender.com/api/config \
  -H "Origin: https://TU-USUARIO.github.io"
# Debe incluir: Access-Control-Allow-Origin
```

3. **Ver Logs en Render**:
   - Dashboard → Tu servicio → Logs
   - Busca: `🛡️ Servidor escuchando en puerto 4000`

### Frontend (GitHub Pages)

1. **Abrir en navegador**:
```
https://TU-USUARIO.github.io/asesur-platform/
```

2. **Verificar en Consola del navegador (F12)**:
   - No debe haber errores CORS
   - Verificar que las peticiones vayan a `https://asesur-platform.onrender.com/api`

3. **Probar Autenticación**:
   - Iniciar sesión con Supabase
   - Verificar que el token se guarda en localStorage
   - Navegar por las secciones

---

## ⚠️ Problemas Comunes

### Error: "CORS request blocked"

**Causa**: El dominio de GitHub Pages no está en la lista de orígenes permitidos.

**Solución**:
1. Verifica tu usuario de GitHub: `git config user.name`
2. Actualiza [server.js](asesur-backend/server.js#L60):
   ```javascript
   'https://TU-USUARIO-REAL.github.io'
   ```
3. Haz push al backend
4. Espera que Render redeploy (2-3 minutos)

### Error: "Token inválido o expirado"

**Causa**: El token de Supabase expiró (duración: 1 hora).

**Solución**:
1. Cierra sesión
2. Vuelve a iniciar sesión
3. El token se renovará automáticamente

### Frontend muestra "localhost:4000" en producción

**Causa**: El archivo `.env.production` no se está usando.

**Solución**:
```bash
# Verificar que existe
cat asesur-frontend/.env.production

# Limpiar build anterior
rm -rf asesur-frontend/dist

# Reconstruir
npm run build

# Redesplegar
npm run deploy
```

### Backend no inicia en Render

**Causa**: Falta alguna variable de entorno.

**Solución**:
1. Ve a Render → Environment
2. Verifica que todas las variables existan:
   - `NODE_ENV=production`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `JWT_SECRET`
3. Forzar redeploy: Settings → Manual Deploy

---

## 📂 Estructura de Variables de Entorno

### Local (Desarrollo)

**Backend** (`asesur-backend/.env`):
```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
JWT_SECRET=...
EMAIL_USER=...
EMAIL_PASS=...
PORT=4000
NODE_ENV=development
```

**Frontend** (`asesur-frontend/.env`):
```env
VITE_API_URL=http://localhost:4000/api
```

### Producción

**Backend** (Render Dashboard → Environment):
```env
NODE_ENV=production
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
JWT_SECRET=...
EMAIL_USER=...
EMAIL_PASS=...
```

**Frontend** (`asesur-frontend/.env.production`):
```env
VITE_API_URL=https://asesur-platform.onrender.com/api
```

---

## 🎯 Resumen de URLs

| Entorno | Backend | Frontend |
|---------|---------|----------|
| **Local** | `http://localhost:4000` | `http://localhost:5173` |
| **Producción** | `https://asesur-platform.onrender.com` | `https://TU-USUARIO.github.io/asesur-platform/` |

---

## 📝 Comandos Rápidos

```bash
# === BACKEND ===
cd asesur-backend
git add . && git commit -m "deploy: actualización producción"
git push origin main
# Render autodeploys

# === FRONTEND ===
cd asesur-frontend
npm run build      # Construir
npm run preview    # Probar local
npm run deploy     # Desplegar a GitHub Pages

# === VERIFICAR ===
# Backend
curl https://asesur-platform.onrender.com/

# Frontend (abre en navegador)
xdg-open https://TU-USUARIO.github.io/asesur-platform/
```

---

## ✅ Checklist Final

Antes de ir a producción:

- [ ] Variables de entorno configuradas en Render
- [ ] Usuario de GitHub actualizado en `server.js` (CORS)
- [ ] Archivo `.env.production` creado en frontend
- [ ] Build exitoso: `npm run build` sin errores
- [ ] Credenciales de Supabase válidas
- [ ] JWT_SECRET configurado
- [ ] Email SMTP configurado (opcional para notificaciones)
- [ ] `.gitignore` incluye `.env`
- [ ] Commit y push realizados

¡Todo listo para producción! 🚀
