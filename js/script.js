const STORAGE_KEY = "swaplygr_evento";

function defaultState() {
  return {
    organizador: "",
    organizadorIncluido: true,
    participantes: [],
    exclusionesActivas: false,
    exclusiones: [],
    tipoEvento: "Navidad",
    eventoPersonalizado: "",
    fechaCelebracion: "",
    presupuesto: "100",
    presupuestoPersonalizado: "",
    resultadoSorteo: null
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function activeStep() {
  const page = document.body.dataset.page;
  document.querySelectorAll(".step-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.step === page);
  });
}

function allPeople(state) {
  const people = [...state.participantes];
  if (state.organizadorIncluido && state.organizador.trim()) {
    const exists = people.some((p) => p.toLowerCase() === state.organizador.toLowerCase());
    if (!exists) {
      people.unshift(state.organizador.trim());
    }
  }
  return people;
}

function fillDateOptions(select) {
  if (!select) return;
  select.innerHTML = "";
  const today = new Date();
  for (let i = 7; i <= 35; i += 7) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const iso = `${yyyy}-${mm}-${dd}`;
    const op = document.createElement("option");
    op.value = iso;
    op.textContent = iso;
    select.appendChild(op);
  }
}

function initStep1(state) {
  const name = document.getElementById("nombreOrganizador");
  const include = document.getElementById("incluyeOrganizador");
  if (!name || !include) return;

  name.value = state.organizador;
  include.value = state.organizadorIncluido ? "si" : "no";

  name.addEventListener("input", () => {
    state.organizador = name.value.trim();
    saveState(state);
  });

  include.addEventListener("change", () => {
    state.organizadorIncluido = include.value === "si";
    saveState(state);
  });
}

function renderParticipants(list, state) {
  list.innerHTML = "";
  if (state.participantes.length === 0) {
    list.innerHTML = '<li class="list-group-item text-muted">Aun no hay participantes.</li>';
    return;
  }

  state.participantes.forEach((person, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.innerHTML = `<span>${person}</span><button class="btn btn-sm btn-outline-danger">x</button>`;
    li.querySelector("button").addEventListener("click", () => {
      state.participantes.splice(index, 1);
      state.exclusiones = state.exclusiones.filter((pair) => pair[0] !== person && pair[1] !== person);
      saveState(state);
      renderParticipants(list, state);
    });
    list.appendChild(li);
  });
}

function initStep2(state) {
  const input = document.getElementById("inputParticipante");
  const addBtn = document.getElementById("btnAgregarParticipante");
  const list = document.getElementById("listaParticipantes");
  if (!input || !addBtn || !list) return;

  renderParticipants(list, state);

  function addParticipant() {
    const value = input.value.trim();
    if (!value) return;
    const exists = state.participantes.some((p) => p.toLowerCase() === value.toLowerCase());
    if (exists) {
      alert("Ese participante ya existe.");
      return;
    }
    state.participantes.push(value);
    input.value = "";
    saveState(state);
    renderParticipants(list, state);
  }

  addBtn.addEventListener("click", addParticipant);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addParticipant();
  });
}

function fillExclusionSelect(select, state) {
  select.innerHTML = "";
  allPeople(state).forEach((p) => {
    const op = document.createElement("option");
    op.value = p;
    op.textContent = p;
    select.appendChild(op);
  });
}

function renderExclusions(list, state) {
  list.innerHTML = "";
  if (state.exclusiones.length === 0) {
    list.innerHTML = '<li class="list-group-item text-muted">No hay exclusiones.</li>';
    return;
  }

  state.exclusiones.forEach((pair, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.innerHTML = `<span>${pair[0]} x ${pair[1]}</span><button class="btn btn-sm btn-outline-danger">x</button>`;
    li.querySelector("button").addEventListener("click", () => {
      state.exclusiones.splice(index, 1);
      saveState(state);
      renderExclusions(list, state);
    });
    list.appendChild(li);
  });
}

