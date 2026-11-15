// Capa de datos. Se elige automáticamente según las variables de entorno:
// - DATABASE_URL -> PostgreSQL en la nube (Render PostgreSQL)  [usado en el despliegue]
// - MONGODB_URI  -> MongoDB Atlas (alternativa en la nube)
// - ninguna      -> archivo data/estudiantes.json (pruebas locales)
const fs = require('fs');
const path = require('path');

const ARCHIVO = path.join(__dirname, 'data', 'estudiantes.json');
let modo = 'archivo';
let pool = null;      // PostgreSQL
let Estudiante = null; // MongoDB

async function conectar() {
  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    const local = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: local ? false : { rejectUnauthorized: false }
    });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS estudiantes (
        id               SERIAL PRIMARY KEY,
        carne            VARCHAR(30)  NOT NULL UNIQUE,
        nombres          VARCHAR(100) NOT NULL,
        apellidos        VARCHAR(100) NOT NULL,
        correo           VARCHAR(150) NOT NULL,
        carrera          VARCHAR(100) NOT NULL,
        telefono         VARCHAR(9)   NOT NULL,
        fecha_nacimiento DATE         NOT NULL,
        genero           VARCHAR(20)  NOT NULL,
        fecha_registro   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )`);
    modo = 'postgresql';
  } else if (process.env.MONGODB_URI) {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    const schema = new mongoose.Schema(
      {
        carne: { type: String, required: true, unique: true },
        nombres: { type: String, required: true },
        apellidos: { type: String, required: true },
        correo: { type: String, required: true },
        carrera: { type: String, required: true },
        telefono: { type: String, required: true },
        fechaNacimiento: { type: String, required: true },
        genero: { type: String, required: true }
      },
      { timestamps: { createdAt: 'fechaRegistro', updatedAt: false }, versionKey: false }
    );
    Estudiante = mongoose.model('Estudiante', schema, 'estudiantes');
    modo = 'mongodb';
  } else {
    if (!fs.existsSync(path.dirname(ARCHIVO))) fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
    if (!fs.existsSync(ARCHIVO)) fs.writeFileSync(ARCHIVO, '[]');
  }
  console.log(`Base de datos: ${modo}`);
}

const SELECT_PG = `
  SELECT id::text AS "_id", carne, nombres, apellidos, correo, carrera, telefono,
         to_char(fecha_nacimiento, 'YYYY-MM-DD') AS "fechaNacimiento", genero,
         fecha_registro AS "fechaRegistro"
  FROM estudiantes`;

function leerArchivo() {
  return JSON.parse(fs.readFileSync(ARCHIVO, 'utf8'));
}

async function existeCarne(carne) {
  if (modo === 'postgresql') {
    const r = await pool.query('SELECT 1 FROM estudiantes WHERE carne = $1', [carne]);
    return r.rowCount > 0;
  }
  if (modo === 'mongodb') return !!(await Estudiante.exists({ carne }));
  return leerArchivo().some((e) => e.carne === carne);
}

async function guardar(d) {
  if (modo === 'postgresql') {
    const r = await pool.query(
      `INSERT INTO estudiantes (carne, nombres, apellidos, correo, carrera, telefono, fecha_nacimiento, genero)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [d.carne, d.nombres, d.apellidos, d.correo, d.carrera, d.telefono, d.fechaNacimiento, d.genero]
    );
    const fila = await pool.query(`${SELECT_PG} WHERE id = $1`, [r.rows[0].id]);
    return fila.rows[0];
  }
  if (modo === 'mongodb') return (await Estudiante.create(d)).toObject();
  const lista = leerArchivo();
  const nuevo = { _id: Date.now().toString(36), ...d, fechaRegistro: new Date().toISOString() };
  lista.push(nuevo);
  fs.writeFileSync(ARCHIVO, JSON.stringify(lista, null, 2));
  return nuevo;
}

async function listar() {
  if (modo === 'postgresql') return (await pool.query(`${SELECT_PG} ORDER BY fecha_registro DESC`)).rows;
  if (modo === 'mongodb') return Estudiante.find().sort({ fechaRegistro: -1 }).lean();
  return leerArchivo().reverse();
}

module.exports = { conectar, existeCarne, guardar, listar, getModo: () => modo };
