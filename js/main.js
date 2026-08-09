/* ========================================
   NAVBAR SCROLL EFFECT
======================================== */
const SITE_CONFIG = window.PONTE_CONFIG || {};
const RESTAURANT_CONTACT_NUMBER = SITE_CONFIG.restaurant?.whatsapp || '39054329448';
const WHATSAPP_BASE_URL = `https://wa.me/${RESTAURANT_CONTACT_NUMBER}`;

function buildWhatsAppUrl(message = '') {
    return message ? `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}` : WHATSAPP_BASE_URL;
}

function formatPrice(value) {
    return `€${Number(value).toFixed(2).replace('.', ',')}`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const ALLERGEN_REFERENCES = Object.freeze({
    'Glutine': 1,
    'Crostacei': 2,
    'Uova': 3,
    'Pesce': 4,
    'Arachidi': 5,
    'Soia': 6,
    'Latte': 7,
    'Frutta a guscio': 8,
    'Sedano': 9,
    'Senape': 10,
    'Sesamo': 11,
    'Solfiti': 12,
    'Lupini': 13,
    'Molluschi': 14
});

const MENU_IMAGE_FALLBACKS = Object.freeze({
    304039: 'assets/menu-images/304039_Cappelletti_al_Rag_della_Nonna_Franca.webp',
    304044: 'assets/menu-images/generated_cotoletta_milanese.png',
    307352: 'assets/menu-images/307352_Tartare_di_Controfiletto_Irlandese_con_Senape_al_Miele_e_Frutta_Fresca.webp',
    307611: 'assets/menu-images/generated_bruciatini.png',
    307616: 'assets/menu-images/307616_Degustazione_di_Formaggi_del_Territorio_e_Piadina_Romagnola.webp',
    307627: 'assets/menu-images/307627_Cozze_alla_Tarantina.webp',
    307633: 'assets/menu-images/307633_Acciughe_del_Mar_Cantabrico_e_Burrata.webp',
    307635: 'assets/menu-images/307635_Tagliatelle_al_Rag_della_Nonna_Franca.webp',
    307643: 'assets/menu-images/307643_Cappelletti_al_Crudo_di_Parma_Ciliegini_e_Pesto_di_Rucola.webp',
    307651: 'assets/menu-images/307651_Tortelli_di_Ricotta_e_Spinaci_con_Guanciale_Salvia_Crema_di_Burro_Chiarificato.webp',
    307660: 'assets/menu-images/307660_Strozzapreti_ai_Porcini_con_Scaglie_di_Pecorino_di_Fossa_di_Sogliano.webp',
    307669: 'assets/menu-images/generated_tagliolini_scoglio.png',
    307678: 'assets/menu-images/307678_Gnocchetti_alle_Vongole_su_Crema_di_Zucchine_e_Datterini.webp',
    307686: 'assets/menu-images/improved_galletto_agrumi.png',
    307947: 'assets/menu-images/307947_Tagliata_di_Controfiletto_di_Manzo_Argentino_al_Sale_di_Cervia_con_Patate_Rustiche_al_Forno.webp',
    307949: 'assets/menu-images/generated_filetto_porcini.png',
    307950: 'assets/menu-images/generated_filetto_pepe_rosa_clean.png',
    307951: 'assets/menu-images/generated_fritto_mare_verdure.png',
    307953: 'assets/menu-images/307953_Polpo_Cotto_a_Bassa_Temperatura_su_Crema_di_Patate_e_Gocce_di_Prezzemolo.webp',
    380901: 'assets/menu-images/generated_grigliata_carne.png',
    493656: 'assets/menu-images/493656_Flan_di_Zucca_e_Porri_su_Crema_di_Gorgonzola.webp',
    493678: 'assets/menu-images/improved_baccala_white.png',
    520062: 'assets/menu-images/generated_lasagne_romagnola.png'
});

function renderAllergens(item, compact = false) {
    if (!item.allergens?.length) return '';
    const inferred = new Set(item.allergens_inferred || []);
    const badges = item.allergens.map(allergen => {
        const reference = ALLERGEN_REFERENCES[allergen];
        const isInferred = inferred.has(allergen);
        const sourceLabel = isInferred ? 'dedotto dagli ingredienti o dalla categoria' : 'dichiarato dal ristorante';
        const tagHtml = isInferred ? ' <small class="allergen-tag">(dedotto)</small>' : '';
        return `<span class="allergen${isInferred ? ' allergen-inferred' : ' allergen-confirmed'}" title="${escapeHtml(sourceLabel)}"><b>${reference || '?'}</b> ${escapeHtml(allergen)}${tagHtml}</span>`;
    }).join('');
    return `<div class="allergens${compact ? ' allergens-compact' : ''}" aria-label="Allergeni numerati">${badges}</div>`;
}

const CART_LIMITS = Object.freeze({ maxItems: 100, maxQty: 99, maxPrice: 1000 });

function normalizeCartItem(item) {
    if (!item || typeof item !== 'object') return null;

    const name = typeof item.name === 'string' ? item.name.trim().slice(0, 160) : '';
    const price = Number(item.price);
    const qty = Number(item.qty);
    const customDetails = typeof item.customDetails === 'string'
        ? item.customDetails.trim().slice(0, 600)
        : null;

    if (!name || !Number.isFinite(price) || price < 0 || price > CART_LIMITS.maxPrice) return null;
    if (!Number.isInteger(qty) || qty < 1) return null;

    return {
        name,
        price: Math.round(price * 100) / 100,
        qty: Math.min(qty, CART_LIMITS.maxQty),
        customDetails: customDetails || null
    };
}

function normalizeCart(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, CART_LIMITS.maxItems).map(normalizeCartItem).filter(Boolean);
}

