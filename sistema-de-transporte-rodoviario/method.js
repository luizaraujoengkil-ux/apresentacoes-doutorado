(() => {
  "use strict";

  const slide = document.querySelector("#metodo");
  const steps = Array.from(slide.querySelectorAll("[data-method-step]"));
  const panels = steps.map((step) => document.getElementById(step.getAttribute("aria-controls")));
  const next = slide.querySelector(".method-next");
  let active = 0;

  function show(index) {
    active = index;
    steps.forEach((step, i) => {
      step.setAttribute("aria-pressed", String(i === active));
      panels[i].hidden = i !== active;
    });
    next.textContent = active === steps.length - 1 ? "Rever etapas" : "Avançar etapa →";
  }

  steps.forEach((step, i) => step.addEventListener("click", () => show(i)));
  next.addEventListener("click", () => show((active + 1) % steps.length));
})();
