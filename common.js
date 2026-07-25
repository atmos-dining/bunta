/**
 * common.js — 大衆焼肉ぶんた 共通スクリプト
 * ヘッダー・フッターのfetch挿入、ドロワー、ページトップ、スクロール表示
 */

(function () {
  'use strict';

  /* -------------------------------------------------------
   * 現在ページ判定（data-page属性を<body>に付ける）
   * 例: <body data-page="menu">
   * home / course / menu / drink / blog
   * ------------------------------------------------------- */
  const currentPage = document.body.dataset.page || 'home';

  /* -------------------------------------------------------
   * ルートへの相対パスを自動計算
   * blog/index.html     → ../
   * blog/posts/post.html → ../../
   * index.html          → ./
   * ------------------------------------------------------- */
  function getRootPath() {
    const scripts = document.querySelectorAll('script[src]');
    for (const s of scripts) {
      const src = s.getAttribute('src');
      if (src && src.includes('common.js')) {
        const ups = (src.match(/\.\.\//g) || []).length;
        return '../'.repeat(ups);
      }
    }
    return './';
  }

  const ROOT = getRootPath();

  /* -------------------------------------------------------
   * ヘッダー読み込み
   * ------------------------------------------------------- */
  function loadHeader() {
    const mount = document.getElementById('shared-header');
    if (!mount) return;

    fetch(ROOT + 'partials/header.html')
      .then(r => r.text())
      .then(html => {
        html = html.replace(/href="\.\//g, `href="${ROOT}`);
        html = html.replace(/src="\.\//g, `src="${ROOT}`);
        mount.outerHTML = html;
        initNav();
        initDrawer();
        initStickyHeader();
      })
      .catch(() => {});
  }

  /* -------------------------------------------------------
   * ナビ：現在ページにaria-currentを付与
   * ------------------------------------------------------- */
  function initNav() {
    document.querySelectorAll('[data-nav]').forEach(a => {
      if (a.dataset.nav === currentPage) {
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* -------------------------------------------------------
   * ドロワー（スマホメニュー）
   * ------------------------------------------------------- */
  function initDrawer() {
    const btn     = document.querySelector('.nav-toggle');
    const drawer  = document.getElementById('drawerMenu');
    const overlay = document.getElementById('drawerOverlay');
    if (!btn || !drawer || !overlay) return;

    function openDrawer() {
      drawer.classList.add('is-open');
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      btn.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      overlay.setAttribute('aria-hidden', 'false');
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      btn.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('aria-hidden', 'true');
    }

    btn.addEventListener('click', () =>
      drawer.classList.contains('is-open') ? closeDrawer() : openDrawer()
    );

    document.querySelectorAll('[data-close="drawer"]').forEach(el =>
      el.addEventListener('click', closeDrawer)
    );

    drawer.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', closeDrawer)
    );

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  /* -------------------------------------------------------
   * フッター読み込み
   * ------------------------------------------------------- */
  function loadBottom() {
    const mount = document.getElementById('shared-bottom');
    if (!mount) return;

    fetch(ROOT + 'partials/bottom.html')
      .then(r => r.text())
      .then(html => {
        mount.innerHTML = html;
        mount.querySelectorAll('.section').forEach(sec => sec.classList.add('is-inview'));

        if (currentPage === 'home') {
          mount.querySelectorAll('.js-hide-on-home').forEach(el => el.style.display = 'none');
        }

        const hash = location.hash;
        if (hash) {
          setTimeout(() => {
            const target = document.querySelector(hash);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }, 400);
        }
      })
      .catch(() => {});
  }

  /* -------------------------------------------------------
   * ページトップボタン
   * ------------------------------------------------------- */
  function initPageTop() {
    const pageTop = document.querySelector('.page-top');
    if (!pageTop) return;

    function toggle() {
      const y = window.scrollY || document.documentElement.scrollTop;
      pageTop.classList.toggle('is-show', y > 480);
    }

    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  }

  /* -------------------------------------------------------
   * セクション スクロール表示
   * ------------------------------------------------------- */
  function initScrollReveal() {
    const sections = document.querySelectorAll('.section');
    if (!sections.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
          io.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -10% 0px'
    });

    sections.forEach(sec => io.observe(sec));
  }

  /* -------------------------------------------------------
   * スティッキーヘッダー（スクロールでコンパクトに）
   * ------------------------------------------------------- */
  function initStickyHeader() {
    const header     = document.querySelector('.site-header');
    if (!header) return;
    const inner      = header.querySelector('.header-inner');
    const logoLink   = header.querySelector('.site-logo');
    const logoImg    = header.querySelector('.site-logo-img');
    const hRight     = header.querySelector('.header-right');
    const reserveBtn = header.querySelector('.header-reserve');
    if (!inner || !logoImg) return;

    logoLink.style.display    = 'flex';
    logoLink.style.alignItems = 'center';

    const RANGE = 200;

    // ボタンはCSS（display:none on mobile）に任せ、flex配置だけ設定
    if (reserveBtn) {
      reserveBtn.style.alignItems     = 'center';
      reserveBtn.style.justifyContent = 'center';
      reserveBtn.style.paddingTop     = '0';
      reserveBtn.style.paddingBottom  = '0';
      reserveBtn.style.boxSizing      = 'border-box';
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    function onScroll() {
      const isMobile = window.innerWidth <= 900;
      const t = Math.min(Math.max(window.scrollY / RANGE, 0), 1);
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      if (isMobile) {
        // スマホ：固定サイズ（スクロールで変化しない）
        inner.style.paddingTop    = '';
        inner.style.paddingBottom = '';
        inner.style.paddingLeft   = '';
        inner.style.paddingRight  = '';
        logoImg.style.height      = '40px'; // CSS default(80px)より小さく固定
        if (reserveBtn) {
          reserveBtn.style.height       = ''; // desktopブランチの残滓をリセット
          reserveBtn.style.borderRadius = '';
        }
      } else {
        inner.style.paddingTop    = lerp(16, 0,  e) + 'px';
        inner.style.paddingBottom = lerp(16, 0,  e) + 'px';
        inner.style.paddingLeft   = lerp(32, 24, e) + 'px';
        inner.style.paddingRight  = lerp(32, 0,  e) + 'px';
        logoImg.style.height      = lerp(80, 56, e) + 'px';
        if (reserveBtn) {
          reserveBtn.style.display      = 'flex';
          reserveBtn.style.height       = lerp(46, 56, e) + 'px';
          reserveBtn.style.borderRadius = lerp(4,  0,  e) + 'px';
        }
      }

      if (hRight) hRight.style.gap = isMobile ? '' : lerp(16, 0, e) + 'px';
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  /* -------------------------------------------------------
   * GA4 イベントトラッキング
   * ------------------------------------------------------- */
  function initGA4Tracking() {
    document.addEventListener('click', function(e) {
      if (typeof gtag !== 'function') return;
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';

      if (href.startsWith('tel:')) {
        gtag('event', 'click_tel', {
          event_category: 'contact',
          event_label: href.replace('tel:', ''),
          page_location: location.href
        });
      }

      if (href.includes('toreta') || href.includes('autoreserve') || href.includes('hotpepper')) {
        gtag('event', 'click_reserve', {
          event_category: 'conversion',
          event_label: a.textContent.trim().slice(0, 50),
          page_location: location.href
        });
      }
    });
  }

  /* -------------------------------------------------------
   * 初期化
   * ------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadBottom();
    initPageTop();
    initScrollReveal();
    initGA4Tracking();
  });

})();
