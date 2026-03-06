(function () {
  const participants = JSON.parse(localStorage.getItem("participants")) || [];
  const enabledSelect = document.getElementById("hayExclusiones");
  const controls = document.querySelector(".exclusion-controls");
  const list = document.getElementById("listaExclusiones");
  const continueBtn = document.getElementById("btnContinuarPaso3");
  const selectA = document.getElementById("selectPersonaA");
  const selectB = document.getElementById("selectPersonaB");
  const addBtn = document.getElementById("btnAgregarExclusion");

  let exclusions = JSON.parse(localStorage.getItem("exclusions")) || {};

  function activarPasoActual() {
    const page = document.body.dataset.page;
    document.querySelectorAll(".step-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.step === page);
    });
  }

  function swal(options) {
    if (window.Swal) {
      const defaults = {
        confirmButtonText: "Entendido",
        buttonsStyling: false,
        customClass: {
          popup: "swaply-alert-popup",
          title: "swaply-alert-title",
          htmlContainer: "swaply-alert-text",
          confirmButton: "swaply-alert-btn"
        }
      };

      return Swal.fire({
        ...defaults,
        ...options,
        customClass: {
          ...defaults.customClass,
          ...(options.customClass || {})
        }
      });
    }

    alert([options.title, options.text].filter(Boolean).join("\n"));
    return Promise.resolve();
  }

  function guardarExclusiones() {
    localStorage.setItem("exclusions", JSON.stringify(exclusions));
  }

  function normalizarExclusiones() {
    const normalized = {};

    participants.forEach((person) => {
      const current = Array.isArray(exclusions[person]) ? exclusions[person] : [];
      normalized[person] = current.filter(
        (name, index, arr) => name !== person && participants.includes(name) && arr.indexOf(name) === index
      );
    });

    exclusions = normalized;
  }

  function puedeExcluir(persona) {
    const maxExclusiones = participants.length - 2;
    if ((exclusions[persona] || []).length >= maxExclusiones) {
      swal({
        icon: "warning",
        title: "Limite alcanzado",
        text: "Esa persona ya no puede bloquear a nadie mas."
      });
      return false;
    }
    return true;
  }

  function getEntries() {
    const entries = [];
    Object.entries(exclusions).forEach(([persona, lista]) => {
      lista.forEach((name) => entries.push([persona, name]));
    });
    return entries;
  }

  function renderExclusionList() {
    list.innerHTML = "";
    const entries = getEntries();

    if (entries.length === 0) {
      list.innerHTML = '<li class="list-group-item text-muted">No hay exclusiones.</li>';
      return;
    }

    entries.forEach(([persona, name]) => {
      const item = document.createElement("li");
      item.className = "list-group-item d-flex justify-content-between align-items-center";
      item.innerHTML = `<span>${persona} no puede regalar a ${name}</span><button type="button" class="btn btn-sm btn-outline-danger">X</button>`;

      item.querySelector("button").addEventListener("click", () => {
        exclusions[persona] = (exclusions[persona] || []).filter((p) => p !== name);
        guardarExclusiones();
        renderExclusionList();
      });

      list.appendChild(item);
    });
  }

  function fillSelects() {
    selectA.innerHTML = "";
    selectB.innerHTML = "";
    participants.forEach((person) => {
      const optionA = document.createElement("option");
      optionA.value = person;
      optionA.textContent = person;
      selectA.appendChild(optionA);

      const optionB = document.createElement("option");
      optionB.value = person;
      optionB.textContent = person;
      selectB.appendChild(optionB);
    });
  }

  function renderControls() {
    controls.classList.toggle("d-none", enabledSelect.value !== "si");
  }

  function init() {
    activarPasoActual();

    if (!enabledSelect || !controls || !list || !continueBtn || !selectA || !selectB || !addBtn) return;

    if (participants.length < 3) {
      swal({
        icon: "warning",
        title: "Paso incompleto",
        text: "Primero agrega participantes en el paso anterior."
      }).then(() => {
        window.location.href = "participantes.html";
      });
      return;
    }

    normalizarExclusiones();
    guardarExclusiones();
    fillSelects();
    enabledSelect.value = getEntries().length > 0 ? "si" : "no";
    renderControls();
    renderExclusionList();

    enabledSelect.addEventListener("change", () => {
      if (enabledSelect.value === "no") {
        exclusions = {};
        guardarExclusiones();
        renderControls();
        renderExclusionList();
        swal({
          icon: "success",
          title: "Exclusiones desactivadas",
          text: "El sorteo seguira sin bloqueos."
        });
        return;
      }

      normalizarExclusiones();
      guardarExclusiones();
      renderControls();
      renderExclusionList();
    });

    addBtn.addEventListener("click", () => {
      if (enabledSelect.value !== "si") return;

      const persona = selectA.value;
      const bloqueo = selectB.value;

      if (!persona || !bloqueo || persona === bloqueo) {
        swal({
          icon: "warning",
          title: "Seleccion invalida",
          text: "Debes seleccionar dos personas distintas."
        });
        return;
      }

      if ((exclusions[persona] || []).includes(bloqueo)) {
        swal({
          icon: "warning",
          title: "Ya estaba bloqueado",
          text: "Esa exclusion ya se habia agregado."
        });
        return;
      }

      if (!puedeExcluir(persona)) return;

      if (!Array.isArray(exclusions[persona])) exclusions[persona] = [];
      exclusions[persona].push(bloqueo);
      guardarExclusiones();
      renderExclusionList();
    });

    continueBtn.addEventListener("click", (event) => {
      event.preventDefault();
      if (enabledSelect.value === "no") localStorage.setItem("exclusions", JSON.stringify({}));
      else guardarExclusiones();

      swal({
        title: "Configuracion guardada",
        text: "Las exclusiones quedaron registradas.",
        icon: "success"
      }).then(() => {
        window.location.href = "evento.html";
      });
    });
  }

  init();
})();
