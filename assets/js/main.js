(function () {
  "use strict";

  /* ——————————————————————————————
     Helpers
  —————————————————————————————— */
  const select = (el, all = false) => {
    el = el.trim();
    return all ? [...document.querySelectorAll(el)] : document.querySelector(el);
  };
  const on = (type, el, listener, all = false) => {
    const els = select(el, all);
    if (!els) return;
    all ? els.forEach(e => e.addEventListener(type, listener)) : els.addEventListener(type, listener);
  };
  const onscroll = (el, listener) => el.addEventListener('scroll', listener);

  /* ——————————————————————————————
     Preloader
  —————————————————————————————— */
  const preloader = select('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.style.opacity = '0';
      setTimeout(() => preloader.remove(), 600);
    });
  }

  /* ——————————————————————————————
     Theme Toggle (Dark/Light)
  —————————————————————————————— */
  const themeToggle = select('#themeToggle');
  const themeIcon = select('#themeIcon');
  const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
    if (themeIcon) {
      themeIcon.className = theme === 'light' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
    }
    localStorage.setItem('portfolio-theme', theme);
  };

  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = localStorage.getItem('portfolio-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  /* ——————————————————————————————
     Mobile Nav
  —————————————————————————————— */
  const mobileToggle = select('.mobile-nav-toggle');

  const closeMobileNav = () => {
    document.body.classList.remove('mobile-nav-active');
    if (mobileToggle) {
      mobileToggle.classList.add('bi-list');
      mobileToggle.classList.remove('bi-x');
    }
    const overlay = select('.mobile-nav-overlay');
    if (overlay) overlay.remove();
  };

  on('click', '.mobile-nav-toggle', function () {
    const isActive = document.body.classList.toggle('mobile-nav-active');
    this.classList.toggle('bi-list', !isActive);
    this.classList.toggle('bi-x', isActive);
    if (isActive) {
      const overlay = document.createElement('div');
      overlay.className = 'mobile-nav-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', closeMobileNav);
    } else {
      const overlay = select('.mobile-nav-overlay');
      if (overlay) overlay.remove();
    }
  });

  /* ——————————————————————————————
     Navbar Active on Scroll
  —————————————————————————————— */
  const navbarlinks = select('#navbar .scrollto', true);
  const navbarlinksActive = () => {
    const position = window.scrollY + 200;
    navbarlinks.forEach(link => {
      if (!link.hash) return;
      const section = select(link.hash);
      if (!section) return;
      link.classList.toggle('active',
        position >= section.offsetTop && position <= section.offsetTop + section.offsetHeight
      );
    });
  };
  window.addEventListener('load', navbarlinksActive);
  onscroll(document, navbarlinksActive);

  /* ——————————————————————————————
     Smooth Scroll
  —————————————————————————————— */
  const scrollto = (el) => {
    const target = select(el);
    if (!target) return;
    const offset = window.innerWidth < 992 ? 0 : 0;
    window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
  };

  on('click', '.scrollto', function (e) {
    if (select(this.hash)) {
      e.preventDefault();
      closeMobileNav();
      scrollto(this.hash);
    }
  }, true);

  window.addEventListener('load', () => {
    if (window.location.hash && select(window.location.hash)) {
      scrollto(window.location.hash);
    }
  });

  /* ——————————————————————————————
     Back to Top
  —————————————————————————————— */
  const backtotop = select('.back-to-top');
  if (backtotop) {
    const toggle = () => backtotop.classList.toggle('active', window.scrollY > 100);
    window.addEventListener('load', toggle);
    onscroll(document, toggle);
  }

  /* ——————————————————————————————
     Typed.js
  —————————————————————————————— */
  const typed = select('.typed');
  if (typed) {
    const strings = typed.getAttribute('data-typed-items').split(',');
    new Typed('.typed', {
      strings,
      loop: true,
      typeSpeed: 80,
      backSpeed: 40,
      backDelay: 2200,
      startDelay: 400,
    });
  }

  /* ——————————————————————————————
     Skill Bars Animation
  —————————————————————————————— */
  const animateSkillBars = () => {
    const bars = select('.skill-bar-fill', true);
    bars.forEach(bar => {
      const width = bar.getAttribute('data-width');
      if (width && bar.style.width === '') {
        setTimeout(() => { bar.style.width = width + '%'; }, 200);
      }
    });
  };

  const resumeSection = select('#resume');
  if (resumeSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateSkillBars();
          observer.disconnect();
        }
      });
    }, { threshold: 0.2 });
    observer.observe(resumeSection);
  }

  /* ——————————————————————————————
     Portfolio: Isotope + Filter + Search
  —————————————————————————————— */
  window.addEventListener('load', () => {
    const portfolioContainer = select('.portfolio-container');
    if (!portfolioContainer) return;

    const iso = new Isotope(portfolioContainer, {
      itemSelector: '.portfolio-item',
      layoutMode: 'fitRows',
      transitionDuration: '0.4s',
    });

    // Filter buttons
    const filterBtns = select('#portfolio-flters li', true);
    on('click', '#portfolio-flters li', function (e) {
      e.preventDefault();
      filterBtns.forEach(el => el.classList.remove('filter-active'));
      this.classList.add('filter-active');
      iso.arrange({ filter: this.getAttribute('data-filter') });
      iso.on('arrangeComplete', () => AOS.refresh());
    }, true);

    // Search
    const searchInput = select('#portfolioSearch');
    const noResults = select('#portfolioNoResults');
    const noResultsTerm = select('#noResultsTerm');

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        const term = this.value.toLowerCase().trim();
        const items = select('.portfolio-item', true);
        let visible = 0;
        items.forEach(item => {
          const title = (item.getAttribute('data-title') || '').toLowerCase();
          const match = !term || title.includes(term);
          item.style.display = match ? '' : 'none';
          if (match) visible++;
        });
        iso.layout();
        if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
        if (noResultsTerm) noResultsTerm.textContent = term;
      });
    }
  });

  /* ——————————————————————————————
     GLightbox (Portfolio Details)
  —————————————————————————————— */
  GLightbox({ selector: '.portfolio-lightbox' });
  GLightbox({ selector: '.portfolio-details-lightbox', width: '90%', height: '90vh' });

  /* ——————————————————————————————
     Swiper (Portfolio Details)
  —————————————————————————————— */
  new Swiper('.portfolio-details-slider', {
    speed: 400,
    loop: true,
    autoplay: { delay: 5000, disableOnInteraction: false },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    pagination: { el: '.swiper-pagination', type: 'bullets', clickable: true },
  });

  /* ——————————————————————————————
     AOS
  —————————————————————————————— */
  window.addEventListener('load', () => {
    AOS.init({ duration: 900, easing: 'ease-out-cubic', once: true, mirror: false, offset: 60 });
  });

  /* ——————————————————————————————
     PureCounter
  —————————————————————————————— */
  new PureCounter();

  /* ——————————————————————————————
     Contact Form (Formspree)
  —————————————————————————————— */
  const form = select('#contactForm');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn = select('#contactSubmit');
      const status = select('#formStatus');
      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Enviando...';

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' },
        });
        if (res.ok) {
          status.className = 'form-status success';
          status.textContent = '✓ Mensagem enviada com sucesso! Responderei em breve.';
          form.reset();
        } else {
          throw new Error();
        }
      } catch {
        status.className = 'form-status error';
        status.textContent = '✗ Ops! Algo deu errado. Tente me contatar diretamente pelo e-mail.';
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-send-fill"></i> Enviar Mensagem';
        setTimeout(() => { status.className = 'form-status'; }, 6000);
      }
    });
  }

})();
