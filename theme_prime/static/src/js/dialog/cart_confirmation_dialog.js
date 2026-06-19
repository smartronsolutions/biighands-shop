import { Dialog } from "@web/core/dialog/dialog";
import { useService } from "@web/core/utils/hooks";
import { markup, onMounted, useRef } from "@odoo/owl";

export class CartConfirmationDialog extends Dialog {
    static template = "theme_prime.cart_confirmation_dialog";
    static props = {
        ...Dialog.props,
        info: { type: Object, optional: true },
        parent: { type: Object, optional: true },
        close: { type: Function, optional: true },
        slots: { type: Object, optional: true },
    };
    static defaultProps = {
        ...Dialog.defaultProps,
        withBodyPadding: false,
        size: "md",
        parent: false,
        technical: false,
    };
    setup() {
        super.setup();
        this.markup = markup;
        this.JSON = JSON;
        this.interactionService = useService("public.interactions");
        this.contentRef = useRef("content");
        onMounted(() => {
            if (this.contentRef.el) {
                this.interactionService.startInteractions(this.contentRef.el);
            }
        });
    }
}
