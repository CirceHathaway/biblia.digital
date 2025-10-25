// js/biblia.js

// =====================
// Versiones soportadas e índice por versión
// =====================
const SUPPORTED_VERSIONS = ["RVR1960", "RVC", "NVI"];
let libros = {}; // { "Génesis": "libros/<VER>/genesis.js", ... }

function getVersionEl() {
  // En móvil usamos el del header; en desktop usamos el de la sección
  const mobileEl  = document.querySelector('#versionSelectorSlot .version-biblia');
  const desktopEl = document.getElementById('versionBibliaDesktop');
  return window.matchMedia('(max-width: 768px)').matches ? (mobileEl || desktopEl) : (desktopEl || mobileEl);
}

// Lee versión desde localStorage o desde el DOM; fallback RVR1960
function getCurrentVersion() {
  const el  = getVersionEl();
  const dom = (el?.textContent || "").trim();
  const ls  = localStorage.getItem("versionBiblia");
  const v   = ls || dom;
  return SUPPORTED_VERSIONS.includes(v) ? v : "RVR1960";
}

// Carga el índice de libros de la versión (nueva convención de rutas)
async function loadLibros(version) {
  try {
    // Ahora todas usan js/libros/<VERSION>/libros.js
    const mod = await import(`./libros/${version}/libros.js`);
    libros = mod.libros || mod.default || {};
    if (!libros || !Object.keys(libros).length) {
      throw new Error(`Mapa de libros vacío para ${version}`);
    }
  } catch (e) {
    console.error(`[biblia] No se pudo cargar js/libros/${version}/libros.js`, e);
    libros = {};
  }
}

// =====================
// Referencias UI y estado
// =====================
const dropdown = document.getElementById("selector-libro");
const dropdownToggle = document.getElementById("selector-toggle");
const dropdownContent = document.getElementById("selector-content");
const versiculosDiv = document.getElementById("versiculos");
const btnAumentar = document.getElementById("aumentarLetra");
const btnAnterior = document.getElementById("anteriorCapitulo");
const btnSiguiente = document.getElementById("siguienteCapitulo");

let libroActual = null;
let capitulos = [];
let capituloSelectIndex = 0;
let versiculoSelectIndex = 0;
let fontSize = 18;
let estadoSelector = "libros";
let libroSeleccionado = "";

let pressTimer;
let mouseMoved = false;
const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// =====================
// Versículo del día (TU lista original intacta)
// =====================
// Pega aquí tu const versiculosDestacados = [ ... ] completa, sin cambios:
const versiculosDestacados = [
  // ... TU LISTA LARGA ORIGINAL AQUÍ ...
];

function obtenerIdentificadorDispositivo() {
  let idDispositivo = localStorage.getItem('deviceId');
  if (!idDispositivo) {
    idDispositivo = Math.random().toString(36).substr(2, 9) + navigator.userAgent.hashCode();
    localStorage.setItem('deviceId', idDispositivo);
  }
  return idDispositivo;
}
String.prototype.hashCode = function() {
  let hash = 0;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
};
function obtenerVersiculoDelDia() {
  const hoy = new Date().toISOString().split('T')[0];
  const idDispositivo = obtenerIdentificadorDispositivo();
  const semilla = hoy.split('-').reduce((acc, num) => acc + parseInt(num), 0) + idDispositivo.hashCode();
  const indice = Math.abs(semilla) % versiculosDestacados.length;
  return versiculosDestacados[indice];
}
function mostrarVersiculoDelDia() {
  const hoy = new Date().toISOString().split('T')[0];
  const ultimaVisita = localStorage.getItem('lastVisitDate');
  if (ultimaVisita === hoy) return;

  const versiculo = obtenerVersiculoDelDia();
  const ventana = document.createElement('div');
  ventana.className = 'versiculo-dia';

  const palabras = versiculo.texto.split(' ');
  const mitad = Math.ceil(palabras.length / 2);
  const linea1 = palabras.slice(0, mitad).join(' ');
  const linea2 = palabras.slice(mitad).join(' ');

  ventana.innerHTML = `
    <div class="contenido">
      <h3>Versículo del día</h3>
      <p class="texto-versiculo">${linea1}<br>${linea2}</p>
      <p class="referencia">${versiculo.libro} ${versiculo.capitulo}:${versiculo.versiculo}</p>
      <div class="botones">
        <button id="btn-compartir-dia">Compartir</button>
        <button id="btn-copiar-dia">Copiar</button>
        <button id="btn-cerrar-dia">Cerrar</button>
      </div>
    </div>
  `;
  document.body.appendChild(ventana);

  document.getElementById('btn-compartir-dia').addEventListener('click', () => {
    compartirVersiculoComoImagen(versiculo.libro, versiculo.capitulo, versiculo.versiculo, versiculo.texto, true);
    localStorage.setItem('lastVisitDate', hoy);
    document.body.removeChild(ventana);
  });

  document.getElementById('btn-copiar-dia').addEventListener('click', () => {
    const texto = `${versiculo.texto} (${versiculo.libro} ${versiculo.capitulo}:${versiculo.versiculo})`;
    navigator.clipboard.writeText(texto).catch(err => {
      console.error('Error al copiar texto:', err);
      alert('No se pudo copiar el texto');
    });
  });

  document.getElementById('btn-cerrar-dia').addEventListener('click', () => {
    localStorage.setItem('lastVisitDate', hoy);
    document.body.removeChild(ventana);
  });
}

