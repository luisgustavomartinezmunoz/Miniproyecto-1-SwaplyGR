const STORAGE_KEYS = {
  participants: "participants",
  exclusions: "exclusions",
  eventType: "tipoEvento",
  eventDate: "fechaEvento",
  giftPrice: "precioRegalo",
  organizerName: "swaply_organizer_name",
  includeOrganizer: "swaply_include_organizer",
  participantsDraft: "swaply_participants_draft"
};

function notify(options) {
  if (window.Swal) {
    return Swal.fire(options);
  }

  const text = [options.title, options.text].filter(Boolean).join("\n");
  alert(text || "Operacion completada");
  return Promise.resolve();
}

function normalizeName(name) {
  return name.trim().toLowerCase();
}

function activeStep() {
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

function clearFlowStorage() {
  localStorage.removeItem(STORAGE_KEYS.participants);
  localStorage.removeItem(STORAGE_KEYS.exclusions);
  localStorage.removeItem(STORAGE_KEYS.eventType);
  localStorage.removeItem(STORAGE_KEYS.eventDate);
  localStorage.removeItem(STORAGE_KEYS.giftPrice);
  localStorage.removeItem(STORAGE_KEYS.organizerName);
  localStorage.removeItem(STORAGE_KEYS.includeOrganizer);
  localStorage.removeItem(STORAGE_KEYS.participantsDraft);
}

function ensureFreshStartOnStep1() {
  if (document.body.dataset.page !== "paso1") return;

  const alreadyInitialized = sessionStorage.getItem("swaply_initialized") === "1";
  if (!alreadyInitialized) {
    clearFlowStorage();
    sessionStorage.setItem("swaply_initialized", "1");
  }
}

function setOrganizerData(name, includeOrganizer) {
  localStorage.setItem(STORAGE_KEYS.organizerName, name.trim());
  localStorage.setItem(STORAGE_KEYS.includeOrganizer, includeOrganizer ? "1" : "0");
}

function getOrganizerData() {
  return {
    name: localStorage.getItem(STORAGE_KEYS.organizerName) || "",
    includeOrganizer: localStorage.getItem(STORAGE_KEYS.includeOrganizer) !== "0"
  };
}

function getParticipantsDraft() {
  return getJson(STORAGE_KEYS.participantsDraft, []);
}

function setParticipantsDraft(participants) {
  setJson(STORAGE_KEYS.participantsDraft, participants);
}

function initStep1() {
  const nameInput = document.getElementById("nombreOrganizador");
  const includeSelect = document.getElementById("incluyeOrganizador");
  const continueBtn = document.getElementById("btnContinuarPaso1");
  if (!nameInput || !includeSelect || !continueBtn) return;

  const organizerData = getOrganizerData();
  nameInput.value = organizerData.name;
  includeSelect.value = organizerData.includeOrganizer ? "si" : "no";

  nameInput.addEventListener("input", () => {
    setOrganizerData(nameInput.value, includeSelect.value === "si");
  });

  includeSelect.addEventListener("change", () => {
    setOrganizerData(nameInput.value, includeSelect.value === "si");
  });

  continueBtn.addEventListener("click", (event) => {
    event.preventDefault();
    setOrganizerData(nameInput.value, includeSelect.value === "si");
    window.location.href = "participantes.html";
  });
}

function renderParticipantsList(listElement, participants) {
  listElement.innerHTML = "";

  if (participants.length === 0) {
    listElement.innerHTML = '<li class="list-group-item text-muted">Aun no hay participantes.</li>';
    return;
  }

  participants.forEach((name, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.innerHTML = `<span>${name}</span><button class="btn btn-sm btn-outline-danger" type="button">X</button>`;

    li.querySelector("button").addEventListener("click", () => {
      const updated = getParticipantsDraft();
      updated.splice(index, 1);
      setParticipantsDraft(updated);
      renderParticipantsList(listElement, updated);
    });

    listElement.appendChild(li);
  });
}

function initStep2() {
  const input = document.getElementById("inputParticipante");
  const addBtn = document.getElementById("btnAgregarParticipante");
  const list = document.getElementById("listaParticipantes");
  const continueBtn = document.getElementById("btnContinuarPaso2");
  if (!input || !addBtn || !list || !continueBtn) return;

  renderParticipantsList(list, getParticipantsDraft());

  function existsName(name) {
    const normalized = normalizeName(name);
    const draft = getParticipantsDraft();

    if (draft.some((participant) => normalizeName(participant) === normalized)) {
      return true;
    }

    const organizerData = getOrganizerData();
    if (organizerData.includeOrganizer && normalizeName(organizerData.name) === normalized) {
      return true;
    }

    return false;
  }

  function addParticipant() {
    const name = input.value.trim();

    if (name === "") {
      notify({
        icon: "warning",
        title: "Campo vacio",
        text: "Escribe un nombre antes de agregar.",
        confirmButtonText: "Entendido"
      });
      return;
    }

    if (existsName(name)) {
      notify({
        icon: "warning",
        title: "Nombre duplicado",
        text: "Ese nombre ya esta en la lista o coincide con el organizador.",
        confirmButtonText: "Entendido"
      });
      return;
    }

    const updated = getParticipantsDraft();
    updated.push(name);
    setParticipantsDraft(updated);
    renderParticipantsList(list, updated);
    input.value = "";
  }

  addBtn.addEventListener("click", addParticipant);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addParticipant();
    }
  });

  continueBtn.addEventListener("click", (event) => {
    event.preventDefault();

    const organizerData = getOrganizerData();
    const participants = getParticipantsDraft();
    const finalList = [...participants];

    if (organizerData.includeOrganizer) {
      const organizerName = organizerData.name.trim();

      if (organizerName === "") {
        notify({
          icon: "warning",
          title: "Organizador vacio",
          text: "Escribe el nombre del organizador o desmarca la opcion.",
          confirmButtonText: "Entendido"
        });
        return;
      }

      if (participants.some((participant) => normalizeName(participant) === normalizeName(organizerName))) {
        notify({
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
      notify({
        icon: "warning",
        title: "Sin participantes",
        text: "No hay participantes agregados para el sorteo.",
        confirmButtonText: "Entendido"
      });
      return;
    }

    if (finalList.length < 3) {
      notify({
        icon: "error",
        title: "Muy pocos participantes",
        text: "El intercambio necesita al menos 3 personas para funcionar correctamente.",
        confirmButtonText: "Entendido"
      });
      return;
    }

    setJson(STORAGE_KEYS.participants, finalList);
    setJson(STORAGE_KEYS.exclusions, {});

    notify({
      icon: "success",
      title: "Comencemos",
      text: "Participantes guardados. Ahora vamos a configurar exclusiones.",
      confirmButtonText: "Vamos"
    }).then(() => {
      window.location.href = "exclusiones.html";
    });
  });
}

function canExclude(participants, exclusions, person) {
  const total = participants.length;
  const maxExclusions = total - 2;

  if ((exclusions[person] || []).length >= maxExclusions) {
    notify({
      icon: "warning",
      title: "Demasiadas exclusiones",
      text: "Cada participante debe tener al menos una persona posible para regalar."
    });
    return false;
  }

  return true;
}

function exclusionEntries(exclusions) {
  const entries = [];
  Object.entries(exclusions).forEach(([person, list]) => {
    list.forEach((blocked) => {
      entries.push([person, blocked]);
    });
  });
  return entries;
}

function renderExclusionsList(listElement, exclusions) {
  const entries = exclusionEntries(exclusions);
  listElement.innerHTML = "";

  if (entries.length === 0) {
    listElement.innerHTML = '<li class="list-group-item text-muted">No hay exclusiones.</li>';
    return;
  }

  entries.forEach(([person, blocked]) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.innerHTML = `<span>${person} no puede regalar a ${blocked}</span><button class="btn btn-sm btn-outline-danger" type="button">X</button>`;

    li.querySelector("button").addEventListener("click", () => {
      const current = getJson(STORAGE_KEYS.exclusions, {});
      current[person] = (current[person] || []).filter((name) => name !== blocked);
      setJson(STORAGE_KEYS.exclusions, current);
      renderExclusionsList(listElement, current);
    });

    listElement.appendChild(li);
  });
}

function fillExclusionSelect(selectElement, participants) {
  selectElement.innerHTML = "";
  participants.forEach((person) => {
    const option = document.createElement("option");
    option.value = person;
    option.textContent = person;
    selectElement.appendChild(option);
  });
}

function initStep3() {
  const enabledSelect = document.getElementById("hayExclusiones");
  const selectA = document.getElementById("selectPersonaA");
  const selectB = document.getElementById("selectPersonaB");
  const addBtn = document.getElementById("btnAgregarExclusion");
  const list = document.getElementById("listaExclusiones");
  const controls = document.querySelector(".exclusion-controls");
  const continueBtn = document.getElementById("btnContinuarPaso3");
  if (!enabledSelect || !selectA || !selectB || !addBtn || !list || !controls || !continueBtn) return;

  const participants = getJson(STORAGE_KEYS.participants, []);
  if (participants.length < 3) {
    notify({
      icon: "warning",
      title: "Faltan participantes",
      text: "Debes completar el paso de participantes antes de configurar exclusiones."
    }).then(() => {
      window.location.href = "participantes.html";
    });
    return;
  }

  let exclusions = getJson(STORAGE_KEYS.exclusions, {});
  participants.forEach((person) => {
    if (!Array.isArray(exclusions[person])) {
      exclusions[person] = [];
    }
  });
  setJson(STORAGE_KEYS.exclusions, exclusions);

  fillExclusionSelect(selectA, participants);
  fillExclusionSelect(selectB, participants);

  const hasExclusions = exclusionEntries(exclusions).length > 0;
  enabledSelect.value = hasExclusions ? "si" : "no";
  controls.classList.toggle("d-none", enabledSelect.value !== "si");

  renderExclusionsList(list, exclusions);

  enabledSelect.addEventListener("change", () => {
    if (enabledSelect.value === "no") {
      exclusions = {};
      setJson(STORAGE_KEYS.exclusions, exclusions);
      controls.classList.add("d-none");
      renderExclusionsList(list, exclusions);

      notify({
        icon: "success",
        title: "Sin exclusiones",
        text: "Se continuara sin restricciones."
      });
      return;
    }

    participants.forEach((person) => {
      if (!Array.isArray(exclusions[person])) {
        exclusions[person] = [];
      }
    });

    controls.classList.remove("d-none");
    setJson(STORAGE_KEYS.exclusions, exclusions);
    renderExclusionsList(list, exclusions);
  });

  addBtn.addEventListener("click", () => {
    if (enabledSelect.value !== "si") return;

    const person = selectA.value;
    const blocked = selectB.value;

    if (!person || !blocked || person === blocked) {
      notify({
        icon: "warning",
        title: "Seleccion invalida",
        text: "Selecciona dos personas distintas."
      });
      return;
    }

    if (!Array.isArray(exclusions[person])) {
      exclusions[person] = [];
    }

    if (exclusions[person].includes(blocked)) {
      notify({
        icon: "warning",
        title: "Exclusion duplicada",
        text: "Esa exclusion ya existe."
      });
      return;
    }

    if (!canExclude(participants, exclusions, person)) return;

    exclusions[person].push(blocked);
    setJson(STORAGE_KEYS.exclusions, exclusions);
    renderExclusionsList(list, exclusions);
  });

  continueBtn.addEventListener("click", (event) => {
    event.preventDefault();

    if (enabledSelect.value === "no") {
      setJson(STORAGE_KEYS.exclusions, {});
    } else {
      setJson(STORAGE_KEYS.exclusions, exclusions);
    }

    notify({
      icon: "success",
      title: "Guardado",
      text: "Datos guardados correctamente."
    }).then(() => {
      window.location.href = "evento.html";
    });
  });
}

function fillDateOptions(selectElement) {
  if (!selectElement) return;

  selectElement.innerHTML = "";
  const today = new Date();

  for (let i = 7; i <= 35; i += 7) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    const value = `${yyyy}-${mm}-${dd}`;
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectElement.appendChild(option);
  }
}

