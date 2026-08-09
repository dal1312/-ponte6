(function () {
  const form = document.getElementById("orderForm");
  const cart = window.PonteCart;
  const config = window.PONTE_CONFIG;
  const utils = window.PonteUtils;
  if (!form || !cart || !config || !utils) return;

  const dateInput = document.getElementById("orderDate");
  const timeSelect = document.getElementById("orderTime");
  const addressField = document.getElementById("addressField");
  const addressInput = document.getElementById("deliveryAddress");
  const feedback = document.getElementById("orderFeedback");
  const receiptDialog = document.getElementById("orderReceiptDialog");
  const receiptContent = document.getElementById("orderReceiptContent");
  const whatsappLink = document.getElementById("sendOrderWhatsapp");
  const { escapeHtml, formatPrice, buildWhatsAppUrl } = utils;
  let currentOrder = null;

  const toDateValue = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const toMinutes = value => {
    const [hour, minute] = value.split(":").map(Number);
    return hour * 60 + minute;
  };

  const toTime = value => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;

  function setupDateRange() {
    const today = new Date();
    const lastDay = new Date(today);
    lastDay.setDate(lastDay.getDate() + config.ordering.maxAdvanceDays);
    dateInput.min = toDateValue(today);
    dateInput.max = toDateValue(lastDay);
    dateInput.value = toDateValue(today);
    renderTimeSlots();
  }

  function renderTimeSlots() {
    if (!dateInput.value) return;
    const selected = new Date(`${dateInput.value}T12:00:00`);
    const slots = config.hours[selected.getDay()] || [];
    const now = new Date();
    const isToday = dateInput.value === toDateValue(now);
    const earliest = isToday ? now.getHours() * 60 + now.getMinutes() + config.ordering.minLeadMinutes : 0;
    const options = [];

    slots.forEach(([start, end]) => {
      for (let value = toMinutes(start); value < toMinutes(end); value += config.ordering.slotMinutes) {
        if (value >= earliest) options.push(toTime(value));
      }
    });

    timeSelect.innerHTML = options.length
      ? `<option value="">Scegli orario</option>${options.map(value => `<option value="${value}">${value}</option>`).join("")}`
      : '<option value="">Nessun orario disponibile</option>';
    timeSelect.disabled = options.length === 0;
  }

  function updateMode(mode) {
    const delivery = mode === "consegna";
    addressField.classList.toggle("is-hidden", !delivery);
    addressField.style.display = delivery ? "block" : "none";
    addressInput.required = delivery;
  }

  function configureModes() {
    const pickup = form.querySelector('input[name="mode"][value="ritiro"]');
    const delivery = form.querySelector('input[name="mode"][value="consegna"]');
    pickup.disabled = !config.ordering.pickupEnabled;
    delivery.disabled = !config.ordering.deliveryEnabled;
    if (pickup.disabled && !delivery.disabled) delivery.checked = true;
    updateMode(form.elements.mode.value);
  }

  function createOrderId() {
    const date = toDateValue(new Date()).replaceAll("-", "");
    const random = crypto.getRandomValues(new Uint16Array(1))[0].toString(36).toUpperCase().padStart(3, "0");
    return `AP-${date}-${random}`;
  }

  function validate(data) {
    feedback.textContent = "";
    if (cart.getCount() === 0) return "Aggiungi almeno un prodotto al carrello.";
    if ((String(data.phone).match(/\d/g) || []).length < 8) return "Inserisci un numero di telefono valido.";
    if (!data.date || !data.time) return "Scegli giorno e orario desiderati.";
    if (data.mode === "consegna" && !/forl[iì]/i.test(data.address || "")) {
      return "Per la consegna inserisci l’indirizzo completo, includendo Forlì.";
    }
    if (cart.getTotal() < config.ordering.minOrder) {
      return `L’ordine minimo è ${formatPrice(config.ordering.minOrder)}.`;
    }
    return "";
  }

  function buildOrder(data) {
    return {
      id: createOrderId(),
      createdAt: new Date().toISOString(),
      status: "draft",
      customer: { name: String(data.name).trim(), phone: String(data.phone).trim() },
      fulfillment: {
        mode: data.mode,
        address: data.mode === "consegna" ? String(data.address).trim() : "",
        date: data.date,
        time: data.time
      },
      notes: String(data.notes || "").trim(),
      items: cart.items.map(item => ({ ...item })),
      total: cart.getTotal()
    };
  }

  function buildMessage(order) {
    const mode = order.fulfillment.mode === "ritiro" ? "Ritiro in loco" : "Consegna a domicilio";
    let message = `🍕 *RICHIESTA ORDINE ${order.id}* 🍕\n\n`;
    message += `👤 *Cliente:* ${order.customer.name}\n`;
    message += `📞 *Telefono:* ${order.customer.phone}\n`;
    message += `🚚 *Modalità:* ${mode}\n`;
    message += `🗓️ *Quando:* ${order.fulfillment.date} alle ${order.fulfillment.time}\n`;
    if (order.fulfillment.address) message += `📍 *Indirizzo:* ${order.fulfillment.address}\n`;
    message += `\n📋 *ORDINE:*\n`;
    order.items.forEach(item => {
      message += `• ${item.qty}x ${item.name} = € ${(item.price * item.qty).toFixed(2)}\n`;
      if (item.customDetails) message += `  └ ${item.customDetails}\n`;
    });
    message += `\n💰 *TOTALE: € ${order.total.toFixed(2)}*`;
    if (order.notes) message += `\n\n📝 *Note:* ${order.notes}`;
    message += "\n\n⏳ Attendo conferma di disponibilità e orario.";
    return message;
  }

  function renderReceipt(order) {
    const mode = order.fulfillment.mode === "ritiro" ? "Ritiro in loco" : "Consegna a domicilio";
    receiptContent.innerHTML = `
      <div class="receipt-meta"><strong>${escapeHtml(order.id)}</strong><span>${escapeHtml(order.fulfillment.date)} · ${escapeHtml(order.fulfillment.time)}</span></div>
      <dl class="receipt-details">
        <div><dt>Cliente</dt><dd>${escapeHtml(order.customer.name)}</dd></div>
        <div><dt>Modalità</dt><dd>${escapeHtml(mode)}</dd></div>
        ${order.fulfillment.address ? `<div><dt>Indirizzo</dt><dd>${escapeHtml(order.fulfillment.address)}</dd></div>` : ""}
      </dl>
      <ul class="receipt-items">${order.items.map(item => `<li><span>${item.qty}× ${escapeHtml(item.name)}${item.customDetails ? `<small>${escapeHtml(item.customDetails)}</small>` : ""}</span><strong>${formatPrice(item.price * item.qty)}</strong></li>`).join("")}</ul>
      <div class="receipt-total"><span>Totale</span><strong>${formatPrice(order.total)}</strong></div>
    `;
    whatsappLink.href = buildWhatsAppUrl(buildMessage(order));
  }

  function saveDraft(order) {
    let drafts = [];
    try { drafts = JSON.parse(localStorage.getItem("ponte-order-drafts") || "[]"); } catch { drafts = []; }
    drafts.push(order);
    localStorage.setItem("ponte-order-drafts", JSON.stringify(drafts.slice(-10)));
  }

  async function sendToConfiguredApi(order) {
    if (!config.ordering.apiEndpoint) return;
    try {
      await fetch(config.ordering.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
        keepalive: true
      });
    } catch {
      // WhatsApp remains the reliable fallback; confirmation is handled by the restaurant.
    }
  }

  form.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener("change", event => updateMode(event.target.value));
  });
  dateInput.addEventListener("change", renderTimeSlots);

  form.addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const error = validate(data);
    if (error) {
      feedback.textContent = error;
      feedback.className = "form-feedback is-error";
      return;
    }

    currentOrder = buildOrder(data);
    saveDraft(currentOrder);
    renderReceipt(currentOrder);
    feedback.textContent = "Riepilogo pronto: controlla i dati prima di aprire WhatsApp.";
    feedback.className = "form-feedback is-success";
    document.body.classList.remove("cart-drawer-open");
    receiptDialog.showModal();
    window.PonteSite?.analytics.track("order_review", { id: currentOrder.id, total: currentOrder.total });
  });

  whatsappLink.addEventListener("click", () => {
    if (!currentOrder) return;
    currentOrder.status = "sent_to_whatsapp";
    sendToConfiguredApi(currentOrder);
  });
  document.getElementById("orderReceiptClose").addEventListener("click", () => receiptDialog.close());
  document.getElementById("printOrder").addEventListener("click", () => window.print());
  receiptDialog.addEventListener("click", event => {
    const bounds = receiptDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      receiptDialog.close();
    }
  });

  setupDateRange();
  configureModes();
})();
