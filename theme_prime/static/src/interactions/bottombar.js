import { Interaction } from "@web/public/interaction";
import { registry } from "@web/core/registry";

export class BottomBar extends Interaction {
    static selector = ".tp-bottombar-component";
    dynamicContent = {
        _document: {
            "t-on-scroll": this.onScroll,
        },
        ".tp-drawer-action-btn": {
            "t-on-click": this.onClickDrawerActionBtn,
        },
    };
    setup() {
        this.scrollingElement = document.scrollingElement;
    }
    onScroll() {
        const scroll = this.scrollingElement.scrollTop;
        if (odoo.dr_theme_config.json_bottom_bar.show_bottom_bar_on_scroll) {
            this.el.classList.toggle("tp-bottombar-not-visible", scroll + window.innerHeight >= document.body.scrollHeight - 100 || scroll < 100);
        } else {
            this.el.classList.toggle("tp-bottombar-not-visible", scroll + window.innerHeight >= document.body.scrollHeight - 100);
        }
    }
    onClickDrawerActionBtn(ev) {
        this.el.querySelector(".tp-bottombar-secondary-element").classList.toggle("tp-drawer-open");
        this.el.classList.toggle("tp-drawer-is-open");
    }
}

registry.category("public.interactions").add("theme_prime.bottom_bar", BottomBar);
