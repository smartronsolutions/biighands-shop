import { Dialog } from '@web/core/dialog/dialog';
import { useService } from "@web/core/utils/hooks";
import { Component, markup, onMounted, useRef } from "@odoo/owl";

export class LazyContentDialog extends Component {
    static template = "theme_prime.LazyContentDialog";
    static components = { Dialog };
    static props = {
        title: {
            validate: (m) => {
                return (
                    typeof m === "string" ||
                    (typeof m === "object" && typeof m.toString === "function")
                );
            },
            optional: true,
        },
        body: { type: String, optional: true },
    };
    setup() {
        super.setup();
        this.markup = markup;
        this.interactionService = useService("public.interactions");
        this.contentRef = useRef("content");
        onMounted(() => {
            this.interactionService.startInteractions(this.contentRef.el);
        });
    }
}
