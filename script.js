/**
 * =============================================================================
 * CERTIFICACIÓN API - JAVASCRIPT PRINCIPAL
 * Funcionalidades para el checklist de certificación
 * =============================================================================
 */

// =============================================================================
// CONSTANTES Y CONFIGURACIÓN
// =============================================================================
const ITEMS_PER_PAGE = 2;
const checklistItems = [
  { id: 1, texto: "Autenticación OAuth 2.0/OpenID Connect implementada", esperado: "El sistema debe autenticar usando OAuth 2.0 o OpenID Connect, siguiendo los estándares de seguridad." },
  { id: 2, texto: "Uso de tokens JWT válidos", esperado: "Las peticiones deben incluir tokens JWT válidos y no expirados." },
  { id: 3, texto: "Comunicación solo por HTTPS", esperado: "Todas las comunicaciones con la API deben realizarse exclusivamente por HTTPS." },
  { id: 4, texto: "Gestión de expiración y refresh de tokens", esperado: "El sistema debe manejar la expiración de tokens y usar refresh tokens cuando corresponda." },
  { id: 5, texto: "Almacenamiento seguro de credenciales", esperado: "Las credenciales y secretos deben almacenarse de forma segura y nunca exponerse públicamente." },
  { id: 6, texto: "Solicita solo los permisos necesarios", esperado: "El sistema debe solicitar únicamente los permisos (scopes) estrictamente necesarios." },
  { id: 7, texto: "Respeta restricciones de acceso", esperado: "El sistema debe respetar las restricciones de acceso según los permisos otorgados." },
  { id: 8, texto: "Manejo de errores y límites de uso", esperado: "El sistema debe manejar correctamente errores y límites de uso (rate limiting)." },
  { id: 9, texto: "Pruebas de integración y seguridad realizadas", esperado: "Se deben realizar pruebas de integración y seguridad con la API." },
  { id: 10, texto: "Documentación revisada y comprendida", esperado: "El equipo debe haber revisado y comprendido la documentación de autenticación y autorización." }
];

// =============================================================================
// VARIABLES GLOBALES
// =============================================================================
let currentPage = 1;
let camposEstado = {};
let numeroCliente = null;
let clienteSha = null; // Para GitHub API

// =============================================================================
// INICIALIZACIÓN
// =============================================================================
document.addEventListener('DOMContentLoaded', function() {
  initializeSidebar();
  initializeCleanButton();
  initializeColorPalettes();
  initializeCargarAvances();
  
  // Solicitar número de cliente e intentar cargar desde GitHub
  solicitarYCargarCliente();
});

async function solicitarYCargarCliente() {
  let valido = false;
  while (!valido) {
    let num = prompt('Ingrese el número de cliente (10 dígitos):');
    if (num && /^\d{10}$/.test(num.trim())) {
      numeroCliente = num.trim();
      valido = true;
      
      // Verificar si existe en GitHub y cargar
      await verificarYCargarDesdeGitHub();
    } else {
      alert('Debe ingresar un número de cliente válido de 10 dígitos.');
    }
  }
  
  // Renderizar checklist después de cargar datos
  renderChecklist();
}

// =============================================================================
// GESTIÓN GITHUB
// =============================================================================
async function verificarYCargarDesdeGitHub() {
  try {
    mostrarMensaje('Verificando avances en GitHub...', 'info');
    
    const existe = await window.githubStorage.verificarCliente(numeroCliente);
    
    if (existe) {
      mostrarMensaje('Cargando avances existentes...', 'info');
      const { content, sha } = await window.githubStorage.cargarAvances(numeroCliente);
      camposEstado = content.avances || {};
      clienteSha = sha;
      mostrarMensaje(`Avances cargados para cliente ${numeroCliente} desde GitHub`, 'success');
    } else {
      mostrarMensaje(`Cliente nuevo: ${numeroCliente}. Puede empezar el checklist.`, 'success');
      camposEstado = {};
      clienteSha = null;
    }
  } catch (error) {
    console.error('Error con GitHub:', error);
    mostrarMensaje(`Error GitHub: ${error.message}. Trabajando en modo local.`, 'warning');
    // Cargar desde localStorage como fallback
    camposEstado = JSON.parse(localStorage.getItem(`avances_${numeroCliente}`) || '{}');
  }
}

