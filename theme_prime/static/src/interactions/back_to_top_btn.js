import { hasTouch } from "@web/core/browser/feature_detection";
import { registry } from "@web/core/registry";
import { SIZES, utils as uiUtils } from "@web/core/ui/ui_service";
import { Interaction } from "@web/public/interaction";

export class BackToTopBtn extends Interaction {
    static selector = ".tp-back-to-top";
    dynamicContent = {
        _document: {
            "t-on-scroll": this.onScroll,
        },
        _root: {
            "t-on-click": this.onClick,
        },
    };
    setup() {
        this.scrollingElement = document.scrollingElement;
    }
    start() {
        this.el.classList.add("d-none");
    }
    onScroll() {
        const scroll = this.scrollingElement.scrollTop;
        if (!(uiUtils.getSize() <= SIZES.LG && hasTouch())) {
            if (scroll > 800) {
                this.el.classList.remove("d-none");
            } else {
                this.el.classList.add("d-none");
            }
        }
    }
    onClick(ev) {
        ev.preventDefault();
        window.scroll({ top: 0, left: 0, behavior: "smooth" });
    }
}

registry.category("public.interactions").add("theme_prime.back_to_top_btn", BackToTopBtn);
