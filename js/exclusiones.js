(function () {
  const participants = JSON.parse(localStorage.getItem("participants")) || [];

  const enabledSelect = document.getElementById("hayExclusiones");
  const controls = document.querySelector(".exclusion-controls");
  const list = document.getElementById("listaExclusiones");
  const continueBtn = document.getElementById("btnContinuarPaso3");

  let exclusions = JSON.parse(localStorage.getItem("exclusions")) || {};

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
        title: "Demasiadas exclusiones",
        text: "Cada participante debe tener al menos una persona posible para regalar."
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
        render();
      });

      list.appendChild(item);
    });
  }

  function render() {
    normalizarExclusiones();
    guardarExclusiones();

    renderExclusionList();

    if (enabledSelect.value !== "si") {
      controls.innerHTML = "";
      controls.classList.add("d-none");
      return;
    }

    controls.classList.remove("d-none");
    controls.innerHTML = `
      <div class="row g-2">
        <div class="col-12 col-md-5">
          <div class="fw-semibold mb-2">Participantes</div>
          <div id="dragParticipantsList" class="list-group"></div>
        </div>
        <div class="col-12 col-md-7">
          <div class="fw-semibold mb-2">Zonas de exclusion</div>
          <div id="dropZonesContainer"></div>
        </div>
      </div>
    `;

    const dragParticipants = controls.querySelector("#dragParticipantsList");
    const zonesContainer = controls.querySelector("#dropZonesContainer");

    participants.forEach((person) => {
      const dragItem = document.createElement("div");
      dragItem.className = "list-group-item mb-2";
      dragItem.textContent = person;
      dragItem.draggable = true;

      dragItem.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", person);
        e.dataTransfer.effectAllowed = "move";
      });

      dragParticipants.appendChild(dragItem);
    });

    participants.forEach((person) => {
      if (!exclusions[person]) exclusions[person] = [];

      const wrapper = document.createElement("div");
      wrapper.className = "mb-3 p-3 border rounded";

      const title = document.createElement("div");
      title.className = "fw-bold mb-2";
      title.textContent = person + " NO puede regalar a:";

      const dropZone = document.createElement("div");
      dropZone.className = "p-2 border rounded";
      dropZone.style.minHeight = "54px";

      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();

        const draggedPerson = e.dataTransfer.getData("text/plain");
        if (!draggedPerson) return;

        if (draggedPerson === person) {
          swal({
            icon: "warning",
            title: "Exclusion invalida",
            text: "Una persona no puede excluirse a si misma."
          });
          return;
        }

        if ((exclusions[person] || []).includes(draggedPerson)) {
          swal({
            icon: "warning",
            title: "Exclusion duplicada",
            text: "Esa exclusion ya existe."
          });
          return;
        }

        if (!puedeExcluir(person)) return;

        exclusions[person].push(draggedPerson);
        guardarExclusiones();
        render();
      });

      const blocked = exclusions[person] || [];
      if (blocked.length === 0) {
        const placeholder = document.createElement("span");
        placeholder.className = "text-muted small";
        placeholder.textContent = "Arrastra aqui a quien no puede regalar.";
        dropZone.appendChild(placeholder);
      } else {
        blocked.forEach((name) => {
          const tag = document.createElement("span");
          tag.className = "badge text-bg-light border me-1 mb-1";
          tag.innerHTML = `${name} <button type="button" class="btn btn-sm p-0 border-0 ms-1">x</button>`;

          tag.querySelector("button").addEventListener("click", () => {
            exclusions[person] = exclusions[person].filter((p) => p !== name);
            guardarExclusiones();
            render();
          });

          dropZone.appendChild(tag);
        });
      }

      wrapper.appendChild(title);
      wrapper.appendChild(dropZone);
      zonesContainer.appendChild(wrapper);
    });
  }

  function init() {
    activarPasoActual();

    if (!enabledSelect || !controls || !list || !continueBtn) return;

    if (participants.length < 3) {
      swal({
        icon: "warning",
        title: "Faltan participantes",
        text: "Debes completar el paso de participantes antes de configurar exclusiones."
      }).then(() => {
        window.location.href = "participantes.html";
      });
      return;
    }

    normalizarExclusiones();
    enabledSelect.value = getEntries().length > 0 ? "si" : "no";
    render();

    enabledSelect.addEventListener("change", () => {
      if (enabledSelect.value === "no") {
        exclusions = {};
        guardarExclusiones();
        render();

        swal({
          icon: "success",
          title: "Sin exclusiones",
          text: "Se continuara sin restricciones."
        });
        return;
      }

      normalizarExclusiones();
      guardarExclusiones();
      render();
    });

    continueBtn.addEventListener("click", (event) => {
      event.preventDefault();
      if (enabledSelect.value === "no") localStorage.setItem("exclusions", JSON.stringify({}));
      else guardarExclusiones();

      swal({
        title: "Guardado",
        text: "Datos guardados correctamente.",
        icon: "success"
      }).then(() => {
        window.location.href = "evento.html";
      });
    });
  }

  init();
})();
