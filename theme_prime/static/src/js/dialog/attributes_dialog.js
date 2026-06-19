import { Dialog } from '@web/core/dialog/dialog';
import { useService } from "@web/core/utils/hooks";
import { getSearchParams } from "@theme_prime/interactions/patch/website_sale";
import { rpc } from "@web/core/network/rpc";
import { redirect } from '@web/core/utils/urls';
import { onMounted, useRef } from "@odoo/owl";

export class attributeSelectionDialog extends Dialog {
    static template = "theme_prime.attribute_selection_dialog";
    static props = {
        ...Dialog.props,
        attributeName: { type: String, optional: true },
        attributeId: { type: Number, optional: true },
        attributesIds: { type: Array, optional: true },
        selectedAttributes: { type: Array, optional: true },
        attribValues: { type: Object, optional: true },
        domain: { type: Array, optional: true },
        close: { type: Function, optional: true },
        slots: { type: Object, optional: true },
    };
    setup() {
        super.setup();
        this.content = useRef("content");
        this.interactionService = useService("public.interactions");
        onMounted(async () => {
            const response = await rpc("/theme_prime/get_attribute_selection_dialog_content", {
                domain: this.props.domain,
                attribute_id: this.props.attributeId,
                selected_attributes: this.props.selectedAttributes,
                attributes_ids: this.props.attributesIds,
                attrib_values: this.props.attribValues,
            });
            this.content.el.innerHTML = response;
            // changing ID of checkboxes and labels to avoid duplicates with main shop filters
            // in some cases when you change something in dialog will trigger change in main shop filters
            this.content.el.querySelectorAll('input[name="attribute_value"]').forEach(checkbox => {
                let id = checkbox.id;
                checkbox.id = `${id}_dialog`;
                let label = this.content.el.querySelector(`label[for="${id}"]`);
                if (label) {
                    label.setAttribute("for", `${id}_dialog`);
                }
            });
            this.interactionService.startInteractions(this.content.el.querySelector('.tp-filter-attribute'));
        });
    }
    _onApplyClick() {
        const form = document.querySelector(".tp-filters-container form.js_attributes");
        const url = new URL(form.action);
        const searchParams = url.searchParams;
        // Combine all relevant filters in one pass
        const filters = [
            ...Array.from(form.querySelectorAll("input:checked, select")).filter(filter => {
            if (!filter.value) return false;
            const [attributeId] = filter.value.split("-");
            return !(filter.name === "attribute_value" && attributeId == this.props.attributeId);
            }),
            ...this.content.el.querySelectorAll("input:checked")
        ];
        redirect(`${url.pathname}?${getSearchParams(filters, searchParams).toString()}`);
    }
}