// =====================
// Selector de versión (mini menú)
// =====================
function renderVersionPill(versionActual) {
  const el = getVersionEl();
  if (!el) return;

  el.textContent = versionActual;

  const container = el.closest('.version-selector') || el.parentElement;
  let menu = container.querySelector('.version-menu'); // <— genérico
  if (!menu) {
    menu = document.createElement('div');
    menu.className = 'version-menu';
    container.appendChild(menu);
  }

  function fillMenu(actual) {
    menu.innerHTML = '';
    SUPPORTED_VERSIONS.forEach(v => {
      const btn = document.createElement('button');
      btn.textContent = v;
      if (v === actual) btn.classList.add('active');
      btn.addEventListener('click', async () => {
        localStorage.setItem('versionBiblia', v);
        el.textContent = v;
        menu.classList.remove('open');
        await initVersionAndHome();
      });
      menu.appendChild(btn);
    });
  }

  fillMenu(versionActual);

  el.onclick = (e) => {
    e.stopPropagation();
    fillMenu(getCurrentVersion()); // refresca activo
    menu.classList.toggle('open');
  };

  // Cerrar al clickear fuera
  document.addEventListener('click', (ev) => {
    if (!container.contains(ev.target)) menu.classList.remove('open');
  });
}

// =====================
// Selector Libros / Capítulos / Versículos
// =====================
function crearInputBusqueda() {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Buscar libros...";
  input.classList.add("dropdown-search");
  input.addEventListener("input", () => {
    const texto = input.value.toLowerCase();
    const opciones = dropdownContent.querySelectorAll(".dropdown-option");
    opciones.forEach(opcion => {
      const visible = opcion.textContent.toLowerCase().includes(texto);
      opcion.style.display = visible ? "block" : "none";
    });
  });
  return input;
}

function agregarBotonVolver(destino) {
  const btn = document.createElement("button");
  btn.textContent = "← Volver";
  btn.className = "dropdown-option dropdown-back"; // clase nueva
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (destino === "libros") {
      cargarLibros();
    } else if (destino === "capitulos") {
      cargarCapitulos(libroActual);
    }
    dropdown.classList.add("open");
  });
  dropdownContent.insertBefore(btn, dropdownContent.firstChild);
}

function cargarLibros() {
  dropdownContent.innerHTML = '';
  estadoSelector = "libros";
  dropdownToggle.textContent = "Libro";
  const inputBusqueda = crearInputBusqueda();
  dropdownContent.appendChild(inputBusqueda);
  Object.keys(libros).forEach(nombre => {
    const opcion = document.createElement("div");
    opcion.className = "dropdown-option";
    opcion.textContent = nombre;
    opcion.addEventListener("click", async (e) => {
      e.stopPropagation();
      libroSeleccionado = nombre;
      dropdownToggle.textContent = nombre;
      await cargarCapitulos(nombre);
      dropdown.classList.add("open");
    });
    dropdownContent.appendChild(opcion);
  });
}