function initStep3(state) {
  const enabled = document.getElementById("hayExclusiones");
  const selectA = document.getElementById("selectPersonaA");
  const selectB = document.getElementById("selectPersonaB");
  const addBtn = document.getElementById("btnAgregarExclusion");
  const list = document.getElementById("listaExclusiones");
  const controls = document.querySelectorAll(".exclusion-controls");
  if (!enabled || !selectA || !selectB || !addBtn || !list) return;

  enabled.value = state.exclusionesActivas ? "si" : "no";
  controls.forEach((c) => c.classList.toggle("d-none", !state.exclusionesActivas));
  fillExclusionSelect(selectA, state);
  fillExclusionSelect(selectB, state);
  renderExclusions(list, state);

  enabled.addEventListener("change", () => {
    state.exclusionesActivas = enabled.value === "si";
    if (!state.exclusionesActivas) state.exclusiones = [];
    controls.forEach((c) => c.classList.toggle("d-none", !state.exclusionesActivas));
    saveState(state);
    renderExclusions(list, state);
  });

  addBtn.addEventListener("click", () => {
    const a = selectA.value;
    const b = selectB.value;
    if (!a || !b || a === b) {
      alert("Selecciona dos personas distintas.");
      return;
    }
    const exists = state.exclusiones.some((pair) => (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a));
    if (exists) {
      alert("Esa exclusion ya existe.");
      return;
    }
    state.exclusiones.push([a, b]);
    saveState(state);
    renderExclusions(list, state);
  });
}

function initStep4(state) {
  const tipo = document.getElementById("tipoEvento");
  const eventoInput = document.getElementById("eventoPersonalizado");
  const eventoWrap = document.getElementById("contenedorEventoPersonalizado");
  const fechaSel = document.getElementById("fechaSugerida");
  const fechaManual = document.getElementById("fechaManual");
  const presupuestoSel = document.getElementById("presupuesto");
  const presupuestoInput = document.getElementById("presupuestoPersonalizado");
  const presupuestoWrap = document.getElementById("contenedorPresupuestoPersonalizado");
  if (!tipo || !eventoInput || !eventoWrap || !fechaSel || !fechaManual || !presupuestoSel || !presupuestoInput || !presupuestoWrap) return;

  fillDateOptions(fechaSel);

  tipo.value = state.tipoEvento;
  eventoInput.value = state.eventoPersonalizado;
  eventoWrap.classList.toggle("d-none", tipo.value !== "otro");

  if (state.fechaCelebracion) {
    const inList = Array.from(fechaSel.options).some((o) => o.value === state.fechaCelebracion);
    if (inList) fechaSel.value = state.fechaCelebracion;
    else fechaManual.value = state.fechaCelebracion;
  }

  presupuestoSel.value = state.presupuesto;
  presupuestoInput.value = state.presupuestoPersonalizado;
  presupuestoWrap.classList.toggle("d-none", presupuestoSel.value !== "otro");

  function saveEvent() {
    state.tipoEvento = tipo.value;
    state.eventoPersonalizado = eventoInput.value.trim();
    state.fechaCelebracion = fechaManual.value || fechaSel.value;
    state.presupuesto = presupuestoSel.value;
    state.presupuestoPersonalizado = presupuestoInput.value;
    saveState(state);
  }

  tipo.addEventListener("change", () => {
    eventoWrap.classList.toggle("d-none", tipo.value !== "otro");
    saveEvent();
  });
  eventoInput.addEventListener("input", saveEvent);
  fechaSel.addEventListener("change", saveEvent);
  fechaManual.addEventListener("change", saveEvent);
  presupuestoSel.addEventListener("change", () => {
    presupuestoWrap.classList.toggle("d-none", presupuestoSel.value !== "otro");
    saveEvent();
  });
  presupuestoInput.addEventListener("input", saveEvent);
}

