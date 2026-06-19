import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

export class ProductItemActions extends Interaction {
    static selector = ".tp-action-buttons";
    dynamicContent = {
        _document: {
            "t-on-scroll": this.onScroll,
        },
        ".tp-action-buttons-toggler": {
            "t-on-click": this.onClickToggler,
        },
    };
    onClickToggler(ev) {
        this.onScroll();
        ev.currentTarget.classList.add("d-none");
        this.el.querySelectorAll('.tp-action-toggle').forEach(el => {
            el.classList.remove("d-none");
        });
    }
    onScroll() {
        document.querySelectorAll(".tp-action-buttons-toggler").forEach(el => {
            if (el.parentElement.querySelectorAll(".tp-action-toggle").length > 1) {
                el.classList.remove("d-none");
            }
        });
        document.querySelectorAll(".tp-action-toggle").forEach(el => {
            if (el.parentElement.querySelectorAll(".tp-action-toggle").length > 1) {
                el.classList.add("d-none");
            }
        });
    }
}

registry.category("public.interactions").add("theme_prime.product_item_actions", ProductItemActions);