async function cargarCapitulos(nombreLibro) {
  try {
    const ruta = libros[nombreLibro];
    if (!ruta) throw new Error("Ruta no encontrada para libro: " + nombreLibro);
    const modulo = await import(`./${ruta}`); // rutas del índice son relativas a /js
    capitulos = modulo.default || modulo.capitulos || [];
    if (!Array.isArray(capitulos) || !capitulos.length) {
      throw new Error("Lista de capítulos vacía en " + ruta);
    }
    libroActual = nombreLibro;
    capituloSelectIndex = 0;
    estadoSelector = "capitulos";
    dropdownToggle.textContent = "Capítulo";
    dropdownContent.innerHTML = '';

    const grid = document.createElement("div");
    grid.className = "chapter-grid";
    capitulos.forEach((_, index) => {
      const btn = document.createElement("div");
      btn.className = "chapter-item";
      btn.textContent = index + 1;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        capituloSelectIndex = index;
        dropdownToggle.textContent = `Capítulo ${index + 1}`;
        mostrarCapitulo(index);
        cargarVersiculos(index);
        setTimeout(() => dropdown.classList.add("open"), 0);
      });
      grid.appendChild(btn);
    });
    dropdownContent.appendChild(grid);
    agregarBotonVolver("libros");
  } catch (e) {
    console.error("[biblia] cargarCapitulos:", e);
    versiculosDiv.innerHTML = `<p style="color:#b00">No se pudo cargar <strong>${nombreLibro}</strong>. Ver consola.</p>`;
  }
}

function cargarVersiculos(indexCapitulo) {
  estadoSelector = "versiculos";
  dropdownToggle.textContent = "Versículo";
  dropdownContent.innerHTML = '';
  const versiculos = capitulos[indexCapitulo];
  const grid = document.createElement("div");
  grid.className = "chapter-grid";
  versiculos.forEach((_, i) => {
    const btn = document.createElement("div");
    btn.className = "chapter-item";
    btn.textContent = i + 1;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      versiculoSelectIndex = i;
      dropdownToggle.textContent = `Versículo ${i + 1}`;
      mostrarVersiculo(indexCapitulo, i);
      dropdown.classList.remove("open");
    });
    grid.appendChild(btn);
  });
  dropdownContent.appendChild(grid);
  agregarBotonVolver("capitulos");
}

function cargarResaltados() {
  const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  favoritos.forEach(fav => {
    const versiculoId = `vers-${fav.versiculo}`;
    const elemento = document.querySelector(`[data-versiculo-id="${versiculoId}"]`);
    if (elemento && fav.libro === libroActual && fav.capitulo === (capituloSelectIndex + 1)) {
      elemento.style.backgroundColor = fav.color || '#ffff99';
    }
  });
}

function mostrarCapitulo(index) {
  const versiculos = capitulos[index];
  capituloSelectIndex = index;
  versiculosDiv.innerHTML = `<h2>${libroActual} ${index + 1}</h2>`;
  versiculos.forEach((verso, i) => {
    const versiculoDiv = document.createElement('div');
    versiculoDiv.className = 'versiculo-item';
    versiculoDiv.setAttribute('data-versiculo-id', `vers-${i + 1}`);
    versiculoDiv.innerHTML = `<p id="vers-${i + 1}"><strong>${i + 1}</strong> ${verso}</p>`;

    if (esMovil) {
      let startY = 0;
      let moved = false;
      versiculoDiv.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        moved = false;
        pressTimer = setTimeout(() => {
          if (!moved) mostrarVentanaDestacar(libroActual, index + 1, i + 1, verso, versiculoDiv);
        }, 500);
      });
      versiculoDiv.addEventListener('touchmove', (e) => {
        const diffY = Math.abs(e.touches[0].clientY - startY);
        if (diffY > 10) { moved = true; clearTimeout(pressTimer); }
      });
      versiculoDiv.addEventListener('touchend', () => clearTimeout(pressTimer));
    } else {
      versiculoDiv.addEventListener('mousedown', (e) => {
        e.preventDefault();
        mouseMoved = false;
        pressTimer = setTimeout(() => {
          if (!mouseMoved) mostrarVentanaDestacar(libroActual, index + 1, i + 1, verso, versiculoDiv);
        }, 500);
      });
      versiculoDiv.addEventListener('mousemove', () => { mouseMoved = true; clearTimeout(pressTimer); });
      versiculoDiv.addEventListener('mouseup', () => clearTimeout(pressTimer));
      versiculoDiv.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    versiculosDiv.appendChild(versiculoDiv);
  });
  cargarResaltados();
}

