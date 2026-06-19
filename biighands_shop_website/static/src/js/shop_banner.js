/** BH Shop — hero, USP strip, sidebar professional styling */
(function () {
    'use strict';

    /* ── active pill from URL ── */
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

    /* ── Apply styles directly to sidebar elements ── */
    function applyStyle(el, styles) {
        if (!el) return;
        Object.keys(styles).forEach(function(k) { el.style[k] = styles[k]; });
    }

    function enhanceSidebar() {
        /* 1. Wrap the sidebar in a clean card container */
        var sidebar = document.querySelector(
            'aside.o_wsale_col_filters, ' +
            '#tp_products_grid_before, ' +
            '.tp-shop-layout-filters'
        );
        if (sidebar && !sidebar.querySelector('.bh-filter-head')) {
            /* Add "FILTERS" header at top */
            var head = document.createElement('div');
            head.className = 'bh-filter-head';
            applyStyle(head, {
                background: 'linear-gradient(135deg,#0D2B2B,#095858)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '12px 12px 0 0'
            });
            head.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg> Filters';
            sidebar.insertBefore(head, sidebar.firstChild);
        }

        /* 2. Style each filter section header (PRICE, BRAND, etc.) */
        var filterTitles = document.querySelectorAll(
            '.filter-attribute .card-header, ' +
            '.tp-filter-attribute-title, ' +
            '.js_sale aside h6, ' +
            '.js_sale aside .fw-bold'
        );
        filterTitles.forEach(function(el) {
            applyStyle(el, {
                background: '#F8FAFC',
                color: '#0D2B2B',
                fontWeight: '800',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                padding: '12px 18px',
                borderLeft: '3px solid #13C2C5',
                borderBottom: '1px solid #E2E8F0',
                borderTop: 'none',
                borderRight: 'none',
                borderRadius: '0',
                boxShadow: 'none'
            });
        });

        /* 3. Fix RESET button — find by text content or href="/shop" */
        var allBtns = document.querySelectorAll(
            '.js_sale .btn, ' +
            '#tp_products_grid_before .btn, ' +
            'aside .btn'
        );
        allBtns.forEach(function(btn) {
            var txt = btn.textContent.trim().toUpperCase();
            var href = btn.getAttribute('href') || '';
            if (txt === 'RESET' || href === '/shop' || txt.indexOf('RESET') !== -1) {
                applyStyle(btn, {
                    background: '#fff',
                    border: '2px solid #E2E8F0',
                    color: '#475569',
                    fontWeight: '700',
                    borderRadius: '8px',
                    padding: '9px 0',
                    margin: '14px 16px 8px',
                    width: 'calc(100% - 32px)',
                    display: 'block',
                    textAlign: 'center',
                    fontSize: '13px',
                    letterSpacing: '.5px',
                    transition: 'all .18s',
                    boxShadow: 'none'
                });
                btn.addEventListener('mouseenter', function() {
                    btn.style.background = '#13C2C5';
                    btn.style.borderColor = '#13C2C5';
                    btn.style.color = '#fff';
                });
                btn.addEventListener('mouseleave', function() {
                    btn.style.background = '#fff';
                    btn.style.borderColor = '#E2E8F0';
                    btn.style.color = '#475569';
                });
            }
        });

        /* 4. Fix card-body padding in filters */
        var filterBodies = document.querySelectorAll(
            '.filter-attribute .card-body, ' +
            '.tp-filter-attribute-collapse-area'
        );
        filterBodies.forEach(function(el) {
            applyStyle(el, {
                padding: '14px 18px',
                background: '#fff',
                borderBottom: '1px solid #F0F2F5'
            });
        });
    }

    /* ── Main inject ── */
    function inject() {
        var shopPage = document.querySelector('.js_sale.tp-shop-page, .js_sale');
        if (!shopPage || shopPage.querySelector('.bh-shop-hero')) return;

        shopPage.insertBefore(buildUsp(), shopPage.firstChild);
        shopPage.insertBefore(buildHero(), shopPage.firstChild);

        /* Run sidebar enhancement after theme_prime has rendered */
        setTimeout(enhanceSidebar, 400);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
}());
