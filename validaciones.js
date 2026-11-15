// Reglas de validación compartidas por el Web Service (servidor).
// Las mismas reglas se aplican en el navegador (public/js/registro.js).

const CARRERAS = [
  'Ingeniería en Sistemas',
  'Ingeniería Industrial',
  'Administración de Empresas',
  'Contaduría Pública',
  'Psicología',
  'Ingeniería Civil'
];

const GENEROS = ['Masculino', 'Femenino', 'Otro'];

const REGEX = {
  carne: /^[A-Za-z0-9]{8,}$/,
  nombre: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/,
  correo: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  telefono: /^\d{4}-\d{4}$/,
  fecha: /^\d{4}-\d{2}-\d{2}$/
};

function calcularEdad(fechaISO) {
  const [y, m, d] = fechaISO.split('-').map(Number);
  const hoy = new Date();
  let edad = hoy.getFullYear() - y;
  const mes = hoy.getMonth() + 1;
  if (mes < m || (mes === m && hoy.getDate() < d)) edad--;
  return edad;
}

function validarEstudiante(e) {
  const errores = {};
  const s = (v) => (typeof v === 'string' ? v.trim() : '');

  const carne = s(e.carne);
  const nombres = s(e.nombres);
  const apellidos = s(e.apellidos);
  const correo = s(e.correo);
  const carrera = s(e.carrera);
  const telefono = s(e.telefono);
  const fechaNacimiento = s(e.fechaNacimiento);
  const genero = s(e.genero);

  if (!carne) errores.carne = 'El carné es requerido';
  else if (!REGEX.carne.test(carne)) errores.carne = 'Mínimo 8 caracteres, solo letras y números';

  if (!nombres) errores.nombres = 'Los nombres son requeridos';
  else if (!REGEX.nombre.test(nombres)) errores.nombres = 'Solo letras y espacios';

  if (!apellidos) errores.apellidos = 'Los apellidos son requeridos';
  else if (!REGEX.nombre.test(apellidos)) errores.apellidos = 'Solo letras y espacios';

  if (!correo) errores.correo = 'El correo es requerido';
  else if (!REGEX.correo.test(correo)) errores.correo = 'Formato de correo inválido';

  if (!carrera) errores.carrera = 'La carrera es requerida';
  else if (!CARRERAS.includes(carrera)) errores.carrera = 'Carrera no válida';

  if (!telefono) errores.telefono = 'El teléfono es requerido';
  else if (!REGEX.telefono.test(telefono)) errores.telefono = 'Formato guatemalteco ####-####';

  if (!fechaNacimiento) errores.fechaNacimiento = 'La fecha de nacimiento es requerida';
  else if (!REGEX.fecha.test(fechaNacimiento) || isNaN(Date.parse(fechaNacimiento)))
    errores.fechaNacimiento = 'Fecha inválida';
  else if (calcularEdad(fechaNacimiento) < 16)
    errores.fechaNacimiento = 'El estudiante debe tener al menos 16 años';

  if (!genero) errores.genero = 'El género es requerido';
  else if (!GENEROS.includes(genero)) errores.genero = 'Género no válido';

  return {
    valido: Object.keys(errores).length === 0,
    errores,
    datos: { carne: carne.toUpperCase(), nombres, apellidos, correo: correo.toLowerCase(), carrera, telefono, fechaNacimiento, genero }
  };
}

module.exports = { validarEstudiante, CARRERAS, GENEROS };
