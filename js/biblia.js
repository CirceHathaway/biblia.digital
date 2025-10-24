// js/biblia.js

// ⚠️ Ya no importamos un libros.js fijo. Se carga dinámicamente según versión.
// import { libros } from './libros.js';

const dropdown = document.getElementById("selector-libro");
const dropdownToggle = document.getElementById("selector-toggle");
const dropdownContent = document.getElementById("selector-content");
const versiculosDiv = document.getElementById("versiculos");
const btnAumentar = document.getElementById("aumentarLetra");
const btnAnterior = document.getElementById("anteriorCapitulo");
const btnSiguiente = document.getElementById("siguienteCapitulo");
const versionEl = document.querySelector(".version-biblia");

let libroActual = null;
let capitulos = [];
let capituloSelectIndex = 0;
let versiculoSelectIndex = 0;
let fontSize = 18;
let estadoSelector = "libros";
let libroSeleccionado = "";
let pressTimer;
let mouseMoved = false;
let touchMoved = false;

// Nuevo: mapa dinámico de libros según versión
let librosMap = {};

const VERSIONES_SOPORTADAS = ["RVR1960", "RVC", "NVI"];

function getVersionInicial() {
  // prioridad: localStorage → HTML (.version-biblia) → RVR1960
  const guardada = localStorage.getItem("versionBiblia");
  if (guardada && VERSIONES_SOPORTADAS.includes(guardada)) return guardada;
  const delHTML = (versionEl?.textContent || "").trim();
  if (VERSIONES_SOPORTADAS.includes(delHTML)) return delHTML;
  return "RVR1960";
}

async function cargarLibrosDeVersion(version) {
  // Seteo visual + persistencia
  if (versionEl) versionEl.textContent = version;
  localStorage.setItem("versionBiblia", version);

  // Cargar el index de libros de la versión
  // Estructura esperada: js/libros/<VERSION>/libros.js exporta { libros }
  const modulo = await import(`./libros/${version}/libros.js`);
  librosMap = modulo.libros || {};

  // Si ya había un libro seleccionado que no existe en esta versión,
  // limpiamos selección
  if (libroSeleccionado && !librosMap[libroSeleccionado]) {
    libroSeleccionado = "";
  }

  // Cargar Génesis 1 por defecto si existe en la versión
  if (librosMap["Génesis"]) {
    await cargarCapituloInicial();
  } else {
    versiculosDiv.innerHTML = `<p style="padding:1rem;">No hay libros disponibles aún para ${version}.</p>`;
  }
}

async function cargarCapituloInicial() {
  const ruta = librosMap["Génesis"];
  const modulo = await import(`./${ruta}`);
  capitulos = modulo.default;
  libroActual = "Génesis";
  capituloSelectIndex = 0;
  versiculoSelectIndex = 0;
  mostrarCapitulo(0);
  dropdownToggle.textContent = "Libro";
}

const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// === Versículos destacados (sin cambios) ===
const versiculosDestacados = [/* ... tu gran array intacto aquí ... */];

// Obtener o generar un identificador único por dispositivo
function obtenerIdentificadorDispositivo() {
  let idDispositivo = localStorage.getItem('deviceId');
  if (!idDispositivo) {
    idDispositivo = Math.random().toString(36).substr(2, 9) + navigator.userAgent.hashCode();
    localStorage.setItem('deviceId', idDispositivo);
  }
  return idDispositivo;
}

