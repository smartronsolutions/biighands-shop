/** Inject teal header banner on shop pages — bypasses template XPath issues */
(function () {
    'use strict';

    function injectShopBanner() {
        const shopPage = document.querySelector('.tp-shop-page, .js_sale');
        if (!shopPage || document.querySelector('.bh-shop-header')) return;

        const banner = document.createElement('div');
        banner.className = 'bh-shop-header';
        banner.innerHTML = [
            '<div class="bh-shop-header-inner">',
            '  <div>',
            '    <h1>Shop All Products</h1>',
            '    <p>Trade-quality products at unbeatable prices — fast delivery available</p>',
            '  </div>',
            '  <div class="bh-shop-header-pills">',
            '    <a href="/shop" class="bh-shop-header-pill">All Products</a>',
            '    <a href="/shop?order=price+asc" class="bh-shop-header-pill">Best Price</a>',
            '    <a href="/shop?order=create_date+desc" class="bh-shop-header-pill">New Arrivals</a>',
            '    <a href="/shop?order=website_sequence+asc" class="bh-shop-header-pill">Featured</a>',
            '  </div>',
            '</div>',
        ].join('');

        shopPage.insertBefore(banner, shopPage.firstChild);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectShopBanner);
    } else {
        injectShopBanner();
    }
})();
