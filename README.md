# Examen Parcial – Registro de Estudiantes

Aplicación web completa con:

- **Formulario de registro de estudiantes** (`public/index.html`) con todas las validaciones obligatorias.
- **Web Service de registro tipo POST en la nube** (`POST /api/estudiantes`) desarrollado en Node.js + Express.
- **Envío de datos con método POST** (`fetch` con `method: 'POST'` y cuerpo JSON).
- **Ventana de consulta** (`public/consulta.html`) con tabla de todos los estudiantes, **buscador**, **botón Actualizar** y **todas las columnas guardadas**.
- **Botón de envío deshabilitado** hasta que todos los campos sean válidos y el reCAPTCHA esté marcado.
- **Google reCAPTCHA v2** ("No soy un robot") validado en el navegador **y** en el servidor.

---

## 1. Herramientas necesarias

| Herramienta | Versión | Uso | Descarga |
|---|---|---|---|
| Node.js (incluye npm) | 18 o superior (recomendado 20 LTS) | Ejecutar el Web Service | https://nodejs.org |
| Visual Studio Code | Cualquiera | Editor de código | https://code.visualstudio.com |
| Navegador web | Chrome / Edge / Firefox | Usar la aplicación | — |
| Git *(opcional)* | Cualquiera | Subir el código a GitHub para desplegar | https://git-scm.com |
| Cuenta de GitHub | — | Repositorio del código | https://github.com |
| Cuenta de Render (gratis) | — | Hospedar el Web Service en la nube | https://render.com |
| Render PostgreSQL (gratis) | PostgreSQL 16 | Base de datos en la nube (se crea con `render.yaml`) | https://render.com |
| MongoDB Atlas *(alternativa opcional)* | Cluster M0 | Base de datos en la nube | https://www.mongodb.com/atlas |
| Google reCAPTCHA | v2 casilla | Protección contra bots | https://www.google.com/recaptcha/admin |

### Librerías (se instalan con `npm install`)

| Paquete | Uso |
|---|---|
| express | Servidor web y Web Service REST |
| pg | Conexión a PostgreSQL (base de datos en la nube) |
| mongoose | Conexión a MongoDB Atlas (alternativa) |
| cors | Permite consumir el Web Service desde otro dominio |
| dotenv | Lee variables de entorno del archivo `.env` |

---

## 2. Estructura del proyecto

```
examen-parcial/
├── server.js            # Web Service (POST y GET /api/estudiantes, verificación reCAPTCHA)
├── validaciones.js      # Validaciones del lado del servidor
├── db.js                # Conexión a PostgreSQL / MongoDB (o archivo JSON en pruebas locales)
├── package.json         # Dependencias y scripts
├── render.yaml          # Blueprint de Render (Web Service + base de datos PostgreSQL)
├── iniciar.bat          # Arranque rápido en Windows
├── .env.example         # Variables de entorno de ejemplo
├── data/                # Almacenamiento local de prueba (si no hay MongoDB)
└── public/
    ├── index.html       # Formulario de registro
    ├── consulta.html    # Ventana de consulta (tabla, buscador, actualizar)
    ├── css/styles.css
    └── js/
        ├── config.js    # URL del Web Service
        ├── registro.js  # Validaciones en vivo + envío POST + reCAPTCHA
        └── consulta.js  # Carga, búsqueda y actualización de la tabla
```

---

## 3. Levantar el proyecto localmente

**Forma rápida (Windows):** doble clic en `iniciar.bat`. Instala dependencias la primera vez, inicia el servidor y abre el navegador. No cierre la ventana negra mientras use la app.

**Forma manual:**


1. Descomprimir el `.zip` y abrir la carpeta en una terminal (o en VS Code → Terminal).
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. *(Opcional)* Copiar `.env.example` a `.env` y colocar la cadena de MongoDB Atlas y las claves de reCAPTCHA.
   Si no se crea el `.env`, la app funciona igual: guarda en `data/estudiantes.json` y usa las claves de prueba de reCAPTCHA de Google.
4. Iniciar el servidor:
   ```bash
   npm start
   ```
5. Abrir en el navegador:
   - Registro: http://localhost:3000
   - Consulta: http://localhost:3000/consulta.html

---

## 4. Publicar el Web Service en la nube (Render)

