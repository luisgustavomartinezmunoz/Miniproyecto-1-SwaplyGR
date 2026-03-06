(function () {
  const participants = JSON.parse(localStorage.getItem("participants")) || [];
  const exclusions = JSON.parse(localStorage.getItem("exclusions")) || {};

  const saveBtn = document.getElementById("btnGuardarEvento");
  const showBtn = document.getElementById("btnMostrarEvento");
  const drawBtn = document.getElementById("btnSortear");
  const clearBtn = document.getElementById("btnLimpiarTodo");

  const status = document.getElementById("estadoGuardado");
  const dataPanel = document.getElementById("panelDatosEvento");
  const resultPanel = document.getElementById("panelResultadoSorteo");

  function activarPasoActual() {
    const page = document.body.dataset.page;
    document.querySelectorAll(".step-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.step === page);
    });
  }

  function swal(options) {
    if (window.Swal) return Swal.fire(options);
    alert([options.title, options.text].filter(Boolean).join("\n"));
    return Promise.resolve();
  }

  function limpiarFlujo() {
    localStorage.removeItem("swaply_organizer_name");
    localStorage.removeItem("swaply_include_organizer");
    localStorage.removeItem("swaply_participants_draft");
    localStorage.removeItem("participants");
    localStorage.removeItem("exclusions");
    localStorage.removeItem("tipoEvento");
    localStorage.removeItem("fechaEvento");
    localStorage.removeItem("precioRegalo");
  }

  function sortear() {
    let intentos = 0;

    while (intentos < 500) {
      let disponibles = [...participants];
      const resultado = {};
      let valido = true;

      for (const persona of participants) {
        const opciones = disponibles.filter(
          (p) => p !== persona && !(exclusions[persona] || []).includes(p)
        );

        if (opciones.length === 0) {
          valido = false;
          break;
        }

        const elegido = opciones[Math.floor(Math.random() * opciones.length)];
        resultado[persona] = elegido;
        disponibles = disponibles.filter((p) => p !== elegido);
      }

      if (valido) return resultado;
      intentos += 1;
    }

    return null;
  }

  function renderResultados(resultado) {
    if (!resultPanel) return;

    if (!resultado) {
      resultPanel.innerHTML = '<div class="alert alert-warning mb-0">No se pudo generar el sorteo con esas exclusiones.</div>';
      return;
    }

    resultPanel.innerHTML = "";

    Object.entries(resultado).forEach(([de, para]) => {
      const row = document.createElement("div");
      row.className = "list-group-item d-flex justify-content-between align-items-center";
      row.innerHTML = `<strong>${de}</strong><span>-></span><strong>${para}</strong>`;
      resultPanel.appendChild(row);
    });

    resultPanel.classList.add("list-group");
  }

  function mostrarDatosEnPanel() {
    if (!dataPanel) return;

    const fechaEvento = localStorage.getItem("fechaEvento") || "No definida";
    const precioRegalo = localStorage.getItem("precioRegalo") || "No definido";
    const tipoEvento = localStorage.getItem("tipoEvento") || "No definido";

    let exclusionsHtml = "";
    Object.entries(exclusions).forEach(([persona, lista]) => {
      exclusionsHtml += `<strong>${persona}</strong>: ${lista.join(", ") || "Ninguna"}<br>`;
    });

    dataPanel.innerHTML = `
      <p><strong>Tipo de evento:</strong> ${tipoEvento}</p>
      <p><strong>Fecha del evento:</strong> ${fechaEvento}</p>
      <p><strong>Precio sugerido:</strong> $${precioRegalo}</p>
      <hr>
      <p><strong>Participantes:</strong><br>${participants.join("<br>") || "No hay participantes"}</p>
      <hr>
      <p><strong>Exclusiones:</strong><br>${exclusionsHtml || "Sin exclusiones"}</p>
    `;
  }

  function mostrarDatosModal() {
    const fechaEvento = localStorage.getItem("fechaEvento") || "No definida";
    const precioRegalo = localStorage.getItem("precioRegalo") || "No definido";
    const tipoEvento = localStorage.getItem("tipoEvento") || "No definido";

    let exclusionsHtml = "";
    Object.entries(exclusions).forEach(([persona, lista]) => {
      exclusionsHtml += `<strong>${persona}</strong>: ${lista.join(", ") || "Ninguna"}<br>`;
    });

    swal({
      title: "Datos del sorteo",
      icon: "info",
      width: 600,
      html: `
        <div style="text-align:left;">
          <p><strong>Tipo de evento:</strong> ${tipoEvento}</p>
          <p><strong>Fecha del evento:</strong> ${fechaEvento}</p>
          <p><strong>Precio sugerido:</strong> $${precioRegalo}</p>
          <hr>
          <p><strong>Participantes:</strong><br>${participants.join("<br>") || "No hay participantes"}</p>
          <hr>
          <p><strong>Exclusiones:</strong><br>${exclusionsHtml || "Sin exclusiones"}</p>
        </div>
      `,
      confirmButtonText: "Cerrar"
    });
  }

  function init() {
    activarPasoActual();

    if (status) status.textContent = "listo";

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        if (status) status.textContent = "guardado";
        swal({
          icon: "success",
          title: "Datos guardados",
          text: "La configuracion actual se mantiene en localStorage."
        });
      });
    }

    if (showBtn) {
      showBtn.addEventListener("click", () => {
        if (dataPanel) mostrarDatosEnPanel();
        else mostrarDatosModal();
      });
    }

    if (drawBtn) {
      drawBtn.addEventListener("click", () => {
        if (participants.length < 3) {
          swal({
            icon: "warning",
            title: "Faltan participantes",
            text: "Debes registrar al menos 3 participantes antes de sortear."
          });
          return;
        }

        const resultado = sortear();

        if (!resultado) {
          renderResultados(null);
          swal({
            icon: "error",
            title: "No se pudo generar el sorteo",
            text: "Las exclusiones son demasiado restrictivas."
          });
          return;
        }

        renderResultados(resultado);

        swal({
          icon: "success",
          title: "Sorteo realizado",
          text: "Los resultados se generaron correctamente."
        });
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        limpiarFlujo();
        sessionStorage.removeItem("swaply_initialized");
        window.location.href = "index.html";
      });
    }

    if (dataPanel) mostrarDatosEnPanel();
  }

  init();
})();
