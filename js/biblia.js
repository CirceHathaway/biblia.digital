import { libros } from './libros.js';

const libroSelect = document.getElementById("libro");
const capituloSelect = document.getElementById("capitulo");
const buscarInput = document.getElementById("buscarLibro");
const versiculosDiv = document.getElementById("versiculos");
const btnAumentar = document.getElementById("aumentarLetra");
const btnAnterior = document.getElementById("anteriorCapitulo");
const btnSiguiente = document.getElementById("siguienteCapitulo");

let libroActual = null;
let capitulos = [];
let fontSize = 18;

let listaLibros = Object.entries(libros);

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function renderLibros(filtrados) {
  libroSelect.innerHTML = '';
  filtrados.forEach(([nombre]) => {
    const option = document.createElement("option");
    option.value = nombre;
    option.textContent = nombre;
    libroSelect.appendChild(option);
  });

  if (filtrados.length > 0) {
    libroSelect.dispatchEvent(new Event('change'));
  } else {
    capituloSelect.innerHTML = '';
    versiculosDiv.innerHTML = '<p>No se encontraron libros con ese nombre.</p>';
  }
}

buscarInput.addEventListener("input", () => {
  let texto = buscarInput.value;
  texto = texto.replace(/\b\w/g, l => l.toUpperCase());
  buscarInput.value = texto;

  const filtrados = listaLibros.filter(([nombre]) =>
    normalizar(nombre).includes(normalizar(texto))
  );
  renderLibros(filtrados);
});

libroSelect.addEventListener("change", async () => {
  const nombreLibro = libroSelect.value;
  const ruta = libros[nombreLibro];

  const modulo = await import(`./${ruta}`);
  capitulos = modulo.default;
  libroActual = nombreLibro;

  capituloSelect.innerHTML = '';
  capitulos.forEach((_, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    opt.textContent = `Capítulo ${index + 1}`;
    capituloSelect.appendChild(opt);
  });

  capituloSelect.dispatchEvent(new Event('change'));
});

capituloSelect.addEventListener("change", () => {
  const index = parseInt(capituloSelect.value);
  const versiculos = capitulos[index];
  versiculosDiv.innerHTML = `<h2>${libroActual} ${index + 1}</h2>`;
  versiculos.forEach((verso, i) => {
    versiculosDiv.innerHTML += `<p><strong>${i + 1}</strong> ${verso}</p>`;
  });
});

// Botón A+ para agrandar letra
btnAumentar.addEventListener("click", () => {
  fontSize += 2;
  versiculosDiv.style.fontSize = `${fontSize}px`;
});

// Botones < y >
btnAnterior.addEventListener("click", () => {
  const actual = parseInt(capituloSelect.value);
  if (actual > 0) {
    capituloSelect.value = actual - 1;
    capituloSelect.dispatchEvent(new Event('change'));
  }
});

btnSiguiente.addEventListener("click", () => {
  const actual = parseInt(capituloSelect.value);
  if (actual < capituloSelect.options.length - 1) {
    capituloSelect.value = actual + 1;
    capituloSelect.dispatchEvent(new Event('change'));
  }
});

// Inicializa lista completa
renderLibros(listaLibros);