window.PonteUtils = { buildWhatsAppUrl, formatPrice, escapeHtml };

const navbar = document.getElementById('navbar');

if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/* ========================================
   MOBILE MENU
======================================== */
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileMenuBtn && mobileMenu) {
    const closeMobileMenu = ({ restoreFocus = false } = {}) => {
        mobileMenu.classList.remove('active');
        document.body.classList.remove('mobile-menu-open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.setAttribute('aria-label', 'Apri menu');
        if (restoreFocus) mobileMenuBtn.focus();
    };

    mobileMenuBtn.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('active');
        document.body.classList.toggle('mobile-menu-open', isOpen);
        mobileMenu.setAttribute('aria-hidden', String(!isOpen));
        mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
        mobileMenuBtn.setAttribute('aria-label', isOpen ? 'Chiudi menu' : 'Apri menu');
        if (isOpen) mobileMenu.querySelector('a')?.focus();
    });
    
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    document.addEventListener('pointerdown', event => {
        if (!mobileMenu.classList.contains('active')) return;
        if (mobileMenu.contains(event.target) || mobileMenuBtn.contains(event.target)) return;
        closeMobileMenu({ restoreFocus: true });
    });

    window.matchMedia('(max-width: 768px)').addEventListener?.('change', event => {
        if (!event.matches && mobileMenu.classList.contains('active')) closeMobileMenu();
    });

    document.addEventListener('keydown', event => {
        if (!mobileMenu.classList.contains('active')) return;
        if (event.key === 'Escape') {
            closeMobileMenu({ restoreFocus: true });
            return;
        }
        if (event.key === 'Tab') {
            const links = [...mobileMenu.querySelectorAll('a')];
            const last = links.at(-1);
            if (event.shiftKey && document.activeElement === mobileMenuBtn) {
                event.preventDefault();
                last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                mobileMenuBtn.focus();
            }
        }
    });
}

/* ========================================
   SCROLL ANIMATIONS (Intersection Observer)
======================================== */
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

let observer = null;

if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
} else {
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.classList.add('visible');
    });
}

/* ========================================
   MENU DATA - GENERATED BY tools/refresh_menu.py
======================================== */
const menuData = window.menuData || {};
const menuMeta = window.menuMeta || {};

function getItemAvailability(item, category) {
    const availability = SITE_CONFIG.availability || {};
    const override = availability.itemOverrides?.[String(item.id)] || {};
    const disabled = availability.disabledItemIds?.map(String).includes(String(item.id))
        || availability.disabledCategories?.includes(category)
        || override.available === false;
    return {
        available: !disabled,
        label: override.label || (disabled ? 'Non disponibile oggi' : '')
    };
}

/* ========================================
   PIZZA CUSTOMIZATION DATA
======================================== */
const defaultPizzaExtras = [
    { id: 'bufala', name: 'Mozzarella di Bufala DOP', price: 2.50 },
    { id: 'burrata', name: 'Burrata', price: 3.00 },
    { id: 'prosciutto_crudo', name: 'Prosciutto Crudo di Parma', price: 2.50 },
    { id: 'porcini', name: 'Funghi Porcini', price: 3.00 },
    { id: 'salsiccia', name: 'Salsiccia', price: 1.50 },
    { id: 'crudo_24_mesi', name: 'Crudo di Parma 24 mesi', price: 4.00 },
    { id: 'salame_piccante', name: 'Salame Piccante', price: 1.50 },
    { id: 'gorgonzola', name: 'Gorgonzola', price: 1.50 },
    { id: 'scamorza', name: 'Scamorza Affumicata', price: 1.50 },
    { id: 'olive', name: 'Olive Taggiasche', price: 1.00 },
    { id: 'rucola', name: 'Rucola Fresca', price: 1.00 },
    { id: 'pesto', name: 'Pesto alla Genovese', price: 1.50 },
    { id: 'nduja', name: "'Nduja Piccante", price: 2.00 },
    { id: 'truffle', name: 'Olio al Tartufo', price: 3.00 }
];
const pizzaExtras = SITE_CONFIG.pizzaExtras || defaultPizzaExtras;

