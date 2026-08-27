/*===================================================================
=            MODELO 3D DEL HERO                                     =
=  Clave: el modelo YA NO bloquea el loader. El hero se pinta de     =
=  inmediato y el avatar entra con fade cuando termina de cargar.    =
===================================================================*/

document.addEventListener('DOMContentLoaded', function () {
    const loaderContainer = document.querySelector('.loader-container');
    const container = document.getElementById('model-container');
    const homeImg = document.querySelector('.home__img');

    // Rotacion inicial del avatar. Verificado renderizando el .glb a 0, PI/2,
    // PI y 3PI/2: el frente (cara visible) es 0 radianes.
    const INITIAL_ROTATION = 0;
    // Amplitud del vaiven. Antes giraba 360 completos, asi que la mitad
    // del tiempo se le veia la nuca.
    const SWAY_AMPLITUDE = 0.28;
    const LOADER_MAX_WAIT = 2500; // ms: el loader nunca se queda pegado

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /*==================== LOADER ====================*/
    let loaderHidden = false;

    function hideLoader() {
        if (loaderHidden || !loaderContainer) return;
        loaderHidden = true;

        loaderContainer.classList.add('hidden');
        setTimeout(() => {
            loaderContainer.style.display = 'none';
        }, 500);
    }

    // El loader ya no espera al .glb: se va cuando la pagina esta lista,
    // y como maximo tras LOADER_MAX_WAIT pase lo que pase.
    if (document.readyState === 'complete') {
        hideLoader();
    } else {
        window.addEventListener('load', hideLoader);
    }
    setTimeout(hideLoader, LOADER_MAX_WAIT);

    /*==================== GUARDAS ====================*/
    if (!container) {
        console.warn('No existe #model-container: se omite el modelo 3D.');
        return;
    }

    if (typeof THREE === 'undefined') {
        console.warn('Three.js no cargo: el hero funciona igual, sin avatar.');
        return;
    }

    // No descargar el modelo si el usuario pidio ahorro de datos
    if (navigator.connection?.saveData) {
        console.info('Modo ahorro de datos activo: se omite el modelo 3D.');
        return;
    }

    /*==================== ESCENA ====================*/
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 3;
    camera.position.y = 0.4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Cap a 2x: en pantallas 3x el coste de render se dispara sin ganancia visible
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    /*==================== LUCES ====================*/
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(2, 2, 2);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(-2, 2, -2);
    scene.add(backLight);

    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.3);
    bottomLight.position.set(0, -1, 2);
    scene.add(bottomLight);

    /*==================== CONTROLES ====================*/
    let controls = null;
    if (typeof THREE.OrbitControls === 'function') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.5;
        controls.maxPolarAngle = Math.PI / 1.5;
        controls.minPolarAngle = Math.PI / 3;
    }

    /*==================== ANIMACION ====================*/
    let model = null;
    let userInteracted = false;
    let rafId = null;

    renderer.domElement.addEventListener('pointerdown', () => {
        userInteracted = true; // al arrastrar, mandar el usuario
    });

    function animate() {
        rafId = requestAnimationFrame(animate);

        // Vaiven suave alrededor del frente en vez de giro completo
        if (model && !userInteracted && !prefersReducedMotion) {
            const t = performance.now() / 2200;
            model.rotation.y = INITIAL_ROTATION + Math.sin(t) * SWAY_AMPLITUDE;
        }

        controls?.update();
        renderer.render(scene, camera);
    }
    animate();

    // No gastar GPU con la pestana en segundo plano
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;
        } else if (!rafId) {
            animate();
        }
    });

    /*==================== CARGA DEL MODELO ====================*/
    if (typeof THREE.GLTFLoader !== 'function') {
        console.warn('GLTFLoader no cargo: se omite el avatar.');
        return;
    }

    const loader = new THREE.GLTFLoader();

    // Necesario para leer el .glb comprimido con Draco
    if (typeof THREE.DRACOLoader === 'function') {
        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        loader.setDRACOLoader(dracoLoader);
    }

    loader.load(
        'assets/models/avatar_programador.glb',
        function (gltf) {
            model = gltf.scene;
            model.scale.set(1.4, 1.4, 1.4);
            model.position.set(0, 0.2, 0);
            model.rotation.y = INITIAL_ROTATION;
            scene.add(model);

            // Fade-in: el hero ya estaba visible, esto solo revela el avatar
            container.classList.add('is-ready');
            homeImg?.classList.add('is-ready');
        },
        undefined,
        function (error) {
            console.error('No se pudo cargar el modelo 3D:', error);
            // El hero se queda con el blob morado, que es un fondo valido
        }
    );

    /*==================== RESIZE ====================*/
    let resizeTimer = null;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (container.clientWidth > 0 && container.clientHeight > 0) {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            }
        }, 150);
    });
});
