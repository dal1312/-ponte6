const navbar = document.getElementById('navbar');

if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
}

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
        link.addEventListener('click', () => closeMobileMenu());
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
        if (event.key !== 'Tab') return;
        const links = [...mobileMenu.querySelectorAll('a')];
        const last = links.at(-1);
        if (event.shiftKey && document.activeElement === mobileMenuBtn) {
            event.preventDefault();
            last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            mobileMenuBtn.focus();
        }
    });
}

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

let observer = null;

if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const delay = Number(entry.target.dataset.delay) || 0;
            window.setTimeout(() => entry.target.classList.add('visible'), delay);
            observer.unobserve(entry.target);
        });
    }, observerOptions);
    document.querySelectorAll('.animate-on-scroll').forEach(element => observer.observe(element));
} else {
    document.querySelectorAll('.animate-on-scroll').forEach(element => element.classList.add('visible'));
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch(error => {
            console.warn('Service Worker non disponibile', error);
        });
    });
}
