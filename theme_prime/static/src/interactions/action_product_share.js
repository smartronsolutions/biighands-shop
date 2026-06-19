import { ProductShareDialog } from "@theme_prime/js/dialog/product_share_dialog";
import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

export class ActionProductShare extends Interaction {
    static selector = ".tp-share-product";
    dynamicContent = {
        _root: {
            "t-on-click": this.onClick,
        },
    };
    async onClick() {
        this.services.dialog.add(ProductShareDialog, {});
    }
}

registry.category("public.interactions").add("theme_prime.action_product_share", ActionProductShare);
