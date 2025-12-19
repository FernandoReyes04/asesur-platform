
# 🛡️ Plataforma de Gestión de Seguros - Grupo Asesur

Sistema integral para la administración de clientes y pólizas de seguros, con soporte multiusuario en tiempo real y arquitectura segura.

---

## 🚀 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
* [Node.js](https://nodejs.org/) (v16 o superior)
* [Git](https://git-scm.com/)

---

## 🛠️ Instalación y Configuración

Sigue estos pasos para levantar el proyecto en tu entorno local.

### 1. Clonar el repositorio
```bash
git clone [https://github.com/FernandoReyes04/asesur-platform.git](https://github.com/FernandoReyes04/asesur-platform.git)
cd asesur-platform
```
### 2. Configuración del Backend (Servidor)

El backend maneja la lógica de negocio, seguridad y conexión a base de datos.

Entra a la carpeta del backend:
```Bash
cd asesur-backend
```
### Instala las dependencias:
```Bash
npm install
```

## Configurar Variables de Entorno: 
Crea un archivo .env en la carpeta asesur-backend y agrega tus credenciales de Supabase:
Fragmento de código

SUPABASE_URL=TU_URL_DE_SUPABASE
SUPABASE_KEY=TU_ANON_KEY_DE_SUPABASE
PORT=3000

Inicia el servidor:
```Bash
    node server.js
```
Deberías ver: 🛡️ Servidor BLINDADO corriendo en http://localhost:3000

## 3. Configuración del Frontend (Cliente Web)

El frontend es la interfaz visual hecha con React.

    Abre una nueva terminal (sin cerrar la del backend) y vuelve a la raíz:
    
```Bash
cd ..
cd asesur-frontend
```

### Instala las dependencias:
``` Bash
npm install
```

## Configurar Conexión: 
Asegúrate de que el archivo src/supabaseClient.js tenga tus credenciales o configúralas en un archivo .env si es necesario.

Inicia la aplicación:
```Bash
    npm run dev
```
Abre tu navegador en el link que aparece (usualmente http://localhost:5173)

🌟 Características Principales

    Gestión de Clientes: CRUD completo con validación de datos.

    Gestión de Pólizas: Registro, edición y visualización de estatus.

    Multiusuario Realtime: Actualización instantánea de datos entre sesiones (WebSockets).

    Seguridad:

        Protección contra fuerza bruta (Rate Limiting).

        Cabeceras seguras (Helmet).

        Sanitización de inputs y prevención de SQL Injection.

    Dashboard Interactivo: Métricas y accesos rápidos por rol.

### 🧪 Tecnologías Utilizadas

    Frontend: React, Vite

    Backend: Node.js, Express

    Base de Datos & Auth: Supabase (PostgreSQL)

    Seguridad: Helmet, Express-Rate-Limit, Cors
