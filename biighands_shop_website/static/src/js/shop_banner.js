/** BH Shop — VIP professional banner, USP strip, sidebar enhancement */
(function () {
    'use strict';

    function activePill() {
        var s = window.location.search;
        if (s.indexOf('list_price') !== -1)      return 'price';
        if (s.indexOf('create_date') !== -1)      return 'new';
        if (s.indexOf('website_sequence') !== -1) return 'featured';
        return 'all';
    }

    function pc(key) {
        return 'bh-pill' + (activePill() === key ? ' bh-pill-active' : '');
    }

    function buildHero() {
        var d = document.createElement('div');
        d.className = 'bh-shop-hero';
        d.innerHTML =
            '<div class="bh-shop-hero-inner">' +
              '<div class="bh-shop-hero-left">' +
                '<span class="bh-shop-hero-tag">Professional Supplies</span>' +
                '<h1>Shop All Products</h1>' +
                '<p>Trade-quality tools &amp; hardware at unbeatable prices</p>' +
              '</div>' +
              '<div class="bh-shop-hero-right">' +
                '<div class="bh-shop-pills">' +
                  '<a href="/shop" class="' + pc('all') + '">All Products</a>' +
                  '<a href="/shop?order=list_price+asc" class="' + pc('price') + '">Best Price</a>' +
                  '<a href="/shop?order=create_date+desc" class="' + pc('new') + '">New In</a>' +
                  '<a href="/shop?order=website_sequence+asc" class="' + pc('featured') + '">Featured</a>' +
                '</div>' +
              '</div>' +
            '</div>';
        return d;
    }

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

    function enhanceSidebar() {
        /* Add a "Filters" header label to the sidebar if it doesn't have one */
        var sidebar = document.querySelector('.tp-shop-layout-filters, #tp_products_grid_before aside, aside.o_wsale_col_filters');
        if (!sidebar || sidebar.querySelector('.bh-filter-head')) return;

        var head = document.createElement('div');
        head.className = 'bh-filter-head';
        head.style.cssText = [
            'background:linear-gradient(135deg,#0D2B2B,#095858)',
            'color:#fff', 'font-size:12px', 'font-weight:800',
            'text-transform:uppercase', 'letter-spacing:1.5px',
            'padding:14px 18px', 'display:flex', 'align-items:center', 'gap:8px',
        ].join(';');
        head.innerHTML = '<span style="font-size:16px;">&#9881;</span> Filters';
        sidebar.insertBefore(head, sidebar.firstChild);
    }

    function inject() {
        var shopPage = document.querySelector('.js_sale.tp-shop-page, .js_sale');
        if (!shopPage) return;
        if (shopPage.querySelector('.bh-shop-hero')) return;

        /* Prepend hero then USP (insert in reverse order) */
        shopPage.insertBefore(buildUsp(), shopPage.firstChild);
        shopPage.insertBefore(buildHero(), shopPage.firstChild);

        /* Enhance sidebar after short delay (let theme_prime render first) */
        setTimeout(enhanceSidebar, 300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
}());