function initStep4() {
  const eventSelect = document.getElementById("tipoEvento");
  const customEventWrap = document.getElementById("contenedorEventoPersonalizado");
  const customEventInput = document.getElementById("eventoPersonalizado");
  const suggestedDate = document.getElementById("fechaSugerida");
  const manualDate = document.getElementById("fechaManual");
  const budgetSelect = document.getElementById("presupuesto");
  const customBudgetWrap = document.getElementById("contenedorPresupuestoPersonalizado");
  const customBudgetInput = document.getElementById("presupuestoPersonalizado");
  const continueBtn = document.getElementById("btnContinuarPaso4");

  if (
    !eventSelect ||
    !customEventWrap ||
    !customEventInput ||
    !suggestedDate ||
    !manualDate ||
    !budgetSelect ||
    !customBudgetWrap ||
    !customBudgetInput ||
    !continueBtn
  ) {
    return;
  }

  fillDateOptions(suggestedDate);

  const today = new Date().toISOString().split("T")[0];
  manualDate.min = today;

  const savedEvent = localStorage.getItem(STORAGE_KEYS.eventType) || "";
  const hasSavedInSelect = Array.from(eventSelect.options).some((option) => option.value === savedEvent);

  if (hasSavedInSelect) {
    eventSelect.value = savedEvent;
  } else if (savedEvent) {
    eventSelect.value = "otro";
    customEventInput.value = savedEvent;
  }

  const savedDate = localStorage.getItem(STORAGE_KEYS.eventDate) || "";
  const inSuggested = Array.from(suggestedDate.options).some((option) => option.value === savedDate);
  if (inSuggested) {
    suggestedDate.value = savedDate;
  } else if (savedDate) {
    manualDate.value = savedDate;
  }

  const savedPrice = localStorage.getItem(STORAGE_KEYS.giftPrice) || "";
  const hasSavedPriceInSelect = Array.from(budgetSelect.options).some((option) => option.value === savedPrice);
  if (hasSavedPriceInSelect) {
    budgetSelect.value = savedPrice;
  } else if (savedPrice) {
    budgetSelect.value = "otro";
    customBudgetInput.value = savedPrice;
  }

  customEventWrap.classList.toggle("d-none", eventSelect.value !== "otro");
  customBudgetWrap.classList.toggle("d-none", budgetSelect.value !== "otro");

  eventSelect.addEventListener("change", () => {
    customEventWrap.classList.toggle("d-none", eventSelect.value !== "otro");
  });

  budgetSelect.addEventListener("change", () => {
    customBudgetWrap.classList.toggle("d-none", budgetSelect.value !== "otro");
  });

  continueBtn.addEventListener("click", (event) => {
    event.preventDefault();

    let tipoEvento = eventSelect.value;
    if (!tipoEvento) {
      notify({
        icon: "warning",
        title: "Selecciona un evento",
        text: "Debes elegir un evento antes de continuar."
      });
      return;
    }

    if (tipoEvento === "otro") {
      tipoEvento = customEventInput.value.trim();
      if (!tipoEvento) {
        notify({
          icon: "warning",
          title: "Selecciona un evento",
          text: "Debes escribir el nombre del evento personalizado."
        });
        return;
      }
    }

    const fecha = manualDate.value || suggestedDate.value;
    let precio = budgetSelect.value;

    if (precio === "otro") {
      precio = customBudgetInput.value.trim();
    }

    if (!fecha || !precio) {
      notify({
        icon: "warning",
        title: "Campos incompletos",
        text: "Debes seleccionar una fecha y un monto para el regalo."
      });
      return;
    }

    localStorage.setItem(STORAGE_KEYS.eventType, tipoEvento);
    localStorage.setItem(STORAGE_KEYS.eventDate, fecha);
    localStorage.setItem(STORAGE_KEYS.giftPrice, precio);

    notify({
      icon: "success",
      title: "Datos guardados",
      text: "La configuracion del intercambio fue guardada."
    }).then(() => {
      window.location.href = "acciones.html";
    });
  });
}