let currentPizza = null;
let selectedExtras = [];
let removedIngredients = [];
let pizzaNotes = '';
let pizzaModalReturnFocus = null;

/* ========================================
   MODALE PERSONALIZZAZIONE PIZZA
======================================== */
function createPizzaModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'pizzaModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modalPizzaName');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3 id="modalPizzaName">Personalizza la tua Pizza</h3>
                <button class="modal-close" id="pizzaModalClose" type="button" aria-label="Chiudi personalizzazione pizza">✕</button>
            </div>
            <div class="modal-body">
                <!-- EXTRA -->
                <div class="modal-section">
                    <div class="modal-section-title"><span aria-hidden="true">01</span>Aggiunte extra</div>
                    <div class="extra-list" id="extraList">
                        ${pizzaExtras.map(e => `
                            <label class="extra-item" data-extra="${e.id}">
                                <input type="checkbox" name="extra" value="${e.id}">
                                <div class="extra-info">
                                    <div class="extra-checkbox">✓</div>
                                    <span class="extra-name">${e.name}</span>
                                </div>
                                <span class="extra-price">+€${e.price.toFixed(2)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- RIMOZIONI INGREDIENTI -->
                <div class="modal-section" id="removeSection">
                    <div class="modal-section-title"><span aria-hidden="true">02</span>Rimuovi ingredienti</div>
                    <div class="remove-list" id="removeList"></div>
                </div>

                <!-- NOTE -->
                <div class="modal-section">
                    <div class="modal-section-title"><span aria-hidden="true">03</span>Note speciali</div>
                    <div class="modal-notes">
                        <textarea id="pizzaNotes" placeholder="Es: senza cipolla, ben cotta, impasto sottile..."></textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <div class="modal-total">
                    <span>Totale</span>
                    <span class="modal-total-price" id="modalTotal">€7,00</span>
                </div>
                <button class="btn-add-custom" id="addCustomPizza" type="button">
                    Aggiungi al Carrello
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closePizzaModal();
    });
    modal.querySelector('#pizzaModalClose').addEventListener('click', closePizzaModal);
    modal.querySelector('#addCustomPizza').addEventListener('click', addCustomPizzaToCart);
    modal.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closePizzaModal();
            return;
        }
        if (event.key !== 'Tab') return;

        const focusable = [...modal.querySelectorAll('button, input, textarea, [href], [tabindex]:not([tabindex="-1"])')]
            .filter(element => !element.disabled && element.offsetParent !== null);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
}

function openPizzaModal(pizzaName, pizzaPrice, pizzaIngredients) {
    pizzaModalReturnFocus = document.activeElement;
    currentPizza = { name: pizzaName, price: parseFloat(pizzaPrice), ingredients: pizzaIngredients };
    selectedExtras = [];
    removedIngredients = [];
    pizzaNotes = '';

    document.getElementById('modalPizzaName').textContent = pizzaName;
    document.getElementById('pizzaNotes').value = '';

    document.querySelectorAll('.extra-item').forEach(item => {
        item.classList.remove('selected');
        item.querySelector('input').checked = false;
    });

    const removeList = document.getElementById('removeList');
    const removeSection = document.getElementById('removeSection');
    
    if (pizzaIngredients && pizzaIngredients.length > 0) {
        removeSection.style.display = 'block';
        removeList.innerHTML = pizzaIngredients.map(ing => `
            <label class="remove-chip" data-ingredient="${escapeHtml(ing)}">
                <input type="checkbox" name="remove" value="${escapeHtml(ing)}">
                ✕ ${escapeHtml(ing)}
            </label>
        `).join('');

        removeList.querySelectorAll('.remove-chip').forEach(chip => {
            const checkbox = chip.querySelector('input');
            checkbox.addEventListener('change', () => {
                const selected = checkbox.checked;
                chip.classList.toggle('selected', selected);
                const ing = chip.dataset.ingredient;
                if (selected) {
                    if (!removedIngredients.includes(ing)) {
                        removedIngredients.push(ing);
                    }
                } else {
                    removedIngredients = removedIngredients.filter(i => i !== ing);
                }
            });
        });
    } else {
        removeSection.style.display = 'none';
    }

    document.querySelectorAll('.extra-item').forEach(item => {
        const checkbox = item.querySelector('input');
        checkbox.onchange = function() {
            const selected = checkbox.checked;
            item.classList.toggle('selected', selected);
            const extraId = item.dataset.extra;
            if (selected) {
                if (!selectedExtras.includes(extraId)) {
                    selectedExtras.push(extraId);
                }
            } else {
                selectedExtras = selectedExtras.filter(ex => ex !== extraId);
            }
            updateModalTotal();
        };
    });

    document.getElementById('pizzaNotes').oninput = function() {
        pizzaNotes = this.value;
    };

    updateModalTotal();

    const modal = document.getElementById('pizzaModal');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-close').focus();
}

function closePizzaModal() {
    const modal = document.getElementById('pizzaModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (pizzaModalReturnFocus instanceof HTMLElement) pizzaModalReturnFocus.focus();
    pizzaModalReturnFocus = null;
}

function updateModalTotal() {
    if (!currentPizza) return;

    let total = currentPizza.price;

    selectedExtras.forEach(extraId => {
        const extra = pizzaExtras.find(e => e.id === extraId);
        if (extra) total += extra.price;
    });

    document.getElementById('modalTotal').textContent = formatPrice(total);
}

function addCustomPizzaToCart() {
    if (!currentPizza) return;

    let total = currentPizza.price;

    const extrasNames = [];
    selectedExtras.forEach(extraId => {
        const extra = pizzaExtras.find(e => e.id === extraId);
        if (extra) {
            total += extra.price;
            extrasNames.push(extra.name);
        }
    });

    let customName = currentPizza.name;

    let customDetails = [];
    if (extrasNames.length > 0) customDetails.push(`+ ${extrasNames.join(', ')}`);
    if (removedIngredients.length > 0) customDetails.push(`Senza: ${removedIngredients.join(', ')}`);
    if (pizzaNotes) customDetails.push(`Note: ${pizzaNotes}`);

    cart.addItem(customName, total, customDetails.join(' | ') || null);
    closePizzaModal();
}

/* ========================================
   CART SYSTEM (con localStorage)
======================================== */
class Cart {
    constructor() {
        this.items = this.load();
        this.init();
    }
    
    init() {
        this.render();
        this.updateUI();
        this.bindEvents();
    }
    
    addItem(name, price, customDetails = null) {
        const candidate = normalizeCartItem({ name, price, qty: 1, customDetails });
        if (!candidate) return;

        const existing = this.items.find(i => i.name === candidate.name && i.customDetails === candidate.customDetails);
        if (existing) {
            existing.qty = Math.min(existing.qty + 1, CART_LIMITS.maxQty);
        } else if (this.items.length < CART_LIMITS.maxItems) {
            this.items.push(candidate);
        } else {
            this.showNotification('Il carrello ha raggiunto il limite massimo');
            return;
        }
        this.save();
        this.render();
        this.updateUI();
        const floatingCart = document.getElementById('floatingCart');
        if (floatingCart) {
            floatingCart.classList.remove('cart-bounce');
            void floatingCart.offsetWidth;
            floatingCart.classList.add('cart-bounce');
        }
        this.showNotification(`✓ ${candidate.name} aggiunto`);
        window.PonteSite?.analytics.track('add_to_cart', { item: candidate.name, price: candidate.price });
    }

    load() {
        try {
            const savedCart = localStorage.getItem('cart');
            return savedCart ? normalizeCart(JSON.parse(savedCart)) : [];
        } catch (error) {
            console.warn('Carrello non leggibile, riparto da vuoto.', error);
            return [];
        }
    }

    removeItem(index) {
        this.items.splice(index, 1);
        this.save();
        this.render();
        this.updateUI();
    }
    
    updateQty(index, delta) {
        const item = this.items[index];
        if (item) {
            item.qty = Math.min(item.qty + delta, CART_LIMITS.maxQty);
            if (item.qty <= 0) {
                this.removeItem(index);
                return;
            }
            this.save();
            this.render();
            this.updateUI();
        }
    }
    
    clear() {
        this.items = [];
        this.save();
        this.render();
        this.updateUI();
    }
    
    save() {
        try {
            localStorage.setItem('cart', JSON.stringify(this.items));
        } catch (error) {
            console.warn('Impossibile salvare il carrello.', error);
        }
    }
    
    getTotal() {
        return this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    }
    
    getCount() {
        return this.items.reduce((sum, item) => sum + item.qty, 0);
    }
    
    render() {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;
        
        if (this.items.length === 0) {
            cartItems.innerHTML = `
                <div class="cart-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    <p aria-label="Il carrello è vuoto. Aggiungi qualcosa di buono!">Il carrello è vuoto.<br>Aggiungi qualcosa di buono!</p>
                </div>
            `;
            return;
        }
        
        cartItems.innerHTML = this.items.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${escapeHtml(item.name)}</div>
                    ${item.customDetails ? `<div class="cart-item-custom">${escapeHtml(item.customDetails)}</div>` : ''}
                    <div class="cart-item-price">${formatPrice(item.price)} cad.</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" type="button" data-cart-index="${index}" data-cart-delta="-1" aria-label="Riduci quantità di ${escapeHtml(item.name)}">−</button>
                    <span class="cart-item-qty">${item.qty}</span>
                    <button class="qty-btn" type="button" data-cart-index="${index}" data-cart-delta="1" aria-label="Aumenta quantità di ${escapeHtml(item.name)}">+</button>
                </div>
            </div>
        `).join('');

        cartItems.querySelectorAll('.qty-btn').forEach(button => {
            button.addEventListener('click', () => {
                this.updateQty(Number(button.dataset.cartIndex), Number(button.dataset.cartDelta));
            });
        });
    }
    
    updateUI() {
        const count = this.getCount();
        const total = this.getTotal();
        
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) cartCount.textContent = count;
        
        const floatingCart = document.getElementById('floatingCart');
        if (floatingCart) {
            if (count > 0) {
                floatingCart.classList.add('active');
            } else {
                floatingCart.classList.remove('active');
            }
        }
        
        const subtotalEl = document.getElementById('subtotal');
        const totalEl = document.getElementById('total');
        if (subtotalEl) subtotalEl.textContent = formatPrice(total);
        if (totalEl) totalEl.textContent = formatPrice(total);
        
        const submitBtn = document.getElementById('submitOrder');
        if (submitBtn) {
            submitBtn.disabled = count === 0;
        }
    }
    
    showNotification(message) {
        const notif = document.createElement('div');
        notif.className = 'cart-notification';
        notif.setAttribute('role', 'status');
        notif.setAttribute('aria-live', 'polite');
        notif.textContent = message;
        notif.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 2rem;
            background: var(--dark);
            color: white;
            padding: 0.75rem 1.25rem;
            border-radius: 50px;
            font-size: 0.9rem;
            z-index: 1001;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            animation: slideInRight 0.3s ease;
        `;
        document.body.appendChild(notif);
        setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => notif.remove(), 300);
        }, 2000);
    }
    
    bindEvents() {
        document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.dataset.name;
                const price = btn.dataset.price;
                this.addItem(name, price);
            });
        });
        
        const clearBtn = document.getElementById('clearCart');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (clearBtn.dataset.confirming !== 'true') {
                    clearBtn.dataset.confirming = 'true';
                    clearBtn.textContent = 'Conferma?';
                    window.setTimeout(() => {
                        clearBtn.dataset.confirming = 'false';
                        clearBtn.textContent = 'Svuota';
                    }, 3000);
                    return;
                }
                this.clear();
                clearBtn.dataset.confirming = 'false';
                clearBtn.textContent = 'Svuota';
                this.showNotification('Carrello svuotato');
            });
        }

        const floatingCart = document.getElementById('floatingCart');
        const cartPanel = document.getElementById('cart');
        const drawerMedia = window.matchMedia('(max-width: 768px)');
        const syncDrawerMode = () => {
            if (!cartPanel) return;
            if (drawerMedia.matches) {
                cartPanel.setAttribute(
                    'aria-hidden',
                    document.body.classList.contains('cart-drawer-open') ? 'false' : 'true'
                );
                return;
            }
            document.body.classList.remove('cart-drawer-open');
            cartPanel.removeAttribute('aria-hidden');
        };
        syncDrawerMode();
        drawerMedia.addEventListener?.('change', syncDrawerMode);
        if (floatingCart) {
            floatingCart.addEventListener('click', () => {
                if (document.getElementById('orderForm')) {
                    if (drawerMedia.matches) {
                        document.body.classList.add('cart-drawer-open');
                        cartPanel?.setAttribute('aria-hidden', 'false');
                        document.getElementById('closeCartDrawer')?.focus();
                    } else {
                        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                        cartPanel?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
                        cartPanel?.focus({ preventScroll: true });
                    }
                } else {
                    window.location.href = 'ordina.html';
                }
            });
        }

        const closeDrawer = () => {
            document.body.classList.remove('cart-drawer-open');
            if (drawerMedia.matches) {
                cartPanel?.setAttribute('aria-hidden', 'true');
            }
            floatingCart?.focus();
        };
        document.getElementById('closeCartDrawer')?.addEventListener('click', closeDrawer);
        document.getElementById('cartBackdrop')?.addEventListener('click', closeDrawer);
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && document.body.classList.contains('cart-drawer-open')) closeDrawer();
        });
    }
}

const cart = new Cart();
window.PonteCart = cart;
createPizzaModal();



/* ========================================
   ORDER CATEGORY NAVIGATION
======================================== */
const orderCategoryButtons = document.querySelectorAll('[data-order-target]');
const orderCategorySections = document.querySelectorAll('.order-category-section');

function showOrderCategory(targetId) {
    orderCategorySections.forEach(section => {
        section.hidden = section.id !== targetId;
    });

    orderCategoryButtons.forEach(button => {
        const selected = button.dataset.orderTarget === targetId;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
}

orderCategoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        showOrderCategory(button.dataset.orderTarget);

        const orderMenu = document.querySelector('.order-menu');
        if (orderMenu) {
            const stickyOffset = 145;
            const top = orderMenu.getBoundingClientRect().top + window.scrollY - stickyOffset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

if (orderCategoryButtons.length > 0 && orderCategorySections.length > 0) {
    showOrderCategory(orderCategoryButtons[0].dataset.orderTarget);
}

/* ========================================
   ORDER PAGE - Genera items dalle categorie
======================================== */
function renderOrderItems() {
    const categories = ['pizze', 'antipasti', 'primi', 'secondi', 'contorni', 'dessert', 'bevande', 'birre', 'vini_bianchi', 'vini_rossi'];
    
    categories.forEach(category => {
        const container = document.getElementById(`${category}-list`);
        if (!container || !menuData[category]) return;
        
        const isPizza = category === 'pizze';
        
        container.innerHTML = menuData[category].map(item => {
            const itemState = getItemAvailability(item, category);
            const dishImage = item.image || MENU_IMAGE_FALLBACKS[item.id] || '';
            const dishMonogram = escapeHtml(item.name.trim().charAt(0).toLocaleUpperCase('it') || '•');
            const disabledAttribute = itemState.available ? '' : ' disabled';
            const availabilityHtml = itemState.available
                ? ''
                : `<span class="availability-badge">${escapeHtml(itemState.label)}</span>`;
            const ingredientsArray = item.ingredients ? item.ingredients.split(', ').filter(i => i.trim()) : [];
            const allergensHtml = renderAllergens(item, true);
            const ingredientDetailsHtml = item.ingredients
                ? `<details class="dish-details order-dish-details"><summary>Ingredienti</summary><p class="dish-description">${escapeHtml(item.ingredients)}</p></details>`
                : '<details class="dish-details order-dish-details"><summary>Ingredienti</summary><p class="dish-description dish-description-muted">Da confermare</p></details>';
            const orderPhotoHtml = dishImage
                ? `<button class="dish-photo-trigger order-dish-photo" type="button" data-photo-src="${escapeHtml(dishImage)}" data-photo-name="${escapeHtml(item.name)}" aria-label="Apri la foto di ${escapeHtml(item.name)}" aria-controls="dishPhotoDialog" aria-haspopup="dialog" data-track="dish_photo"><img src="${escapeHtml(dishImage)}" alt="" loading="lazy" decoding="async"><span>Guarda il piatto</span></button>`
                : '';
            
            if (isPizza) {
                const ingredientsJson = escapeHtml(JSON.stringify(ingredientsArray));
                return `
                    <div class="order-item order-item-pizza${dishImage ? ' has-photo' : ' no-photo'}${itemState.available ? '' : ' is-unavailable'}" data-monogram="${dishMonogram}">
                        ${orderPhotoHtml}
                        <div class="order-item-name">${escapeHtml(item.name)}</div>
                        ${availabilityHtml}
                        ${ingredientDetailsHtml}
                        ${allergensHtml}
                        <div class="order-item-bottom">
                            <span class="order-item-price">${formatPrice(item.price)}</span>
                            <button class="btn-add-small btn-customize-order" type="button" data-name="${escapeHtml(item.name)}" data-price="${item.price}" data-ingredients='${ingredientsJson}' aria-label="${itemState.available ? 'Personalizza' : 'Non disponibile'} ${escapeHtml(item.name)}"${disabledAttribute}>Personalizza</button>
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="order-item${dishImage ? ' has-photo' : ' no-photo'}${itemState.available ? '' : ' is-unavailable'}" data-monogram="${dishMonogram}">
                    ${orderPhotoHtml}
                    <div class="order-item-name">${escapeHtml(item.name)}</div>
                    ${availabilityHtml}
                    ${allergensHtml}
                    <div class="order-item-bottom">
                        <span class="order-item-price">${formatPrice(item.price)}</span>
                        <button class="btn-add-small" type="button" data-name="${escapeHtml(item.name)}" data-price="${item.price}" aria-label="${itemState.available ? 'Aggiungi' : 'Non disponibile'} ${escapeHtml(item.name)}"${disabledAttribute}>Aggiungi</button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.querySelectorAll('.btn-add-small').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('btn-customize-order')) {
                    const name = btn.dataset.name;
                    const price = btn.dataset.price;
                    const ingredients = JSON.parse(btn.dataset.ingredients || '[]');
                    openPizzaModal(name, price, ingredients);
                } else {
                    cart.addItem(btn.dataset.name, btn.dataset.price);
                }
            });
        });
    });
}

