/** BH Shop — hero, USP strip, sidebar styling */
(function () {
    'use strict';

    /* ── active pill helper ── */
    function activePill() {
        var s = window.location.search;
        if (s.indexOf('list_price') !== -1)      return 'price';
        if (s.indexOf('create_date') !== -1)      return 'new';
        if (s.indexOf('website_sequence') !== -1) return 'featured';
        return 'all';
    }
    function pc(k) { return 'bh-pill' + (activePill() === k ? ' bh-pill-active' : ''); }

    /* ── Hero banner ── */
    function buildHero() {
        var d = document.createElement('div');
        d.className = 'bh-shop-hero';
        d.innerHTML =
            '<div class="bh-shop-hero-inner">' +
              '<div>' +
                '<span class="bh-shop-hero-tag">Professional Supplies</span>' +
                '<h1>Shop All Products</h1>' +
                '<p>Trade-quality tools &amp; hardware at unbeatable prices</p>' +
              '</div>' +
              '<div class="bh-shop-pills">' +
                '<a href="/shop" class="' + pc('all') + '">All Products</a>' +
                '<a href="/shop?order=list_price+asc" class="' + pc('price') + '">Best Price</a>' +
                '<a href="/shop?order=create_date+desc" class="' + pc('new') + '">New In</a>' +
                '<a href="/shop?order=website_sequence+asc" class="' + pc('featured') + '">Featured</a>' +
              '</div>' +
            '</div>';
        return d;
    }

    /* ── USP strip ── */
    function buildUsp() {
        var d = document.createElement('div');
        d.className = 'bh-shop-usp';
        d.innerHTML =
            '<div class="bh-shop-usp-inner">' +
              '<div class="bh-shop-usp-item"><span>&#128666;</span>Free delivery over $50</div>' +
              '<div class="bh-shop-usp-item"><span>&#9889;</span>Same-day dispatch</div>' +
              '<div class="bh-shop-usp-item"><span>&#128230;</span>Click &amp; Collect</div>' +
              '<div class="bh-shop-usp-item"><span>&#128260;</span>30-day returns</div>' +
            '</div>';
        return d;
    }

    /* ══════════════════════════════════════════════
       FILTER SIDEBAR — targets #tp_products_grid_before
    ══════════════════════════════════════════════ */
    function setupFilter() {
        var sidebar = document.getElementById('tp_products_grid_before');
        if (!sidebar) {
            /* fallback selectors */
            sidebar = document.querySelector(
                'aside.o_wsale_col_filters, .tp-shop-layout-filters, .js_sale aside'
            );
        }
        if (!sidebar) return;

        /* 1. Wrap sidebar in a clean card (NO teal left border on wrapper) */
        sidebar.style.cssText = [
            'background:#fff',
            'border:1.5px solid #E2E8F0',   /* plain grey border on all 4 sides */
            'border-radius:14px',
            'overflow:hidden',
            'box-shadow:0 4px 18px rgba(0,0,0,.07)',
            'align-self:flex-start',
            'padding:0',
            'margin-bottom:24px'
        ].join(';');

        /* 1b. Force all collapsed sections open + remove toggle behaviour */
        sidebar.querySelectorAll('.collapse').forEach(function(el){
            el.classList.add('show');
            el.style.display = 'block';
            el.style.height   = 'auto';
        });
        sidebar.querySelectorAll('[data-bs-toggle="collapse"],[data-toggle="collapse"]').forEach(function(btn){
            btn.removeAttribute('data-bs-toggle');
            btn.removeAttribute('data-toggle');
            btn.removeAttribute('data-bs-target');
            btn.removeAttribute('href');           /* prevent link-collapse too */
            btn.style.pointerEvents = 'none';      /* disable click */
            btn.style.cursor = 'default';
            /* hide the — / + icon */
            btn.querySelectorAll('.fa-minus,.fa-plus,[class*="collapse-icon"]').forEach(function(ic){
                ic.style.display = 'none';
            });
        });

        /* 2. Inject FILTERS header (once only) */
        if (!sidebar.querySelector('.bh-filter-head')) {
            var head = document.createElement('div');
            head.className = 'bh-filter-head';
            head.style.cssText = [
                'background:linear-gradient(135deg,#0D2B2B,#095858)',
                'color:#fff',
                'font-size:12px',
                'font-weight:800',
                'text-transform:uppercase',
                'letter-spacing:1.5px',
                'padding:14px 18px',
                'display:flex',
                'align-items:center',
                'gap:8px'
            ].join(';');
            head.innerHTML =
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"' +
                ' stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
                '<line x1="4" y1="6" x2="20" y2="6"/>' +
                '<line x1="8" y1="12" x2="16" y2="12"/>' +
                '<line x1="11" y1="18" x2="13" y2="18"/>' +
                '</svg> Filters';
            sidebar.insertBefore(head, sidebar.firstChild);
        }

        /* 3 & 4. CSS handles filter title + body styling.
           Only remove the collapse toggle here. */

        /* 5. Price range inputs → clean bordered style */
        sidebar.querySelectorAll('input[type="number"],input[type="text"]').forEach(function(inp){
            inp.style.cssText = [
                'border:1.5px solid #E2E8F0',
                'border-radius:8px',
                'padding:6px 10px',
                'font-size:13px',
                'font-weight:600',
                'color:#0D2B2B',
                'background:#F8FAFC',
                'outline:none',
                'width:100%',
                'box-sizing:border-box'
            ].join(';');
            inp.addEventListener('focus', function(){
                inp.style.borderColor = '#13C2C5';
                inp.style.boxShadow = '0 0 0 3px rgba(19,194,197,.15)';
            });
            inp.addEventListener('blur', function(){
                inp.style.borderColor = '#E2E8F0';
                inp.style.boxShadow = 'none';
            });
        });

        /* 6. Teal slider */
        sidebar.querySelectorAll('input[type="range"]').forEach(function(r){
            r.style.accentColor = '#13C2C5';
        });

        /* 7. FILTER / APPLY button → teal pill */
        sidebar.querySelectorAll('button,a,.btn,input[type="submit"]').forEach(function(btn){
            if (btn.closest('.bh-filter-head')) return;
            var txt = (btn.textContent || btn.value || '').trim().toUpperCase();
            if (txt === 'FILTER' || txt === 'APPLY' || txt === 'SEARCH' || txt === 'GO') {
                btn.style.cssText = [
                    'background:#13C2C5',
                    'border:none',
                    'color:#fff',
                    'font-weight:800',
                    'border-radius:100px',
                    'padding:8px 22px',
                    'font-size:12px',
                    'cursor:pointer',
                    'display:inline-block',
                    'text-decoration:none',
                    'letter-spacing:.4px'
                ].join(';');
            }
        });

        /* 8. RESET / CLEAR button → white outlined */
        sidebar.querySelectorAll('a,button').forEach(function(btn){
            if (btn.closest('.bh-filter-head')) return;
            var txt = (btn.textContent || '').trim().toUpperCase();
            var href = (btn.getAttribute('href') || '');
            var isReset = txt === 'RESET' || txt === 'CLEAR' || txt === 'CLEAR ALL'
                        || href === '/shop' || href === '/shop?';
            if (isReset) {
                btn.style.cssText = [
                    'display:block',
                    'background:#fff',
                    'border:2px solid #CBD5E1',
                    'color:#475569',
                    'font-weight:700',
                    'font-size:13px',
                    'border-radius:8px',
                    'padding:9px 0',
                    'margin:14px 16px 16px',
                    'width:calc(100% - 32px)',
                    'text-align:center',
                    'text-decoration:none',
                    'cursor:pointer',
                    'letter-spacing:.5px',
                    'box-sizing:border-box',
                    'transition:all .18s'
                ].join(';');
                btn.addEventListener('mouseenter', function(){
                    btn.style.background = '#13C2C5';
                    btn.style.borderColor = '#13C2C5';
                    btn.style.color = '#fff';
                });
                btn.addEventListener('mouseleave', function(){
                    btn.style.background = '#fff';
                    btn.style.borderColor = '#CBD5E1';
                    btn.style.color = '#475569';
                });
            }
        });
    }

    /* ── Main entry ── */
    function init() {
        var shopPage = document.querySelector('.js_sale.tp-shop-page, .js_sale');
        if (!shopPage) return;

        /* Hero + USP (inject once) */
        if (!shopPage.querySelector('.bh-shop-hero')) {
            shopPage.insertBefore(buildUsp(), shopPage.firstChild);
            shopPage.insertBefore(buildHero(), shopPage.firstChild);
        }

        /* Filter sidebar — 500 ms so theme JS renders first */
        setTimeout(setupFilter, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
