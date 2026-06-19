import { browser } from "@web/core/browser/browser";
import { Dialog } from "@web/core/dialog/dialog";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import { onMounted, useRef, useState } from "@odoo/owl";

export class ProductShareDialog extends Dialog {
    static template = "theme_prime.product_share_dialog";
    static props = {
        ...Dialog.props,
        close: { type: Function, optional: true },
        slots: { type: Object, optional: true },
    };
    static defaultProps = {
        ...Dialog.defaultProps,
        title: _t("Share"),
        size: "md",
        technical: false,
    };
    setup() {
        super.setup();
        this.interactionService = useService("public.interactions");
        this.contentRef = useRef("content");
        this.inputRef = useRef("input");
        this.state = useState({
            copying: false,
        });
        onMounted(() => {
            this.onClickCopy();
            this.inputRef.el.value = window.location.href;
            this.interactionService.startInteractions(this.contentRef.el);
        });
    }
    onClickCopy() {
        try {
            browser.navigator.clipboard.writeText(window.location.href);
            this.state.copying = true;
            setTimeout(() => {
                this.state.copying = false;
            }, 1000);
        } catch {
            this.env.services.notification.add(_t("Link copy failed due to permission denied!"), { type: "danger" });
        }
    }
}
