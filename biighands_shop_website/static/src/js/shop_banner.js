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
       FILTER SIDEBAR
       #tp_products_grid_before = header slot (empty by default)
       aside.o_wsale_col_filters = real filter content
       We inject FILTERS header just BEFORE the aside so they
       visually look like one card (header on top, content below).
    ══════════════════════════════════════════════ */
    function setupFilter() {
        var filterAside = document.querySelector('aside.o_wsale_col_filters');
        if (!filterAside) return;

        /* 1. Inject FILTERS dark header directly before the aside (once only) */
        if (!document.querySelector('.bh-filter-head')) {
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
                'gap:8px',
                'border-radius:14px 14px 0 0',
                'border:1.5px solid #0D2B2B',
                'border-bottom:none'
            ].join(';');
            head.innerHTML =
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"' +
                ' stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
                '<line x1="4" y1="6" x2="20" y2="6"/>' +
                '<line x1="8" y1="12" x2="16" y2="12"/>' +
                '<line x1="11" y1="18" x2="13" y2="18"/>' +
                '</svg> Filters';
            filterAside.parentNode.insertBefore(head, filterAside);
        }

        /* 2. Force all .collapse open + kill every possible toggle */
        filterAside.querySelectorAll('.collapse').forEach(function(el){
            el.classList.add('show');
            el.style.cssText += ';display:block!important;height:auto!important;visibility:visible!important;';
        });

        /* Kill data-bs-toggle buttons */
        filterAside.querySelectorAll('[data-bs-toggle],[data-toggle]').forEach(function(btn){
            btn.removeAttribute('data-bs-toggle');
            btn.removeAttribute('data-toggle');
            btn.removeAttribute('data-bs-target');
            btn.removeAttribute('href');
            btn.style.display = 'none';
        });

        /* Hide ANY element that is ONLY the — or + character (the collapse icon) */
        filterAside.querySelectorAll('*').forEach(function(el){
            if (el.children.length > 0) return;
            var t = (el.textContent || '').trim();
            if (t === '—' || t === '–' || t === '+' || t === '-' || t === '×') {
                el.style.display = 'none';
            }
            /* Also hide by class name keywords */
            var cls = (el.className || '').toString().toLowerCase();
            if (
                cls.indexOf('collapse-icon') !== -1 ||
                cls.indexOf('toggle-icon')   !== -1 ||
                cls.indexOf('tp-toggle')     !== -1 ||
                cls.indexOf('fa-minus')      !== -1 ||
                cls.indexOf('fa-plus')       !== -1
            ) {
                el.style.display = 'none';
            }
        });

        /* 3. Teal slider */
        filterAside.querySelectorAll('input[type="range"]').forEach(function(r){
            r.style.accentColor = '#13C2C5';
        });

        /* 4. FILTER/APPLY button → full-width teal, text = APPLY
              Target by CLASS (.a-submit) first, then fall back to text match */
        var applyBtns = filterAside.querySelectorAll(
            '.a-submit, button[type="submit"], input[type="submit"]'
        );
        /* fallback: also check text if class-based selector found nothing */
        if (!applyBtns.length) {
            applyBtns = Array.prototype.filter.call(
                filterAside.querySelectorAll('button, a, .btn'),
                function(b){ return (b.textContent||'').trim().toUpperCase() === 'FILTER'; }
            );
        }
        applyBtns.forEach(function(btn){
            /* rename */
            if (btn.tagName === 'INPUT') { btn.value = 'APPLY'; }
            else { btn.textContent = 'APPLY'; }

            /* full-width style — inline so it beats everything */
            btn.style.cssText = [
                'display:block',
                'width:100%',
                'max-width:100%',
                'background:#13C2C5',
                'border:none',
                'color:#fff',
                'font-weight:800',
                'border-radius:8px',
                'padding:13px 0',
                'font-size:14px',
                'cursor:pointer',
                'text-align:center',
                'text-decoration:none',
                'letter-spacing:.5px',
                'box-sizing:border-box',
                'margin-top:12px',
                'transition:background .18s'
            ].join(';');

            /* fix parent so it doesn't right-align or squeeze the button */
            var par = btn.parentElement;
            if (par) {
                par.style.display    = 'block';
                par.style.width      = '100%';
                par.style.textAlign  = 'unset';
                par.style.justifyContent = 'unset';
            }

            btn.addEventListener('mouseenter', function(){ btn.style.background = '#037C7C'; });
            btn.addEventListener('mouseleave', function(){ btn.style.background = '#13C2C5'; });
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
