/*===================================================================
=            EXPERIENCIA — ENTRADA AL HACER SCROLL                  =
=  Progresivo: el contenido esta visible por defecto y el JS solo    =
=  oculta lo que todavia no llega al pliegue. Si algo falla, las     =
=  entradas aparecen sin animacion, nunca en blanco.                 =
===================================================================*/

(function () {
    const list = document.querySelector('.xp');
    if (!list) return;

    const items = [...list.querySelectorAll('.xp__item')];
    if (!items.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    // Solo lo que hoy queda por debajo del pliegue. Lo que ya se ve (o quedo
    // por encima) no se toca nunca.
    const pendientes = items.filter(item => item.getBoundingClientRect().top > window.innerHeight);
    if (!pendientes.length) return;

    pendientes.forEach(item => item.classList.add('is-pending'));

    const mostrar = (item, retardo) => {
        if (!item.classList.contains('is-pending')) return;
        setTimeout(() => item.classList.remove('is-pending'), retardo);
    };

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const idx = pendientes.indexOf(entry.target);

            // La lista va en orden: si esta entro, lo de arriba ya se paso.
            // Al saltar directo aqui (enlace del nav, scroll rapido) esos
            // elementos no volveran a cruzar la pantalla y quedarian ocultos.
            for (let i = 0; i < idx; i++) {
                pendientes[i].classList.remove('is-pending');
                io.unobserve(pendientes[i]);
            }

            mostrar(entry.target, idx * 110);
            io.unobserve(entry.target);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });

    pendientes.forEach(item => io.observe(item));

    // Red de seguridad: si por lo que sea no dispara, se muestran igual
    setTimeout(() => {
        pendientes.forEach(item => item.classList.remove('is-pending'));
    }, 6000);
})();