// Extensión de String para hashCode (simplificado)
String.prototype.hashCode = function() {
  let hash = 0;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
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

  if (ultimaVisita !== hoy) {
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
}

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
  btn.textContent = "Volver";
  btn.className = "dropdown-option";
  btn.style.fontWeight = "bold";
  btn.style.backgroundColor = "#ddd";
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (destino === "libros") {
      cargarLibros();
    } else if (destino === "capitulos") {
      await cargarCapitulos(libroActual);
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

  Object.keys(librosMap).forEach(nombre => {
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
  const ruta = librosMap[nombreLibro];
  if (!ruta) return;
  const modulo = await import(`./${ruta}`);
  capitulos = modulo.default;
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
      setTimeout(() => {
        dropdown.classList.add("open");
      }, 0);
    });
    grid.appendChild(btn);
  });
  dropdownContent.appendChild(grid);
  agregarBotonVolver("libros");
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
          if (!moved) {
            mostrarVentanaDestacar(libroActual, index + 1, i + 1, verso, versiculoDiv);
          }
        }, 500);
      });
      versiculoDiv.addEventListener('touchmove', (e) => {
        const currentY = e.touches[0].clientY;
        const diffY = Math.abs(currentY - startY);
        if (diffY > 10) {
          moved = true;
          clearTimeout(pressTimer);
        }
      });
      versiculoDiv.addEventListener('touchend', () => clearTimeout(pressTimer));
    } else {
      versiculoDiv.addEventListener('mousedown', (e) => {
        e.preventDefault();
        mouseMoved = false;
        pressTimer = setTimeout(() => {
          if (!mouseMoved) {
            mostrarVentanaDestacar(libroActual, index + 1, i + 1, verso, versiculoDiv);
          }
        }, 500);
      });
      versiculoDiv.addEventListener('mousemove', () => {
        mouseMoved = true;
        clearTimeout(pressTimer);
      });
      versiculoDiv.addEventListener('mouseup', () => clearTimeout(pressTimer));
      versiculoDiv.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    versiculosDiv.appendChild(versiculoDiv);
  });
  cargarResaltados();
}

async function generarImagenVersiculo(libro, capitulo, versiculoNumero, texto, esVersiculoDelDia = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 940;
  canvas.height = 788;
  const ctx = canvas.getContext('2d');

  const fondo = new Image();
  fondo.src = esVersiculoDelDia ? 'images/background-versiculo-dia.jpg' : 'images/background-versiculo.jpg';
  await new Promise(resolve => fondo.onload = resolve);
  ctx.drawImage(fondo, 0, 0, 940, 788);

  await document.fonts.load('32px "PT Serif"');

  const fontFamily = '"PT Serif", serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = `32px ${fontFamily}`;
  const referencia = `${libro} ${capitulo}:${versiculoNumero}`;
  const referenciaWidth = ctx.measureText(referencia).width;

  ctx.font = `28px ${fontFamily}`;
  const maxWidth = 800;
  const lineHeight = 40;
  const words = texto.split(' ');
  let line = '';
  const lines = [];
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && i > 0) {
      lines.push(line);
      line = words[i] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  const paddingX = 40;
  const paddingY = 20;
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
  lines.forEach((line, i) => {
    ctx.fillText(line, 470, rectY + paddingY + lineHeight * (i + 1.5));
  });

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob));
  });
}

