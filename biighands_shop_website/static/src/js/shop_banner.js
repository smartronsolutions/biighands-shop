/** BH Shop — hero, USP strip, sidebar professional styling */
(function () {
    'use strict';

    function activePill() {
        var s = window.location.search;
        if (s.indexOf('list_price') !== -1)      return 'price';
        if (s.indexOf('create_date') !== -1)      return 'new';
        if (s.indexOf('website_sequence') !== -1) return 'featured';
        return 'all';
    }
    function pc(k) { return 'bh-pill' + (activePill() === k ? ' bh-pill-active' : ''); }

    /* ── Hero ── */
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

    /* ── USP ── */
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

    /* ── direct element styling ── */
    function css(el, s) {
        if (!el) return;
        Object.keys(s).forEach(function(k) { el.style[k] = s[k]; });
    }

    function enhanceSidebar() {
        /* Find the sidebar — try multiple selectors */
        var sidebar = document.querySelector(
            'aside.o_wsale_col_filters, ' +
            '#tp_products_grid_before, ' +
            '.tp-shop-layout-filters, ' +
            '.js_sale aside'
        );
        if (!sidebar) return;

        /* ─ Sidebar card wrapper ─ */
        css(sidebar, {
            background: '#fff',
            border: '1.5px solid #E2E8F0',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 4px 18px rgba(0,0,0,.07)',
            alignSelf: 'flex-start',   /* don't stretch to full row height */
            padding: '0'
        });

        /* ─ FILTERS header (inject once) ─ */
        if (!sidebar.querySelector('.bh-fhead')) {
            var head = document.createElement('div');
            head.className = 'bh-fhead';
            css(head, {
                background: 'linear-gradient(135deg,#0D2B2B,#095858)',
                color: '#fff', fontSize: '12px', fontWeight: '800',
                textTransform: 'uppercase', letterSpacing: '1.5px',
                padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '8px'
            });
            head.innerHTML =
                '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"' +
                ' stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
                '<line x1="4" y1="6" x2="20" y2="6"/>' +
                '<line x1="8" y1="12" x2="16" y2="12"/>' +
                '<line x1="11" y1="18" x2="13" y2="18"/>' +
                '</svg> Filters';
            sidebar.insertBefore(head, sidebar.firstChild);
        }

        /* ─ Style every filter section header:
               catch ALL possible elements — h5, h6, .card-header,
               .tp-filter-attribute-title, buttons with collapse toggle ─ */
        var HEADER_SELECTORS = [
            '.card-header',
            '.tp-filter-attribute-title',
            '[class*="filter-attribute-title"]',
            '[class*="filter"] > h5',
            '[class*="filter"] > h6',
            'h5.collapse-toggle',
            'h6.collapse-toggle',
            'button[data-bs-toggle="collapse"]',
            '.filter-attribute h6',
            '.filter-attribute h5',
            'h6.filter-title'
        ];
        sidebar.querySelectorAll(HEADER_SELECTORS.join(',')).forEach(function(el) {
            if (el.classList.contains('bh-fhead') || el.closest('.bh-fhead')) return;
            css(el, {
                background: '#F8FAFC',
                color: '#0D2B2B',
                fontSize: '12px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '.8px',
                padding: '11px 18px',
                borderLeft: '3px solid #13C2C5',
                borderBottom: '1px solid #E2E8F0',
                borderTop: 'none',
                borderRight: 'none',
                borderRadius: '0',
                boxShadow: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                textAlign: 'left'
            });
        });

        /* ─ Fallback: find filter title by scanning short-text block elements ─ */
        sidebar.querySelectorAll('div, span, label').forEach(function(el) {
            /* Skip our injected head and elements with children */
            if (el.closest('.bh-fhead')) return;
            var txt = el.textContent.trim();
            if (
                el.children.length === 0 &&      /* leaf text node container */
                txt.length > 1 && txt.length < 40 &&
                el.parentElement &&
                el.parentElement.children.length <= 3 &&
                window.getComputedStyle(el).display !== 'none'
            ) {
                var parent = el.parentElement;
                /* If parent looks like a filter-section header row */
                if (
                    parent.style.display === 'flex' ||
                    window.getComputedStyle(parent).display === 'flex' ||
                    parent.classList.toString().toLowerCase().indexOf('header') !== -1 ||
                    parent.classList.toString().toLowerCase().indexOf('title') !== -1
                ) {
                    css(parent, {
                        background: '#F8FAFC',
                        borderLeft: '3px solid #13C2C5',
                        borderBottom: '1px solid #E2E8F0',
                        padding: '11px 18px',
                        fontWeight: '800',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '.8px',
                        color: '#0D2B2B'
                    });
                }
            }
        });

        /* ─ Style the RESET button ─ */
        sidebar.querySelectorAll('a, button').forEach(function(btn) {
            if (btn.closest('.bh-fhead')) return;
            var txt = btn.textContent.trim().toUpperCase();
            if (txt === 'RESET' || txt === 'CLEAR' || txt === 'CLEAR ALL') {
                css(btn, {
                    display: 'block',
                    background: '#fff',
                    border: '2px solid #CBD5E1',
                    color: '#475569',
                    fontWeight: '700',
                    fontSize: '13px',
                    borderRadius: '8px',
                    padding: '9px 0',
                    margin: '14px 16px',
                    width: 'calc(100% - 32px)',
                    textAlign: 'center',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    letterSpacing: '.5px',
                    transition: 'all .18s',
                    boxSizing: 'border-box'
                });
                btn.addEventListener('mouseenter', function() {
                    btn.style.background = '#13C2C5';
                    btn.style.borderColor = '#13C2C5';
                    btn.style.color = '#fff';
                });
                btn.addEventListener('mouseleave', function() {
                    btn.style.background = '#fff';
                    btn.style.borderColor = '#CBD5E1';
                    btn.style.color = '#475569';
                });
            }
        });

        /* ─ Style FILTER / APPLY buttons inside sidebar (teal) ─ */
        sidebar.querySelectorAll('button, input[type=submit], .btn').forEach(function(btn) {
            if (btn.closest('.bh-fhead')) return;
            var txt = btn.textContent.trim().toUpperCase();
            if (txt === 'FILTER' || txt === 'APPLY' || txt === 'SEARCH') {
                css(btn, {
                    background: '#13C2C5',
                    borderColor: '#13C2C5',
                    color: '#fff',
                    fontWeight: '800',
                    borderRadius: '100px',
                    padding: '7px 20px',
                    fontSize: '12px',
                    border: 'none'
                });
            }
        });

        /* ─ Teal price range slider ─ */
        sidebar.querySelectorAll('input[type=range]').forEach(function(r) {
            r.style.accentColor = '#13C2C5';
        });

        /* ─ Card body / collapse areas ─ */
        sidebar.querySelectorAll('.card-body, [class*="collapse-area"], .tp-filter-attribute-collapse-area').forEach(function(el) {
            css(el, { padding: '14px 18px', background: '#fff' });
        });
    }

    /* ── Main ── */
    function inject() {
        var shopPage = document.querySelector('.js_sale.tp-shop-page, .js_sale');
        if (!shopPage || shopPage.querySelector('.bh-shop-hero')) return;

        shopPage.insertBefore(buildUsp(), shopPage.firstChild);
        shopPage.insertBefore(buildHero(), shopPage.firstChild);

        setTimeout(enhanceSidebar, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
}());