function showDataInPanel(target) {
  if (!target) return;

  const participants = getJson(STORAGE_KEYS.participants, []);
  const exclusions = getJson(STORAGE_KEYS.exclusions, {});
  const fechaEvento = localStorage.getItem(STORAGE_KEYS.eventDate) || "No definida";
  const precioRegalo = localStorage.getItem(STORAGE_KEYS.giftPrice) || "No definido";
  const tipoEvento = localStorage.getItem(STORAGE_KEYS.eventType) || "No definido";

  let exclusionsHtml = "";
  Object.entries(exclusions).forEach(([person, list]) => {
    exclusionsHtml += `<li><strong>${person}</strong>: ${list.join(", ") || "Ninguna"}</li>`;
  });

  if (!exclusionsHtml) {
    exclusionsHtml = "<li>Sin exclusiones</li>";
  }

  target.innerHTML = `
    <p><strong>Tipo de evento:</strong> ${tipoEvento}</p>
    <p><strong>Fecha del evento:</strong> ${fechaEvento}</p>
    <p><strong>Precio sugerido:</strong> $${precioRegalo}</p>
    <p><strong>Participantes:</strong></p>
    <ul>${participants.map((name) => `<li>${name}</li>`).join("") || "<li>No hay participantes</li>"}</ul>
    <p><strong>Exclusiones:</strong></p>
    <ul>${exclusionsHtml}</ul>
  `;
}

