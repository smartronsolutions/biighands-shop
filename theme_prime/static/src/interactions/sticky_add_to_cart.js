import { hasTouch } from "@web/core/browser/feature_detection";
import { registry } from "@web/core/registry";
import { SIZES, utils as uiUtils } from "@web/core/ui/ui_service";
import { Interaction } from "@web/public/interaction";

export class StickyAddToCart extends Interaction {
    static selector = ".tp-sticky-add-to-cart, .tp-bottom-bar-add-to-cart";
    dynamicContent = {
        ".product-add-to-cart": {
            "t-on-click": this.onClickProductAddToCart,
        },
        ".product-img": {
            "t-on-click": this.onClickImg,
        },
    };
    start() {
        const isMobileEnv = uiUtils.getSize() <= SIZES.LG && hasTouch();
        if (isMobileEnv || !document.getElementById("add_to_cart")) {
            return;
        }
        this.observer = new IntersectionObserver(entries => {
            entries.forEach((entry) => {
                if (entry.intersectionRatio > 0) {
                    this.el.classList.add("d-none");
                } else {
                    this.el.classList.remove("d-none");
                }
            })
        }, {});
        this.observer.observe(document.getElementById("add_to_cart"));
    }
    onClickProductAddToCart(ev) {
        ev.preventDefault();
        const btnEl = document.querySelector("#add_to_cart:not(.disabled)");
        if (btnEl) {
            const event = new MouseEvent("click", { view: window, bubbles: true });
            btnEl.dispatchEvent(event);
        }
    }
    onClickImg(ev) {
        ev.preventDefault();
        const addToCartEl = document.getElementById("add_to_cart");
        if (addToCartEl) {
            addToCartEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }
    destroy() {
        if (this.observer) {
            this.observer.unobserve(document.getElementById("add_to_cart"));
        }
    }
}

registry.category("public.interactions").add("theme_prime.sticky_add_to_cart", StickyAddToCart);
