(function () {
  const config = window.PONTE_CONFIG;
  if (!config) return;

  const minutes = value => {
    const [hour, minute] = value.split(":").map(Number);
    return hour * 60 + minute;
  };

  function restaurantClock(now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: config.restaurant.timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(now);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: dayMap[values.weekday], minute: Number(values.hour) * 60 + Number(values.minute) };
  }

  function getRestaurantStatus(now = new Date()) {
    const current = restaurantClock(now);
    const today = config.hours[current.day] || [];
    const active = today.find(([start, end]) => current.minute >= minutes(start) && current.minute < minutes(end));
    if (active) return { open: true, label: `Aperto ora · fino alle ${active[1]}` };

    const later = today.find(([start]) => current.minute < minutes(start));
    if (later) return { open: false, label: `Chiuso ora · riapre alle ${later[0]}` };

    const dayNames = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
    for (let offset = 1; offset <= 7; offset += 1) {
      const day = (current.day + offset) % 7;
      const slots = config.hours[day] || [];
      if (slots.length) return { open: false, label: `Chiuso ora · riapre ${dayNames[day]} alle ${slots[0][0]}` };
    }
    return { open: false, label: "Ordini temporaneamente non disponibili" };
  }

  function bindConfig() {
    const bindings = {
      phone: config.restaurant.phoneDisplay,
      address: config.restaurant.shortAddress,
      whatsapp: `https://wa.me/${config.restaurant.whatsapp}`,
      bookingWhatsapp: `https://wa.me/${config.restaurant.whatsapp}?text=${encodeURIComponent("Salve, vorrei prenotare un tavolo")}`,
      tel: `tel:${config.restaurant.phoneLink}`
    };
    document.querySelectorAll("[data-config-text]").forEach(element => {
      const value = bindings[element.dataset.configText];
      if (value) element.textContent = value;
    });
    document.querySelectorAll("[data-config-href]").forEach(element => {
      const value = bindings[element.dataset.configHref];
      if (value) element.href = value;
    });
  }

  function renderStatus() {
    const status = getRestaurantStatus();
    document.querySelectorAll("[data-restaurant-status]").forEach(element => {
      element.textContent = status.label;
      element.classList.toggle("is-open", status.open);
      element.classList.toggle("is-closed", !status.open);
    });
  }

  function renderHours() {
    const dayNames = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
    document.querySelectorAll("[data-hours-list]").forEach(list => {
      list.innerHTML = dayNames.map((dayName, day) => {
        const slots = config.hours[day] || [];
        const value = slots.length ? slots.map(slot => slot.join("–")).join(" · ") : "Chiuso";
        return `<li><span>${dayName}</span><span${slots.length ? "" : ' class="closed"'}>${value}</span></li>`;
      }).join("");
    });
  }

  const analytics = {
    track(eventName, data = {}) {
      if (!config.analytics.enabled || navigator.doNotTrack === "1") return;
      if (localStorage.getItem("ponte-analytics-optout") === "1") return;
      const key = config.analytics.storageKey;
      let events = [];
      try { events = JSON.parse(localStorage.getItem(key) || "[]"); } catch { events = []; }
      events.push({ event: eventName, data, path: location.pathname, at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(events.slice(-100)));
      if (config.analytics.endpoint && navigator.sendBeacon) {
        navigator.sendBeacon(config.analytics.endpoint, JSON.stringify(events.at(-1)));
      }
    },
    optOut() { localStorage.setItem("ponte-analytics-optout", "1"); },
    optIn() { localStorage.removeItem("ponte-analytics-optout"); }
  };

  document.addEventListener("click", event => {
    const target = event.target.closest("[data-track]");
    if (target) analytics.track(target.dataset.track, { label: target.textContent.trim().slice(0, 80) });
  });

  window.PonteSite = { getRestaurantStatus, analytics };
  document.getElementById("privacyOptOut")?.addEventListener("click", () => {
    analytics.optOut();
    document.getElementById("privacyStatus").textContent = "Misurazioni locali disattivate.";
  });
  document.getElementById("privacyOptIn")?.addEventListener("click", () => {
    analytics.optIn();
    document.getElementById("privacyStatus").textContent = "Misurazioni locali riattivate.";
  });
  bindConfig();
  renderStatus();
  renderHours();
})();
