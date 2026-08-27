/*===================================================================
=            PORTAFOLIO — LOGICA PRINCIPAL                          =
=  Nav movil, scroll activo, tema, idioma y efecto typing del hero. =
===================================================================*/

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/*==================== MENU MOVIL ====================*/
const showMenu = (toggleId, navId) => {
    const toggle = document.getElementById(toggleId),
          nav = document.getElementById(navId);

    if (!toggle || !nav) {
        console.warn(`No se encontro el toggle "${toggleId}" o el menu "${navId}"`);
        return;
    }

    toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('show');
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Cerrar menu' : 'Abrir menu');
        toggle.querySelector('i')?.classList.toggle('bx-x', isOpen);
        toggle.querySelector('i')?.classList.toggle('bx-menu', !isOpen);
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('show')) {
            toggle.click();
        }
    });
};
showMenu('nav-toggle', 'nav-menu');

/*==================== CERRAR MENU AL NAVEGAR ====================*/
const navLink = document.querySelectorAll('.nav__link');

function linkAction() {
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');
    if (!navMenu) return;

    navMenu.classList.remove('show');
    if (navToggle) {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menu');
        navToggle.querySelector('i')?.classList.remove('bx-x');
        navToggle.querySelector('i')?.classList.add('bx-menu');
    }
}
navLink.forEach(n => n.addEventListener('click', linkAction));

/*==================== LINK ACTIVO SEGUN SCROLL ====================*/
const sections = document.querySelectorAll('section[id]');

const scrollActive = () => {
    const scrollDown = window.scrollY;

    sections.forEach(current => {
        const sectionHeight = current.offsetHeight,
              sectionTop = current.offsetTop - 58,
              sectionId = current.getAttribute('id'),
              sectionsClass = document.querySelector(`.nav__menu a[href*="${sectionId}"]`);

        // Una seccion puede no tener link en el nav: sin esta guarda revienta
        if (!sectionsClass) return;

        if (scrollDown > sectionTop && scrollDown <= sectionTop + sectionHeight) {
            sectionsClass.classList.add('active-link');
        } else {
            sectionsClass.classList.remove('active-link');
        }
    });
};
window.addEventListener('scroll', scrollActive, { passive: true });

/*==================== SCROLL REVEAL ====================*/
// Viene de un CDN: si falla la red, el sitio debe seguir funcionando.
if (typeof ScrollReveal === 'function' && !prefersReducedMotion) {
    const sr = ScrollReveal({
        origin: 'top',
        distance: '60px',
        duration: 2000,
        delay: 200
    });

    sr.reveal('.about__img, .skills__subtitle, .skills__text', {});
    sr.reveal('.about__subtitle, .about__text, .skills__img', { delay: 400 });
    sr.reveal('.skills__data, .work__img, .contact__input', { interval: 200 });
} else if (typeof ScrollReveal !== 'function') {
    console.warn('ScrollReveal no cargo: el contenido se muestra sin animacion.');
}

/*==================== EFECTO TYPING DEL HERO ====================*/
const typedRole = document.getElementById('typed-role');
let typingTimer = null;

const startTyping = (roles) => {
    if (!typedRole || !Array.isArray(roles) || roles.length === 0) return;

    // Reiniciar si ya habia una animacion corriendo (p. ej. al cambiar de idioma)
    if (typingTimer) {
        clearTimeout(typingTimer);
        typingTimer = null;
    }

    // Sin animacion si el usuario la desactivo en su sistema
    if (prefersReducedMotion) {
        typedRole.textContent = roles[0];
        return;
    }

    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const tick = () => {
        const currentRole = roles[roleIndex];

        charIndex += deleting ? -1 : 1;
        typedRole.textContent = currentRole.slice(0, charIndex);

        let delay = deleting ? 45 : 90;

        if (!deleting && charIndex === currentRole.length) {
            delay = 1800;          // pausa leyendo el rol completo
            deleting = true;
        } else if (deleting && charIndex === 0) {
            deleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            delay = 350;
        }

        typingTimer = setTimeout(tick, delay);
    };

    typedRole.textContent = '';
    tick();
};

/*==================== IDIOMA ====================*/
const STORAGE_LANG = 'language';
const SUPPORTED_LANGS = ['es', 'en'];
const textsToChange = document.querySelectorAll('[data-section]');

const setActiveLangButton = (language) => {
    document.querySelectorAll('.language-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.language === language);
        btn.setAttribute('aria-pressed', String(btn.dataset.language === language));
    });
};

const changeLanguage = async (language) => {
    if (!SUPPORTED_LANGS.includes(language)) {
        console.warn(`Idioma no soportado: "${language}". Se usa "es".`);
        language = 'es';
    }

    try {
        const response = await fetch(`./assets/languages/${language}.json`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} al pedir ${language}.json`);
        }
        const texts = await response.json();

        for (const textToChange of textsToChange) {
            const section = textToChange.dataset.section;
            const value = textToChange.dataset.value;
            const translation = texts?.[section]?.[value];

            // Sin esta guarda, una clave faltante escribia "undefined" en pantalla
            if (typeof translation === 'string') {
                textToChange.innerHTML = translation;
            } else {
                console.warn(`Falta la traduccion "${section}.${value}" en ${language}.json`);
            }
        }

        // Que el idioma real del documento coincida: importa para SEO y lectores de pantalla
        document.documentElement.lang = language;
        localStorage.setItem(STORAGE_LANG, language);
        setActiveLangButton(language);

        // Los roles del typing tambien son traducibles
        startTyping(texts?.home?.roles);
    } catch (error) {
        console.error('No se pudo cargar el idioma:', error);
    }
};

document.querySelectorAll('.language-button').forEach(button => {
    button.addEventListener('click', (e) => {
        changeLanguage(e.currentTarget.dataset.language);
    });
});

// Idioma inicial: lo guardado > el del navegador > espanol
const detectLanguage = () => {
    const saved = localStorage.getItem(STORAGE_LANG);
    if (SUPPORTED_LANGS.includes(saved)) return saved;

    const browser = (navigator.language || 'es').slice(0, 2).toLowerCase();
    return SUPPORTED_LANGS.includes(browser) ? browser : 'es';
};
changeLanguage(detectLanguage());

/*==================== TEMA ====================*/
const STORAGE_THEME = 'theme';
const themeToggle = document.getElementById('theme-toggle');

const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);

    const icon = themeToggle?.querySelector('i');
    if (icon) {
        icon.classList.toggle('bx-sun', theme === 'dark');
        icon.classList.toggle('bx-moon', theme !== 'dark');
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute('content', theme === 'dark' ? '#1c1526' : '#f0f0f0');
    }
};

// Antes se forzaba "dark" en cada carga y se ignoraba lo guardado
const savedTheme = localStorage.getItem(STORAGE_THEME);
applyTheme(savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark');

themeToggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';

    applyTheme(next);
    localStorage.setItem(STORAGE_THEME, next);
});
