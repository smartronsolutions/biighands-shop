import { Dialog } from "@web/core/dialog/dialog";
import { rpc } from "@web/core/network/rpc";
import { useService } from "@web/core/utils/hooks";
import { markup, onMounted, onWillStart, useRef } from "@odoo/owl";
import { bindCarousel } from '@theme_prime/interactions/dynamic_snippet/dynamic_snippet_hook';

export class QuickViewDialog extends Dialog {
    static template = "theme_prime.quick_view_dialog";
    static props = {
        ...Dialog.props,
        productTmplId: { type: Number, optional: true },
        productId: { type: Number, optional: true },
        isVariantSelector: { type: Boolean, optional: true },
        onCloseTpDialog: { type: Function, optional: true },
        close: { type: Function, optional: true },
        slots: { type: Object, optional: true },
    };
    static defaultProps = {
        ...Dialog.defaultProps,
        size: "xl",
        parent: Object,
    };
    setup() {
        super.setup();
        this.markup = markup;
        this.interactionService = useService("public.interactions");
        this.contentRef = useRef("content");
        onWillStart(this.onWillStart);
        onMounted(this.onMounted);
    }
    async onWillStart() {
        const result = await rpc("/theme_prime/get_quick_view_html", {
            options: { product_tmpl_id: this.props.productTmplId, product_id: this.props.productId, variant_selector: this.props.isVariantSelector },
        });
        if (result) {
            this.content = result;
            // We will not open the dialog for the single variant in mini view
            if (this.props.isVariantSelector && ($(result).hasClass("tp-product-out-of-stock")) && !$(result).hasClass("tp-combo-product")) {
                this.props.autoAddCallback({ inStock: !$(result).hasClass("tp-product-out-of-stock"), productTmplID: parseInt($(result).get(0).dataset.productTmplId) });
                this.props.close();
            }
        }
    }
    onMounted() {
        $(this.contentRef.el).find("#product_detail").on('dr_add_to_cart_event', ev => {
            // Remove the class to prevent errors when the dialog is closed
            // they are changing combination info to update stock info but i'm removing the class
            // so their will be no check/update for stock notifications
            this.contentRef.el.querySelector('.js_main_product').classList.remove('js_main_product');
            this.props.close();
            this.props.onCloseTpDialog();
        });
        this.contentRef.el.querySelector('#o-carousel-product').classList.add('d_shop_product_details_carousel');
        this.interactionService.startInteractions(this.contentRef.el);
        // Bind navigation events to carousel blocks on initial mount.
        const productContainer = this.contentRef.el.querySelector('.oe_website_sale');
        bindCarousel({productContainer, editablemode:false});
    }
}