function formatEventData(state) {
  const eventName = state.tipoEvento === "otro" ? (state.eventoPersonalizado || "Celebracion personalizada") : state.tipoEvento;
  const money = state.presupuesto === "otro" ? `$${state.presupuestoPersonalizado || "0"}` : `$${state.presupuesto}`;
  const people = allPeople(state);
  const badges = people.map((p) => `<span class="badge rounded-pill badge-soft me-1 mb-1">${p}</span>`).join("");
  const ex = state.exclusionesActivas && state.exclusiones.length
    ? state.exclusiones.map((pair) => `<li>${pair[0]} x ${pair[1]}</li>`).join("")
    : "<li>Sin exclusiones</li>";

  return `
    <p><strong>Organizador:</strong> ${state.organizador || "Sin definir"}</p>
    <p><strong>Organizador incluido:</strong> ${state.organizadorIncluido ? "Si" : "No"}</p>
    <p><strong>Celebracion:</strong> ${eventName}</p>
    <p><strong>Fecha:</strong> ${state.fechaCelebracion || "Sin definir"}</p>
    <p><strong>Presupuesto:</strong> ${money}</p>
    <p><strong>Participantes:</strong></p>
    <div class="mb-2">${badges}</div>
    <p><strong>Exclusiones:</strong></p>
    <ul>${ex}</ul>
  `;
}

function isExcluded(a, b, pairs) {
  return pairs.some((pair) => (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a));
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function drawPairs(people, exclusions) {
  const givers = [...people];
  shuffle(givers);
  const result = {};
  const used = new Set();

  function solve(i) {
    if (i === givers.length) return true;
    const giver = givers[i];
    const options = [...givers];
    shuffle(options);
    for (const receiver of options) {
      if (giver === receiver) continue;
      if (used.has(receiver)) continue;
      if (isExcluded(giver, receiver, exclusions)) continue;
      result[giver] = receiver;
      used.add(receiver);
      if (solve(i + 1)) return true;
      delete result[giver];
      used.delete(receiver);
    }
    return false;
  }

  return solve(0) ? result : null;
}

function renderResult(panel, result) {
  if (!panel) return;
  if (!result) {
    panel.innerHTML = "Aun no hay sorteo realizado.";
    return;
  }
  const html = Object.keys(result)
    .map((name) => `<li><strong>${name}</strong> intercambia con <strong>${result[name]}</strong></li>`)
    .join("");
  panel.innerHTML = `<ul class="mb-0">${html}</ul>`;
}

function initSteps5to7(state) {
  const saveBtn = document.getElementById("btnGuardarEvento");
  const showBtn = document.getElementById("btnMostrarEvento");
  const drawBtn = document.getElementById("btnSortear");
  const clearBtn = document.getElementById("btnLimpiarTodo");
  const status = document.getElementById("estadoGuardado");
  const dataPanel = document.getElementById("panelDatosEvento");
  const resultPanel = document.getElementById("panelResultadoSorteo");

  if (status) status.textContent = "listo";

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveState(state);
      if (status) status.textContent = "guardado";
      alert("Datos guardados.");
    });
  }

  if (showBtn && dataPanel) {
    showBtn.addEventListener("click", () => {
      dataPanel.innerHTML = formatEventData(state);
    });
  }

  if (drawBtn && resultPanel) {
    drawBtn.addEventListener("click", () => {
      const people = allPeople(state);
      if (!state.organizador || people.length < 2) {
        alert("Falta organizador o participantes.");
        return;
      }
      const exclusions = state.exclusionesActivas ? state.exclusiones : [];
      const result = drawPairs(people, exclusions);
      if (!result) {
        resultPanel.innerHTML = '<div class="alert alert-warning mb-0">No se pudo generar el sorteo con esas exclusiones.</div>';
        return;
      }
      state.resultadoSorteo = result;
      saveState(state);
      renderResult(resultPanel, result);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    });
  }

  if (dataPanel) dataPanel.innerHTML = formatEventData(state);
  if (resultPanel) renderResult(resultPanel, state.resultadoSorteo);
}

function init() {
  const state = loadState();
  activeStep();
  initStep1(state);
  initStep2(state);
  initStep3(state);
  initStep4(state);
  initSteps5to7(state);
}

init();
