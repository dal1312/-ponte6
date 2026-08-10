const SITE_CONFIG = window.PONTE_CONFIG || {};
const RESTAURANT_CONTACT_NUMBER = SITE_CONFIG.restaurant?.whatsapp || '39054329448';
const WHATSAPP_BASE_URL = `https://wa.me/${RESTAURANT_CONTACT_NUMBER}`;

function buildWhatsAppUrl(message = '') {
    return message ? `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}` : WHATSAPP_BASE_URL;
}

function formatPrice(value) {
    return `€\u00a0${Number(value).toFixed(2).replace('.', ',')}`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

window.PonteUtils = { buildWhatsAppUrl, formatPrice, escapeHtml };