async function guardarEnGitHub() {
  if (!numeroCliente) {
    mostrarMensaje('Error: número de cliente no definido', 'error');
    return;
  }

  try {
    mostrarMensaje('Guardando en GitHub...', 'info');
    guardarCamposPaginaActual();
    
    const nuevoSha = await window.githubStorage.guardarAvances(numeroCliente, camposEstado, clienteSha);
    clienteSha = nuevoSha;
    
    // También guardar en localStorage como backup
    localStorage.setItem(`avances_${numeroCliente}`, JSON.stringify(camposEstado));
    
    mostrarMensaje('Avances guardados en GitHub correctamente', 'success');
    renderSidebar();
  } catch (error) {
    console.error('Error guardando en GitHub:', error);
    mostrarMensaje(`Error al guardar en GitHub: ${error.message}`, 'error');
    
    // Guardar solo localmente como fallback
    localStorage.setItem(`avances_${numeroCliente}`, JSON.stringify(camposEstado));
    mostrarMensaje('Guardado localmente como respaldo', 'warning');
  }
}

function initializeCargarAvances() {
  const inputCargarAvances = document.getElementById('inputCargarAvances');
  if (inputCargarAvances) {
    inputCargarAvances.addEventListener('change', async function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async function(evt) {
        try {
          const base64 = evt.target.result;
          const json = decodeURIComponent(escape(atob(base64)));
          const data = JSON.parse(json);
          if (!data.numeroCliente || !data.avances) throw new Error('Formato inválido');
          
          // Cambiar cliente si es diferente
          if (data.numeroCliente !== numeroCliente) {
            numeroCliente = data.numeroCliente;
            await verificarYCargarDesdeGitHub();
          }
          
          camposEstado = data.avances;
          mostrarMensaje(`Avances cargados para el cliente: ${data.numeroCliente}`, 'success');
          renderChecklist();
        } catch (err) {
          mostrarMensaje('Error al cargar avances: archivo inválido.', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }
}

window.onload = function() {
  // Ya no se usa, la inicialización está en DOMContentLoaded
};

// =============================================================================
// GESTIÓN DEL SIDEBAR
// =============================================================================
function initializeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const muesca = document.getElementById('sidebarMuesca');
  const muescaIcon = document.getElementById('sidebarMuescaIcon');
  const muescaShow = document.getElementById('sidebarMuescaShow');
  let sidebarOculta = false;
  
  function actualizarMuesca() {
    if (sidebarOculta) {
      muesca.style.display = 'none';
      muescaShow.style.display = 'flex';
    } else {
      muesca.style.display = 'flex';
      muescaShow.style.display = 'none';
      muescaIcon.innerHTML = "&#x25C0;";
    }
  }
  
  muesca.onclick = function() {
    sidebarOculta = true;
    sidebar.classList.add('sidebar-oculta');
    actualizarMuesca();
  };
  
  muescaShow.onclick = function() {
    sidebarOculta = false;
    sidebar.classList.remove('sidebar-oculta');
    actualizarMuesca();
  };
  
  actualizarMuesca();
}

function renderSidebar() {
  const sidebarMenu = document.getElementById('sidebarMenu');
  sidebarMenu.innerHTML = '';
  
  for (let idx = 0; idx < checklistItems.length; idx++) {
    const item = checklistItems[idx];
    let completo = false;
    
    if (camposEstado[`aprobado_${item.id}`] && camposEstado[`evidencias_${item.id}`]) {
      completo = camposEstado[`aprobado_${item.id}`] !== '' && camposEstado[`evidencias_${item.id}`].trim() !== '';
    }
    
    let clase = 'nav-punto';
    if (currentPage === Math.floor(idx / ITEMS_PER_PAGE) + 1) clase += ' active';
    if (completo) clase += ' completo';
    else clase += ' incompleto';
    
    sidebarMenu.innerHTML += `
      <button type="button" class="${clase}" onclick="goToPage(${Math.floor(idx / ITEMS_PER_PAGE) + 1})" title="Ir al punto ${idx + 1}">
        <span style="display:inline-block;width:22px;text-align:right;font-weight:bold;">${idx + 1}.</span>
        <span style="flex:1 1 auto; text-align:left; margin-left:6px;">${item.texto}</span>
        <span style="font-size:1.1em; margin-left:8px;">${completo ? '✔️' : '⚠️'}</span>
      </button>
    `;
  }
}

// =============================================================================
// RENDERIZADO DEL CHECKLIST
// =============================================================================
function renderChecklist() {
  const container = document.getElementById('checklist');
  container.innerHTML = '';
  
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, checklistItems.length);
  
  checklistItems.slice(startIdx, endIdx).forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'checklist-item';
    div.setAttribute('id', `item_${item.id}`);
    div.innerHTML = createChecklistItemHTML(item, startIdx + idx + 1);
    container.appendChild(div);
  });
  
  cargarCambios();
  renderSidebar();
  renderPagination();
  inicializarEvidenciasEditables();
}