if (document.getElementById('pizze-list')) {
    renderOrderItems();
}

/* ========================================
   MENU PAGE - Render Items
======================================== */
function renderMenuItems() {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) return;
    
    let html = '';
    
    Object.keys(menuData).forEach(category => {
        menuData[category].forEach(item => {
            const itemState = getItemAvailability(item, category);
            const allergenData = (item.allergens || []).join('|').toLocaleLowerCase('it');
            const allergensHtml = renderAllergens(item);
            
            const descHtml = item.description
                ? `<p class="dish-description">${escapeHtml(item.description)}</p>`
                : (item.ingredients ? `<p class="dish-description">${escapeHtml(item.ingredients)}</p>` : '');

            const detailsHtml = descHtml || allergensHtml
                ? `<div class="menu-item-meta">${descHtml}${allergensHtml}</div>`
                : '';
            
            const dishImage = item.image || MENU_IMAGE_FALLBACKS[item.id] || '';
            const photoButtonHtml = dishImage
                ? `<button class="dish-photo-trigger dish-photo-thumb" type="button" data-photo-src="${escapeHtml(dishImage)}" data-photo-name="${escapeHtml(item.name)}" aria-label="Apri la foto di ${escapeHtml(item.name)}" aria-controls="dishPhotoDialog" aria-haspopup="dialog" data-track="dish_photo"><img src="${escapeHtml(dishImage)}" alt="" loading="lazy" decoding="async"><span>Apri foto</span></button>`
                : '';
            const availabilityHtml = itemState.available
                ? ''
                : `<span class="availability-badge">${escapeHtml(itemState.label)}</span>`;
            

            html += `
                <div class="menu-item animate-on-scroll category-${escapeHtml(category)}${itemState.available ? '' : ' is-unavailable'}" data-category="${escapeHtml(category)}" data-allergens="${escapeHtml(allergenData)}">
                    <div class="menu-item-content${dishImage ? ' has-photo' : ''}">
                        <div class="menu-item-layout">
                            <div class="menu-item-copy">
                                <div class="menu-item-header">
                                    <h3>${escapeHtml(item.name)}</h3>
                                    <span class="price">${formatPrice(item.price)}</span>
                                </div>
                                ${availabilityHtml}
                                ${detailsHtml}
                            </div>
                            ${photoButtonHtml}
                        </div>
                    </div>
                </div>
            `;
        });
    });
    
    menuGrid.innerHTML = html;
    
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        if (observer) {
            observer.observe(el);
        } else {
            el.classList.add('visible');
        }
    });
}

