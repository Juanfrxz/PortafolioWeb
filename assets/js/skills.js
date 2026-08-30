/*===================================================================
=            CONSTELACION DE SKILLS                                 =
=  Al enfocar un nodo se resalta su vecindario y se apaga el resto. =
=  El grafo ya viene dibujado en el HTML: esto solo agrega la        =
=  interaccion, asi que si el JS falla la seccion se sigue viendo.   =
===================================================================*/

(function () {
    const section = document.querySelector('.skills');

    /*=========== Luz de fondo que sigue al cursor ===========*/
    // Mueve una capa ya existente con transform (se compone en GPU),
    // en vez de repintar el degradado de toda la seccion.
    if (section && section.querySelector('.skills__glow')) {
        let pending = false;
        let px = 0;
        let py = 0;

        const paint = () => {
            pending = false;
            section.style.setProperty('--gx', px + 'px');
            section.style.setProperty('--gy', py + 'px');
        };

        section.addEventListener('pointermove', (e) => {
            // Con lapiz o dedo el "hover" no existe: la luz solo estorbaria
            if (e.pointerType !== 'mouse') return;
            const r = section.getBoundingClientRect();
            px = e.clientX - r.left;
            py = e.clientY - r.top;
            section.classList.add('is-lit');
            if (!pending) {
                pending = true;
                requestAnimationFrame(paint);
            }
        });

        section.addEventListener('pointerleave', () => {
            section.classList.remove('is-lit');
        });
    }

    const cst = document.querySelector('.cst');
    if (!cst) return;

    const nodes = [...cst.querySelectorAll('.cst__node')];
    const links = [...cst.querySelectorAll('.cst__link')];
    if (!nodes.length) return;

    const clear = () => {
        cst.classList.remove('is-exploring');
        cst.style.removeProperty('--ring-active');
        if (section) section.style.removeProperty('--glow');
        nodes.forEach(n => n.classList.remove('is-active', 'is-linked'));
        links.forEach(l => l.classList.remove('is-active'));
    };

    const explore = (node) => {
        const id = node.dataset.skill;
        const linked = (node.dataset.linked || '').split(' ').filter(Boolean);

        clear();
        cst.classList.add('is-exploring');
        // El color del grupo tinta las lineas del vecindario...
        const ring = getComputedStyle(node).getPropertyValue('--ring');
        cst.style.setProperty('--ring-active', ring);
        // ...y tambien la luz del fondo, para que forme parte de la interaccion
        if (section) section.style.setProperty('--glow', ring);

        node.classList.add('is-active');
        nodes.forEach(n => {
            if (linked.includes(n.dataset.skill)) n.classList.add('is-linked');
        });
        links.forEach(l => {
            if (l.dataset.a === id || l.dataset.b === id) l.classList.add('is-active');
        });
    };

    nodes.forEach(node => {
        node.addEventListener('mouseenter', () => explore(node));
        node.addEventListener('focus', () => explore(node));
        node.addEventListener('blur', clear);
        // En tactil no hay hover: el toque hace de conmutador
        node.addEventListener('click', (e) => {
            e.preventDefault();
            if (node.classList.contains('is-active')) {
                clear();
            } else {
                explore(node);
            }
        });
    });

    cst.addEventListener('mouseleave', clear);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cst.classList.contains('is-exploring')) clear();
    });
})();