// =====================
// Compartir como imagen
// =====================
async function generarImagenVersiculo(libro, capitulo, versiculoNumero, texto, esVersiculoDelDia = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 940;
  canvas.height = 788;
  const ctx = canvas.getContext('2d');

  const fondo = new Image();
  fondo.src = esVersiculoDelDia ? 'images/background-versiculo-dia.jpg' : 'images/background-versiculo.jpg';
  await new Promise(resolve => { fondo.onload = resolve; fondo.onerror = resolve; });
  ctx.drawImage(fondo, 0, 0, 940, 788);

  try { await document.fonts.load('32px "PT Serif"'); } catch {}

  const fontFamily = '"PT Serif", serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const referencia = `${libro} ${capitulo}:${versiculoNumero}`;

  ctx.font = `28px ${fontFamily}`;
  const maxWidth = 800;
  const lineHeight = 40;
  const words = texto.split(' ');
  let line = '';
  const lines = [];
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && i > 0) { lines.push(line.trim()); line = words[i] + ' '; }
    else { line = testLine; }
  }
  lines.push(line.trim());

  const paddingX = 40;
  const paddingY = 20;
  ctx.font = `32px ${fontFamily}`;
  const referenciaWidth = ctx.measureText(referencia).width;
  ctx.font = `28px ${fontFamily}`;
  const textWidth = Math.max(referenciaWidth, ...lines.map(l => ctx.measureText(l).width));
  const textHeight = (lines.length + 1) * lineHeight;
  const rectWidth = textWidth + paddingX * 2;
  const rectHeight = textHeight + paddingY * 2;
  const rectX = (940 - rectWidth) / 2;
  const rectY = (788 - rectHeight) / 2;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

  ctx.fillStyle = '#000000';
  ctx.font = `32px ${fontFamily}`;
  ctx.fillText(referencia, 470, rectY + paddingY + lineHeight / 2);

  ctx.font = `28px ${fontFamily}`;
  lines.forEach((l, i) => ctx.fillText(l, 470, rectY + paddingY + lineHeight * (i + 1.5)));

  return new Promise(resolve => canvas.toBlob(blob => resolve(blob)));
}

