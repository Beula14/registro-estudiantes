// ===== Formulario de registro: validaciones en vivo + envío POST =====
const form = document.getElementById('formRegistro');
const btnEnviar = document.getElementById('btnEnviar');
const mensaje = document.getElementById('mensaje');

let recaptchaWidget = null;
let recaptchaToken = '';
const tocado = {}; // solo mostrar errores en campos que el usuario ya tocó

const REGEX = {
  carne: /^[A-Za-z0-9]{8,}$/,
  nombre: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/,
  correo: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  telefono: /^\d{4}-\d{4}$/
};

function edad(fechaISO) {
  const [y, m, d] = fechaISO.split('-').map(Number);
  const hoy = new Date();
  let e = hoy.getFullYear() - y;
  const mes = hoy.getMonth() + 1;
  if (mes < m || (mes === m && hoy.getDate() < d)) e--;
  return e;
}

function valores() {
  const g = form.querySelector('input[name="genero"]:checked');
  return {
    carne: form.carne.value.trim(),
    nombres: form.nombres.value.trim(),
    apellidos: form.apellidos.value.trim(),
    correo: form.correo.value.trim(),
    carrera: form.carrera.value,
    telefono: form.telefono.value.trim(),
    fechaNacimiento: form.fechaNacimiento.value,
    genero: g ? g.value : ''
  };
}

function validar(v) {
  const e = {};
  if (!v.carne) e.carne = 'El carné es requerido';
  else if (!REGEX.carne.test(v.carne)) e.carne = 'Mínimo 8 caracteres, solo letras y números';

  if (!v.nombres) e.nombres = 'Los nombres son requeridos';
  else if (!REGEX.nombre.test(v.nombres)) e.nombres = 'Solo letras y espacios';

  if (!v.apellidos) e.apellidos = 'Los apellidos son requeridos';
  else if (!REGEX.nombre.test(v.apellidos)) e.apellidos = 'Solo letras y espacios';

  if (!v.correo) e.correo = 'El correo es requerido';
  else if (!REGEX.correo.test(v.correo) || !form.correo.checkValidity()) e.correo = 'Formato de correo inválido';

  if (!v.carrera) e.carrera = 'Seleccione una carrera';

  if (!v.telefono) e.telefono = 'El teléfono es requerido';
  else if (!REGEX.telefono.test(v.telefono)) e.telefono = 'Formato guatemalteco: ####-####';

  if (!v.fechaNacimiento) e.fechaNacimiento = 'La fecha de nacimiento es requerida';
  else if (edad(v.fechaNacimiento) < 16) e.fechaNacimiento = 'El estudiante debe tener al menos 16 años';

  if (!v.genero) e.genero = 'Seleccione un género';
  return e;
}

function pintarErrores(errores, mostrarTodos = false) {
  form.querySelectorAll('[data-error]').forEach((el) => {
    const campo = el.dataset.error;
    if (campo === 'captcha') return;
    const msg = (mostrarTodos || tocado[campo]) ? (errores[campo] || '') : '';
    el.textContent = msg;
    const input = form.elements[campo];
    if (input && input.classList) {
      input.classList.toggle('invalido', !!msg);
      input.classList.toggle('valido', !!((mostrarTodos || tocado[campo]) && !errores[campo]));
    }
  });
}

function actualizarEstado() {
  const errores = validar(valores());
  pintarErrores(errores);
  // El botón se habilita solo si TODOS los campos son válidos y el reCAPTCHA está resuelto
  btnEnviar.disabled = Object.keys(errores).length > 0 || !recaptchaToken;
}

// Máscara de teléfono ####-####
form.telefono.addEventListener('input', () => {
  const d = form.telefono.value.replace(/\D/g, '').slice(0, 8);
  form.telefono.value = d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d;
});

// Fecha máxima permitida = hoy menos 16 años
(function limitarFecha() {
  const h = new Date();
  h.setFullYear(h.getFullYear() - 16);
  form.fechaNacimiento.max = h.toISOString().slice(0, 10);
})();

form.addEventListener('input', (ev) => { if (ev.target.name) tocado[ev.target.name] = true; actualizarEstado(); });
form.addEventListener('change', (ev) => { if (ev.target.name) tocado[ev.target.name] = true; actualizarEstado(); });
form.addEventListener('focusout', (ev) => { if (ev.target.name) { tocado[ev.target.name] = true; actualizarEstado(); } });

let conservarMensaje = false;
form.addEventListener('reset', () => {
  const mantener = conservarMensaje;
  conservarMensaje = false;
  setTimeout(() => {
    Object.keys(tocado).forEach((k) => delete tocado[k]);
    form.querySelectorAll('.valido, .invalido').forEach((el) => el.classList.remove('valido', 'invalido'));
    reiniciarCaptcha();
    actualizarEstado();
    if (!mantener) mensaje.hidden = true;
  });
});

// ===== reCAPTCHA =====
window.onRecaptchaLoad = async function () {
  try {
    const cfg = await fetch(`${API_URL}/api/config`).then((r) => r.json());
    recaptchaWidget = grecaptcha.render('recaptcha', {
      sitekey: cfg.recaptchaSiteKey,
      callback: (token) => { recaptchaToken = token; setCaptchaError(''); actualizarEstado(); },
      'expired-callback': () => { recaptchaToken = ''; setCaptchaError('El reCAPTCHA expiró, márquelo de nuevo'); actualizarEstado(); },
      'error-callback': () => { recaptchaToken = ''; actualizarEstado(); }
    });
  } catch (err) {
    setCaptchaError('No se pudo cargar el reCAPTCHA. Verifique la conexión con el servidor.');
  }
};

function setCaptchaError(msg) {
  form.querySelector('[data-error="captcha"]').textContent = msg;
}

function reiniciarCaptcha() {
  recaptchaToken = '';
  if (window.grecaptcha && recaptchaWidget !== null) grecaptcha.reset(recaptchaWidget);
}

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
  mensaje.hidden = false;
}

// ===== Envío con método POST al Web Service =====
form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const datos = valores();
  const errores = validar(datos);
  if (Object.keys(errores).length || !recaptchaToken) {
    pintarErrores(errores, true);
    if (!recaptchaToken) setCaptchaError('Confirme que no es un robot');
    return;
  }

  btnEnviar.disabled = true;
  btnEnviar.textContent = 'Enviando...';
  try {
    const resp = await fetch(`${API_URL}/api/estudiantes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...datos, recaptchaToken })
    });
    const json = await resp.json();
    if (resp.ok && json.ok) {
      mostrarMensaje(`✔ ${json.mensaje}: ${json.estudiante.nombres} ${json.estudiante.apellidos} (${json.estudiante.carne})`, 'exito');
      conservarMensaje = true;
      form.reset();
    } else {
      if (json.errores) pintarErrores(json.errores, true);
      mostrarMensaje(`✖ ${json.mensaje || 'No se pudo registrar'}`, 'falla');
      reiniciarCaptcha();
    }
  } catch (err) {
    mostrarMensaje('✖ No se pudo conectar con el Web Service', 'falla');
    reiniciarCaptcha();
  } finally {
    btnEnviar.textContent = 'Registrar estudiante';
    actualizarEstado();
  }
});

actualizarEstado();
