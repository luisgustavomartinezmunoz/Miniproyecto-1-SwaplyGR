(function () {
  const STORAGE = {
    organizerName: "swaply_organizer_name",
    includeOrganizer: "swaply_include_organizer",
    participantsDraft: "swaply_participants_draft",
    participants: "participants",
    exclusions: "exclusions",
    eventType: "tipoEvento",
    eventDate: "fechaEvento",
    giftPrice: "precioRegalo"
  };

  const organizerInput = document.getElementById("nombreOrganizador");
  const includeOrganizer = document.getElementById("incluyeOrganizador");
  const participantInput = document.getElementById("inputParticipante");
  const list = document.getElementById("listaParticipantes");

  const addBtn = document.getElementById("btnAgregarParticipante");
  const continueBtnStep1 = document.getElementById("btnContinuarPaso1");
  const continueBtnStep2 = document.getElementById("btnContinuarPaso2");

  function activarPasoActual() {
    const page = document.body.dataset.page;
    document.querySelectorAll(".step-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.step === page);
    });
  }

  function getJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function setJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function limpiarFlujo() {
    localStorage.removeItem(STORAGE.organizerName);
    localStorage.removeItem(STORAGE.includeOrganizer);
    localStorage.removeItem(STORAGE.participantsDraft);
    localStorage.removeItem(STORAGE.participants);
    localStorage.removeItem(STORAGE.exclusions);
    localStorage.removeItem(STORAGE.eventType);
    localStorage.removeItem(STORAGE.eventDate);
    localStorage.removeItem(STORAGE.giftPrice);
  }

  function iniciarFlujoSiEsPaso1() {
    if (document.body.dataset.page !== "paso1") return;

    const yaInicializado = sessionStorage.getItem("swaply_initialized") === "1";
    if (!yaInicializado) {
      limpiarFlujo();
      sessionStorage.setItem("swaply_initialized", "1");
    }
  }

  function normalizar(nombre) {
    return nombre.trim().toLowerCase();
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

  function getOrganizerData() {
    return {
      name: localStorage.getItem(STORAGE.organizerName) || "",
      include: localStorage.getItem(STORAGE.includeOrganizer) !== "0"
    };
  }

  function saveOrganizerData(name, include) {
    localStorage.setItem(STORAGE.organizerName, name.trim());
    localStorage.setItem(STORAGE.includeOrganizer, include ? "1" : "0");
  }

  function getDraftParticipants() {
    return getJson(STORAGE.participantsDraft, []);
  }

  function saveDraftParticipants(participants) {
    setJson(STORAGE.participantsDraft, participants);
  }

  function initPaso1() {
    if (!organizerInput || !includeOrganizer || !continueBtnStep1) return;

    const data = getOrganizerData();
    organizerInput.value = data.name;
    includeOrganizer.value = data.include ? "si" : "no";

    organizerInput.addEventListener("input", () => {
      saveOrganizerData(organizerInput.value, includeOrganizer.value === "si");
    });

    includeOrganizer.addEventListener("change", () => {
      saveOrganizerData(organizerInput.value, includeOrganizer.value === "si");
    });

    continueBtnStep1.addEventListener("click", (event) => {
      event.preventDefault();
      saveOrganizerData(organizerInput.value, includeOrganizer.value === "si");
      window.location.href = "participantes.html";
    });
  }

  function renderList(participants) {
    if (!list) return;

    list.innerHTML = "";

    if (participants.length === 0) {
      list.innerHTML = '<li class="list-group-item text-muted">Aun no hay participantes.</li>';
      return;
    }

    let draggedIndex = null;

    participants.forEach((name, index) => {
      const item = document.createElement("li");
      item.className = "list-group-item d-flex justify-content-between align-items-center participant-drag-item";
      item.draggable = true;
      item.innerHTML = `<span class="participant-name"><span class="drag-handle">::</span>${name}</span><button type="button" class="btn btn-sm btn-danger">X</button>`;

      item.addEventListener("dragstart", () => {
        draggedIndex = index;
        item.classList.add("dragging");
      });

      item.addEventListener("dragend", () => {
        draggedIndex = null;
        item.classList.remove("dragging");
        list.querySelectorAll(".participant-drag-item").forEach((el) => el.classList.remove("drag-over"));
      });

      item.addEventListener("dragover", (event) => {
        event.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
          item.classList.add("drag-over");
        }
      });

      item.addEventListener("dragleave", () => {
        item.classList.remove("drag-over");
      });

      item.addEventListener("drop", (event) => {
        event.preventDefault();
        item.classList.remove("drag-over");

        if (draggedIndex === null || draggedIndex === index) return;

        const current = getDraftParticipants();
        const [moved] = current.splice(draggedIndex, 1);
        current.splice(index, 0, moved);
        saveDraftParticipants(current);
        renderList(current);
      });

      item.querySelector("button").addEventListener("click", () => {
        const current = getDraftParticipants();
        current.splice(index, 1);
        saveDraftParticipants(current);
        renderList(current);
      });

      list.appendChild(item);
    });
  }

  function initPaso2() {
    if (!participantInput || !addBtn || !continueBtnStep2 || !list) return;

    renderList(getDraftParticipants());

    function existeNombre(nombre) {
      const n = normalizar(nombre);
      const participants = getDraftParticipants();

      if (participants.some((p) => normalizar(p) === n)) return true;

      const organizer = getOrganizerData();
      if (organizer.include && normalizar(organizer.name) === n) return true;

      return false;
    }

    function agregarParticipante() {
      const name = participantInput.value.trim();

      if (name === "") {
        swal({
          icon: "warning",
          title: "Nombre pendiente",
          text: "Escribe un nombre para agregarlo a la lista.",
          confirmButtonText: "Listo"
        });
        return;
      }

      if (existeNombre(name)) {
        swal({
          icon: "warning",
          title: "Ese nombre ya existe",
          text: "Ya esta registrado o coincide con el organizador.",
          confirmButtonText: "Corregir"
        });
        return;
      }

      const participants = getDraftParticipants();
      participants.push(name);
      saveDraftParticipants(participants);
      renderList(participants);
      participantInput.value = "";
    }

    addBtn.addEventListener("click", agregarParticipante);
    participantInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") agregarParticipante();
    });

    continueBtnStep2.addEventListener("click", (event) => {
      event.preventDefault();

      const participants = getDraftParticipants();
      const organizer = getOrganizerData();
      const finalList = [...participants];

      if (organizer.include) {
        const organizerName = organizer.name.trim();

        if (organizerName === "") {
          swal({
            icon: "warning",
            title: "Falta el organizador",
            text: "Escribe su nombre o marca que no participa.",
            confirmButtonText: "Corregir"
          });
          return;
        }

        if (participants.some((p) => normalizar(p) === normalizar(organizerName))) {
          swal({
            icon: "warning",
            title: "Nombre repetido",
            text: "El organizador ya se agrego como participante.",
            confirmButtonText: "Entendido"
          });
          return;
        }

        finalList.push(organizerName);
      }

      if (finalList.length === 0) {
        swal({
          icon: "warning",
          title: "Lista vacia",
          text: "Agrega participantes antes de continuar.",
          confirmButtonText: "Agregar"
        });
        return;
      }

      if (finalList.length < 3) {
        swal({
          icon: "error",
          title: "Se necesitan mas personas",
          text: "Debes registrar al menos 3 participantes.",
          confirmButtonText: "Ok"
        });
        return;
      }

      setJson(STORAGE.participants, finalList);
      setJson(STORAGE.exclusions, {});

      swal({
        icon: "success",
        title: "Participantes listos",
        text: "Todo guardado. Seguimos con exclusiones.",
        confirmButtonText: "Seguir"
      }).then(() => {
        window.location.href = "exclusiones.html";
      });
    });
  }

  iniciarFlujoSiEsPaso1();
  activarPasoActual();
  initPaso1();
  initPaso2();
})();