async function compartirVersiculoComoImagen(libro, capitulo, versiculoNumero, texto, esVersiculoDelDia = false) {
  try {
    const blob = await generarImagenVersiculo(libro, capitulo, versiculoNumero, texto, esVersiculoDelDia);
    const file = new File([blob], `versiculo-${libro}-${capitulo}-${versiculoNumero}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: `${libro} ${capitulo}:${versiculoNumero}`, text: 'Comparte este versículo de Mi Biblia' });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `versiculo-${libro}-${capitulo}-${versiculoNumero}.png`;
      a.click(); URL.revokeObjectURL(url);
      alert('La función de compartir no está soportada. La imagen se ha descargado.');
    }
  } catch (error) {
    console.error('Error al generar o compartir la imagen:', error);
    alert('Hubo un error al generar la imagen. Por favor, intenta de nuevo.');
  }
}

// =====================
// Destacar / Favoritos
// =====================
function mostrarVentanaDestacar(libro, capitulo, versiculo, texto, versiculoDiv) {
  const ventana = document.createElement('div');
  ventana.className = 'ventana-destacar';
  function aplicarEstilosVentana() {
    ventana.style.position = 'fixed';
    ventana.style.top = '0';
    ventana.style.left = '0';
    ventana.style.width = '100%';
    ventana.style.height = '100%';
    ventana.style.backgroundColor = 'rgba(0,0,0,.5)';
    ventana.style.display = 'flex';
    ventana.style.alignItems = 'center';
    ventana.style.justifyContent = 'center';
    ventana.style.zIndex = '1002';
  }
  function aplicarEstilosContenido(contenido) {
    contenido.style.backgroundColor = '#fff';
    contenido.style.padding = '1.5rem';
    contenido.style.borderRadius = '0.625rem';
    contenido.style.textAlign = 'center';
  }
  function aplicarEstilosBoton(boton, colorFondo) {
    boton.style.backgroundColor = colorFondo;
    boton.style.color = 'white';
    boton.style.border = 'none';
    boton.style.borderRadius = '0.5rem';
    boton.style.cursor = 'pointer';
    boton.style.margin = '0.3125rem';
  }

  function vistaInicial() {
    ventana.innerHTML = `
      <div class="ventana-contenido">
        <p>¿Qué deseas hacer con este versículo?</p>
        <div class="botones-ventana">
          <button id="btn-destacar">Destacar</button>
          <button id="btn-compartir-imagen">Imagen</button>
          <button id="btn-copiar">Copiar</button>
          <button id="btn-cancelar">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(ventana);
    aplicarEstilosVentana();
    const contenido = ventana.querySelector('.ventana-contenido');
    aplicarEstilosContenido(contenido);

    const btnDestacar = document.getElementById('btn-destacar');
    const btnCompartirImagen = document.getElementById('btn-compartir-imagen');
    const btnCopiar = document.getElementById('btn-copiar');
    const btnCancelar = document.getElementById('btn-cancelar');

    aplicarEstilosBoton(btnDestacar, '#4CAF50');
    aplicarEstilosBoton(btnCompartirImagen, '#01717d');
    aplicarEstilosBoton(btnCopiar, '#ff8000');
    aplicarEstilosBoton(btnCancelar, '#ff4444');

    btnDestacar.addEventListener('click', vistaColores);
    btnCompartirImagen.addEventListener('click', () => {
      compartirVersiculoComoImagen(libro, capitulo, versiculo, texto);
      document.body.removeChild(ventana);
    });
    btnCopiar.addEventListener('click', () => {
      const textoACopiar = `${texto} (${libro} ${capitulo}:${versiculo})`;
      navigator.clipboard.writeText(textoACopiar).then(() => {
        document.body.removeChild(ventana);
      }).catch(err => console.error('Error al copiar:', err));
    });
    btnCancelar.addEventListener('click', () => document.body.removeChild(ventana));
  }

  function vistaColores() {
    ventana.innerHTML = `
      <div class="ventana-contenido">
        <p>Elige un color para destacar</p>
        <div class="color-options">
          <button class="color-btn" data-color="#ffff99" style="background-color:#ffff99;"></button>
          <button class="color-btn" data-color="#ffcccb" style="background-color:#ffcccb;"></button>
          <button class="color-btn" data-color="#add8e6" style="background-color:#add8e6;"></button>
          <button class="color-btn" data-color="#90ee90" style="background-color:#90ee90;"></button>
        </div>
        <div class="botones-ventana">
          <button id="btn-confirmar">Confirmar</button>
          <button id="btn-cancelar-colores">Cancelar</button>
        </div>
      </div>
    `;
    aplicarEstilosVentana();
    const contenido = ventana.querySelector('.ventana-contenido');
    aplicarEstilosContenido(contenido);

    const btnConfirmar = document.getElementById('btn-confirmar');
    const btnCancelarColores = document.getElementById('btn-cancelar-colores');
    const colorButtons = ventana.querySelectorAll('.color-btn');

    aplicarEstilosBoton(btnConfirmar, '#4CAF50');
    aplicarEstilosBoton(btnCancelarColores, '#ff4444');

    let colorSeleccionado = '#ffff99';
    colorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        colorSeleccionado = btn.getAttribute('data-color');
        colorButtons.forEach(b => b.style.border = 'none');
        btn.style.border = '2px solid #333';
      });
    });

    btnConfirmar.addEventListener('click', () => {
      destacarVersiculo(versiculoDiv, colorSeleccionado);
      guardarFavorito(libro, capitulo, versiculo, texto, colorSeleccionado);
      document.body.removeChild(ventana);
    });
    btnCancelarColores.addEventListener('click', () => document.body.removeChild(ventana));
  }

  vistaInicial();
}

function destacarVersiculo(versiculoDiv, color) {
  versiculoDiv.style.backgroundColor = color;
}
function guardarFavorito(libro, capitulo, versiculo, texto, color) {
  let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  const existe = favoritos.some(f => f.libro === libro && f.capitulo === capitulo && f.versiculo === versiculo);
  if (!existe) {
    favoritos.push({ libro, capitulo, versiculo, texto, color });
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
  } else {
    alert('Este versículo ya está en tus favoritos.');
  }
}
function mostrarVersiculo(capIndex, versIndex) {
  mostrarCapitulo(capIndex);
  const target = document.getElementById(`vers-${versIndex + 1}`);
  if (target) {
    target.style.backgroundColor = '#ffff99';
    (esMovil ? target.parentElement : target).scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// =====================
// Eventos UI
// =====================
dropdownToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdown.classList.toggle("open");
  cargarLibros();
});
document.addEventListener("click", (e) => {
  if (!dropdown.contains(e.target)) {
    dropdown.classList.remove("open");
    estadoSelector = "libros";
    dropdownToggle.textContent = "Libro";
  }
});