function showDataModal() {
  const participants = getJson(STORAGE_KEYS.participants, []);
  const exclusions = getJson(STORAGE_KEYS.exclusions, {});
  const fechaEvento = localStorage.getItem(STORAGE_KEYS.eventDate) || "No definida";
  const precioRegalo = localStorage.getItem(STORAGE_KEYS.giftPrice) || "No definido";
  const tipoEvento = localStorage.getItem(STORAGE_KEYS.eventType) || "No definido";

  let exclusionsHtml = "";
  Object.entries(exclusions).forEach(([person, list]) => {
    exclusionsHtml += `<strong>${person}</strong>: ${list.join(", ") || "Ninguna"}<br>`;
  });

  notify({
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

function sortear() {
  const participants = getJson(STORAGE_KEYS.participants, []);
  const exclusions = getJson(STORAGE_KEYS.exclusions, {});

  let attempts = 0;

  while (attempts < 500) {
    let available = [...participants];
    const result = {};
    let valid = true;

    for (const person of participants) {
      const options = available.filter(
        (candidate) =>
          candidate !== person &&
          !(exclusions[person] || []).includes(candidate)
      );

      if (options.length === 0) {
        valid = false;
        break;
      }

      const chosen = options[Math.floor(Math.random() * options.length)];
      result[person] = chosen;
      available = available.filter((candidate) => candidate !== chosen);
    }

    if (valid) {
      return result;
    }

    attempts += 1;
  }

  return null;
}

function renderDrawResult(resultPanel, result) {
  if (!resultPanel) return;

  if (!result) {
    resultPanel.innerHTML = '<div class="alert alert-warning mb-0">No se pudo generar el sorteo con esas exclusiones.</div>';
    return;
  }

  const rows = Object.entries(result)
    .map(
      ([from, to]) => `
        <div class="list-group-item d-flex justify-content-between align-items-center">
          <strong>${from}</strong>
          <span>-></span>
          <strong>${to}</strong>
        </div>
      `
    )
    .join("");

  resultPanel.innerHTML = `<div class="list-group">${rows}</div>`;
}

function initSteps5to7() {
  const saveBtn = document.getElementById("btnGuardarEvento");
  const showBtn = document.getElementById("btnMostrarEvento");
  const drawBtn = document.getElementById("btnSortear");
  const clearBtn = document.getElementById("btnLimpiarTodo");

  const status = document.getElementById("estadoGuardado");
  const dataPanel = document.getElementById("panelDatosEvento");
  const resultPanel = document.getElementById("panelResultadoSorteo");

  if (status) {
    status.textContent = "listo";
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (status) {
        status.textContent = "guardado";
      }

      notify({
        icon: "success",
        title: "Datos guardados",
        text: "La configuracion actual se mantiene en localStorage."
      });
    });
  }

  if (showBtn) {
    showBtn.addEventListener("click", () => {
      if (dataPanel) {
        showDataInPanel(dataPanel);
      } else {
        showDataModal();
      }
    });
  }

  if (drawBtn) {
    drawBtn.addEventListener("click", () => {
      const participants = getJson(STORAGE_KEYS.participants, []);

      if (participants.length < 3) {
        notify({
          icon: "warning",
          title: "Faltan participantes",
          text: "Debes registrar al menos 3 participantes antes de sortear."
        });
        return;
      }

      const result = sortear();
      if (!result) {
        if (resultPanel) {
          renderDrawResult(resultPanel, null);
        }

        notify({
          icon: "error",
          title: "No se pudo generar el sorteo",
          text: "Las exclusiones son demasiado restrictivas."
        });
        return;
      }

      if (resultPanel) {
        renderDrawResult(resultPanel, result);
      }

      notify({
        icon: "success",
        title: "Sorteo realizado",
        text: "Los resultados se generaron correctamente."
      });
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      clearFlowStorage();
      sessionStorage.removeItem("swaply_initialized");
      window.location.href = "index.html";
    });
  }

  if (dataPanel) {
    showDataInPanel(dataPanel);
  }
}

function init() {
  ensureFreshStartOnStep1();
  activeStep();
  initStep1();
  initStep2();
  initStep3();
  initStep4();
  initSteps5to7();
}

init();
