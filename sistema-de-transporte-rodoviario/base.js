(() => {
  "use strict";
  const slide = document.querySelector("#base");
  const switches = Array.from(slide.querySelectorAll("[data-basis]"));
  const select = slide.querySelector("#basis-country");
  const markers = slide.querySelector(".basis-markers");
  const summary = slide.querySelector(".basis-country-summary");
  const open = slide.querySelector(".basis-open");
  const dialog = document.querySelector("#basis-studies-dialog");
  const list = dialog.querySelector("#basis-studies-list");
  const dialogContext = dialog.querySelector("#basis-studies-context");
  const names = new Intl.DisplayNames(["pt-BR"], { type: "region" });
  const countryLabel = (code) => names.of(code);
  const records = ERI_READING_STUDIES;
  const locations = ERI_STUDY_MAP_POINTS;
  const byCountry = new Map();
  const markerButtons = new Map();

  for (const record of records) {
    for (const country of record.countries) {
      if (!byCountry.has(country)) byCountry.set(country, []);
      byCountry.get(country).push(record);
    }
  }

  const countries = [...byCountry.keys()].sort((a, b) => countryLabel(a).localeCompare(countryLabel(b), "pt-BR"));

  function studyCount(count) {
    return count === 1 ? "1 trabalho" : count + " trabalhos";
  }

  function selectCountry(country) {
    select.value = country;
    for (const [code, marker] of markerButtons) marker.setAttribute("aria-pressed", String(code === country));
    if (country) {
      const selected = byCountry.get(country);
      summary.textContent = countryLabel(country) + " · " + studyCount(selected.length);
      open.textContent = selected.length === 1 ? "Ver trabalho" : "Ver " + selected.length + " trabalhos";
    } else {
      const links = records.reduce((total, record) => total + record.countries.length, 0);
      summary.textContent = countries.length + " países · " + links + " vínculos entre trabalhos e países";
      open.textContent = "Ver os " + records.length + " trabalhos";
    }
  }

  for (const [index, country] of countries.entries()) {
    const count = byCountry.get(country).length;
    const option = new Option(countryLabel(country) + " · " + count, country);
    select.add(option);
    const position = locations[country];
    if (!position) continue;
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "basis-marker";
    marker.title = countryLabel(country) + " · " + studyCount(count);
    marker.setAttribute("aria-label", marker.title);
    marker.style.setProperty("--marker-x", position[0] + "%");
    marker.style.setProperty("--marker-y", position[1] + "%");
    marker.style.setProperty("--marker-size", (7 + 2.7 * Math.sqrt(count)) + "px");
    marker.style.setProperty("--marker-delay", (index * 35) + "ms");
    marker.addEventListener("click", () => selectCountry(country));
    markers.append(marker);
    markerButtons.set(country, marker);
  }

  switches.forEach((button) => button.addEventListener("click", () => {
    for (const tab of switches) {
      const current = tab === button;
      tab.setAttribute("aria-pressed", String(current));
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !current;
    }
  }));

  select.addEventListener("change", () => selectCountry(select.value));
  open.addEventListener("click", () => {
    const code = select.value;
    const items = code ? byCountry.get(code) : records;
    dialogContext.textContent = code
      ? countryLabel(code) + " · " + studyCount(items.length) + " com afiliação ou origem institucional no país."
      : "40 trabalhos, incluindo artigos e relatórios técnicos. A localização indica a afiliação dos autores ou o país do órgão editor. Um trabalho pode aparecer em mais de um país. Base cartográfica Natural Earth.";
    list.replaceChildren(...items.map((record) => {
      const li = document.createElement("li");
      const heading = document.createElement(record.url ? "a" : "span");
      heading.textContent = record.title;
      if (record.url) {
        heading.href = record.url;
        heading.target = "_blank";
        heading.rel = "noopener";
      }
      const meta = document.createElement("small");
      meta.textContent = record.group + " · " + record.countries.map(countryLabel).join(", ") + " · " + record.source;
      li.append(heading, meta);
      return li;
    }));
    dialog.showModal();
  });

  selectCountry("");
})();
