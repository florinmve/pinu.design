/* =========================================================
   PINU DESIGN — Front-end interactions
   ========================================================= */

(function () {
    'use strict';

    /* ---------- Nav: scroll + mobile toggle ---------- */
    const nav = document.querySelector('.nav');
    const toggle = document.querySelector('.nav__toggle');

    if (nav) {
        let lastY = window.scrollY;
        let ticking = false;
        const update = () => {
            const y = Math.max(0, window.scrollY);
            nav.classList.toggle('is-scrolled', y > 30);
            // Hide on scroll down (past the hero), reveal on scroll up.
            // Skip while the dropdown menu is open. Small deltas are ignored
            // so the bar doesn't flicker on trackpad/touch micro-scrolls.
            if (!nav.classList.contains('is-open')) {
                if (y > lastY + 6 && y > 160) nav.classList.add('nav--hidden');
                else if (y < lastY - 6) nav.classList.remove('nav--hidden');
            }
            lastY = y;
            ticking = false;
        };
        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(update);
                ticking = true;
            }
        };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (toggle && nav) {
        const setOpen = (open) => {
            nav.classList.toggle('is-open', open);
            // Opening the menu must always reveal the bar, even mid scroll-down.
            if (open) nav.classList.remove('nav--hidden');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        };
        toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
        // close on link click
        document.querySelectorAll('.nav__links a').forEach((a) => {
            a.addEventListener('click', () => setOpen(false));
        });
        // close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false);
        });
    }

    /* ---------- Reveal on scroll ---------- */
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
        revealEls.forEach((el) => io.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('is-visible'));
    }

    /* ---------- Lottie loader ---------- */
    // Each [data-lottie] element loads an animation from data-src.
    // Lazy: only initialised when scrolled into view.
    function loadLottieFor(el) {
        if (!window.lottie) return;
        const src = el.getAttribute('data-src');
        const loop = el.getAttribute('data-loop') !== 'false';
        const autoplay = el.getAttribute('data-autoplay') !== 'false';
        const renderer = el.getAttribute('data-renderer') || 'svg';
        if (!src || el.dataset.loaded === 'true') return;
        el.dataset.loaded = 'true';
        window.lottie.loadAnimation({
            container: el,
            renderer: renderer,
            loop: loop,
            autoplay: autoplay,
            path: src,
        });
    }

    function initLotties() {
        const lottieEls = document.querySelectorAll('[data-lottie]');
        if (!lottieEls.length) return;
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        loadLottieFor(entry.target);
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            lottieEls.forEach((el) => io.observe(el));
        } else {
            lottieEls.forEach(loadLottieFor);
        }
    }

    // wait until lottie-web is ready (script tag is async/defer-friendly)
    if (window.lottie) {
        initLotties();
    } else {
        const wait = setInterval(() => {
            if (window.lottie) {
                clearInterval(wait);
                initLotties();
            }
        }, 80);
        setTimeout(() => clearInterval(wait), 6000);
    }

    /* ---------- FAQ accordions ---------- */
    document.querySelectorAll('.faq-item__q').forEach((q) => {
        q.addEventListener('click', () => {
            const item = q.closest('.faq-item');
            const wasOpen = item.classList.contains('is-open');
            // close siblings
            item.parentElement.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('is-open'));
            if (!wasOpen) item.classList.add('is-open');
        });
    });

    /* ---------- Portfolio filter ---------- */
    const filterButtons = document.querySelectorAll('.portfolio-filter button');
    const portfolioCards = document.querySelectorAll('[data-cat]');
    if (filterButtons.length && portfolioCards.length) {
        filterButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                filterButtons.forEach((b) => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                const target = btn.dataset.filter;
                portfolioCards.forEach((card) => {
                    const cat = card.dataset.cat;
                    const show = target === 'all' || cat.split(' ').includes(target);
                    card.style.display = show ? '' : 'none';
                });
            });
        });
    }

    /* ---------- Contact form (Web3Forms) ---------- */
    const form = document.getElementById('contact-form');
    if (form) {
        const success = form.querySelector('.form-success');
        const submitBtn = form.querySelector('button[type="submit"]');
        const okText = 'Mulțumim! Mesajul a fost trimis. Revenim cât de curând.';
        const errText = 'Hopa, ceva n-a mers. Scrie-ne direct la contact@pinudesign.ro.';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!form.checkValidity()) { form.reportValidity(); return; }

            const label = submitBtn ? submitBtn.textContent : '';
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Se trimite…'; }

            try {
                const res = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { Accept: 'application/json' },
                    body: new FormData(form),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.message || 'submit failed');

                form.reset();
                if (success) {
                    success.textContent = okText;
                    success.classList.remove('is-error');
                    success.classList.add('is-visible');
                }
            } catch (err) {
                if (success) {
                    success.textContent = errText;
                    success.classList.add('is-visible', 'is-error');
                }
            } finally {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = label; }
            }
        });
    }

    /* ---------- Highlight active nav link ---------- */
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.nav__links a').forEach((a) => {
        const href = (a.getAttribute('href') || '').toLowerCase();
        if (href === path || (path === '' && href === 'index.html')) {
            a.classList.add('active');
        }
    });

    /* ---------- Clients marquee duplication for seamless loop ---------- */
    const marquees = document.querySelectorAll('.clients__track, .clients__marquee');
    marquees.forEach((m) => {
        if (m.dataset.duplicated) return;
        m.innerHTML += m.innerHTML;
        m.dataset.duplicated = 'true';
    });
})();