function createChecklistItemHTML(item, numero) {
  return `
    <label>
      <span class="numero-punto">${numero}.</span>
      <span id="alerta_${item.id}" class="punto-faltante" style="display:none;" title="Falta completar este punto">&#9888;</span>
      ${item.texto}
    </label>
    <div class="campo-espera"><strong>¿Qué se espera?</strong><br>${item.esperado}</div>
    <div style="display:flex;align-items:center;gap:18px;margin-bottom:4px;">
      <select name="aprobado_${item.id}" required onchange="guardarEstadoCampo(${item.id})" style="margin-right:18px;">
        <option value="">Selecciona...</option>
        <option value="Aprobado">Aprobado</option>
        <option value="No aprobado">No aprobado</option>
        <option value="No aplica">No aplica</option>
      </select>
      ${createToolbarHTML()}
    </div>
    <div contenteditable="true" class="evidencias-editable" name="observaciones_${item.id}" data-id="${item.id}" spellcheck="true" aria-label="Evidencias (puede pegar imágenes y texto)"></div>
    <div class="char-count" id="contador_${item.id}"></div>
  `;
}

function createToolbarHTML() {
  return `
    <div class="toolbar-evidencia">
      <button type="button" title="Negrita" onclick="formatoEvidencia(this, 'bold')"><b>B</b></button>
      <button type="button" title="Cursiva" onclick="formatoEvidencia(this, 'italic')"><i>I</i></button>
      <button type="button" title="Subrayado" onclick="formatoEvidencia(this, 'underline')"><u>U</u></button>
      <button type="button" title="Alinear a la izquierda" onclick="formatoEvidencia(this, 'justifyLeft')">&#8676;</button>
      <button type="button" title="Centrar" onclick="formatoEvidencia(this, 'justifyCenter')">&#8596;</button>
      <button type="button" title="Alinear a la derecha" onclick="formatoEvidencia(this, 'justifyRight')">&#8677;</button>
      <button type="button" title="Lista numerada" onclick="formatoEvidencia(this, 'insertOrderedList')">1.</button>
      <button type="button" title="Lista con viñetas" onclick="formatoEvidencia(this, 'insertUnorderedList')">&#8226;</button>
      <button type="button" title="Enlace" onclick="formatoEvidencia(this, 'createLink')">🔗</button>
      <div class="color-selector">
        <button type="button" class="color-selector-btn" title="Color de texto" onclick="toggleColorPalette(this)">🎨</button>
        <div class="color-palette">
          <div class="color-option" style="background-color: #000000;" onclick="aplicarColor(this, '#000000')"></div>
          <div class="color-option" style="background-color: #ff0000;" onclick="aplicarColor(this, '#ff0000')"></div>
          <div class="color-option" style="background-color: #00ff00;" onclick="aplicarColor(this, '#00ff00')"></div>
          <div class="color-option" style="background-color: #0000ff;" onclick="aplicarColor(this, '#0000ff')"></div>
          <div class="color-option" style="background-color: #ffff00;" onclick="aplicarColor(this, '#ffff00')"></div>
          <div class="color-option" style="background-color: #ff00ff;" onclick="aplicarColor(this, '#ff00ff')"></div>
          <div class="color-option" style="background-color: #00ffff;" onclick="aplicarColor(this, '#00ffff')"></div>
          <div class="color-option" style="background-color: #ffffff; border-color: #000;" onclick="aplicarColor(this, '#ffffff')"></div>
        </div>
      </div>
    </div>
  `;
}

