(function () {
  const fechaSugerida = document.getElementById("fechaSugerida");
  const fechaInput = document.getElementById("fechaManual");
  const precioSelect = document.getElementById("presupuesto");
  const otroPrecio = document.getElementById("presupuestoPersonalizado");
  const otroPrecioWrap = document.getElementById("contenedorPresupuestoPersonalizado");
  const eventSelect = document.getElementById("tipoEvento");
  const customEventInput = document.getElementById("eventoPersonalizado");
  const boton = document.getElementById("btnContinuarPaso4");

  function swal(options) {
    if (window.Swal) return Swal.fire(options);
    alert([options.title, options.text].filter(Boolean).join("\n"));
    return Promise.resolve();
  }

  function fillDateOptions() {
    if (!fechaSugerida) return;
    fechaSugerida.innerHTML = "";

    const hoy = new Date();
    for (let i = 7; i <= 35; i += 7) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      const yyyy = fecha.getFullYear();
      const mm = String(fecha.getMonth() + 1).padStart(2, "0");
      const dd = String(fecha.getDate()).padStart(2, "0");
      const value = `${yyyy}-${mm}-${dd}`;

      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      fechaSugerida.appendChild(option);
    }
  }

  function init() {
    if (!fechaInput || !precioSelect || !otroPrecio || !otroPrecioWrap || !eventSelect || !customEventInput || !boton) return;

    fillDateOptions();

    const hoy = new Date().toISOString().split("T")[0];
    fechaInput.min = hoy;

    const savedDate = localStorage.getItem("fechaEvento") || "";
    if (savedDate) {
      const inSuggested = Array.from(fechaSugerida.options).some((op) => op.value === savedDate);
      if (inSuggested) fechaSugerida.value = savedDate;
      else fechaInput.value = savedDate;
    }

    const savedPrice = localStorage.getItem("precioRegalo") || "";
    const inBudget = Array.from(precioSelect.options).some((op) => op.value === savedPrice);
    if (inBudget) {
      precioSelect.value = savedPrice;
    } else if (savedPrice) {
      precioSelect.value = "otro";
      otroPrecio.value = savedPrice;
    }

    otroPrecioWrap.classList.toggle("d-none", precioSelect.value !== "otro");

    precioSelect.addEventListener("change", () => {
      if (precioSelect.value === "otro") {
        otroPrecioWrap.classList.remove("d-none");
      } else {
        otroPrecioWrap.classList.add("d-none");
      }
    });

    boton.addEventListener("click", (event) => {
      event.preventDefault();

      let tipoEvento = eventSelect.value;
      if (!tipoEvento) {
        swal({
          icon: "warning",
          title: "Selecciona un evento",
          text: "Debes elegir un evento antes de continuar."
        });
        return;
      }

      if (tipoEvento === "otro") {
        tipoEvento = customEventInput.value.trim();
        if (!tipoEvento) {
          swal({
            icon: "warning",
            title: "Selecciona un evento",
            text: "Debes escribir el nombre del evento personalizado."
          });
          return;
        }
      }

      const fecha = fechaInput.value || fechaSugerida.value;
      let precio = precioSelect.value;

      if (precio === "otro") {
        precio = otroPrecio.value;
      }

      if (!fecha || !precio) {
        swal({
          icon: "warning",
          title: "Campos incompletos",
          text: "Debes seleccionar una fecha y un monto para el regalo"
        });
        return;
      }

      localStorage.setItem("tipoEvento", tipoEvento);
      localStorage.setItem("fechaEvento", fecha);
      localStorage.setItem("precioRegalo", precio);

      swal({
        icon: "success",
        title: "Datos guardados",
        text: "La configuracion del intercambio fue guardada"
      }).then(() => {
        window.location.href = "acciones.html";
      });
    });
  }

  init();
})();
