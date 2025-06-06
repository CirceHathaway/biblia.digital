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

async function generarImagenVersiculo(libro, capitulo, versiculoNumero, texto) {
  const canvas = document.createElement('canvas');
  canvas.width = 940;
  canvas.height = 788;
  const ctx = canvas.getContext('2d');

  // Cargar fondo
  const fondo = new Image();
  fondo.src = 'images/background-versiculo.jpg';
  await new Promise(resolve => fondo.onload = resolve);
  ctx.drawImage(fondo, 0, 0, 940, 788);

  // Asegurar que la fuente esté cargada
  await document.fonts.load('32px "PT Serif"');

  // Configurar fuente y color
  const fontFamily = '"PT Serif", serif';
  ctx.fillStyle = '#000000'; // Color negro
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Referencia (Salmos 33:11)
  ctx.font = `32px ${fontFamily}`;
  const referencia = `${libro} ${capitulo}:${versiculoNumero}`;
  const referenciaWidth = ctx.measureText(referencia).width;

  // Versículo con ajuste de líneas
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

  // Calcular dimensiones del rectángulo
  const paddingX = 40;
  const paddingY = 20;
  const textWidth = Math.max(referenciaWidth, ...lines.map(l => ctx.measureText(l).width));
  const textHeight = (lines.length + 1) * lineHeight; // +1 por la referencia
  const rectWidth = textWidth + paddingX * 2;
  const rectHeight = textHeight + paddingY * 2;
  const rectX = (940 - rectWidth) / 2;
  const rectY = (788 - rectHeight) / 2;

  // Dibujar rectángulo semitransparente
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

  // Dibujar texto
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

async function compartirVersiculoComoImagen(libro, capitulo, versiculoNumero, texto) {
  try {
    const blob = await generarImagenVersiculo(libro, capitulo, versiculoNumero, texto);
    const file = new File([blob], `versiculo-${libro}-${capitulo}-${versiculoNumero}.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `${libro} ${capitulo}:${versiculoNumero}`,
        text: 'Comparte este versículo de Mi Biblia',
      });
      console.log('Versículo compartido como imagen con éxito');
    } else {
      // Fallback: Descargar imagen
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
  
  // Función para aplicar estilos comunes a la ventana
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

  // Función para aplicar estilos comunes al contenido
  function aplicarEstilosContenido(contenido) {
    contenido.style.backgroundColor = '#fff';
    contenido.style.padding = '20px';
    contenido.style.borderRadius = '8px';
    contenido.style.textAlign = 'center';
  }

  // Función para aplicar estilos a los botones
  function aplicarEstilosBoton(boton, colorFondo) {
    boton.style.backgroundColor = colorFondo;
    boton.style.color = 'white';
    boton.style.border = 'none';
    boton.style.padding = '5px 10px';
    boton.style.margin = '5px';
    boton.style.borderRadius = '5px';
    boton.style.cursor = 'pointer';
  }

  // Vista inicial: sin colores
  function mostrarVistaInicial() {
    ventana.innerHTML = `
      <div class="ventana-contenido">
        <p>¿Qué deseas hacer con este versículo?</p>
        <button id="btn-destacar">Destacar</button>
        <button id="btn-compartir-imagen">Compartir como imagen</button>
        <button id="btn-cancelar">Cancelar</button>
      </div>
    `;
    document.body.appendChild(ventana);

    aplicarEstilosVentana();
    const contenido = ventana.querySelector('.ventana-contenido');
    aplicarEstilosContenido(contenido);

    const btnDestacar = document.getElementById('btn-destacar');
    const btnCompartirImagen = document.getElementById('btn-compartir-imagen');
    const btnCancelar = document.getElementById('btn-cancelar');

    aplicarEstilosBoton(btnDestacar, '#4CAF50');
    aplicarEstilosBoton(btnCompartirImagen, '#2196F3');
    aplicarEstilosBoton(btnCancelar, '#ff4444');

    btnDestacar.addEventListener('click', () => {
      mostrarVistaColores();
    });

    btnCompartirImagen.addEventListener('click', () => {
      compartirVersiculoComoImagen(libro, capitulo, versiculo, texto);
      document.body.removeChild(ventana);
    });

    btnCancelar.addEventListener('click', () => {
      document.body.removeChild(ventana);
    });
  }

  // Vista de selección de colores
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
        <button id="btn-confirmar">Confirmar</button>
        <button id="btn-cancelar-colores">Cancelar</button>
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

  // Mostrar la vista inicial
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