// =============================================================================
// GESTIÓN DE EVIDENCIAS EDITABLES
// =============================================================================
function inicializarEvidenciasEditables() {
  document.querySelectorAll('.evidencias-editable').forEach(div => {
    div.oninput = function() {
      guardarEstadoCampo(div.dataset.id);
    };
    
    div.onpaste = handlePasteEvent;
    
    // Permitir seleccionar imagen para resize y edición
    div.addEventListener('click', function(e) {
      if (!e.target.closest('.img-resizable-wrapper')) {
        document.querySelectorAll('.img-resizable-wrapper').forEach(w => w.classList.remove('selected'));
      }
    });
  });
}

function handlePasteEvent(e) {
  const div = this;
  const items = (e.clipboardData || window.clipboardData).items;
  let hasImage = false;
  
  // Verificar si hay imágenes en el portapeles
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      hasImage = true;
      handleImagePaste(items[i], div, e);
      break;
    }
  }
  
  // Si no hay imágenes, manejar texto pegado
  if (!hasImage) {
    handleTextPaste(e, div);
  }
}

function handleImagePaste(item, div, e) {
  const file = item.getAsFile();
  const reader = new FileReader();
  
  reader.onload = function(event) {
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    const wrapper = createImageWrapper(event.target.result, div);
    range.insertNode(wrapper);
    guardarEstadoCampo(div.dataset.id);
  };
  
  reader.readAsDataURL(file);
  e.preventDefault();
}

function handleTextPaste(e, div) {
  const pastedText = e.clipboardData.getData('text/plain');
  
  // Detectar si es código
  const isLikelyCode = pastedText.length > 80 || 
                      pastedText.includes('{') || 
                      pastedText.includes('function') ||
                      pastedText.includes('const ') ||
                      pastedText.includes('let ') ||
                      pastedText.includes('var ') ||
                      pastedText.includes('=>') ||
                      pastedText.includes('http://') ||
                      pastedText.includes('https://') ||
                      pastedText.includes('=') && pastedText.includes(';');
  
  if (isLikelyCode) {
    e.preventDefault();
    insertCodeBlock(pastedText, div);
  }
}

function insertCodeBlock(text, div) {
  const pre = document.createElement('pre');
  pre.style.cssText = `
    background: #f4f4f4;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 12px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    margin: 8px 0;
    line-height: 1.4;
    max-width: 100%;
    overflow-x: auto;
  `;
  pre.textContent = text;
  
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(pre);
    
    // Mover cursor después del elemento insertado
    range.setStartAfter(pre);
    range.setEndAfter(pre);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  
  guardarEstadoCampo(div.dataset.id);
}

