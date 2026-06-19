import { Countdown } from "@theme_prime/snippets/s_tp_countdown/tp_countdown";
import { registry } from "@web/core/registry";
import { patch } from "@web/core/utils/patch";
import { Interaction } from "@web/public/interaction";

patch(Countdown.prototype, {
    _endCountdown() {
        if (this.el.closest('.s_coming_soon')) {
            if (!this.editableMode) {
                this.el.closest('.s_coming_soon').classList.add('d-none');
                this.el.classList.add("s_coming_soon_countdown_over");
            }
            const wrapwrap = document.getElementById("wrapwrap");
            if (wrapwrap) {
                wrapwrap.style.overflow = "auto";
            }
        }
        super._endCountdown(...arguments);
    }
});

export class ComingSoon extends Interaction {
    static selector = ".s_coming_soon";
    setup() {
        this.wrapwrapEl = document.getElementById("wrapwrap");
        if (this.wrapwrapEl) {
            if (!this.editableMode || !this.el.querySelector(".s_coming_soon_countdown_over")) {
                this.wrapwrapEl.style.overflow = "hidden";
            }
            if (this.editableMode) {
                this.el.classList.remove("d-none");
                this.wrapwrapEl.style.overflow = "auto";
            }
        }
    }
    destroy() {
        if (this.wrapwrapEl) {
            this.wrapwrapEl.style.overflow = "auto";
        }
    }
}

const ComingSoonEditor = I => class extends I {
    setup() {
        this.editableMode = true;
        super.setup();
    }
};

registry.category("public.interactions").add("theme_prime.coming_soon", ComingSoon);
registry.category("public.interactions.edit").add("theme_prime.coming_soon", { Interaction: ComingSoon, mixin: ComingSoonEditor });