El archivo `render.yaml` es un **Blueprint**: Render crea automáticamente el Web Service y una base de datos **PostgreSQL** gratuita, y los conecta con la variable `DATABASE_URL`. La tabla `estudiantes` se crea sola al iniciar el servidor.

1. Subir el proyecto a un repositorio de **GitHub** (sin la carpeta `node_modules`).
2. Entrar a https://render.com e iniciar sesión con GitHub.
3. **New → Blueprint** → seleccionar el repositorio → **Apply**.
4. Esperar a que termine el deploy (2–5 min). La app queda en `https://registro-estudiantes-xxxx.onrender.com`.
   - Formulario: `/`
   - Consulta: `/consulta.html`
   - Web Service POST: `/api/estudiantes`

**reCAPTCHA:** si no se configuran `RECAPTCHA_SITE_KEY` y `RECAPTCHA_SECRET_KEY`, se usan las claves de prueba de Google (muestran el aviso "solo para pruebas"). Para claves reales: https://www.google.com/recaptcha/admin → tipo **v2 casilla "No soy un robot"** → dominios `localhost` y el dominio de Render → copiar las claves en **Environment** del servicio en Render.

> Notas del plan gratuito: el servicio "se duerme" tras 15 min sin uso (la primera visita tarda ~1 min en despertar) y la base de datos gratuita de Render vence a los 30 días.

**Alternativa MongoDB Atlas:** en lugar de `DATABASE_URL`, definir `MONGODB_URI` con la cadena de conexión de Atlas.

---

## 5. Documentación del Web Service

URL base local: `http://localhost:3000` — en la nube: `https://<nombre>.onrender.com`

### POST `/api/estudiantes` – Registrar estudiante

**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "carne": "0901202301",
  "nombres": "Juan Carlos",
  "apellidos": "Pérez López",
  "correo": "juan@correo.com",
  "carrera": "Ingeniería en Sistemas",
  "telefono": "5555-1234",
  "fechaNacimiento": "2004-05-10",
  "genero": "Masculino",
  "recaptchaToken": "<token generado por el widget>"
}
```

**Respuestas:**

| Código | Significado |
|---|---|
| 201 | Estudiante registrado. Devuelve `{ ok: true, mensaje, estudiante }` |
| 400 | reCAPTCHA inválido |
| 409 | El carné ya está registrado |
| 422 | Datos inválidos. Devuelve `errores` por campo |
| 500 | Error interno |

### GET `/api/estudiantes` – Listar estudiantes
Devuelve `{ ok: true, total, estudiantes: [...] }` ordenados del más reciente al más antiguo.

### GET `/api/health` – Estado del servicio
Devuelve `{ ok: true, db: "mongodb" | "archivo" }`.

---

## 6. Validaciones implementadas (cliente y servidor)

| Campo | Tipo de input | Validación |
|---|---|---|
| Carné | text | Requerido, mínimo 8 caracteres, solo alfanumérico; no se permite duplicado |
| Nombres | text | Requerido, solo letras (incluye tildes y ñ) y espacios |
| Apellidos | text | Requerido, solo letras (incluye tildes y ñ) y espacios |
| Correo | email | Requerido, formato válido de email |
| Carrera | select | Requerido, debe pertenecer al catálogo |
| Teléfono | tel | Requerido, formato guatemalteco `####-####` (máscara automática) |
| Fecha de nacimiento | date | Requerido, el estudiante debe tener al menos 16 años |
| Género | radio | Requerido (Masculino / Femenino / Otro) |

**Catálogo de carreras:** Ingeniería en Sistemas, Ingeniería Industrial, Administración de Empresas, Contaduría Pública, Psicología, Ingeniería Civil.

**Requerimientos adicionales:**
- El botón **Registrar estudiante** permanece deshabilitado hasta que todos los campos son válidos y se marca el reCAPTCHA.
- El servidor vuelve a verificar el token de reCAPTCHA con Google y vuelve a validar todos los campos antes de guardar.

---

## 7. Prueba rápida del Web Service (sin navegador)

Con las claves de prueba de Google, cualquier token es aceptado:

```bash
curl -X POST http://localhost:3000/api/estudiantes \
  -H "Content-Type: application/json" \
  -d '{"carne":"0901202301","nombres":"Juan","apellidos":"Pérez","correo":"juan@correo.com","carrera":"Psicología","telefono":"5555-1234","fechaNacimiento":"2004-05-10","genero":"Masculino","recaptchaToken":"prueba"}'
```