function createImageWrapper(src, div) {
  const wrapper = document.createElement('span');
  wrapper.className = 'img-resizable-wrapper';
  wrapper.contentEditable = "false";
  
  const img = document.createElement('img');
  img.src = src;
  img.onload = function() {
    img.style.width = (this.naturalWidth * 0.7) + 'px';
    img.style.height = (this.naturalHeight * 0.7) + 'px';
  };
  img.setAttribute('draggable', 'true');
  wrapper.appendChild(img);

  // Barra de edición de imagen
  const toolbar = document.createElement('span');
  toolbar.className = 'img-toolbar';
  toolbar.innerHTML = `
    <button type="button" title="Eliminar imagen" onclick="editarImagen(this, 'eliminar')">🗑️</button>
  `;
  wrapper.appendChild(toolbar);

  const handle = document.createElement('span');
  handle.className = 'img-resize-handle';
  wrapper.appendChild(handle);

  setupImageInteractions(img, wrapper, handle, div);
  
  return wrapper;
}

function setupImageInteractions(img, wrapper, handle, div) {
  // Selección para resize y edición
  img.onclick = function(e) {
    e.stopPropagation();
    document.querySelectorAll('.img-resizable-wrapper').forEach(w => w.classList.remove('selected'));
    wrapper.classList.add('selected');
  };

  // Resize mejorado
  handle.onmousedown = function(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = parseInt(document.defaultView.getComputedStyle(img).width, 10);
    const startHeight = parseInt(document.defaultView.getComputedStyle(img).height, 10);
    
    function mousemove(ev) {
      const newWidth = startWidth + ev.clientX - startX;
      const newHeight = startHeight + ev.clientY - startY;
      img.style.width = newWidth + 'px';
      img.style.height = newHeight + 'px';
    }
    
    function mouseup() {
      document.removeEventListener('mousemove', mousemove);
      document.removeEventListener('mouseup', mouseup);
    }
    
    document.addEventListener('mousemove', mousemove);
    document.addEventListener('mouseup', mouseup);
  };

  // Drag & drop dentro del campo
  img.ondragstart = function(ev) {
    ev.dataTransfer.setData('text/plain', '');
    window._draggedImg = wrapper;
  };
  
  div.ondragover = function(ev) {
    ev.preventDefault();
  };
  
  div.ondrop = function(ev) {
    ev.preventDefault();
    const dropRange = document.caretRangeFromPoint(ev.clientX, ev.clientY);
    if (window._draggedImg && dropRange) {
      dropRange.insertNode(window._draggedImg);
      window._draggedImg = null;
    }
  };
}

// =============================================================================
// HERRAMIENTAS DE FORMATO
// =============================================================================
function formatoEvidencia(btn, comando) {
  const div = btn.closest('.checklist-item').querySelector('.evidencias-editable');
  div.focus();
  
  if (comando === 'createLink') {
    let url = prompt('URL del enlace:');
    if (url) document.execCommand('createLink', false, url);
  } else {
    document.execCommand(comando, false, null);
  }
}

function editarImagen(btn, accion) {
  const wrapper = btn.closest('.img-resizable-wrapper');
  const img = wrapper.querySelector('img');
  
  if (accion === 'rotar') {
    let rot = parseInt(img.getAttribute('data-rot') || '0', 10);
    rot = (rot + 90) % 360;
    img.style.transform = `rotate(${rot}deg) scaleX(${img.getAttribute('data-flipH') === '1' ? -1 : 1})`;
    img.setAttribute('data-rot', rot);
  } else if (accion === 'flipH') {
    let flip = img.getAttribute('data-flipH') === '1' ? '0' : '1';
    img.style.transform = `rotate(${img.getAttribute('data-rot') || 0}deg) scaleX(${flip === '1' ? -1 : 1})`;
    img.setAttribute('data-flipH', flip);
  } else if (accion === 'eliminar') {
    wrapper.remove();
  }
}

// =============================================================================
// SELECTOR DE COLORES
// =============================================================================
function initializeColorPalettes() {
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.color-selector')) {
      document.querySelectorAll('.color-palette').forEach(palette => {
        palette.classList.remove('show');
      });
    }
  });
}