function setupDishPhotoDialog() {
    const photoTriggerRoot = document.getElementById('menu-grid') || document.querySelector('.order-menu');
    const dialog = document.getElementById('dishPhotoDialog');
    const image = document.getElementById('dishPhotoImage');
    const title = document.getElementById('dishPhotoTitle');
    const closeButton = document.getElementById('dishPhotoClose');
    if (!photoTriggerRoot || !dialog || !image || !title || !closeButton) {
        console.warn('Dish photo dialog not fully initialized');
        return;
    }

    let activeTrigger = null;
    const closeDialog = () => dialog.close();

    // Focus trap for dish photo dialog
    dialog.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeDialog();
            return;
        }
        if (event.key !== 'Tab') return;
        const focusable = [...dialog.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')]
            .filter(el => !el.disabled && el.offsetParent !== null);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    // When opened, focus close button
    const originalShowModal = dialog.showModal.bind(dialog);
    dialog.showModal = () => {
        originalShowModal();
        closeButton.focus();
    };

    photoTriggerRoot.addEventListener('click', event => {
        const trigger = event.target.closest('.dish-photo-trigger');
        if (!trigger) return;
        activeTrigger = trigger;
        image.src = trigger.dataset.photoSrc;
        image.alt = trigger.dataset.photoName;
        title.textContent = trigger.dataset.photoName;
        dialog.showModal();
    });

    closeButton.addEventListener('click', closeDialog);
    dialog.addEventListener('click', event => {
        const bounds = dialog.getBoundingClientRect();
        const clickedBackdrop = event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom;
        if (clickedBackdrop) closeDialog();
    });
    dialog.addEventListener('close', () => {
        image.removeAttribute('src');
        activeTrigger?.focus();
        activeTrigger = null;
    });
}

