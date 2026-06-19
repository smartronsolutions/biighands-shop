import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";
import { attributeSelectionDialog } from "@theme_prime/js/dialog/attributes_dialog";
import { _t } from "@web/core/l10n/translation";

export class ShopFilterAttribute extends Interaction {
    static selector = ".tp-filter-attribute";
    dynamicContent = {
        ".tp-accordion-item.collapsible .tp-accordion-header": {
            "t-on-click": this.onClickAccordionHeader,
        },
        ".tp-search-attribute-value": {
            "t-on-keyup": this.onChangeSearch,
        },
    };
    onClickAccordionHeader(ev) {
        const item = ev.currentTarget.closest(".tp-accordion-item");
        const body = item.querySelector(".tp-accordion-body");
        const isExpanded = item.classList.contains("expanded");
        const duration = 400; // match CSS transition duration in ms

        // Collapse
        if (isExpanded) {
            body.style.maxHeight = `${body.scrollHeight}px`;
            requestAnimationFrame(() => {
                body.style.maxHeight = "0";
            });
            item.classList.remove("expanded");
            return;
        }

        // Expand
        item.classList.add("expanded");
        body.style.maxHeight = `${body.scrollHeight}px`;

        // After animation ends, unlock full height
        setTimeout(() => {
            if (item.classList.contains("expanded")) {
                body.style.maxHeight = "none";
            }
        }, duration);
    }
    onChangeSearch(ev) {
        ev.stopPropagation();
        const value = ev.currentTarget.value.trim();
        if (value) {
            this.el.querySelectorAll("li[data-search-term]").forEach(el => {
                el.classList.add("d-none");
            });
            this.el.querySelectorAll('li[data-search-term*="' + value.toLowerCase() + '"]').forEach(el => {
                el.classList.remove("d-none");
            });
        } else {
            this.el.querySelectorAll("li[data-search-term]").forEach(el => {
                el.classList.remove("d-none");
            });
        }
    }
}
registry.category("public.interactions").add("theme_prime.shop_filter_attribute", ShopFilterAttribute);

export class tpShowAllAttributes extends Interaction {
    static selector = ".tp-show-all-attributes";
    dynamicContent = {
        _root: {
            "t-on-click": this.onClickShowAllAttributes,
        },
    };
    async onClickShowAllAttributes(ev) {
        let {dataset} = ev.currentTarget;
        this.services.dialog.add(attributeSelectionDialog, {
            title: _t('Select %s', dataset.attributeName),
            footer: false,
            body: '<div>Loading...</div>',
            attributeName: dataset.attributeName,
            attributeId: parseInt(dataset.attributeId),
            selectedAttributes: dataset.selectedAttributes ? JSON.parse(dataset.selectedAttributes) : [],
            attributesIds: dataset.attributesIds ? JSON.parse(dataset.attributesIds) : [],
            attribValues : dataset.attribValues ? JSON.parse(dataset.attribValues) : {},
            domain: dataset.domain ? JSON.parse(dataset.domain) : [],
        });
    }
}

registry.category("public.interactions").add("theme_prime.shop_show_all_attributes", tpShowAllAttributes);
