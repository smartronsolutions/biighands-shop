/** BH Shop — professional hero banner + USP strip injected above product grid */
(function () {
    'use strict';

    /* Determine active sort pill from URL */
    function activePill() {
        var s = window.location.search;
        if (s.indexOf('list_price') !== -1)       return 'price';
        if (s.indexOf('create_date') !== -1)       return 'new';
        if (s.indexOf('website_sequence') !== -1)  return 'featured';
        return 'all';
    }

    function pillClass(key) {
        return 'bh-pill' + (activePill() === key ? ' bh-pill-active' : '');
    }

    function buildBanner() {
        var hero = document.createElement('div');
        hero.className = 'bh-shop-hero';
        hero.innerHTML = [
            '<div class="bh-shop-hero-inner">',
            '  <div class="bh-shop-hero-left">',
            '    <span class="bh-shop-hero-tag">Professional Supplies</span>',
            '    <h1>Shop All Products</h1>',
            '    <p>Trade-quality tools &amp; hardware at unbeatable prices</p>',
            '  </div>',
            '  <div class="bh-shop-hero-right">',
            '    <div class="bh-shop-pills">',
            '      <a href="/shop" class="' + pillClass('all') + '">All Products</a>',
            '      <a href="/shop?order=list_price+asc" class="' + pillClass('price') + '">Best Price</a>',
            '      <a href="/shop?order=create_date+desc" class="' + pillClass('new') + '">New In</a>',
            '      <a href="/shop?order=website_sequence+asc" class="' + pillClass('featured') + '">Featured</a>',
            '    </div>',
            '  </div>',
            '</div>',
        ].join('');

        var usp = document.createElement('div');
        usp.className = 'bh-shop-usp';
        usp.innerHTML = [
            '<div class="bh-shop-usp-inner">',
            '  <div class="bh-shop-usp-item"><span>&#128666;</span> Free delivery on orders over $50</div>',
            '  <div class="bh-shop-usp-item"><span>&#9889;</span> Same-day dispatch before 3pm</div>',
            '  <div class="bh-shop-usp-item"><span>&#128230;</span> Click &amp; Collect in 1 hour</div>',
            '  <div class="bh-shop-usp-item"><span>&#128260;</span> 30-day hassle-free returns</div>',
            '</div>',
        ].join('');

        return [hero, usp];
    }

    function inject() {
        /* Find the shop page wrapper — theme_prime uses .js_sale + .tp-shop-page */
        var shopPage = document.querySelector('.js_sale.tp-shop-page, .js_sale');
        if (!shopPage) return;
        if (shopPage.querySelector('.bh-shop-hero')) return;

        var parts = buildBanner();
        shopPage.insertBefore(parts[1], shopPage.firstChild); /* USP strip */
        shopPage.insertBefore(parts[0], shopPage.firstChild); /* hero first */
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
}());
