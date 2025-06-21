document.addEventListener('DOMContentLoaded', function() {
  i18next
    .use(i18nextHttpBackend)
    .use(i18nextBrowserLanguageDetector)
    .init({
      fallbackLng: 'es',
      debug: false,
      load: 'languageOnly',
      backend: {
        loadPath: 'assets/languages/{{lng}}.json'
      }
    }, function(err, t) {
      if (err) return console.error(err);
      updateContent();
    });

  // Language switcher
  document.querySelectorAll('.language-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedLang = btn.dataset.language;
      i18next.changeLanguage(selectedLang, updateContent);
    });
  });
});

function updateContent() {
  document.querySelectorAll('[data-section][data-value]').forEach(el => {
    const section = el.getAttribute('data-section');
    const value = el.getAttribute('data-value');
    const key = `${section}.${value}`;
    const translation = i18next.t(key);
    if (translation) el.innerHTML = translation;
  });
}