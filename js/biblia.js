// biblia.js (completo con cuadrícula de capítulos, reinicio, y Génesis 1:1 al inicio)
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

function cargarLibros() {
  dropdownContent.innerHTML = '';
  estadoSelector = "libros";

  const inputBusqueda = crearInputBusqueda();
  dropdownContent.appendChild(inputBusqueda);

  Object.keys(libros).forEach(nombre => {
    const opcion = document.createElement("div");
    opcion.className = "dropdown-option";
    opcion.textContent = nombre;
    opcion.addEventListener("click", async () => {
      libroSeleccionado = nombre;
      dropdownToggle.textContent = nombre;
      await cargarCapitulos(nombre);
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

  dropdownContent.innerHTML = '';

  const grid = document.createElement("div");
  grid.className = "chapter-grid";

  capitulos.forEach((_, index) => {
    const btn = document.createElement("div");
    btn.className = "chapter-item";
    btn.textContent = index + 1;
    btn.addEventListener("click", () => {
      mostrarCapitulo(index);
      dropdown.classList.remove("open");
    });
    grid.appendChild(btn);
  });

  dropdownContent.appendChild(grid);
}

function mostrarCapitulo(index) {
  const versiculos = capitulos[index];
  capituloSelectIndex = index;
  versiculosDiv.innerHTML = `<h2>${libroActual} ${index + 1}</h2>`;
  versiculos.forEach((verso, i) => {
    versiculosDiv.innerHTML += `<p><strong>${i + 1}</strong> ${verso}</p>`;
  });
}

dropdownToggle.addEventListener("click", () => {
  const estabaAbierto = dropdown.classList.contains("open");
  dropdown.classList.toggle("open");

  if (!estabaAbierto || estadoSelector !== "libros") {
    cargarLibros();
  }
});

document.addEventListener("click", (e) => {
  if (!dropdown.contains(e.target)) {
    dropdown.classList.remove("open");
  }
});

btnAumentar.addEventListener("click", () => {
  fontSize += 2;
  versiculosDiv.style.fontSize = `${fontSize}px`;
});

btnAnterior.addEventListener("click", () => {
  if (capituloSelectIndex > 0) {
    capituloSelectIndex--;
    mostrarCapitulo(capituloSelectIndex);
  }
});

btnSiguiente.addEventListener("click", () => {
  if (capituloSelectIndex < capitulos.length - 1) {
    capituloSelectIndex++;
    mostrarCapitulo(capituloSelectIndex);
  }
});

// Mostrar Génesis 1:1 al cargar la página
(async function mostrarGenesis1() {
  const ruta = libros["Génesis"];
  const modulo = await import(`./${ruta}`);
  capitulos = modulo.default;
  libroActual = "Génesis";
  capituloSelectIndex = 0;
  mostrarCapitulo(0);
  dropdownToggle.textContent = "Génesis";
})();