import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

export class ProductDetailPage extends Interaction {
    static selector = ".o_wsale_product_page";
    dynamicContent = {
        ".o_product_page_reviews_link": {
            "t-on-click": this.onClickProductRating,
        },
    };
    start() {
        const productDetailTabEl = this.el.querySelector(".tp-product-details-tab");
        productDetailTabEl.querySelectorAll(":scope > ul.nav-tabs a.nav-link").forEach(el => {
            el.classList.remove("active");
        });
        productDetailTabEl.querySelectorAll(":scope > .tab-content > .tab-pane").forEach(el => {
            el.classList.remove("active", "show");
        });
        const firstTabEl = productDetailTabEl.querySelector(":scope > ul.nav-tabs > li.nav-item:first-child > a.nav-link");
        if (firstTabEl) {
            new Tab(firstTabEl).show();
        }
    }
    onClickProductRating(ev) {
        const ratingTabEl = this.el.querySelector('[href="#tp-product-rating-tab"]');
        new Tab(ratingTabEl).show();
        ratingTabEl.scrollIntoView();
    }
}

registry.category("public.interactions").add("theme_prime.product_detail_page", ProductDetailPage);
