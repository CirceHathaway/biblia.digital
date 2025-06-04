import { libros } from './libros.js';

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
let touchMoved = false;

const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
  const ruta = libros[nombreLibro];
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
    let elemento;
    if (esMovil) {
      elemento = document.querySelector(`[data-versiculo-id="${versiculoId}"]`);
    } else {
      elemento = document.querySelector(`[data-versiculo-id="${versiculoId}"]`);
    }
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
    if (esMovil) {
      const versiculoDiv = document.createElement('div');
      versiculoDiv.className = 'versiculo-item';
      versiculoDiv.setAttribute('data-versiculo-id', `vers-${i + 1}`);
      versiculoDiv.innerHTML = `<p id="vers-${i + 1}"><strong>${i + 1}</strong> ${verso}</p>`;
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
      versiculoDiv.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
      });
      versiculosDiv.appendChild(versiculoDiv);
    } else {
      const versiculoDiv = document.createElement('div');
      versiculoDiv.className = 'versiculo-item';
      versiculoDiv.setAttribute('data-versiculo-id', `vers-${i + 1}`);
      versiculoDiv.innerHTML = `<p id="vers-${i + 1}"><strong>${i + 1}</strong> ${verso}</p>`;
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
      versiculoDiv.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
      });
      versiculoDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
      versiculosDiv.appendChild(versiculoDiv);
    }
  });
  cargarResaltados();
}

function mostrarVentanaDestacar(libro, capitulo, versiculo, texto, versiculoDiv) {
  const ventana = document.createElement('div');
  ventana.className = 'ventana-destacar';
  ventana.innerHTML = `
    <div class="ventana-contenido">
      <p>¿Deseas destacar este versículo?</p>
      <div class="color-options">
        <button class="color-btn" data-color="#ffff99" style="background-color: #ffff99;"></button>
        <button class="color-btn" data-color="#ffcccb" style="background-color: #ffcccb;"></button>
        <button class="color-btn" data-color="#add8e6" style="background-color: #add8e6;"></button>
        <button class="color-btn" data-color="#90ee90" style="background-color: #90ee90;"></button>
      </div>
      <button id="btn-confirmar">Confirmar</button>
      <button id="btn-cancelar">Cancelar</button>
    </div>
  `;
  document.body.appendChild(ventana);
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
  const contenido = ventana.querySelector('.ventana-contenido');
  contenido.style.backgroundColor = '#fff';
  contenido.style.padding = '20px';
  contenido.style.borderRadius = '8px';
  contenido.style.textAlign = 'center';
  const btnConfirmar = document.getElementById('btn-confirmar');
  const btnCancelar = document.getElementById('btn-cancelar');
  const colorButtons = ventana.querySelectorAll('.color-btn');
  let colorSeleccionado = '#ffff99';
  colorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      colorSeleccionado = btn.getAttribute('data-color');
      colorButtons.forEach(b => b.style.border = 'none');
      btn.style.border = '2px solid #333';
    });
  });
  btnConfirmar.style.backgroundColor = '#4CAF50';
  btnConfirmar.style.color = 'white';
  btnConfirmar.style.border = 'none';
  btnConfirmar.style.padding = '5px 10px';
  btnConfirmar.style.margin = '5px';
  btnConfirmar.style.borderRadius = '5px';
  btnConfirmar.style.cursor = 'pointer';
  btnCancelar.style.backgroundColor = '#ff4444';
  btnCancelar.style.color = 'white';
  btnCancelar.style.border = 'none';
  btnCancelar.style.padding = '5px 10px';
  btnCancelar.style.margin = '5px';
  btnCancelar.style.cursor = 'pointer';
  btnConfirmar.addEventListener('click', () => {
    destacarVersiculo(versiculoDiv, colorSeleccionado);
    guardarFavorito(libro, capitulo, versiculo, texto, colorSeleccionado);
    document.body.removeChild(ventana);
  });
  btnCancelar.addEventListener('click', () => {
    document.body.removeChild(ventana);
  });
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
    alert(`Versículo ${libro} ${capitulo}:${versiculo} guardado como favorito y destacado.`);
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

(async function mostrarGenesis1() {
  const ruta = libros["Génesis"];
  const modulo = await import(`./${ruta}`);
  capitulos = modulo.default;
  libroActual = "Génesis";
  capituloSelectIndex = 0;
  versiculoSelectIndex = 0;
  mostrarCapitulo(0);
  dropdownToggle.textContent = "Libro";
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado con éxito:', registration);
      })
      .catch(error => {
        console.log('Error al registrar el Service Worker:', error);
      });
  });
}

const appLink = document.querySelector('#appLink');
const appLinkText = document.querySelector('#appLinkText');
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Evento beforeinstallprompt disparado');
  e.preventDefault();
  deferredPrompt = e;
  if (esMovil && !window.matchMedia('(display-mode: standalone)').matches) {
    appLinkText.textContent = 'Obtener la App';
    appLink.href = '#app';
  }
});

function shareApp() {
  if (navigator.share) {
    navigator.share({
      title: 'Mi Biblia',
      text: 'Descubre la Biblia Reina-Valera 1960 con Mi Biblia, una app para leer y destacar versículos.',
      url: 'https://circehathaway.github.io/biblia.digital/',
    })
    .then(() => console.log('Enlace compartido con éxito'))
    .catch(error => console.log('Error al compartir:', error));
  } else {
    alert('La función de compartir no está soportada en este navegador. Copia este enlace: https://circehathaway.github.io/biblia.digital/');
  }
}

if (esMovil && window.matchMedia('(display-mode: standalone)').matches) {
  appLinkText.textContent = 'Compartir App';
  appLink.href = '#share';
  appLink.addEventListener('click', (e) => {
    e.preventDefault();
    shareApp();
  });
} else {
  appLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Usuario aceptó instalar la PWA');
        } else {
          console.log('Usuario canceló la instalación de la PWA');
        }
        deferredPrompt = null;
      });
    } else {
      console.log('La PWA no está lista para instalarse aún.');
    }
  });
}