if (document.getElementById('menu-grid')) renderMenuItems();
if (document.getElementById('dishPhotoDialog')) setupDishPhotoDialog();

/* ========================================
   MENU FILTERS
======================================== */
const filterBtns = document.querySelectorAll('.filter-btn');
const menuCategoryCopy = {
    antipasti: 'Per iniziare con il passo giusto.',
    primi: 'Pasta fresca e ricette della tradizione romagnola.',
    pizze: 'Impasto, forno e ingredienti scelti: la pizza come piace a noi.',
    secondi: 'Carne e pesce, cucinati senza fretta.',
    contorni: 'Il complemento giusto per ogni tavola.',
    dessert: 'Una chiusura dolce, fatta in casa.',
    bevande: 'Per accompagnare ogni piatto.',
    birre: 'Una selezione per la pizza e per la tavola.',
    vini_bianchi: 'Bianchi scelti per la cucina e il pesce.',
    vini_rossi: 'Rossi da condividere, calice dopo calice.'
};

function updateMenuCategoryIntro(category) {
    const title = document.getElementById('menuCategoryTitle');
    const copy = document.getElementById('menuCategoryCopy');
    const button = document.querySelector(`.filter-btn[data-category="${category}"]`);

    if (title && button) title.textContent = button.textContent.trim();
    if (copy) copy.textContent = menuCategoryCopy[category] || 'Scopri la nostra selezione.';
}

