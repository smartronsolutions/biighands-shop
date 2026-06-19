import { DynamicSnippetBase } from "./dynamic_snippet_base";
import { intersection } from "@web/core/utils/arrays";
import { markUpValues } from "./dynamic_snippet_hook"
import { utils as uiUtils } from "@web/core/ui/ui_service";
import { registry } from "@web/core/registry";
import { rpc } from "@web/core/network/rpc";
import { markup } from "@odoo/owl";
import { renderToString } from "@web/core/utils/render";
import { _t } from "@web/core/l10n/translation";
import { EventBus } from '@odoo/owl';
import comparisonUtils from '@website_sale_comparison/js/website_sale_comparison_utils';

export class DynamicProductSnippetBase extends DynamicSnippetBase {
    static selector = '.some-selector-that-never-exists';
    dynamicContent = {
        ...this.dynamicContent,
        ".d_add_to_wishlist_btn": {
            't-att-class': (item) => ({
                'disabled': this.wishlistProductIDs.includes(parseInt(item.dataset.productProductId)),
            }),
            't-on-click': this._onAddToWishlistClick,
        },
        ".o_add_compare": {
            't-att-class': (item) => ({
                'disabled': this.comparisonProductIds.includes(parseInt(item.dataset.productProductId)),
            }),
            "t-on-click": this._onAddToComparisonClick,
        }
    };
    setup() {
        this.registryToUse = 'theme_prime_snippet_registry';
        // Not a big fan of bus :(
        this.bus = new EventBus();
        super.setup();
        this.wishlistProductIDs = [];
        this.imageFill = odoo?.dr_theme_config?.json_shop_product_item?.image_fill;
        this.imageSize = odoo?.dr_theme_config?.json_shop_product_item?.image_size;
    }
    _setDefaults() {
        super._setDefaults();
        this.snippetNodeAttrs = [...this.snippetNodeAttrs, 'uiConfigInfo', 'extraInfo'];
        this.tpFieldsToMarkUp = [...new Set([...this.tpFieldsToMarkUp,'price', 'rating', 'list_price', 'label_template', 'dr_stock_label', 'colors', 'description_ecommerce', 'short_description'])];
    }
    _isActionEnabled(actionName, actions) {
        let allActions = actions || this.uiConfigInfo.activeActions;
        return allActions.includes(actionName);
    }
    _anyActionEnabled(actions) {
        return intersection(actions, this.uiConfigInfo.activeActions).length >= 1;
    }
    _onSuccessResponse(response) {
        if (this.isMobile && this.uiConfigInfo && this.uiConfigInfo.mobileConfig) {
            let keys = Object.keys(this.uiConfigInfo.mobileConfig);
            keys.forEach((key) => {
                if (this.uiConfigInfo[key] && this.uiConfigInfo.mobileConfig[key] === 'default') {
                    this.uiConfigInfo.mobileConfig[key] = this.uiConfigInfo[key];
                }
            });
            this.uiConfigInfo = { ... this.uiConfigInfo, ... this.uiConfigInfo.mobileConfig };
        }
        super._onSuccessResponse(...arguments);
    }
    _onWindowResize() {
        super._onWindowResize();
        // Added this.response bcoz odoo is triggering resize from many places and this is totally shit for ex comparison
        // due to this no data template append first sometimes
        if (this.uiConfigInfo && this.uiConfigInfo.mode === 'grid' && this.response && !this.editableMode) {
            this._setClass();
            this._onSuccessResponse(this.response);
        }
    }
    _cleanBeforeAppend () {
        if (this.uiConfigInfo && this.uiConfigInfo.mode === 'grid') {
            this._setClass();
        }
        super._cleanBeforeAppend();
    }
    _setClass() {
        this.deviceSizeClass = uiUtils.getSize();
        if (this.deviceSizeClass <= 1) {
            this.cardSize = 12;
            if (this.uiConfigInfo_init && this.uiConfigInfo_init.mobileConfig && this.uiConfigInfo_init.mobileConfig.style !== 'default' && this.uiConfigInfo.mobileConfig && this.uiConfigInfo.mobileConfig.mode === 'grid') {
                this.cardSize = 6;
            }
            this.cardColClass = 'col-' + this.cardSize.toString();
        } else if (this.deviceSizeClass === 2) {
            this.cardSize = 6;
            this.cardColClass = 'col-sm-' + this.cardSize.toString();
        } else if (this.deviceSizeClass === 3 || this.deviceSizeClass === 4) {
            this.cardSize = 4;
            this.cardColClass = 'col-md-' + this.cardSize.toString();
        } else if (this.deviceSizeClass >= 5) {
            this.cardSize = parseInt(12 / this.uiConfigInfo.ppr);
            this.cardColClass = 'col-lg-' + this.cardSize.toString();
        }
    }
    _modifyElementsAfterAppend() {
        super._modifyElementsAfterAppend();
        if (!this.editableMode) {
            this._reloadInteractionNode({ selector: '.s_add_to_cart_btn'});
            this._reloadInteractionNode({ selector: '.tp-product-quick-view-action'});
            this._reloadInteractionNode({ selector: '.tp_show_similar_products'});
        }
        this._reloadInteractionNode({ selector: '.tp-product-preview-swatches'});
    }
    /**
    * @private
    */
    get mustDisabledOptions() {
        return ['wishlist', 'comparison', 'rating'];
    }
    get extraLibs() {
        return ['theme_prime.swiper'];
    }
    get mustDisabledOptions() {
        return ['wishlist', 'comparison', 'rating']
    }
    get allActions() {
        return ['wishlist', 'comparison', 'add_to_cart', 'quick_view'];
    }
    get comparisonProductIds() {
        return comparisonUtils.getComparisonProductIds();
    }
    /**
     * @private
     */
    _updateUserParams(shopConfigParams) {
        if (this.uiConfigInfo) {
            this.mustDisabledOptions.forEach(option => {
                let enabledInShop = shopConfigParams['is_' + option + '_active'];
                if (!enabledInShop) {
                    this.uiConfigInfo['activeActions'] = this.uiConfigInfo.activeActions.filter((x) => x !== option);
                }
            });
            // whether need to render whole container for
            // e.g if all actions are disabled then donot render overlay(contains add to card, wishlist btns etc)
            this.uiConfigInfo['anyActionEnabled'] = this._anyActionEnabled(this.allActions);
        }
    }
    _setDBData(data) {
        if (data.wishlist_products) {
            this.wishlistProductIDs = data.wishlist_products;
        }
        if (data.shop_config_params) {
            this.shopConfig = data.shop_config_params;
            this._updateUserParams(data.shop_config_params);
        }
        super._setDBData(data);
    }
    _processData(data) {
        if (data.products) {
            markUpValues(this.tpFieldsToMarkUp, data.products);
        }
        return data;
    }
    _appendNoDataTemplate() {
        if (this.noDataTemplate) {
            this._renderAndAppendQweb(this.noDataTemplate, 'd_no_data_tmpl_default', true);
        }
    }
    _updateWishlistView() {
        const wishButton = document.querySelector('.o_wsale_my_wish');
        if (wishButton) {
            const isEmpty = this.wishlistProductIDs.length === 0;
            if (wishButton.classList.contains('o_wsale_my_wish_hide_empty')) {
            wishButton.classList.toggle('d-none', isEmpty);
            }
            wishButton.style.display = 'block';
        }
        const count = this.wishlistProductIDs.length || '';
        document.querySelectorAll('.my_wish_quantity').forEach(el => el.textContent = count);
    }
    async _removeProductFromWishlist(wishlistID, productID) {
        await rpc('/shop/wishlist/remove/' + wishlistID);
        document.querySelector(`.tp-notification.tp-${productID}`)?.classList.add('d-none');
        document.querySelectorAll(`.d_add_to_wishlist_btn[data-product-variant-id='${productID}']`).forEach(button => { button.classList.remove('disabled'); });
        this.wishlistProductIDs = this.wishlistProductIDs.filter(id => id !== productID);
        this._updateWishlistView();
    }
    async _onAddToWishlistClick(ev) {
        if (this.editableMode) return;
        const productID = parseInt(ev.currentTarget.dataset.productVariantId);
        const res = await rpc('/theme_prime/wishlist_general', { product_id: productID });
        this.wishlistProductIDs = res.products;
        const notificationData = { type: 'danger', className: `tp-notification tp-bg-soft-danger tp-${productID}`, templateToUse: 'theme_prime.NotificationGeneric', message: markup(renderToString('DroggolNotification', { color: 'danger', productName: res.name, message: _t('Added to your wishlist.'), iconClass: 'dri dri-wishlist' })), buttons: [{ name: _t("Wishlist"), onClick: () => window.location = '/shop/wishlist' }, { name: _t("Undo"), onClick: () => this._removeProductFromWishlist(res.wishlist_id, productID) }] };

        this.displayNotification(notificationData);
        this._updateWishlistView();
    }
    async _onAddToComparisonClick(ev) {
        if (this.editableMode) return;
        // keep it async for future use if needed may be display product name in notification
        const productID = parseInt(ev.currentTarget.dataset.productVariantId), baseNotification = { type: 'warning', className: `tp-notification tp-bg-soft-danger tp-compare-${productID}`, templateToUse: 'theme_prime.NotificationGeneric', buttons: [{ name: _t("View"), onClick: () => window.location = `/shop/compare?products=${encodeURIComponent(this.comparisonProductIds.join(','))}` }, { name: _t("Close"), onClick: () => document.querySelector(`.tp-notification.tp-compare-${productID}`)?.classList.add('d-none') }] };
        let notificationConfig;
        if (this.comparisonProductIds.length >= comparisonUtils.MAX_COMPARISON_PRODUCTS) {
            notificationConfig = { color: 'warning', productName: _t("Can't be added to compare"), message: _t('Max 4 products allowed'), iconClass: 'fa fa-exclamation-triangle' };
        } else if (this.comparisonProductIds.includes(productID)) {
            notificationConfig = { color: 'warning', productName: _t("Already in comparison"), message: _t('This product is already in your comparison list'), iconClass: 'fa fa-info-circle' };
        } else {
            comparisonUtils.addComparisonProduct(productID, this.bus);
            notificationConfig = { color: 'primary', productName: _t("Product added to compare"), message: _t('Check your compare list.'), iconClass: 'fa fa-check' };
            baseNotification.type = 'primary';
        }
        this.displayNotification({ ...baseNotification, message: markup(renderToString('DroggolNotification', notificationConfig)) });
    }
    get options() {
        let options = {};
        if (this.selectionInfo && this.selectionInfo.model) {
            options['model'] = this.selectionInfo.model;
        }
        // add new attribute to widget or just set data-userParams to $target
        if (this.uiConfigInfo) {
            if (this._isActionEnabled('wishlist')) {
                options['wishlist_enabled'] = true;
            }
            // fetch shop config only if 'wishlist', 'comparison', 'rating'
            // any one of this is enabled in current snippet
            if (this._anyActionEnabled(this.mustDisabledOptions)) {
                options['shop_config_params'] = true;
            }
            return options;
        } else {
            let _sup = super.options;
            return Object.keys(options).length !== 0 ? options : _sup;
        }
    }
}
registry.category("public.interactions").add('theme_prime.dynamic_product_snippet_base', DynamicProductSnippetBase);
registry.category("public.interactions.edit").add('theme_prime.dynamic_product_snippet_base', { Interaction: DynamicProductSnippetBase });