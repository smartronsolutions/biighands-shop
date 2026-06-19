import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

export class ShopSelectedAttribute extends Interaction {
    static selector = ".oe_website_sale";
    dynamicContent = {
        ".tp-attribute": {
            "t-on-click": this.onClickAttribute,
        },
    };
    onClickAttribute(ev) {
        if (ev.currentTarget.classList.contains("clear")) {
            const url = new URL(this.el.querySelector("form").action);
            window.location.href = url.pathname;
        } else {
            this.deactivateFilter(ev.currentTarget);
        }
    }
    deactivateFilter(el) {
        const { id, key } = el.dataset;
        if (key) {
            const el = this.el.querySelector(`div[data-key=${key}]`);
            const url = new URL(el.dataset.url, window.location.origin);
            const searchParams = url.searchParams;
            searchParams.delete(`min_${key}`);
            searchParams.delete(`max_${key}`);
            window.location.href = `${url.pathname}?${searchParams.toString()}`;
            return;
        }
        const customChangeEvent = new CustomEvent("change", {
            bubbles: true,
            cancelable: true,
        });
        const inputEl = this.el.querySelector(`.js_attributes input[id=${id}]`);
        if (inputEl) {
            inputEl.checked = false;
            inputEl.dispatchEvent(customChangeEvent);
        }
        const optionEl = this.el.querySelector(`.js_attributes option[id=${id}]`);
        if (optionEl) {
            optionEl.closest("select").value = "";
            optionEl.dispatchEvent(customChangeEvent);
        }
    }
}

registry.category("public.interactions").add("theme_prime.shop_selected_attribute", ShopSelectedAttribute);
