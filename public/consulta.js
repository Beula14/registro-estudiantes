// ===== Ventana de consulta: tabla + buscador + actualizar =====
const tbody = document.getElementById('tbody');
const buscador = document.getElementById('buscador');
const btnActualizar = document.getElementById('btnActualizar');
const contador = document.getElementById('contador');

let estudiantes = [];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function formatoFecha(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function formatoFechaHora(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' });
}

function render() {
  const q = norm(buscador.value.trim());
  const filtrados = !q
    ? estudiantes
    : estudiantes.filter((e) =>
        norm([e.carne, e.nombres, e.apellidos, e.correo, e.carrera, e.telefono, e.fechaNacimiento, e.genero].join(' ')).includes(q)
      );

  contador.textContent = q
    ? `Mostrando ${filtrados.length} de ${estudiantes.length} estudiantes`
    : `Total: ${estudiantes.length} estudiantes`;

  if (!filtrados.length) {
    tbody.innerHTML = `<tr><td colspan="10" class="vacio">${estudiantes.length ? 'Sin resultados para la búsqueda' : 'No hay estudiantes registrados'}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtrados
    .map((e, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${esc(e.carne)}</td>
        <td>${esc(e.nombres)}</td>
        <td>${esc(e.apellidos)}</td>
        <td>${esc(e.correo)}</td>
        <td>${esc(e.carrera)}</td>
        <td>${esc(e.telefono)}</td>
        <td>${esc(formatoFecha(e.fechaNacimiento))}</td>
        <td>${esc(e.genero)}</td>
        <td>${esc(formatoFechaHora(e.fechaRegistro))}</td>
      </tr>`)
    .join('');
}

async function cargar() {
  btnActualizar.disabled = true;
  btnActualizar.textContent = 'Cargando...';
  try {
    const r = await fetch(`${API_URL}/api/estudiantes`);
    const json = await r.json();
    if (!json.ok) throw new Error(json.mensaje);
    estudiantes = json.estudiantes;
    render();
  } catch (err) {
    contador.textContent = 'Error al consultar el Web Service';
    tbody.innerHTML = '<tr><td colspan="10" class="vacio">No se pudieron cargar los datos</td></tr>';
  } finally {
    btnActualizar.disabled = false;
    btnActualizar.textContent = '⟳ Actualizar';
  }
}

buscador.addEventListener('input', render);
btnActualizar.addEventListener('click', cargar);
cargar();