btnAumentar.addEventListener("click", () => {
  fontSize += 2;
  versiculosDiv.style.fontSize = `${fontSize}px`;
});
btnAnterior.addEventListener("click", () => {
  if (capituloSelectIndex > 0) {
    capituloSelectIndex--;
    versiculoSelectIndex = 0;
    mostrarCapitulo(capituloSelectIndex);
    dropdownToggle.textContent = "Capítulo";
    cargarVersiculos(capituloSelectIndex);
  }
});
btnSiguiente.addEventListener("click", () => {
  if (capituloSelectIndex < capitulos.length - 1) {
    capituloSelectIndex++;
    versiculoSelectIndex = 0;
    mostrarCapitulo(capituloSelectIndex);
    dropdownToggle.textContent = "Capítulo";
    cargarVersiculos(capituloSelectIndex);
  }
});

// =====================
// Inicio: carga versión y abre cap. inicial
// =====================
async function initVersionAndHome() {
  const version = getCurrentVersion();
  renderVersionPill(version);
  await loadLibros(version);

  if (!libros || !Object.keys(libros).length) {
    versiculosDiv.innerHTML = `<p style="color:#b00">No se pudo cargar el índice de la versión <strong>${version}</strong>.</p>`;
    return;
  }

  try {
    // Preferí “Génesis”, si no existe probá “Genesis”, sino el primer libro del índice
    let libroInicio = null;
    if (Object.prototype.hasOwnProperty.call(libros, "Génesis")) libroInicio = "Génesis";
    else if (Object.prototype.hasOwnProperty.call(libros, "Genesis")) libroInicio = "Genesis";
    else libroInicio = Object.keys(libros)[0];

    const ruta = libros[libroInicio];
    const modulo = await import(`./${ruta}`);
    capitulos = modulo.default || modulo.capitulos || [];
    if (!Array.isArray(capitulos) || !capitulos.length) {
      throw new Error("Capítulos vacíos en " + ruta);
    }
    libroActual = libroInicio;
    capituloSelectIndex = 0;
    versiculoSelectIndex = 0;
    mostrarCapitulo(0);
    dropdownToggle.textContent = "Libro";
  } catch (e) {
    console.error("[biblia] initVersionAndHome:", e);
    versiculosDiv.innerHTML = `<p style="color:#b00">No se pudo abrir el capítulo inicial. Ver consola.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initVersionAndHome();
  mostrarVersiculoDelDia();
});

// =====================
// Service Worker (opcional)
// =====================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(r => console.log('SW OK:', r))
      .catch(err => console.log('SW error:', err));
  });
}

/*                                                             */
/*                       JS PARA CELULAR                       */
/*                                                             */

// ====== MODO MÓVIL/TABLET ======
const isMobileLike = window.matchMedia('(max-width: 768px)').matches;

// Elementos del header y modal móvil
const bibleBtn = document.getElementById('bibleBtn');
const currentRefEl = document.getElementById('current-ref');
const selectorModal = document.getElementById('selector-modal');
const selectorBackBtn = document.getElementById('selector-back');
const selectorTitle = document.getElementById('selector-title');
const selectorSearchWrap = document.getElementById('selector-search-wrap');
const selectorSearchInput = document.getElementById('selector-search');
const selectorBody = document.getElementById('selector-body');

// Estado de navegación del modal
let mobileState = 'libros'; // 'libros' | 'capitulos' | 'versiculos'
let mobileLibroActual = null;
let mobileCapIndex = 0;

// Actualiza la referencia visible en la barra ("Génesis 1")
function updateCurrentRef() {
  if (!isMobileLike) return;
  const cap = (capituloSelectIndex || 0) + 1;
  currentRefEl.textContent = `${libroActual || 'Mi Biblia'} ${cap || ''}`.trim();
}

// Hookear a tus funciones existentes para refrescar la ref
const _mostrarCapitulo_original = mostrarCapitulo;
mostrarCapitulo = function(index) {
  _mostrarCapitulo_original(index);
  updateCurrentRef();
};

// Abrir/cerrar modal
function openSelectorModal() {
  selectorModal.classList.add('show');
  document.body.style.overflow = 'hidden';
  mobileShowLibros();
  selectorSearchInput.value = '';
}

function closeSelectorModal() {
  selectorModal.classList.remove('show');
  document.body.style.overflow = '';
}

// Render: LIBROS
function mobileShowLibros() {
  mobileState = 'libros';
  selectorTitle.textContent = 'Mi Biblia';
  selectorSearchWrap.style.display = 'block';
  selectorBody.innerHTML = '';

  // Construimos la lista de libros a partir de "libros" (importado)
  const all = Object.keys(libros);
  const frag = document.createDocumentFragment();

  const renderList = (items) => {
    selectorBody.innerHTML = '';
    items.forEach(nombre => {
      const item = document.createElement('div');
      item.className = 'selector-item';
      item.textContent = nombre;
      item.addEventListener('click', async () => {
        await mobileShowCapitulos(nombre);
      });
      selectorBody.appendChild(item);
    });
  };

  // Búsqueda
  selectorSearchInput.oninput = () => {
    const q = selectorSearchInput.value.trim().toLowerCase();
    const filtered = all.filter(n => n.toLowerCase().includes(q));
    renderList(filtered);
  };

  renderList(all);
}

// Render: CAPÍTULOS
async function mobileShowCapitulos(nombreLibro) {
  mobileState = 'capitulos';
  selectorTitle.textContent = nombreLibro;
  selectorSearchWrap.style.display = 'none';
  selectorBody.innerHTML = '';

  // Cargamos usando tu misma lógica
  const ruta = libros[nombreLibro];
  const modulo = await import(`./${ruta}`);
  const caps = modulo.default;

  // Guardamos en estado global para mantener consistencia
  capitulos = caps;
  libroActual = nombreLibro;

  const grid = document.createElement('div');
  grid.className = 'selector-grid';

  caps.forEach((_, index) => {
    const cell = document.createElement('div');
    cell.className = 'selector-cell';
    cell.textContent = index + 1;
    cell.addEventListener('click', () => {
      mobileCapIndex = index;
      mobileShowVersiculos(nombreLibro, index);
    });
    grid.appendChild(cell);
  });

  selectorBody.appendChild(grid);
}

// Render: VERSÍCULOS
function mobileShowVersiculos(nombreLibro, capIndex) {
  mobileState = 'versiculos';
  selectorTitle.textContent = `${nombreLibro} ${capIndex + 1}`;
  selectorSearchWrap.style.display = 'none';
  selectorBody.innerHTML = '';

  const vers = capitulos[capIndex] || [];
  const grid = document.createElement('div');
  grid.className = 'selector-grid';

  vers.forEach((_, i) => {
    const cell = document.createElement('div');
    cell.className = 'selector-cell';
    cell.textContent = i + 1;
    cell.addEventListener('click', () => {
      // Al elegir versículo: cerramos modal y mostramos en la vista
      capituloSelectIndex = capIndex;
      versiculoSelectIndex = i;
      _mostrarCapitulo_original(capIndex); // pinto capítulo
      mostrarVersiculo(capIndex, i);       // scrolleo y resalto
      closeSelectorModal();
      updateCurrentRef();
    });
    grid.appendChild(cell);
  });

  selectorBody.appendChild(grid);
}

// Botón Biblia abre modal en móvil
if (isMobileLike && bibleBtn) {
  bibleBtn.addEventListener('click', openSelectorModal);
}

// Botón back del modal
if (isMobileLike && selectorBackBtn) {
  selectorBackBtn.addEventListener('click', () => {
    if (mobileState === 'versiculos') {
      mobileShowCapitulos(libroActual);
    } else if (mobileState === 'capitulos') {
      mobileShowLibros();
    } else {
      closeSelectorModal();
    }
  });
}

// Cerrar modal con ESC
document.addEventListener('keydown', (e) => {
  if (!isMobileLike) return;
  if (e.key === 'Escape' && selectorModal.classList.contains('show')) {
    closeSelectorModal();
  }
});

// Inicializar ref visual al cargar primer capítulo
updateCurrentRef();
