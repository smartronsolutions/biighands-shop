import { QuickViewDialog } from "@theme_prime/js/dialog/quick_view_dialog";
import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

export class ActionProductQuickView extends Interaction {
    static selector = ".tp-product-quick-view-action, .tp_img_hotspot[data-on-hotspot-click='modal']";
    dynamicContent = {
        _root: {
            "t-on-click": this.onClick,
        },
    };
    onClick(ev) {
        this.services.dialog.add(QuickViewDialog, {
            productTmplId: parseInt(ev.currentTarget.dataset.productTemplateId),
            productId: parseInt(ev.currentTarget.dataset.productVariantId),
        });
    }
}

registry.category("public.interactions").add("theme_prime.action_product_quick_view", ActionProductQuickView);
