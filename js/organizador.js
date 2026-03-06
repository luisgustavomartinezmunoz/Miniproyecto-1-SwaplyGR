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
    if (window.Swal) return Swal.fire(options);
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

    participants.forEach((name, index) => {
      const item = document.createElement("li");
      item.className = "list-group-item d-flex justify-content-between align-items-center";
      item.innerHTML = `${name}<button type="button" class="btn btn-sm btn-danger">X</button>`;

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
          title: "Campo vacio",
          text: "Escribe un nombre antes de agregar.",
          confirmButtonText: "Entendido"
        });
        return;
      }

      if (existeNombre(name)) {
        swal({
          icon: "warning",
          title: "Nombre duplicado",
          text: "Ese nombre ya esta en la lista o coincide con el organizador.",
          confirmButtonText: "Entendido"
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
            title: "Organizador vacio",
            text: "Escribe el nombre del organizador o desmarca la opcion.",
            confirmButtonText: "Entendido"
          });
          return;
        }

        if (participants.some((p) => normalizar(p) === normalizar(organizerName))) {
          swal({
            icon: "warning",
            title: "Nombre duplicado",
            text: "El organizador ya esta agregado como participante.",
            confirmButtonText: "Entendido"
          });
          return;
        }

        finalList.push(organizerName);
      }

      if (finalList.length === 0) {
        swal({
          icon: "warning",
          title: "Sin participantes",
          text: "No hay participantes agregados para el sorteo.",
          confirmButtonText: "Entendido"
        });
        return;
      }

      if (finalList.length < 3) {
        swal({
          icon: "error",
          title: "Muy pocos participantes",
          text: "El intercambio necesita al menos 3 personas para funcionar correctamente.",
          confirmButtonText: "Entendido"
        });
        return;
      }

      setJson(STORAGE.participants, finalList);
      setJson(STORAGE.exclusions, {});

      swal({
        icon: "success",
        title: "Comencemos",
        text: "Participantes guardados. Ahora vamos a configurar exclusiones.",
        confirmButtonText: "Vamos"
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
