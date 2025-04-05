// Esperar a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    const loaderContainer = document.querySelector('.loader-container');
    let assetsLoaded = false;
    let modelLoaded = false;

    // Función para ocultar el loader cuando todo esté listo
    function hideLoader() {
        if (assetsLoaded && modelLoaded) {
            loaderContainer.classList.add('hidden');
            // Remover el loader después de la transición
            setTimeout(() => {
                loaderContainer.style.display = 'none';
            }, 500);
        }
    }

    // Verificar que Three.js esté disponible
    if (typeof THREE === 'undefined') {
        console.error('Three.js no está disponible');
        return;
    }

    console.log('Inicializando Three.js');
    
    const container = document.getElementById('model-container');
    if (!container) {
        console.error('No se encontró el contenedor del modelo 3D');
        return;
    }
    
    // Configurar escena
    const scene = new THREE.Scene();
    
    // Configurar cámara
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 3;
    camera.position.y = 0.4;
    
    // Configurar renderer
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    
    // Añadir luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(2, 2, 2);
    scene.add(directionalLight);

    // Luz de relleno desde atrás
    const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(-2, 2, -2);
    scene.add(backLight);

    // Luz suave desde abajo
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.3);
    bottomLight.position.set(0, -1, 2);
    scene.add(bottomLight);

    // Configurar controles
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.minPolarAngle = Math.PI / 3;
    
    // Variable para almacenar el modelo
    let model;
    
    // Función de animación
    function animate() {
        requestAnimationFrame(animate);
        
        if (model) {
            model.rotation.y += 0.005;
        }
        
        controls.update();
        renderer.render(scene, camera);
    }
    
    // Iniciar animación
    animate();
    
    // Cargar el modelo 3D
    const loader = new THREE.GLTFLoader();
    console.log('Intentando cargar el modelo 3D desde:', 'assets/models/avatar_programador.glb');
    
    loader.load(
        'assets/models/avatar_programador.glb',
        function(gltf) {
            console.log('¡Modelo cargado con éxito!');
            model = gltf.scene;
            model.scale.set(1.4, 1.4, 1.4);
            model.position.set(0, 0.2, 0);
            scene.add(model);
            
            // Marcar el modelo como cargado
            modelLoaded = true;
            hideLoader();
        },
        function(xhr) {
            console.log('Progreso de carga: ' + Math.round(xhr.loaded / xhr.total * 100) + '%');
        },
        function(error) {
            console.error('Error al cargar el modelo:', error);
            // En caso de error, ocultar el loader de todos modos
            modelLoaded = true;
            hideLoader();
        }
    );
    
    // Manejar redimensionamiento de ventana
    window.addEventListener('resize', function() {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });

    // Marcar los assets como cargados cuando la página esté lista
    window.addEventListener('load', function() {
        assetsLoaded = true;
        hideLoader();
    });
}); 