async function initTour() {
  const { driver } = await import('driver.js');
  await import('driver.js/dist/driver.css');

  const driverObj = driver({
    showProgress: true,
    steps: [
      {
        element: ".about__container",
        popover: {
          title: "Hola Soy Juan",
          description: "Soy desarrollador de software.",
        },
        position: "bottom",
      },
      {
        element: ".home__img",
        popover: {
          title: "Este es mi Modelo 3D",
          description:
            "Este modelo es una representacion de mi persona, está hecho con Three.js.",
        },
        position: "left",
      },
      {
        element: '[data-section="home"][data-value="contact"]',
        popover: {
          title: "Aqui puedes contactarme",
          description: "Haz clic aquí para contactarme vía WhatsApp.",
        },
        position: "bottom",
      },
      {
        element: '[data-section="home"][data-value="download"]',
        popover: {
          title: "Esta es mi hoja de vida",
          description: "Descarga mi CV en inglés y español.",
        },
        position: "bottom",
      },
      {
        element: "#linkedin",
        popover: {
          title: "Linkedin",
          description: "Aqui podras encontrar mi perfil de linkedin",
        },
        position: "bottom",
      },
      {
        element: "#instagram",
        popover: {
          title: "Instagram",
          description: "Aqui podras encontrar mi perfil de instagram",
        },
        position: "bottom",
      },
      {
        element: "#github",
        popover: {
          title: "Github",
          description: "Aqui podras encontrar mi perfil de github",
        },
        position: "bottom",
      },
      {
        element: "[data-section='skills'][data-value='title']",
        popover: {
          title: "Habilidades",
          description: "Aquí tienes algunas de mis habilidades técnicas.",
        },
        position: "bottom",
      },
      {
        element: "#frontend",
        popover: {
          title: "frontend",
          description:
            "Aquí tienes algunas de mis habilidades técnicas en frontend",
        },
        position: "top",
      },
      {
        element: "#backend",
        popover: {
          title: "backend",
          description:
            "Aquí tienes algunas de mis habilidades técnicas en backend",
        },
        position: "top",
      },
      {
        element: "#tools",
        popover: {
          title: "tools and others",
          description: "Aquí tienes algunas de mis habilidades técnicas en tools",
        },
        position: "top",
      },
      {
        element: "[data-section='projects'][data-value='title']",
        popover: {
          title: "Proyectos",
          description: "Estos son algunos de mis proyectos destacados.",
        },
        position: "top",
      },
      {
        element: "#f1_title",
        popover: {
          title: "F1 - Formula1",
          description: "Este es mi proyecto de Formula 1, unos de mis mejores proyectos.",
        },
        position: "top",
      },
      {
        element: "#f1_content",
        popover: {
          title: "F1 - Formula1",
          description: "A comprehensive Formula 1 management system featuring team management, cars, drivers, pole positions, and 3D model integrations.",
        },
        position: "top",
      },
      {
        element: ".contact__form",
        popover: {
          title: "Sección de Contacto",
          description: "Aqui puedes contactarme vía email.",
        },
        position: "top",
      },
    ],
  });

  const startTourBtn = document.getElementById('start-tour');
  if (startTourBtn) {
    startTourBtn.addEventListener('click', (e) => {
      e.preventDefault();
      driverObj.drive();
    });
  }
}

// Initialize tour when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTour);
} else {
  initTour();
}