function applyMenuFilters() {
    const activeCategory = document.querySelector('#menuFilters .filter-btn.active')?.dataset.category || 'all';
    const excludedAllergen = (document.getElementById('menuExcludeAllergen')?.value || '').toLocaleLowerCase('it');
    const items = [...document.querySelectorAll('#menu-grid .menu-item')];
    let visibleCount = 0;

    items.forEach(item => {
        const categoryMatches = activeCategory === 'all' || item.dataset.category === activeCategory;
        const allergenMatches = !excludedAllergen || !item.dataset.allergens.includes(excludedAllergen);
        const visible = categoryMatches && allergenMatches;
        item.hidden = !visible;
        item.style.display = visible ? '' : 'none';
        if (visible) visibleCount += 1;
    });

    const noResults = document.getElementById('menuNoResults');
    if (noResults) noResults.hidden = visibleCount !== 0;
}

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterBtns.forEach(button => button.setAttribute('aria-pressed', String(button === btn)));
        
        const category = btn.dataset.category;

        updateMenuCategoryIntro(category);
        applyMenuFilters();
        window.PonteSite?.analytics.track('menu_category', { category });

        const menuCategoryIntro = document.getElementById('menuCategoryIntro');
        if (menuCategoryIntro) {
            const stickyOffset = 160;
            const top = menuCategoryIntro.getBoundingClientRect().top + window.scrollY - stickyOffset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});



const initialMenuFilter = document.querySelector('#menuFilters .filter-btn.active');
if (initialMenuFilter && document.getElementById('menu-grid')) {
    const initialCategory = initialMenuFilter.dataset.category;
    filterBtns.forEach(button => {
        button.setAttribute('aria-pressed', String(button === initialMenuFilter));
    });
    updateMenuCategoryIntro(initialCategory);
    applyMenuFilters();
}

document.getElementById('menuExcludeAllergen')?.addEventListener('change', applyMenuFilters);

/* ========================================
   NOTIFICATION STYLE
======================================== */
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

/* ========================================
   PWA SERVICE WORKER REGISTRATION
======================================== */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('✓ Service Worker registrato'))
            .catch(err => console.log('✗ SW error:', err));
    });
}