function toggleColorPalette(btn) {
  const palette = btn.nextElementSibling;
  const isVisible = palette.classList.contains('show');
  
  // Cerrar todas las paletas
  document.querySelectorAll('.color-palette').forEach(p => p.classList.remove('show'));
  
  // Mostrar la paleta actual si no estaba visible
  if (!isVisible) {
    palette.classList.add('show');
  }
}

function aplicarColor(colorDiv, color) {
  const evidenciaDiv = colorDiv.closest('.checklist-item').querySelector('.evidencias-editable');
  evidenciaDiv.focus();
  document.execCommand('foreColor', false, color);
  
  // Cerrar la paleta
  colorDiv.closest('.color-palette').classList.remove('show');
}

// =============================================================================
// BOTÓN DE LIMPIEZA
// =============================================================================
function initializeCleanButton() {
  const btnLimpiarDiscreto = document.getElementById('btnLimpiarEvidenciasDiscreto');
  if (btnLimpiarDiscreto) {
    btnLimpiarDiscreto.onclick = function() {
      const evidenciasVisibles = document.querySelectorAll('.evidencias-editable');
      let algunaSeleccionada = false;
      let elementosALimpiar = [];
      
      evidenciasVisibles.forEach(div => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (div.contains(range.commonAncestorContainer) || div === range.commonAncestorContainer) {
            algunaSeleccionada = true;
            elementosALimpiar.push(div);
          }
        }
      });
      
      if (algunaSeleccionada) {
        if (confirm('¿Seguro que deseas limpiar las evidencias seleccionadas?')) {
          elementosALimpiar.forEach(div => {
            div.innerHTML = '';
            
            const itemId = div.dataset.id;
            const selectElement = document.querySelector(`[name="aprobado_${itemId}"]`);
            if (selectElement) {
              selectElement.value = '';
            }
            
            guardarEstadoCampo(itemId);
          });
          mostrarMensaje('Evidencias seleccionadas limpiadas y estado reiniciado.', 'success');
        }
      } else {
        mostrarMensaje('Selecciona texto o posiciona el cursor en las evidencias que deseas limpiar.', 'error');
      }
    };
  }
}

