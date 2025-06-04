const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const appLink = document.querySelector('#appLink');
const appLinkText = document.querySelector('#appLinkText');
let deferredPrompt;

if (appLink && appLinkText) {
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
} else {
  console.warn('Elementos #appLink o #appLinkText no encontrados en la página.');
}