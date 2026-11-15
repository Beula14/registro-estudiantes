require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { validarEstudiante, CARRERAS } = require('./validaciones');

const app = express();
const PORT = process.env.PORT || 3000;

// Claves de prueba oficiales de Google reCAPTCHA v2 (siempre válidas en desarrollo).
// En producción se reemplazan con las variables de entorno.
const RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function verificarRecaptcha(token, ip) {
  if (!token) return false;
  try {
    const params = new URLSearchParams({ secret: RECAPTCHA_SECRET_KEY, response: token, remoteip: ip || '' });
    const r = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body: params });
    const data = await r.json();
    return data.success === true;
  } catch (err) {
    console.error('Error verificando reCAPTCHA:', err.message);
    return false;
  }
}

// Configuración pública para el frontend
app.get('/api/config', (req, res) => {
  res.json({ recaptchaSiteKey: RECAPTCHA_SITE_KEY, carreras: CARRERAS });
});

// ===== WEB SERVICE TIPO POST: registro de estudiantes =====
app.post('/api/estudiantes', async (req, res) => {
  try {
    const { recaptchaToken, ...estudiante } = req.body || {};

    const captchaOk = await verificarRecaptcha(recaptchaToken, req.ip);
    if (!captchaOk) {
      return res.status(400).json({ ok: false, mensaje: 'Verificación reCAPTCHA inválida. Intente de nuevo.' });
    }

    const { valido, errores, datos } = validarEstudiante(estudiante);
    if (!valido) {
      return res.status(422).json({ ok: false, mensaje: 'Datos inválidos', errores });
    }

    if (await db.existeCarne(datos.carne)) {
      return res.status(409).json({ ok: false, mensaje: 'Ya existe un estudiante con ese carné', errores: { carne: 'Carné ya registrado' } });
    }

    const guardado = await db.guardar(datos);
    res.status(201).json({ ok: true, mensaje: 'Estudiante registrado correctamente', estudiante: guardado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

// Consulta de estudiantes (usado por la ventana de consulta)
app.get('/api/estudiantes', async (req, res) => {
  try {
    const estudiantes = await db.listar();
    res.json({ ok: true, total: estudiantes.length, estudiantes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true, db: db.getModo() }));

db.conectar()
  .then(() => app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  });