async function compartirVersiculoComoImagen(libro, capitulo, versiculoNumero, texto, esVersiculoDelDia = false) {
  try {
    const blob = await generarImagenVersiculo(libro, capitulo, versiculoNumero, texto, esVersiculoDelDia);
    const file = new File([blob], `versiculo-${libro}-${capitulo}-${versiculoNumero}.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `${libro} ${capitulo}:${versiculoNumero}`,
        text: 'Comparte este versículo de Mi Biblia',
      });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `versiculo-${libro}-${capitulo}-${versiculoNumero}.png`;
      a.click();
      URL.revokeObjectURL(url);
      alert('La función de compartir no está soportada. La imagen se ha descargado.');
    }
  } catch (error) {
    console.error('Error al generar o compartir la imagen:', error);
    alert('Hubo un error al generar la imagen. Por favor, intenta de nuevo.');
  }
}

function mostrarVentanaDestacar(libro, capitulo, versiculo, texto, versiculoDiv) {
  const ventana = document.createElement('div');
  ventana.className = 'ventana-destacar';

  function aplicarEstilosVentana() {
    ventana.style.position = 'fixed';
    ventana.style.top = '50%';
    ventana.style.left = '50%';
    ventana.style.transform = 'translate(-50%, -50%)';
    ventana.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    ventana.style.width = '100%';
    ventana.style.height = '100%';
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

  function mostrarVistaInicial() {
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

    btnDestacar.addEventListener('click', () => {
      mostrarVistaColores();
    });

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

    btnCancelar.addEventListener('click', () => {
      document.body.removeChild(ventana);
    });
  }

  function mostrarVistaColores() {
    ventana.innerHTML = `
      <div class="ventana-contenido">
        <p>Elige un color para destacar</p>
        <div class="color-options">
          <button class="color-btn" data-color="#ffff99" style="background-color: #ffff99;"></button>
          <button class="color-btn" data-color="#ffcccb" style="background-color: #ffcccb;"></button>
          <button class="color-btn" data-color="#add8e6" style="background-color: #add8e6;"></button>
          <button class="color-btn" data-color="#90ee90" style="background-color: #90ee90;"></button>
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

    btnCancelarColores.addEventListener('click', () => {
      document.body.removeChild(ventana);
    });
  }

  mostrarVistaInicial();
}

function destacarVersiculo(versiculoDiv, color) {
  versiculoDiv.style.backgroundColor = color;
}

function guardarFavorito(libro, capitulo, versiculo, texto, color) {
  let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  const existe = favoritos.some(fav =>
    fav.libro === libro && fav.capitulo === capitulo && fav.versiculo === versiculo
  );
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
    if (esMovil) {
      target.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

// === UI eventos ===
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

// === Cambio de versión clickeando en .version-biblia (ciclo) ===
/*
if (versionEl) {
  versionEl.style.cursor = 'pointer';
  versionEl.addEventListener('click', async () => {
    const actual = (versionEl.textContent || "").trim();
    const idx = VERSIONES_SOPORTADAS.indexOf(actual);
    const siguiente = VERSIONES_SOPORTADAS[(idx + 1) % VERSIONES_SOPORTADAS.length];
    await cargarLibrosDeVersion(siguiente);
    // Reabrir selector a LIBROS para refrescar listado
    dropdownToggle.textContent = "Libro";
    estadoSelector = "libros";
  });
} */

// === Menú de selección de versión ===
let versionMenuEl = null;
let versionWrapperEl = null;

function updateVersionMenuActive(version) {
  if (!versionMenuEl) return;
  versionMenuEl.querySelectorAll('button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.version === version);
  });
}

function closeVersionMenu() {
  versionMenuEl?.classList.remove('open');
}

function buildVersionMenu() {
  if (!versionEl) return;

  // Envolvemos el .version-biblia en un contenedor relativo
  versionWrapperEl = document.createElement('div');
  versionWrapperEl.className = 'version-selector';
  versionEl.parentNode.insertBefore(versionWrapperEl, versionEl);
  versionWrapperEl.appendChild(versionEl);

  // Accesibilidad básica
  versionEl.setAttribute('role', 'button');
  versionEl.setAttribute('tabindex', '0');
  versionEl.setAttribute('aria-haspopup', 'true');
  versionEl.setAttribute('aria-expanded', 'false');

  // Menú
  versionMenuEl = document.createElement('div');
  versionMenuEl.className = 'version-menu';

  VERSIONES_SOPORTADAS.forEach(v => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = v;
    btn.dataset.version = v;
    btn.addEventListener('click', async () => {
      await cargarLibrosDeVersion(v);
      dropdownToggle.textContent = "Libro";
      estadoSelector = "libros";
      updateVersionMenuActive(v);
      versionEl.setAttribute('aria-expanded', 'false');
      closeVersionMenu();
    });
    versionMenuEl.appendChild(btn);
  });

  versionWrapperEl.appendChild(versionMenuEl);

  // Toggle con click
  versionEl.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = versionMenuEl.classList.toggle('open');
    versionEl.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    updateVersionMenuActive((versionEl.textContent || '').trim());
  });

  // Teclado: Enter/Espacio abre-cierra; Escape cierra
  versionEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const isOpen = versionMenuEl.classList.toggle('open');
      versionEl.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      updateVersionMenuActive((versionEl.textContent || '').trim());
    } else if (e.key === 'Escape') {
      closeVersionMenu();
      versionEl.setAttribute('aria-expanded', 'false');
    }
  });

  // Cerrar al clicar fuera
  document.addEventListener('click', (e) => {
    if (!versionWrapperEl.contains(e.target)) {
      closeVersionMenu();
      versionEl.setAttribute('aria-expanded', 'false');
    }
  });
}

// === Boot ===
document.addEventListener('DOMContentLoaded', async () => {
  mostrarVersiculoDelDia();
  const versionInicial = getVersionInicial();
  await cargarLibrosDeVersion(versionInicial);
  buildVersionMenu();               // <-- construir menú
  updateVersionMenuActive(versionInicial);
});

// === Service Worker ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isGhPages = location.hostname.endsWith('github.io');
    const basePath = isGhPages ? '/biblia.digital/' : '/';
    const swURL = `${basePath}service-worker.js`;
    navigator.serviceWorker.register(swURL, { scope: basePath })
      .then(reg => console.log('Service Worker registrado con éxito:', reg.scope))
      .catch(error => console.log('Error al registrar el Service Worker:', error));
  });
}
