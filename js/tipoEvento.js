(function () {
  const eventSelect = document.getElementById("tipoEvento");
  const customEventWrap = document.getElementById("contenedorEventoPersonalizado");
  const customEventInput = document.getElementById("eventoPersonalizado");

  function activarPasoActual() {
    const page = document.body.dataset.page;
    document.querySelectorAll(".step-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.step === page);
    });
  }

  function init() {
    activarPasoActual();

    if (!eventSelect || !customEventWrap || !customEventInput) return;

    const savedEvent = localStorage.getItem("tipoEvento") || "";
    const inSelect = Array.from(eventSelect.options).some((op) => op.value === savedEvent);

    if (inSelect) {
      eventSelect.value = savedEvent;
    } else if (savedEvent) {
      eventSelect.value = "otro";
      customEventInput.value = savedEvent;
    }

    customEventWrap.classList.toggle("d-none", eventSelect.value !== "otro");

    eventSelect.addEventListener("change", () => {
      customEventWrap.classList.toggle("d-none", eventSelect.value !== "otro");
    });
  }

  init();
})();
