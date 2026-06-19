import { registry } from "@web/core/registry";
import { DynamicProductSnippetBase } from "./dynamic_product_snippet_base";
import { composeMixins, swiperHelper } from "./dynamic_snippet_hook";
import { Interaction } from "@web/public/interaction";
import { localization } from "@web/core/l10n/localization";
import { SIZES, utils as uiUtils } from "@web/core/ui/ui_service";
import { DynamicSnippetBase } from "./dynamic_snippet_base";
import { groupBy } from "@web/core/utils/arrays";
import { renderToFragment, renderToString } from "@web/core/utils/render";
import { pick } from "@web/core/utils/objects";
import { _t } from "@web/core/l10n/translation";
import { QuickViewDialog } from "@theme_prime/js/dialog/quick_view_dialog";
import { bindCarousel } from '@theme_prime/interactions/dynamic_snippet/dynamic_snippet_hook';

/*
 * Developer Notice:
 *
 * This message is for developers extending or modifying existing functionality.
 *
 * **Recent Updates (Initial Phase):**
 * We successfully migrated all publicWidget to the new interaction system and implemented
 * technical optimizations to improve performance and maintain full compatibility with
 * existing snippets.
 *
 * **Upcoming Updates (Post Theme Release not sure when may be next year too i'm sure there will be changes in interactions next year too):**
 * Following the theme release this year, we plan to introduce refinements to the snippet codebase
 * to further modernize and enhance the system.
 *
 * **Action Recommended for Customizations:**
 * If you have extended any interactions from this file, please validate them in your testing environment
 * after updating to the latest theme version before deploying to production.
 *
 * All planned changes are limited to the **Frontend** codebase and do not involve any modifications
 * to the database structure. Your **data integrity** and **current design blocks remain fully protected**.
 *
 * Thank you for building E-commerce with Theme Prime.
 *
 * Regards,
 * Kishan Gajjar
 */

