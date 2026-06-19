import { Interaction } from "@web/public/interaction";
import { registry } from "@web/core/registry";
import { deserializeDateTime } from "@web/core/l10n/dates";
import { renderToElement } from "@web/core/utils/render";

export class Countdown extends Interaction {
    static selector = ".tp-countdown";
    setup() {
        const dueDate = this.el.dataset.dueDate;
        let eventTime = luxon.DateTime.now();
        if (dueDate.includes("-")) {
            eventTime = deserializeDateTime(dueDate);
        } else {
            eventTime = luxon.DateTime.fromISO(new Date(parseInt(dueDate) * 1000).toISOString());
        }
        if (this.el.dataset.countdownStyle) {
            if (this.el.querySelector(".tp-countdown-container")) {
                this.el.querySelector(".tp-countdown-container").remove();
            }
            this.el.prepend(renderToElement(this.el.dataset.countdownStyle));
        }
        this.msgContainer = this.el.querySelector(".tp-end-msg-container");
        if (this.msgContainer) {
            this.msgContainer.classList.add("css_non_editable_mode_hidden");
        }
        if (Math.floor(eventTime.diffNow().as("seconds")) > 0) {
            this.countDownTimer = setInterval(() => {
                const diff = eventTime.diffNow();
                if (Math.floor(diff.as("seconds")) <= 0) {
                    this._endCountdown();
                }
                const format = diff.toFormat("dd:hh:mm:ss").split(":");
                this.el.querySelector(".countdown_days").textContent = format[0];
                this.el.querySelector(".countdown_hours").textContent = format[1];
                this.el.querySelector(".countdown_minutes").textContent = format[2];
                this.el.querySelector(".countdown_seconds").textContent = format[3];
            }, 1000);
        } else {
            this._endCountdown();
        }
    }
    _endCountdown() {
        this.el.querySelector(".countdown_days").textContent = "00";
        this.el.querySelector(".countdown_hours").textContent = "00";
        this.el.querySelector(".countdown_minutes").textContent = "00";
        this.el.querySelector(".countdown_seconds").textContent = "00";
        if (this.msgContainer) {
            this.msgContainer.classList.remove("css_non_editable_mode_hidden");
        }
        if (this.countDownTimer) {
            clearInterval(this.countDownTimer);
        }
    }
    destroy() {
        if (this.countDownTimer) {
            clearInterval(this.countDownTimer);
        }
    }
}

const CountdownEditor = I => class extends I {
    setup() {
        this.editableMode = true;
        super.setup();
    }
};

registry.category("public.interactions").add("theme_prime.tp_countdown", Countdown);
registry.category("public.interactions.edit").add("theme_prime.tp_countdown", { Interaction: Countdown, mixin: CountdownEditor });
