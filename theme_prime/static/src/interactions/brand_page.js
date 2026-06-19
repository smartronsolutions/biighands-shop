import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

export class BrandPage extends Interaction {
    static selector = ".tp-all-brands-page";
    dynamicContent = {
        ".tp-brand-search-alphabet": {
            "t-on-click": this.onClickBrandSearchAlphabet,
        },
    };
    onClickBrandSearchAlphabet(ev) {
        this.el.querySelectorAll(".tp-brand-search-alphabet").forEach(el => {
            el.classList.remove("active");
        });
        ev.currentTarget.classList.add("active");
        const searchAlphabet = ev.currentTarget.dataset.alphabet;
        if (searchAlphabet === "all") {
            this.el.querySelectorAll(".tp-grouped-brands").forEach(el => {
                el.classList.remove("d-none");
            });
        } else {
            this.el.querySelectorAll(".tp-grouped-brands").forEach(el => {
                el.classList.add("d-none");
            });
            this.el.querySelector(`.tp-grouped-brands[data-brand=${ searchAlphabet }]`).classList.remove("d-none");
        }
    }
}

registry.category("public.interactions").add("theme_prime.brand_page", BrandPage);