export class TpHotSpotInteraction extends composeMixins(DynamicSnippetBase, 'MarkupRecords') {
    static selector = '.tp_img_hotspot';
    dynamicContent = {
        _root: {
            "t-on-click": this._onClickHotSpot,
            "t-on-shown.bs.popover": this._onShownPopover,
            "t-on-force-toggle-popover": this._onTogglePopover,
        },
        _document: {
            "t-on-scroll": this.onScroll,
        },
    };
    _onTogglePopover(ev) {
        if (this.editableMode) {
            this.popover._isShown() ? this.popover.hide() : this.popover.show();
        }
    }
    _onShownPopover() {
        if (this.popover) {
            document.querySelectorAll('.tp-popover-button').forEach((el) => {
                this.services["public.interactions"].stopInteractions(el);
                this.services["public.interactions"].startInteractions(el);
            });
            document.querySelectorAll('.tp-popover-view-all-btn').forEach((el) => {
                el.addEventListener('click', (event) => {
                    const urls = event.currentTarget.dataset.urls.split(',');
                    if (urls) {
                        urls.forEach(url => window.open(window.location.origin + url, '_blank'));
                    }
                });
            });
        }
    }
    onScroll() {
        if (this.popover) this.popover.hide();
    }
    _setDefaults() {
        super._setDefaults();
        this.noRendering = true;
        this.tpFieldsToMarkUp = ['price', 'list_price', 'rating'];
        this.hotSpotData = { ...this.el.dataset, records: [] };
        this.hotspotType = this.hotSpotData.hotspotType || 'static';
        this.controllerRoute = this.hotspotType === 'static' ? false : '/theme_prime/get_products_data';
    }
    start() {
        super.start();
        if (this.hotspotType === 'dynamic' && this.hotSpotData.onClickAction) {
            return;
        }
        let popoverParams = {
            trigger: "focus",
            placement: "auto",
            html: true,
            customClass: "tp-hotspot-popover",
            container: this.el.closest('#wrapwrap'),
            content: renderToString('tp_img_hotspot_popover_body', { widget: this, ...this.hotSpotData }),
        };
        this.el.setAttribute('tabindex', '0');
        if (this.editableMode) {
            popoverParams.trigger = 'manual';
            popoverParams.container = 'body';
        }
        this.popover = new window.Popover(this.el, popoverParams);
    }
    get fieldsToFetch() {
        return ['rating'];
    }
    get options() {
        if (this.hotspotType === 'dynamic') {
            return { model: 'product.template' };
        }
        return super.options;
    }
    get domain() {
        if (this.hotspotType === 'dynamic') {
            return [['id', 'in', this.getRecordsIDs()]];
        }
        return super.domain;
    }
    getRecordsIDs() {
        const productInfo = JSON.parse(this.el.dataset.productIds || '[]');
        let productIDs = productInfo.map(product => parseInt(product.id));
        return productIDs;
    }
    _onSuccessResponse(response) {
        let hasData = this._responseHasData(response);
        if (hasData) {
            this.hotSpotData = { ...this.hotSpotData, records: this._markUpValues(this.tpFieldsToMarkUp, response.products) };
        }
        if (this.popover) {
            this.popover._config.content = renderToString('theme_prime.tp_img_hotspot_dynamic_popover_content', { widget: this, ...this.hotSpotData });
        }
    }
    destroy() {
        if (this.popover) {
            this.popover.dispose();
        }
    }
    async _onClickHotSpot(ev) {
        if (this.hotspotType !== 'dynamic' && this.hotSpotData?.records.length && !this.editableMode) return;
        ev.stopPropagation();
        let firstProduct = this.hotSpotData.records[0];
        if (this.hotSpotData.onClickAction === 'openModal' && this.hotSpotData && !this.editableMode) {
            this.services.dialog.add(QuickViewDialog, {
                productTmplId: parseInt(firstProduct.id),
            });
        }
        if (this.hotSpotData.onClickAction === 'goToProductPage' && !this.editableMode) {
            window.open(firstProduct.website_url, '_blank');
        }
    }
    get ObserverNeedsToBeSet() {
        return super.ObserverNeedsToBeSet && this.el.dataset.hotspotType === 'dynamic';
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add("theme_prime.tp_img_hotspot_interaction", TpHotSpotInteraction);

// [TO-DO] should moved to droggol_theme_common
export class TpPreviewWrapper extends Interaction {
    static selector = '#tp_wrap';
    dynamicContent = {
        _root: {
            "t-on-click": this._onClick,
            "t-on-tp-reload": this._onReload,
        },
    };
    start() {
        super.start();
        window.dispatchEvent(new CustomEvent('TP_WRAPPER_READY'));
        document.body.classList.add('tp-preview-element');
        document.querySelector('.tp-bottombar-component .tp-bottom-action-btn').classList.add('pe-none');
    }
    _onClick(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    }
    _onReload() {
        this.domEl = this.el.querySelector('.tp-dynamic-snippet-prime');
        if (!this.domEl) {
            this.domEl = this.el.querySelector('section');
        }
        this._setOffsetPosition();
        return new Promise((resolve, reject) => {
            this.services["public.interactions"].stopInteractions(this.domEl);
            this.services["public.interactions"].startInteractions(this.domEl);
            resolve();
        });
    }
    _setOffsetPosition() {
        const containerEl = this.domEl.querySelector(':scope > .container:not(.s_inner_dynamic_products_block');
        if (containerEl) {
            containerEl.classList.remove('container');
            containerEl.classList.add('container-fluid');
        }
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add("theme_prime.tp_preview_wrapper", TpPreviewWrapper);

export class TpProductsSnippet extends composeMixins(DynamicProductSnippetBase, 'ProductsBlockMixins', 'SwiperMixin') {
    static selector = ".s_d_products_snippet_wrapper";
    get fieldsToFetch() {
        return [...new Set([...super.fieldsToFetch, 'name', 'website_ribbon_id', 'rating', 'public_categ_ids', 'product_variant_ids', 'dr_stock_label', 'colors'])];
    }
    /**
     * initialize Swiper.
     * @private
     */
    _modifyElementsAfterAppend() {
        super._modifyElementsAfterAppend();
        if (this.uiConfigInfo.mode === 'slider') {
            this.initializeSwiper(this.uiConfigInfo.ppr);
        }
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add("theme_prime.s_d_products_snippet", TpProductsSnippet);

export class TpSingleProductCountdown extends composeMixins(DynamicProductSnippetBase, 'ProductsBlockMixins') {
    static selector =".s_d_single_product_count_down_wrapper";
    get fieldsToFetch() {
        return [...new Set([...super.fieldsToFetch, 'name', 'offer_data', 'description_ecommerce'])];
    }
    _modifyElementsAfterAppend() {
        this._reloadInteractionNode({ selector: '.tp-countdown'});
        let { direction } = localization;
        new Swiper(this.el.querySelector('.tp-snippet-count-down-swiper'), { slidesPerView: 1, spaceBetween: 20, direction: 'horizontal', navigation: { nextEl: '.dr-swiper-button-next', prevEl: '.dr-swiper-button-prev' }, autoHeight: true, breakpoints: { 0: { slidesPerView: 1 } }, rtl: direction === 'rtl', ...swiperHelper });
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add("theme_prime.s_d_single_product_count_down_wrapper", TpSingleProductCountdown);

export class TpTwoColumnCards extends composeMixins(DynamicProductSnippetBase, 'ProductsBlockMixins', 'SwiperMixin') {
    static selector = ".s_two_column_card_wrapper";
    get fieldsToFetch() {
        return [...new Set([...super.fieldsToFetch, 'name', 'website_ribbon_id', 'rating', 'public_categ_ids', 'product_variant_ids', 'description_ecommerce', 'colors', 'dr_stock_label'])];
    }
    _setDefaultDataSetsFromNode(){
        super._setDefaultDataSetsFromNode();
        if (this.uiConfigInfo) {
            this.uiConfigInfo['ppr'] = 2;
        }
        this.selectionType = false;
        if (this.selectionInfo) {
            this.selectionType = this.selectionInfo.selectionType;
        }
    }
    _modifyElementsAfterAppend() {
        super._modifyElementsAfterAppend();
        this._reloadInteractionNode({ selector: '.tp-product-preview-swatches' });
        if (this.uiConfigInfo.mode === 'slider') {
            this.initializeSwiper(this.uiConfigInfo.ppr, true);
        }
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add("theme_prime.s_two_column_card_wrapper", TpTwoColumnCards);
export class TpProductsGrid extends composeMixins(DynamicProductSnippetBase, 'ProductsBlockMixins') {
    static selector = ".s_d_products_grid_wrapper";
    get fieldsToFetch() {
        return [...new Set([...super.fieldsToFetch, 'name', 'rating', 'public_categ_ids', 'offer_data'])];
    }
    get options() {
        if (!this.selectionInfo) {
            return false;
        }
        return super.options;
    }
    _modifyElementsAfterAppend() {
        super._modifyElementsAfterAppend();
        this._reloadInteractionNode({ selector: '.tp-countdown' });
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add("theme_prime.s_d_products_grid_wrapper", TpProductsGrid);

class tpDynamicTabsSnippet extends composeMixins(DynamicProductSnippetBase, "SwiperMixin", "MarkupRecords", "CategoryInteractionMixins", "TabsMixin") {
    static selector = ".s_d_categories_tabs_snippet_wrapper, .s_products_by_brands_tabs_wrapper";
    dynamicContent = {
        ...this.dynamicContent,
        ".d_category_tab": {
            "t-on-click": this._onCategoryTabClick,
        },
    };
    setup(){
        super.setup();
        this.isBrand = this.el.classList.contains('s_products_by_brands_tabs_wrapper') ? true : false;
    }
    get fieldsToFetch() {
        return [...new Set([...super.fieldsToFetch, 'name', 'description_ecommerce', 'website_ribbon_id', 'rating', 'public_categ_ids', 'product_template_image_ids', 'product_variant_ids', 'dr_stock_label', 'colors'])]
    }
    _getDomainValues(categoryID) {
        let { includesChild, sortBy, limit } = this.uiConfigInfo;
        var operator = '=';
        if (includesChild) {
            operator = 'child_of';
        }
        let domain = [['public_categ_ids', operator, categoryID]]
        if (this.isBrand) {
            domain = [['attribute_line_ids.value_ids', 'in', [categoryID]]];
        }
        return { domain: domain, options: { order: sortBy, limit: limit }, fields: this.fieldsToFetch };
    }
    /**
     * initialize Swiper.
     * @override
     */
    _modifyElementsAfterAppend() {
        super._modifyElementsAfterAppend();
        var categories = this.fetchedCategories;
        // if first categories is archive or moved to another website then activate first category
        if (categories.length && categories[0] !== this.initialCategory) {
            this._fetchAndAppendByCategory(categories[0]);
        }
        if (this.uiConfigInfo.mode === 'slider') {
            this.initializeSwiper(this.uiConfigInfo.ppr);
        }
    }
    _processData(data) {
        var categories = this.fetchedCategories;
        if (!categories.length) {
            this._appendNoDataTemplate();
            return [];
        }

        // if initialCategory is archive or moved to another website
        if (categories.length && categories[0] !== this.initialCategory) {
            return [];
        } else {
            this._markUpValues(this.tpFieldsToMarkUp, data.products);
            return data.products;
        }
    }
    /**
     * @override
     */
    _setDBData(data) {
        let recordsIDs = this.selectionInfo.recordsIDs || [];
        let categories = recordsIDs.map((categoryID) => { return data.categories.find(c => c.id === categoryID); });
        this.categories = categories.filter((x) => !!x);
        this.fetchedCategories = this.categories.map((category) => { return category.id; });
        this.selectionInfo.recordsIDs = this.fetchedCategories;
        super._setDBData(...arguments);
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add("theme_prime.s_d_categories_tabs_snippet", tpDynamicTabsSnippet);

class tpBrandsSnippet extends DynamicSnippetBase {
    static selector = ".s_d_brand_snippet_wrapper.tp-dynamic-snippet-prime";
    setup() {
        this.registryToUse = 'theme_prime_snippet_registry';
        super.setup();
    }
    get extraLibs() {
        return ['theme_prime.swiper'];
    }
    get fieldsToFetch() {
        return ['id', 'name', 'attribute_id'];
    }
    get options() {
        this.recordsIDs = this.selectionInfo && this.selectionInfo.recordsIDs || [];
        this.categories = this.el.dataset.categories;
        this.mode = this.uiConfigInfo && this.uiConfigInfo.mode || 'slider';
        this.cardStyle = this.uiConfigInfo && this.uiConfigInfo.style || 'tp_brand_card_style_1';
        return {
            limit: this.brandCount,
            recordsIDs: this.recordsIDs,
            categories: this.categories ? JSON.parse(this.categories) : false,
        };
    }
    _processData(data) {
        if (!this.recordsIDs.length) {
            return data;
        }
        let matchedRecords = [];
        this.selectionInfo.recordsIDs.forEach((resID) => {
            let record = data.find((rec) => rec.id === resID);
            if (record) {
                matchedRecords.push(record);
            }
        });
        return matchedRecords;
    }
    _modifyElementsAfterAppend() {
        super._modifyElementsAfterAppend();
        if (this.mode === 'slider') {
            new Swiper(this.el.querySelector('.tp-snippet-swiper'), { slidesPerView: 2, spaceBetween: 20, autoplay: { delay: 4000 }, rtl: localization.direction === 'rtl', breakpoints: { 576: { slidesPerView: 4 } } });
        }
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add("theme_prime.s_d_brand_snippet", tpBrandsSnippet);

class tpSingleCategory extends composeMixins(DynamicProductSnippetBase, "MarkupRecords", "CategoryInteractionMixins") {
    static selector = ".s_d_single_category_snippet_wrapper";
    get fieldsToFetch() {
        return [...new Set([...super.fieldsToFetch, 'name', 'rating', 'public_categ_ids'])];
    }
    get extraLibs() {
        return ['theme_prime.swiper'];
    }
    _setDBData(data) {
        var categories = data.categories;
        if (categories && categories.length) {
            this.categoryName = categories.length ? categories[0].name : false;
        }
        super._setDBData(data);
    }
    /**
     * initialize Swiper.
     * @private
     */
    _modifyElementsAfterAppend() {
        super._modifyElementsAfterAppend();
        this.initializeSwiper(this.uiConfigInfo.ppr);
    }
    /**
     * @private
     */
    _processData(data) {
        if (this.categoryName) {
            // group of 8 products
            var items = 8;
            if (uiUtils.isSmall() || uiUtils.getSize() === 3) {
                items = 4;
            }
            this._markUpValues(this.tpFieldsToMarkUp, data.products);
            var group = groupBy(data.products, function (product) {
                let index = data.products.findIndex(x => x.id === product.id);
                return Math.floor(index / (items));
            });
            return Object.keys(group).map((key) => group[key]);
        } else {
            return [];
        }
    }
    initializeSwiper() {
        const slider = this.el.querySelector('.droggol_product_category_slider');
        if (slider) {
            new Swiper(slider, { slidesPerView: 1, spaceBetween: 10, rtl: localization.direction === 'rtl', loop: true, navigation: { nextEl: this.el.querySelector('.dr-swiper-button-next'), prevEl: this.el.querySelector('.dr-swiper-button-prev') }, breakpoints: { 0: { slidesPerView: 1 } } });
        }
    }
}

registry.category('theme_prime.dynamic_snippet_registry').add("theme_prime.s_d_single_category_snippet", tpSingleCategory);

// [TO-DO] Implement tpSuggestedProductSlider review card style
class tpSuggestedProductSlider extends composeMixins(DynamicProductSnippetBase, "ProductsBlockMixins") {
    static selector = ".tp-suggested-product-slider";
    setup() {
        super.setup();
        this.registryToUse = 'theme_prime_snippet_registry';
    }
    get fieldsToFetch() {
        return [...new Set([...super.fieldsToFetch, 'website_ribbon_id', 'public_categ_ids'])];
    }
    get extraLibs() {
        return ['theme_prime.swiper'];
    }
    get currentSnippetID() {
        return 's_d_suggested_product_slider';
    }
    destroy() {
        super.destroy();
        if (this.swiper) {
            this.swiper.destroy();
            this.el.querySelector(".tp-prev").removeEventListener("click", this.swiper.slidePrev.bind(this.swiper));
            this.el.querySelector(".tp-next").removeEventListener("click", this.swiper.slideNext.bind(this.swiper));
        }
    }
    _modifyElementsAfterAppend() {
        super._modifyElementsAfterAppend();
        this.el.querySelector(".swiper").classList.remove("d-none");
        let breakpoints = { 1200: { slidesPerView: 3 } };
        if (!this.el.dataset.twoBlock) {
            Object.assign(breakpoints, { 992: { slidesPerView: 4 }, 1200: { slidesPerView: 6 } });
        }
        this.swiper = new Swiper(this.el.querySelector(".swiper"), { ...swiperHelper, slidesPerView: 2, spaceBetween: 10, mousewheel: { enabled: true, forceToAxis: true }, breakpoints: breakpoints });
        this.swiper.changeLanguageDirection(localization.direction);
        this.el.querySelector(".tp-next").addEventListener("click", () => this.swiper.isEnd ? this.swiper.slideTo(0, 500) : this.swiper.slideNext(500));
        this.el.querySelector(".tp-prev").addEventListener("click", () => this.swiper.isBeginning ? this.swiper.slideTo(this.swiper.slides.length - 1, 500) : this.swiper.slidePrev(500));
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add("theme_prime.s_d_suggested_product_slider", tpSuggestedProductSlider);
class tpSmallProductBlock extends composeMixins(DynamicProductSnippetBase, "ProductsBlockMixins") {
    static selector = ".s_d_product_small_block";
    setup() {
        super.setup();
        this.registryToUse = 'theme_prime_snippet_registry';
    }
    get fieldsToFetch() {
        return [...new Set([...super.fieldsToFetch, 'name', 'rating', 'public_categ_ids', 'website_ribbon_id'])];
    }
    get extraLibs() {
        return ['theme_prime.swiper'];
    }
    _adjustCardsHeight() {
        let slider = this.el.querySelector('.droggol_product_slider_top');
        const img = slider?.querySelector('.d-product-img');
        if (img && uiUtils.getSize() >= 3) {
            const adjustHeight = () => {
                const sideCard = slider.closest('.s_d_2_column_snippet')?.querySelector('.s_d_product_count_down .swiper-slide-active > .card');
                if (sideCard) {
                    const height = sideCard.getBoundingClientRect().height;
                    if (height > slider.getBoundingClientRect().height) {
                        slider.querySelectorAll('.swiper-slide').forEach(slide => slide.style.height = `${height+1}px`);
                    }
                }
            };
            img.removeEventListener('load', adjustHeight);
            img.addEventListener('load', () => setTimeout(adjustHeight, 300));
        }
    }
    /**
     * initialize owlCarousel.
     * @private
     */
    _modifyElementsAfterAppend() {
        super._modifyElementsAfterAppend();
        this.inConfirmDialog = this.el.classList.contains('in_confirm_dialog');
        if (this.inConfirmDialog) {
            this.el.querySelector('.s_d_product_small_block_body .container').classList.remove('container');
        }
        const slider = this.el.querySelector('.droggol_product_slider_top');
        if (slider) {
            this.swiper = new Swiper(slider, { slidesPerView: 2, spaceBetween: 20, rewind: true, rtl: localization.direction === 'rtl', navigation: { nextEl: this.el.querySelector('.dr-swiper-button-next'), prevEl: this.el.querySelector('.dr-swiper-button-prev') }, on: { init: this._adjustCardsHeight.bind(this) }, breakpoints: { 0: { slidesPerView: 2 }, 576: { slidesPerView: 2 }, 768: { slidesPerView: 2 }, 992: { slidesPerView: 2 }, 1200: { slidesPerView: 3 } } });
        }
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add("theme_prime.s_d_product_small_block", tpSmallProductBlock);

class tpSingleProductSnippet extends composeMixins(DynamicSnippetBase, 'ProductCarouselMixins') {
    static selector = ".s_d_single_product_snippet_wrapper";
    dynamicContent = {
        ...this.dynamicContent,
        ".d_single_product_container": {
            "t-on-tp-reload-swiper-node": (ev) => {this._initializeSwiperForProducts(this.el);},
        }
    };
    setup() {
        this.registryToUse = 'theme_prime_snippet_registry';
        super.setup();
    }
    _setDefaultDataSetsFromNode() {
        super._setDefaultDataSetsFromNode();
        if (this.selectionInfo) {
            var productIDs = this.selectionInfo.recordsIDs;
            // first category
            if (productIDs.length) {
                this.initialProduct = productIDs[0];
            }
        }
    }
    get options() {
        var options = {};
        if (this.initialProduct) {
            options['product_tmpl_id'] = this.initialProduct;
            options['main_product_classes'] = 'border rounded-2 p-3 align-self-start h-100 w-100 overflow-auto';
            return options;
        }
        return super.options;
    }
    _modifyElementsAfterAppend() {
        this._reloadInteractionNode({ selector: '.oe_website_sale' });
        if (this.el.classList.contains('s_d_single_product_cover_snippet_wrapper')) {return;}
        this.el.querySelectorAll("#product_detail > .row > .py-2").forEach(el => el.classList.remove("py-2"));
        this.el.querySelector(".tp-website-product-link").classList.add("d-none");
        this._initializeSwiperForProducts(this.el);
        // Bind navigation events to carousel blocks on initial rendering.
        const productContainer = this.el.querySelector('.oe_website_sale');
        bindCarousel({productContainer, editablemode:false});
        this._bindEvents();
    }
    get extraLibs() {
        return ['theme_prime.swiper'];
    }
    _initializeSwiperForProducts(target) {
        const carousel = target.querySelector("#o-carousel-product");
        if (!carousel) return;
        carousel.classList.add('d-none');
        const imageUrls = Array.from(carousel.querySelectorAll('.carousel-item .product_detail_img')).map(img => img.src);
        const swiperElement = target.querySelector('.tp-snippet-swiper');
        if (swiperElement?.swiper) {
            swiperElement.swiper.destroy(true, true);
            target?.querySelector('.droggol_product_slider')?.remove();
        }
        const fragment = renderToFragment('tp_product_images_slider', {images: imageUrls, widget: this});
        carousel.parentNode.insertBefore(fragment, carousel.nextSibling);
        const container = carousel.nextSibling;
        const mainSwiperEl = container.querySelector(".tp-snippet-swiper");
        const productDetails = target.querySelector('#product_details');
        if (mainSwiperEl && productDetails) {
            new Swiper(mainSwiperEl, { ...swiperHelper, spaceBetween: 10, navigation: { nextEl: container.querySelector(".dr-swiper-button-next"), prevEl: container.querySelector(".dr-swiper-button-prev") } });
        }
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add("theme_prime.s_d_single_product_snippet", tpSingleProductSnippet);
// [TO-DO] review XML of right panel and everything once onChangeCombinationInfo is refactored.
class TpSingleProductWithCoverSnippet extends tpSingleProductSnippet {
    static selector = ".s_d_single_product_cover_snippet_wrapper";
    get options() {
        var options = {};
        if (this.initialProduct) {
            options['product_tmpl_id'] = this.initialProduct;
            options['right_panel'] = true;
            return options;
        } else {
            return super.options;
        }
    }
    _modifyElementsAfterAppend() {
        super._modifyElementsAfterAppend();
        if (this.el.classList.contains('tp-show-variant-image')) {
            const imageEl = this.el.querySelector('.tp-variant-image');
            const carousel = this.el.querySelector("#o-carousel-product");
            const src = carousel.querySelector('.product_detail_img').attributes.src.value;
            if (src !== imageEl.src) {
                imageEl.classList.remove("tp-product-image-fade-animation");
                imageEl.src = src;
                imageEl.addEventListener('load', () => {
                    imageEl.classList.add("tp-product-image-fade-animation");
                }, { once: true });
            }
        }
        // Bind navigation events to carousel blocks on initial rendering.
        const productContainer = this.el.querySelector('.oe_website_sale');
        bindCarousel({productContainer, editablemode:false});
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add("theme_prime.s_d_single_product_cover_snippet_wrapper", TpSingleProductWithCoverSnippet);

class tpProductInnerContentSnippet extends composeMixins(DynamicProductSnippetBase, "ProductsBlockMixins") {
    static selector = '.s_inner_dynamic_products_block_wrapper';
    get fieldsToFetch() {
        return [...new Set([...super.fieldsToFetch, 'name', 'rating', 'public_categ_ids'])];
    }
    _setDefaults() {
        super._setDefaults();
        this.displayLoader = false;
    }
    setup() {
        super.setup();
        this.registryToUse = 'tp_inner_content_snippet_registry';
    }
    getWidthOfCard() {
        let cardRegistry = this.snippetWidgetsProps?.TpUiComponent?.cardRegistry;
        let width = 225;
        if (cardRegistry) {
            registry.category(cardRegistry)?.getEntries().forEach((item) => {
                let style = item[0];
                let config = item[1];
                if (style === this.uiConfigInfo.style) {
                    width = config.width || 225;
                }
            });
        }
        return width;
    }
    getSlidesPerView() {
        let calculated = Math.max(1, Math.floor(this.el.offsetWidth / this.getWidthOfCard()));
        return Math.max(1, Math.min(calculated, 5));
    }
    _onWindowResize() {
        super._onWindowResize();
        if (!this.editableMode) {
            this._onSuccessResponse(this.response);
        }
    }
    _modifyElementsAfterAppend() {
        super._modifyElementsAfterAppend();

        new Swiper(this.el.querySelector('.tp-snippet-swiper'), {
            slidesPerView: this.getSlidesPerView(),
            spaceBetween: 8,
            rtl: localization.direction === 'rtl',
            navigation: { nextEl: this.el.querySelector('.dr-next-sm'), prevEl: this.el.querySelector('.dr-prev-sm') },
            ...swiperHelper,
        });
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add('theme_prime.s_inner_dynamic_products_block_wrapper', tpProductInnerContentSnippet);
class tpImageProductsBlock extends composeMixins(DynamicProductSnippetBase, 'ProductsBlockMixins', 'MarkupRecords') {
    static selector = '.s_d_image_products_block_wrapper';
    get options() {
        return { ...super.options, 'shop_config_params': true };
    }
    get fieldsToFetch() {
        return [...new Set([...super.fieldsToFetch, 'name', 'rating', 'public_categ_ids'])];
    }
    _processData(data) {
        let products = this._getProducts(data);
        this._markUpValues(this.tpFieldsToMarkUp, products);
        let items = 8;
        if (uiUtils.isSmall()) {
            items = 4;
        }
        let group = groupBy(products, function (product) {
            let index = products.findIndex(x => x.id === product.id);
            return Math.floor(index / (items));
        });
        return Object.keys(group).map((key) => group[key]);
    }
    _modifyElementsAfterAppend() {
        super._modifyElementsAfterAppend();
        const slider = this.el.querySelector('.droggol_product_slider_top');
        if (slider) {
            new Swiper(slider, { slidesPerView: 1, spaceBetween: 10, rtl: localization.direction === 'rtl', navigation: { nextEl: this.el.querySelector('.dr-swiper-button-next'), prevEl: this.el.querySelector('.dr-swiper-button-prev') }, breakpoints: { 0: { slidesPerView: 1 }, 576: { slidesPerView: 1 }, 768: { slidesPerView: 1 }, 992: { slidesPerView: 1 }, 1200: { slidesPerView: 1 } } });
        }
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add('theme_prime.s_d_image_products_block', tpImageProductsBlock);

class tpTopCategoriesBlock extends composeMixins(DynamicSnippetBase, 'MarkupRecords') {
    static selector = '.s_d_top_categories';
    // [TO-DO] make default registry in baseClass
    setup() {
        this.registryToUse = 'theme_prime_snippet_registry';
        super.setup();
    }
    get options() {
        if (!this.selectionInfo) { return super.options;}
        return { params: { categoryIDs: this.selectionInfo.recordsIDs, sortBy: this.uiConfigInfo.sortBy, limit: this.uiConfigInfo.limit, includesChild: this.uiConfigInfo.includesChild } };
    }
    _setDBData(data) {
        super._setDBData(data);
        data = data || [];
        const fetchedCategoryIds = data.map(category => category.id);
        const recordsIDs = this.selectionInfo.recordsIDs || [];
        this.selectionInfo.recordsIDs = recordsIDs.filter(categoryID =>
            fetchedCategoryIds.includes(categoryID)
        );
    }
    _processData(data) {
        const recordsIDs = this.selectionInfo.recordsIDs || [];
        this._markUpValues(['min_price'], data);
        return recordsIDs.map(categoryID => data.find(c => c.id === categoryID));
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add('theme_prime.s_d_top_categories', tpTopCategoriesBlock);

class tpCategoryBlockSnippet extends composeMixins(DynamicProductSnippetBase, "ProductsBlockMixins") {
    static selector = '.s_category_snippet_wrapper';
    _setDefaultDataSetsFromNode() {
        super._setDefaultDataSetsFromNode();
        if (this.selectionInfo) {
            this.categoriesTofetch = [];
            this.categoriesTofetch = this.selectionInfo.recordsIDs;
            this.categoryStyle = this.uiConfigInfo.style;
        }
    }
    get fieldsToFetch() {
        return ['dr_category_label_id']
    }
    get options() {
        return { categoryIDs: this.categoriesTofetch, getCount: true };
    }
    _processData(data) {
        let categories = this.categoriesTofetch.map(categoryID => {
            return data.find(c => c.id === categoryID);
        });
        return categories.filter((x) => !!x);
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add('theme_prime.s_category_block_snippet', tpCategoryBlockSnippet);

// [TO-DO] on sale is not working
class TpProductListingCardsSnippet extends composeMixins(DynamicProductSnippetBase, 'ProductsBlockMixins', 'MarkupRecords') {
    static selector = '.s_product_listing_cards_wrapper, .s_image_product_listing_cards_wrapper';
    get fieldsToFetch() {
        return [...new Set([...super.fieldsToFetch, 'name', 'rating'])];
    }
    get options() {
        let value = pick(this.uiConfigInfo || {}, 'bestseller', 'newArrived', 'discount');
        value['mode'] = this.selectionInfo?.selectionType || 'manual';
        value['shop_config_params'] = true;
        return value;
    }
    get limit() {
        return this.uiConfigInfo.limit || 5;
    }
    _processData(data) {
        this.numOfCol = 12 / Object.keys(data.products).length;
        let result = [];
        let { products } = data;
        for (let key in products) {
            const list = products[key];
            let title;
            switch (key) {
                case 'bestseller':
                    title = _t("Best Seller");
                    break;
                case 'newArrived':
                    title = _t("Newly Arrived");
                    break;
                case 'discount':
                    title = _t("On Sale");
                    break;
            }
            if (title) {
                this._markUpValues(this.tpFieldsToMarkUp, list);
                result.push({ title, products: list });
            }
        }
        return result;
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add('theme_prime.s_product_listing_cards_wrapper', TpProductListingCardsSnippet);

class tpTwoColCountDown extends composeMixins(DynamicProductSnippetBase, 'ProductsBlockMixins') {
    static selector = '.s_d_product_count_down';
    get fieldsToFetch() {
        return [...new Set([...super.fieldsToFetch, 'name', 'description_ecommerce', 'rating', 'public_categ_ids', 'offer_data'])];
    }
    get extraLibs() {
        return ['theme_prime.swiper'];
    }
    get options() {
        let options = super.options;
        if (this.selectionType) {
            options = options || {};
            options['shop_config_params'] = true;
        }
        return options;
    }
    _setDBData(data) {
        this.shopParams = data.shop_config_params;
        super._setDBData(...arguments);
    }
    _modifyElementsAfterAppend() {
        super._modifyElementsAfterAppend(...arguments);
        const slider = this.el.querySelector('.droggol_product_slider_top');
        this._reloadInteractionNode({ selector: '.tp-countdown' });
        if (slider) {
            new Swiper(slider, { slidesPerView: 1, spaceBetween: 20, rewind: true, rtl: localization.direction === 'rtl', navigation: { nextEl: this.el.querySelector('.dr-swiper-button-next'), prevEl: this.el.querySelector('.dr-swiper-button-prev') }, breakpoints: { 0: { slidesPerView: 1 }, 768: { slidesPerView: 2 }, 992: { slidesPerView: 1 }, 1200: { slidesPerView: 1 } } });
        }
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add('theme_prime.s_product_count_down', tpTwoColCountDown);

class tpCategoryBrandsSnippet extends composeMixins(DynamicProductSnippetBase, 'ProductsBlockMixins') {
    static selector = '.s_category_small, .s_brands_small';
    get fieldsToFetch() {
        return [...new Set([...super.fieldsToFetch, 'name'])];
    }
    _getImgUrl(id) {
        return this._getResModel() === 'product.attribute.value' ? `/web/image/${this._getResModel()}/${id}/image` : `/web/image/${this._getResModel()}/${id}/image_128`;
    }
    _getItemUrl(record) {
        return this._getResModel() === 'product.attribute.value' ? `/shop?attribute_values=${record.attribute_id[0]}-${record.id}` : `/shop/category/${record.id}`;
    }
    _getBodyDetails(resModel) {
        let resModels = { 'product.attribute.value': { title: _t('Shop By Brands'), url: '/shop/all-brands' }, 'product.public.category': { title: _t('Shop By Categories'), url: '/shop' } };
        return resModels[resModel];
    }
    _getResModel() {
        return this.el.dataset.tpResModel;
    }
    get options() {
        return this.selectionInfo ? { model: this._getResModel() } : super.options;
    }
}

registry.category('theme_prime.dynamic_snippet_registry').add('theme_prime.s_category_small', tpCategoryBrandsSnippet);
class tpProductListingTabs extends composeMixins(DynamicProductSnippetBase, 'SwiperMixin', 'MarkupRecords', 'TabsMixin') {
    static selector = '.s_product_listing_tabs_wrapper';
    dynamicContent = {
        ...this.dynamicContent,
        ".d_category_tab": {
            "t-on-click": this._onCategoryTabClick,
        },
    };
    get fieldsToFetch() {
        return [...new Set([...super.fieldsToFetch, 'name', 'description_ecommerce', 'website_ribbon_id', 'rating', 'public_categ_ids', 'product_template_image_ids', 'product_variant_ids', 'dr_stock_label', 'colors'])];
    }
    _getDomainValues(recordID) {
        let { limit } = this.uiConfigInfo;
        let params = { limit: limit, fields: this.fieldsToFetch };
        let selectedTab = this.categories.find(c => c.id === recordID);
        let productListingType = selectedTab ? selectedTab.type : 'bestseller';
        if (productListingType === 'discount') {
            params['domain'] = [['dr_has_discount', '!=', false]];
        } else {
            params['order'] = this._getSortbyValue(productListingType);
        }
        if (this.domainRecordID) {
            params['options'] = { categoryID: this.domainRecordID };
        }
        return params;
    }
    _getSortbyValue(productListingType) {
        if (productListingType === 'bestseller') {
            return productListingType;
        }
        if (productListingType === "newArrived") {
            return 'create_date desc';
        }
        return false;
    }
    get options() {
        if (this.selectionInfo && this.selectionInfo.recordsIDs && this.selectionInfo.recordsIDs.length) {
            this.domainRecordID = this.selectionInfo.recordsIDs[0];
            return { categoryID: this.domainRecordID, shop_config_params: true };
        }
        return { shop_config_params: true };
    }
    _setDefaultDataSetsFromNode() {
        super._setDefaultDataSetsFromNode();
        this.initialType = false;
        this.categories = [];
        let labels = { bestseller: _t("Best Sellers"), discount: _t("On Sale"), newArrived: _t("Newly Arrived") };
        this.supportedTypes.forEach((type, index) => {
            this.initialType = !this.initialType && this.uiConfigInfo[type] ? type : this.initialType;
            if (this.uiConfigInfo[type]) {
                this.categories.push({ id: index + 1, name: labels[type], type: type });
            }
        });
    }
    _modifyElementsAfterAppend() {
        super._modifyElementsAfterAppend();
        if (this.uiConfigInfo.mode === 'slider') {
            this.initializeSwiper(this.uiConfigInfo.ppr);
        }
    }
    _processData(data) {
        this._markUpValues(this.tpFieldsToMarkUp, data.products);
        if (data.listing_category && data.listing_category.length) {
            this.listing_category = data.listing_category[0];
        }
        super._processData(data);
        return data.products;
    }
    get sortBy() {
        return this._getSortbyValue(this.initialType);
    }
    get limit() {
        return this.uiConfigInfo.limit || 5;
    }
    get domain() {
        return this.initialType === 'discount' ? [['dr_has_discount', '!=', false]] : false;
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add('theme_prime.s_product_listing_tabs_wrapper', tpProductListingTabs);

// Mega menus
class tpMegaMenuCategories extends composeMixins(DynamicSnippetBase) {
    static selector = '.s_tp_mega_menu_category_snippet';
    setup() {
        this.registryToUse = 'theme_prime_snippet_registry';
        super.setup();
    }
    _isActionEnabled(actionName, actions) {
        let allActions = actions || this.uiConfigInfo.activeActions;
        return allActions.includes(actionName);
    }
    get options() {
        if (this.selectionInfo && this.selectionInfo.recordsIDs) {
            return { categoryIDs: this.selectionInfo.recordsIDs };
        }
        return false;
    }
    get sortBy() {
        if (!this.uiConfigInfo) {return false;}
        return this.uiConfigInfo && this.uiConfigInfo.childOrder ? this.uiConfigInfo.childOrder : 'count';
    }
    get limit() {
        return this.uiConfigInfo && (this.uiConfigInfo.limit !== undefined) ? this.uiConfigInfo.limit : false;
    }
    destroy() {
        if (this.selectionInfo && this.uiConfigInfo) {
            super.destroy();
        }
    }
    _modifyElementsAfterAppend() {
        this._reloadInteractionNode({selector: '.tp-dynamic-snippet-prime'});
        this._reloadInteractionNode({selector: '.s_d_brand_snippet_wrapper'});
    }
    _getProductSelectionData() {
        return this.JaysonStringify({ selectionType: "advance", domain_params: { domain: [["public_categ_ids", "child_of", this.selectionInfo.recordsIDs]], limit: 5, order: "bestseller" } });
    }
    _getUIConfigData() {
        let config = {};
        config[this.uiConfigInfo.productListing] = true;
        return this.JaysonStringify(Object.assign({}, config, { 'limit': 3, 'style': 'tp_product_list_cards_4', 'header': 'tp_product_list_header_1', 'activeActions': ['rating', 'add_to_cart', 'wishlist', 'quick_view'], 'model': 'product.template' }));
    }
    _processData(data) {
        let result = this.uiConfigInfo ? [] : false;
        this.recordsIDs = [];
        let recordsIDs = this.selectionInfo.recordsIDs || [];
        recordsIDs.forEach((recordsID) => {
            let categoryRec = data.find(category => { return category.category.id === recordsID; });
            if (categoryRec) {
                result.push(categoryRec);
                this.recordsIDs.push(recordsID);
            }
        });
        return result;
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add('theme_prime.s_tp_mega_menu_categories_snippet', tpMegaMenuCategories);

class tpMegaMenuCategorySnippet extends DynamicSnippetBase {
    static selector = '.s_category_tabs_snippet_wrapper:not(.tp-side-menu), .s_tp_categories_menu';
    dynamicContent = {
        ...this.dynamicContent,
        ".tp-menu-category-tab": {
            "t-on-mouseenter": this._onActivateMenuItem,
            "t-on-click": this._onActivateMenuItem,
            "t-att-class": (tab) => ({
                "tp-active-category": parseInt(tab.getAttribute('tp-menu-id')) === this.activeCategory,
            })
        },
        ".tp-category-submenu": {
            "t-att-class": (submenu) => ({
                "d-none": parseInt(submenu.dataset.submenuId) !== this.activeCategory,
                "tp-fetched-submenu": this.fetchedMenus.includes(submenu.dataset.submenuId)
            })
        },
        ".tp-side-menu": {
            "t-on-mouseleave": this._onMouseLeave
        },
    };
    setup() {
        super.setup();
        this.activeCategory = false;
        this.fetchedMenus = [];
        this.registryToUse = 'theme_prime_snippet_registry';
        this.isMobileDevice = uiUtils.getSize() <= SIZES.MD;
        this.isSideMenu = false;
        if (this.el.classList.contains('s_tp_categories_menu')) {
            this.el.classList.add('tp-side-menu');
            this.isSideMenu = true;
        }
    }
    // hack
    get currentSnippetID() {
        return 's_mega_menu_category_tabs_snippet';
    }
    _onMouseLeave(){
        if (this.isSideMenu) {
            this.el.querySelector('.tp-submenu-float').classList.add('d-none');
            this.activeCategory = false;
        }
    }
    destroy() {
        if (this.selectionInfo && this.uiConfigInfo) {
            super.destroy();
        }
    }
    get limit() {
        return this.uiConfigInfo && this.uiConfigInfo.limit ? this.uiConfigInfo.limit : false;
    }
    get options() {
        let options = this.uiConfigInfo && this.uiConfigInfo.onlyDirectChild ? { onlyDirectChild: this.uiConfigInfo.onlyDirectChild } : {};
        return this.selectionInfo && this.selectionInfo.recordsIDs ? { ...options, categoryIDs: this.selectionInfo.recordsIDs } : false;
    }
    get sortBy() {
        return this.uiConfigInfo && this.uiConfigInfo.childOrder ? this.uiConfigInfo.childOrder : 'count';
    }
    _isActionEnabled(actionName, actions) {
        let allActions = actions || this.uiConfigInfo.activeActions;
        return allActions.includes(actionName);
    }
    _activateCategory(categoryID) {
        if (!this.editableMode) {
            this.el.querySelector('.tp-submenu-float')?.classList.remove('d-none');
        }
        let $submenu = this.el.querySelector(".tp-category-submenu[data-submenu-id='" + categoryID + "']");
        if (!$submenu.classList.contains('tp-fetched-submenu')) {
            this._activateCategorySubmenu($submenu);
        } else {
            this._setOffsetPosition(this.el.querySelector(".tp-menu-category-tab[tp-menu-id='" + categoryID + "']"));
        }
        this.activeCategory = categoryID;
    }
    _isLabelActive () {
        return this.uiConfigInfo && this.uiConfigInfo.menuLabel;
    }
    _activateCategorySubmenu(target) {
        this._reloadInteractionNode({ target: target.querySelector(':scope > .tp-mega-menu-snippet') });
        if (!this.fetchedMenus.includes(target.dataset.submenuId)) {
            this.fetchedMenus.push(target.dataset.submenuId);
        }
    }
    getCategoryConfigData(categoryID) {
        if (this.uiConfigInfo && this.uiConfigInfo.categoryTabsConfig && this.uiConfigInfo.categoryTabsConfig.records) {
            let records = this.uiConfigInfo.categoryTabsConfig.records || [];
            let record = records.find((res) => res.id === categoryID);
            if (record) {
                record['activeActions'] = [];
                // force create activeActions array coz boolean is not acceptable
                ['brand', 'label', 'count'].forEach(actionName => {
                    if (record[actionName]) {
                        record.activeActions.push(actionName);
                    }
                });
                return record;
            }
        }
        return {};
    }
    /**
     * Set value for primary attrs
     * @private
     * @param data {Object}
     * @return {String}
     */
    _getSelectionData(data) {
        return JSON.stringify({ selectionType: "manual", recordsIDs: data.map((child) => { return child.id }) });
    }
    /**
     * Set value for secondary attrs
     * @private
     * @param categoryID {Integer}
     * @return {Object}
     */
    _getUIConfigData(categoryID) {
        let { style, limit, activeActions, background, productListing } = this.getCategoryConfigData(categoryID);
        return { productListing: productListing || 'bestseller', background: background || false, style: style || 's_tp_hierarchical_category_style_1', limit: limit, activeActions: activeActions || [], model: "product.public.category" };
    }
    _modifyElementsAfterAppend() {
        super._modifyElementsAfterAppend();

        if (this.activeCategory) {
            this._activateCategory(this.activeCategory);
        }
        if (this.editableMode && this.uiConfigInfo.categoryTabsConfig && this.uiConfigInfo.categoryTabsConfig.activeRecordID) {
            this._activateCategory(this.uiConfigInfo.categoryTabsConfig.activeRecordID);
        }
        if (this.isSideMenu) {
            let target = this.el.querySelector('.s_category_tabs_snippet_wrapper');
            let width = target.offsetWidth * 3.29;
            if (target.querySelector('.tp-submenu-float')) {
                target.querySelector('.tp-submenu-float').style.maxWidth = `${width}px`;
                target.querySelector('.tp-submenu-float').style.width = `${width}px`;
            }
        }
    }
    _processData(data) {
        let result = [];
        let recordsIDs = this.selectionInfo.recordsIDs || [];
        recordsIDs.forEach((recordsID) => {
            let categoryRec = data.find(category => { return category.category.id === recordsID; });
            if (categoryRec && categoryRec.category) {
                let res = this.getCategoryConfigData(categoryRec.category.id);
                let child = res.child;
                categoryRec['child'] = categoryRec.child.slice(0, child);
                result.push(categoryRec);
            }
        });
        // Changed the active category before rendering otherwise _modifyElementsAfterAppend will not do updateContent
        if (!this.editableMode && !this.el.classList.contains('tp-side-menu') && result.length) {
            this.activeCategory = result[0].category.id;
        }
        return result;
    }
    _setOffsetPosition(target) {
        if (this.isMobileDevice && target) {
            const topMenuCollapse = document.getElementById('top_menu_collapse');
            if (topMenuCollapse) {
                const { top: targetTop } = target.getBoundingClientRect();
                const { top: containerTop } = topMenuCollapse.getBoundingClientRect();
                const offsetTop = targetTop - containerTop;
                topMenuCollapse.scrollTop += offsetTop < 0 ? offsetTop : -topMenuCollapse.scrollTop;
            }
        }
    }
    /**
     * @private
     * @param ev {Object} event
     */
    _onActivateMenuItem(ev) {
        if (this.editableMode) {
            return;
        }
        if (this.isMobileDevice && ev.type === 'mouseover') {
            return;
        }
        let menuID = parseInt(ev.currentTarget.getAttribute('tp-menu-id'));
        ev.stopPropagation();
        if (!ev.currentTarget.classList.contains('tp-active-category')) {
            this._activateCategory(menuID);
        }
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add('theme_prime.s_mega_menu_categories_tabs_snippet', tpMegaMenuCategorySnippet);

class tpProductRatings extends composeMixins(DynamicSnippetBase, 'ProductsBlockMixins', 'MarkupRecords') {
    static selector = '.s_tp_products_rating_wrapper';
    setup() {
        this.registryToUse = 'theme_prime_snippet_registry';
        super.setup();
    }
    get fieldsToFetch() {
        return ['rating_ids'];
    }
    get extraLibs() {
        return ['theme_prime.swiper'];
    }
    _setDefaults() {
        super._setDefaults();
        this.tpFieldsToMarkUp = ['price', 'list_price', 'rating'];
        this.snippetNodeAttrs = [...this.snippetNodeAttrs, 'uiConfigInfo'];
    }
    _modifyElementsAfterAppend() {
        super._modifyElementsAfterAppend();
        let { direction } = localization;
        let breakpoints = {0: { slidesPerView: 1 }, 576: { slidesPerView: 2 }, 1200: { slidesPerView: 3 }};
        if (this.uiConfigInfo && ['tp_rating_snippet_style_3', 'tp_rating_snippet_style_4'].includes(this.uiConfigInfo.style)) {
            breakpoints['1200'] = { slidesPerView: 2 };
            breakpoints['576'] = { slidesPerView: 1 };
        }
        new Swiper(this.el.querySelector('.tp-snippet-swiper'), { slidesPerView: 1, spaceBetween: 20, direction: 'horizontal', navigation: { nextEl: '.dr-swiper-button-next', prevEl: '.dr-swiper-button-prev' }, autoHeight: true, breakpoints: breakpoints, rtl: direction === 'rtl', ...swiperHelper });
    }
    _processData(data, ...args) {
        super._processData?.(data, ...args);
        if (!data.products) return [];
        data['products'] = data.products.filter(product => product.rating_info);
        let processedData = this._getProducts(data);
        if (data.products) {
            this._markUpValues(this.tpFieldsToMarkUp, data.products);
        }
        processedData.forEach(product => {
            this._markUpValues(['comment', 'rating'], [product.rating_info]);
        });
        return processedData;
    }
}
registry.category('theme_prime.dynamic_snippet_registry').add('theme_prime.s_tp_products_rating', tpProductRatings);