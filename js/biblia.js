// js/biblia.js
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

function mostrarCapitulo(index) {
  const versiculos = capitulos[index];
  capituloSelectIndex = index;
  versiculosDiv.innerHTML = `<h2>${libroActual} ${index + 1}</h2>`;
  versiculos.forEach((verso, i) => {
    versiculosDiv.innerHTML += `<p id="vers-${i + 1}"><strong>${i + 1}</strong> ${verso}</p>`;
  });
}

function mostrarVersiculo(capIndex, versIndex) {
  mostrarCapitulo(capIndex);
  const target = document.getElementById(`vers-${versIndex + 1}`);
  if (target) {
    target.style.backgroundColor = '#f64444';
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

dropdownToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdown.classList.toggle("open");

  // Siempre cargar libros cuando se abre el dropdown
  cargarLibros();
});

document.addEventListener("click", (e) => {
  if (!dropdown.contains(e.target)) {
    dropdown.classList.remove("open");
    // Reiniciar el estado al cerrar el dropdown
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