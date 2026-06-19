import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

export class ProductNavigator extends Interaction {
    static selector = ".tp-product-navigator";
    setup() {
        this.popovers = [];
    }
    start() {
        this.el.querySelectorAll(".tp-navigation-btn").forEach((el, index) => {
            const popoverEl = this.el.querySelector(`.tp-navigation-content[data-content-id=${el.dataset.contentId}]`);
            if (popoverEl) {
                const clonePopoverEl = popoverEl.cloneNode(true);
                clonePopoverEl.classList.remove("d-none");
                const popover = new Popover(el, {
                    animation: true,
                    template: "<div class='popover border shadow-sm' role='popover'><div class='popover-arrow'></div><div class='popover-body p-0'></div></div>",
                    content: clonePopoverEl.outerHTML,
                    html: true,
                    placement: "bottom",
                    trigger: "hover",
                    offset: [8, 8],
                });
                this.popovers.push(popover);
            }
        });
    }
    destroy() {
        this.popovers.forEach(popover => { popover.dispose() });
    }
}

registry.category("public.interactions").add("theme_prime.product_navigator", ProductNavigator);
