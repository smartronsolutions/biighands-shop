import { loadBundle } from "@web/core/assets";
import { localization } from "@web/core/l10n/localization";
import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

export class RangeFilter extends Interaction {
    static selector = ".tp-range-filter";
    dynamicContent = {
        "input": {
            "t-on-change": this.onChangeInput,
        },
        ".apply": {
            "t-on-click": this.onClickApply,
        },
    };
    async willStart() {
        await loadBundle("theme_prime.range_slider");
    }
    start() {
        this.rangeSlider = this.el.querySelector(".tp-slider");
        this.fromInput = this.el.querySelector("input.from");
        this.toInput = this.el.querySelector("input.to");
        const { min, max, from, to, currency } = this.rangeSlider.dataset;

        this.el.querySelector(".min-formatted-value").textContent = this.formatNumber(Number(min));
        this.el.querySelector(".max-formatted-value").textContent = this.formatNumber(Number(max));

        noUiSlider.create(this.rangeSlider, {
            start: [Number(from), Number(to)],
            connect: true,
            step: 1,
            range: {
                min: Number(min),
                max: Number(max),
            },
            format: {
                to: value => { return (currency + parseInt(value, 10)) },
                from: value => { return Number(value) },
            },
            direction: localization.direction,
        });

        this.rangeSlider.noUiSlider.on("update", (values, handle) => {
            let value = values[handle];
            value = value.replace(/\D/g, "");
            if (handle) {
                this.toInput.value = Math.round(value);
            } else {
                this.fromInput.value = Math.round(value);
            }
            this._validateRange();
        });
    }
    onChangeInput(ev) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        const error = this._validateRange();
        if (!error) {
            this.rangeSlider.noUiSlider.set([this.fromInput.value, this.toInput.value]);
        }
    }
    onClickApply(ev) {
        const key = this.rangeSlider.dataset.key;
        const url = new URL(this.rangeSlider.dataset.url, window.location.origin);
        const searchParams = url.searchParams;
        if (Number(this.rangeSlider.dataset.min) !== Number(this.fromInput.value)) {
            searchParams.set(`min_${key}`, this.fromInput.value);
        }
        if (Number(this.rangeSlider.dataset.max) !== Number(this.toInput.value)) {
            searchParams.set(`max_${key}`, this.toInput.value);
        }
        window.location.href = `${url.pathname}?${searchParams.toString()}`;
    }
    formatNumber(number) {
        const language = document.querySelector("html").getAttribute("lang");
        const locale = (() => {
            switch (language) {
                case "sr@latin":
                    return "sr-Latn";
                case "sr@Cyrl":
                    return "sr-Cyrl";
                default:
                    return language.replaceAll("_", "-");
            }
        })();
        let formatedNumber = number.toLocaleString(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        if (this.rangeSlider.dataset.currency) {
            if (this.rangeSlider.dataset.currencyPosition === "after") {
                formatedNumber = formatedNumber + " " + this.rangeSlider.dataset.currency;
            } else {
                formatedNumber = this.rangeSlider.dataset.currency + " " + formatedNumber;
            }
        }
        return formatedNumber;
    }
    _validateRange() {
        if (isNaN(this.fromInput.value) || isNaN(this.toInput.value)) {
            this.el.querySelector(".tp-validate-msg").textContent = _t("Enter valid value.");
            this.el.querySelector(".apply").classList.add("d-none");
            return true;
        }
        if (parseInt(this.fromInput.value) > parseInt(this.toInput.value)) {
            this.el.querySelector(".tp-validate-msg").textContent = _t("Maximum value should be greater than minimum.");
            this.el.querySelector(".apply").classList.add("d-none");
            return true;
        }
        this.el.querySelector(".tp-validate-msg").textContent = "";
        this.el.querySelector(".apply").classList.remove("d-none");
    }
    destroy() {
        if (this.rangeSlider && this.rangeSlider.noUiSlider) {
            this.rangeSlider.noUiSlider.destroy();
        }
    }
}

registry.category("public.interactions").add("theme_prime.range_filter", RangeFilter);
