import { browser } from '@web/core/browser/browser';
import { patch } from "@web/core/utils/patch";
import { session } from '@web/session';
import { cartService, CartService } from "@website_sale/js/cart_service";
import { QuickViewDialog } from "@theme_prime/js/dialog/quick_view_dialog";

CartService.dependencies = [...CartService.dependencies, "primeService"];
cartService.dependencies = [...cartService.dependencies, "primeService"];

patch(CartService.prototype, {
    setup(_env, services) {
        this.primeService = services.primeService;
        return super.setup(_env, services);
    },
    async add({
        productTemplateId,
        productId = undefined,
        quantity = 1,
        uomId = undefined,
        ptavs = [],
        productCustomAttributeValues = [],
        noVariantAttributeValues = [],
        isCombo = false,
        ...rest
    },
        {
            isBuyNow = false,
            redirectToCart = true,
            isConfigured = false,
            showQuantity = true,
        } = {},
    ) {
        if (productId)  {
            this.drProductId = productId;
        }
        // Not a good idea to store state in service
        this.drProductId = productId || false;
        if (this.primeService.isB2bModeEnabled) {
            this.primeService.loginNotification();
            return;
        }
        return await super.add(...arguments);
    },
    async _openProductConfigurator(
        productTemplateId,
        quantity,
        uomId,
        combination,
        productCustomAttributeValues,
        options,
        additionalData
    ) {
        if (odoo?.dr_theme_config?.cart_config_type === 'prime') {
            return await new Promise((resolve) => {
                let params = {
                    productTmplId: productTemplateId,
                    size: 'sm',
                    isVariantSelector: true,
                    onCloseTpDialog: () => {
                        resolve(0);
                    },
                    autoAddCallback: (data) => {
                        if (!data.inStock) {
                            this.primeService.stockNotification({ productTmplID: data.productTmplID });
                            resolve(0);
                        }
                        resolve(data);
                    }
                };
                if (this.drProductId) {
                    params['productId'] = this.drProductId;
                }
                this.dialog.add(QuickViewDialog, params);
            });
        }
        return await super._openProductConfigurator(...arguments);
    },
    async _makeRequest({
        productTemplateId,
        productId,
        quantity,
        uomId = undefined,
        productCustomAttributeValues = [],
        noVariantAttributeValues = [],
        shouldRedirectToCart = false,
        ...rest
    }) {
        const data = await this.rpc('/shop/cart/add', {
            product_template_id: productTemplateId,
            product_id: productId,
            quantity: quantity,
            uom_id: uomId,
            product_custom_attribute_values: productCustomAttributeValues,
            no_variant_attribute_value_ids: noVariantAttributeValues,
            ...rest
        });

        if (shouldRedirectToCart) {
            window.location = '/shop/cart';
            return data.quantity;
        }

        if (odoo.dr_theme_config.cart_flow === "default") {
            if (session.add_to_cart_action === 'go_to_cart') {
                window.location = '/shop/cart';
                return data.quantity;
            }
        }

        if (data.cart_quantity && (
            data.cart_quantity !== browser.sessionStorage.getItem('website_sale_cart_quantity')
        )) {
            this._updateCartIcon(data.cart_quantity);
        };

        if (odoo.dr_theme_config.cart_flow === "default") {
            this._showCartNotification(data.notification_info);
        } else if (odoo.dr_theme_config.cart_flow === "side_cart") {
            this.primeService.cartFlowSidebar();
        } else if (odoo.dr_theme_config.cart_flow === "dialog") {
            this.primeService.cartFlowDialog({ ...data, product_id : productId});
        } else if (odoo.dr_theme_config.cart_flow === "notification") {
            for (const line of data.notification_info.lines) {
                this.primeService.cartFlowNotification(line);
            }
        }
        const productDetailEl = document.querySelector(`.tp-product-variant-selector-modal-dialog #product_detail[data-product-tmpl-id="${productTemplateId}"]`);
        if (productDetailEl) {
            productDetailEl.dispatchEvent(new CustomEvent('dr_add_to_cart_event'));
        }
        document.querySelectorAll(".dr-update-cart-total").forEach(el => {
            if (data.notification_info && data.notification_info.order_amount_html) {
                el.innerHTML = data.notification_info.order_amount_html;
            }
        });

        if (data.quantity) {
            this._trackProducts(data.tracking_info);
        }
        return data.quantity;
    },
    _trackProducts(trackingInfo) {
        if (document.querySelector('.oe_website_sale')) {
            super._trackProducts(...arguments);
            return;
        }
        // I don't want to rely on oe_website_sale class for tracking. so make sure snippet also respect tracking.
        if (document.querySelector('.tp-dynamic-snippet-prime')) {
            document.querySelector('.tp-dynamic-snippet-prime').dispatchEvent(
                new CustomEvent('add_to_cart_event', {'detail': trackingInfo})
            );
        }
    }
});