// =============================================================================
// PAGINACIÓN
// =============================================================================
function renderPagination() {
  const totalPages = Math.ceil(checklistItems.length / ITEMS_PER_PAGE);
  const pagDiv = document.getElementById('pagination');
  pagDiv.innerHTML = '';
  
  pagDiv.innerHTML += `<button onclick="prevPage()" ${currentPage === 1 ? 'disabled' : ''}>&lt; Anterior</button>`;
  
  for (let i = 1; i <= totalPages; i++) {
    pagDiv.innerHTML += `<button onclick="goToPage(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
  }
  
  pagDiv.innerHTML += `<button onclick="nextPage()" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente &gt;</button>`;
}

function goToPage(page) {
  guardarCamposPaginaActual();
  currentPage = page;
  renderChecklist();
}

function prevPage() {
  guardarCamposPaginaActual();
  if (currentPage > 1) {
    currentPage--;
    renderChecklist();
  }
}

function nextPage() {
  guardarCamposPaginaActual();
  const totalPages = Math.ceil(checklistItems.length / ITEMS_PER_PAGE);
  if (currentPage < totalPages) {
    currentPage++;
    renderChecklist();
  }
}

// =============================================================================
// GESTIÓN DE ESTADO
// =============================================================================
function guardarEstadoCampo(id) {
  const aprobado = document.querySelector(`[name="aprobado_${id}"]`);
  const evidenciasDiv = document.querySelector(`.evidencias-editable[name="observaciones_${id}"]`);
  
  camposEstado[`aprobado_${id}`] = aprobado ? aprobado.value : '';
  camposEstado[`evidencias_${id}`] = evidenciasDiv ? evidenciasDiv.innerHTML : '';
  
  // Guardar en localStorage como backup inmediato
  if (numeroCliente) {
    localStorage.setItem(`avances_${numeroCliente}`, JSON.stringify(camposEstado));
  }
  
  renderSidebar();
  
  // Debounce para evitar muchas llamadas a GitHub
  clearTimeout(window.saveTimeout);
  window.saveTimeout = setTimeout(() => {
    guardarEnGitHub();
  }, 2000); // Guardar en GitHub después de 2 segundos de inactividad
}

function guardarCamposPaginaActual() {
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, checklistItems.length);
  
  checklistItems.slice(startIdx, endIdx).forEach(item => {
    guardarEstadoCampo(item.id);
  });
}

// Guardar cambios en GitHub
function guardarCambios() {
  guardarEnGitHub();
}

// Descargar avances (mantener como backup)
function descargarAvances() {
  guardarCamposPaginaActual();
  if (!numeroCliente || !/^\d{10}$/.test(numeroCliente)) {
    mostrarMensaje('Número de cliente inválido.', 'error');
    return;
  }
  const data = {
    numeroCliente,
    avances: camposEstado
  };
  const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  const blob = new Blob([base64], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `avances_${numeroCliente}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  mostrarMensaje('Archivo de respaldo descargado correctamente.', 'success');
}

function cargarCambios() {
  // No cargar desde localStorage, solo desde archivo remoto
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, checklistItems.length);
  
  checklistItems.slice(startIdx, endIdx).forEach(item => {
    if (camposEstado[`aprobado_${item.id}`]) {
      const selectElement = document.querySelector(`[name="aprobado_${item.id}"]`);
      if (selectElement) {
        selectElement.value = camposEstado[`aprobado_${item.id}`];
      }
    }
    
    if (camposEstado[`evidencias_${item.id}`]) {
      const obsDiv = document.querySelector(`.evidencias-editable[name="observaciones_${item.id}"]`);
      if (obsDiv) {
        obsDiv.innerHTML = camposEstado[`evidencias_${item.id}`];
        actualizarContadorEditable(obsDiv, item.id);
      }
    }
  });
}

function actualizarContadorEditable(div, id) {
  // Ya no hay límite ni contador visible
}

// =============================================================================
// VALIDACIÓN Y MENSAJES
// =============================================================================
function validarCampos() {
  let valido = true;
  let msg = '';
  let faltantes = [];
  
  checklistItems.forEach(item => {
    const aprobado = camposEstado[`aprobado_${item.id}`];
    const evidencias = camposEstado[`evidencias_${item.id}`];
    const alerta = document.getElementById(`alerta_${item.id}`);
    let incompleto = false;
    
    if (!aprobado) { 
      valido = false; 
      incompleto = true; 
    }
    
    // Considera vacío si no hay texto ni imágenes
    const temp = document.createElement('div');
    temp.innerHTML = evidencias || '';
    const hasContent = temp.innerText.trim().length > 0 || temp.querySelector('img');
    
    if (!hasContent) { 
      valido = false; 
      incompleto = true; 
    }
    
    if (alerta) {
      if (incompleto) { 
        alerta.style.display = 'inline-block'; 
      } else { 
        alerta.style.display = 'none'; 
      }
    }
    
    if (incompleto) { 
      faltantes.push(item.id); 
    }
  });
  
  if (!valido) {
    msg = 'Faltan puntos por completar: ' + faltantes.map(id => id).join(', ');
  }
  
  mostrarMensaje(msg, valido ? 'success' : 'error');
  return valido;
}

function mostrarMensaje(msg, tipo) {
  const formMsg = document.getElementById('formMsg');
  if (msg) {
    formMsg.innerHTML = `<span class="${tipo}">${msg}</span>`;
  } else {
    formMsg.innerHTML = '';
  }
}

// =============================================================================
// FUNCIONES PRINCIPALES
// =============================================================================
function guardarCambios() {
  guardarCamposPaginaActual();
  mostrarMensaje('Cambios guardados en memoria. Use "Descargar avances" para guardar remotamente.', 'success');
  renderSidebar();
}
