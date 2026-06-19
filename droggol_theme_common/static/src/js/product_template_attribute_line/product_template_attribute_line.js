/** @odoo-module **/

import {
    ProductTemplateAttributeLine as PTAL
} from "@sale/js/product_template_attribute_line/product_template_attribute_line";
import { patch } from "@web/core/utils/patch";

patch(PTAL, {
    props: {
        ...PTAL.props,
        extraInfo: {
            type: Object,
            optional: true,
        },
    },
});
