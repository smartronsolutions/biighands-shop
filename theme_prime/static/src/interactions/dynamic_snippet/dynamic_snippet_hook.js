import { user } from "@web/core/user";
import { loadBundle } from "@web/core/assets";
import { markup } from "@odoo/owl";
import { localization } from "@web/core/l10n/localization";
import { rpc } from "@web/core/network/rpc";
import { renderToElement } from "@web/core/utils/render";

export function isPublicUser() {
    return !user.isInternalUser;
}

export async function _primeLoadExtras(extraLibs, extraMethod) {
    /**
     * @private
     * As method name suggest will refector someday
     */
    var proms = [];
    await Promise.all(extraLibs.map(async (lib) => { await loadBundle(lib); }));
    return await Promise.all(proms).then(() => { if (extraMethod) { extraMethod(); } });
};

export function markUpValues(fieldNames, records) {
    records.forEach(record => {
        for (const fieldName of fieldNames) {
            if (record[fieldName]) {
                record[fieldName] = markup(record[fieldName]);
            }
        }
    });
    return records;
}

// Binds navigation events to individual Carousel blocks.
// This ensures correct behavior when multiple Carousel instances exist on the same page.
export function bindCarousel({productContainer, editablemode=false}) {
    const carousel = productContainer.querySelector('#o-carousel-product');
    if (carousel && !editablemode) {
        const bsCarousel = window.Carousel.getInstance(carousel);
        carousel.removeAttribute('data-bs-ride');
        carousel.querySelectorAll('[data-bs-slide], [data-bs-target]').forEach(el => {
            el.removeAttribute('data-bs-slide');
            el.removeAttribute('data-bs-target');
            el.classList.add('cursor-pointer');
        });
        // // Handle next control
        const nextBtn = carousel.querySelector('.carousel-control-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', ev => {
                ev.preventDefault();
                ev.stopPropagation();
                bsCarousel.next();
            });
        }
        // Handle prev control
        const prevBtn = carousel.querySelector('.carousel-control-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', ev => {
                ev.preventDefault();
                ev.stopPropagation();
                bsCarousel.prev();
            });
        }
        // Handle indicator clicks
        carousel.querySelectorAll('.carousel-indicators li').forEach((indicator, idx) => {
            indicator.addEventListener('click', ev => {
                ev.preventDefault();
                ev.stopImmediatePropagation();
                bsCarousel.to(idx);
            });
        });
    }
}

export let swiperHelper = {
    on: {
        reachEnd(sw) {
            sw.navigation.nextEl?.addEventListener("click", () => { sw.slideTo(0, 300); }, { once: true });
        },
        reachBeginning(sw) {
            sw.navigation.prevEl?.addEventListener("click", () => { sw.slideTo(sw.slides.length - 1, 300); }, { once: true });
        }
    }
}

// And magic start happens
const tpMixinRegistry = new Map();

// Define a mixin with a name + default implementation
export function defineMixin(name, impl) {
    if (tpMixinRegistry.has(name)) {
        console.warn(`[MixinRegistry] Mixin '${name}' already defined. Skipping new definition.`);
        return;
    }
    tpMixinRegistry.set(name, impl);
}

// Get the current mixin implementation
export function getMixin(name) {
    const impl = tpMixinRegistry.get(name);
    if (!impl) {
        throw new Error(`[MixinRegistry] Mixin '${name}' not defined`);
    }
    return impl;
}

// Override mixin globally: chain new impl on top of old one
// Let makes developers happy :)
// If you're reading this method, you're giving me some blessings for sure :)
export function overrideMixin(name, impl) {
    if (!tpMixinRegistry.has(name)) {
        console.warn(`[MixinRegistry] Mixin '${name}' not defined, defining new one instead.`);
        tpMixinRegistry.set(name, impl);
        return;
    }
    const prev = tpMixinRegistry.get(name);

    // Chain: new impl(Base) extends prev(Base)
    const composed = (Base) => impl(prev(Base));

    tpMixinRegistry.set(name, composed);
}

// Compose multiple mixins by name
// make sure patch works as expected
export function composeMixins(Base, ...names) {
    return names.reduce((Cls, name) => getMixin(name)(Cls), Base);
}

defineMixin("ProductsBlockMixins", (Base) => class extends Base {
    _setDefaultDataSetsFromNode() {
        super._setDefaultDataSetsFromNode?.();
        this.selectionType = false;
        if (this.selectionInfo) {
            this.selectionType = this.selectionInfo.selectionType;
        }
    }

    /**
    * @private
    */
    get domain() {
        let domain = false;
        switch (this.selectionType) {
            case 'manual':
                if (this.selectionInfo.recordsIDs) {
                    domain = [['id', 'in', this.selectionInfo.recordsIDs]];
                }
                break;
            case 'advance':
                if (Array.isArray(this.selectionInfo.domain_params.domain)) {
                    domain = this.selectionInfo.domain_params.domain;
                }
                break;
        }
        return domain ? domain : super.domain;
    }

    /**
    * @private
    */
    get limit() {
        return (this.selectionType === 'advance'
            ? this.selectionInfo.domain_params.limit || 5
            : super.limit);
    }

    /**
    * @private
    */
    get sortBy() {
        return (this.selectionType === 'advance'
            ? this.selectionInfo.domain_params.order
            : super.sortBy);
    }

    /**
    * @private
    */
    _getProducts(data) {
        let { products } = data;
        let selectionInfo = this.selectionInfo;
        if (selectionInfo && selectionInfo.selectionType === 'manual') {
            products = selectionInfo.recordsIDs.map(productID => {
                let results = (data && data.products) || data;
                return results.find(p => p.id === productID) || false;
            });
        }
        return products.filter(x => !!x);
    }
    /**
    * @private
    */
    _processData(data, ...args) {
        super._processData?.(data, ...args);
        return this._getProducts(data);
    }
});

defineMixin("MarkupRecords", (Base) => class extends Base {
    _markUpValues(fields, products) {
        return markUpValues(fields, products);
    }
});

defineMixin("SwiperMixin", (Base) => class extends Base {
    initializeSwiper(ppr, isTwoColLayout) {
        let breakpoints = {0: { slidesPerView: 1 },576: { slidesPerView: 2 },768: { slidesPerView: 3 },992: { slidesPerView: 3 },1200: { slidesPerView: ppr }};
        if (this.uiConfigInfo_init && this.uiConfigInfo_init.mobileConfig && this.uiConfigInfo_init.mobileConfig.style !== 'default') {
            breakpoints[0] = { slidesPerView: 2 };
        }
        if (isTwoColLayout) {
            breakpoints = {0: { slidesPerView: 1 }, 576: { slidesPerView: ppr }};
        }
        let { direction } = localization;
        let sliders = this.el.querySelectorAll('.tp-snippet-swiper:not(.swiper-initialized)');
        sliders.forEach(slider => {
            new Swiper(slider, {
                slidesPerView: 1,
                spaceBetween: 14,
                direction: 'horizontal',
                navigation: {
                    nextEl: slider.parentNode.querySelector('.dr-swiper-button-next'),
                    prevEl: slider.parentNode.querySelector('.dr-swiper-button-prev'),
                },
                breakpoints: breakpoints,
                rtl: direction === 'rtl',
                ...swiperHelper,
            })
        })
    }
});

defineMixin("TabsMixin", (Base) => class extends Base {
    _getDomainValues(recordID) {
        return {};
    }
    /**
     * Activate clicked category
     * @param {Integer} recordID
     * @private
     */
    _activateTab(recordID) {
        this.el.querySelectorAll('.d_s_category_cards_item').forEach(el => el.classList.add('d-none'));
        this.el.querySelector('.d_s_category_cards_item[data-category-id="' + recordID + '"]')?.classList.remove('d-none');
    }
    /**
     * Fetch and render products for category
     * @private
     * @param {Integer} recordID
     */
    _fetchAndAppendByCategory(recordID) {
        this._activateTab(recordID);
        this._fetchProductsByDomain(this._getDomainValues(recordID)).then(data => {
            this._renderNewProducts(data.products, recordID);
        });
    }
    /**
    * @private
    * @returns {Integer} recordID
    */
    _fetchProductsByDomain(params) {
        return rpc(this.controllerRoute, params);
    }
    /**
     * Render and append new products.
     * @private
     * @param {Array} products
     * @param {Integer} recordID
     */
    _renderNewProducts(products, recordID) {
        this._markUpValues(this.tpFieldsToMarkUp, products);
        var templateEl = renderToElement('d_s_category_cards_item', { data: products, widget: this, recordID: recordID });
        this.el.querySelector('.d_loader_default').remove();
        this.el.querySelector('.d_s_category_cards_container').appendChild(templateEl);
        this.initializeSwiper(this.uiConfigInfo.ppr);
        this._reloadInteractionNode({ selector: '.tp_show_similar_products' });
        this._reloadInteractionNode({ selector: '.tp-product-preview-swatches' });
        this._reloadInteractionNode({ selector: '.tp-product-quick-view-action' });
        this.updateContent();
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {Event} ev
     */
    _onCategoryTabClick(ev) {
        var {currentTarget} = ev;
        this.el.querySelectorAll('.d_category_tab').forEach(el => el.classList.remove('d_active'));
        currentTarget.classList.add('d_active');
        var recordID = parseInt(currentTarget.getAttribute('data-category-id'), 10);
        if (!this.el.querySelectorAll('.d_s_category_cards_item[data-category-id="' + recordID + '"]').length) {
            if (this.loaderTemplate) {
                var templateEl = renderToElement(this.loaderTemplate);
                templateEl.classList.add('d_loader_default');
                this.el.querySelector('.d_s_category_cards_container').appendChild(templateEl);
            }
            this._fetchAndAppendByCategory(recordID);
        } else {
            this._activateTab(recordID);
        }
    }
});

defineMixin("CategoryInteractionMixins", (Base) => class extends Base {
    _setDefaultDataSetsFromNode() {
        super._setDefaultDataSetsFromNode?.();
        if (this.selectionInfo) {
            var categoryIDs = this.selectionInfo.recordsIDs;
            // first category
            this.initialCategory = categoryIDs.length ? categoryIDs[0] : false;
        }
    }
    /**
     * @private
     * @returns {Array} options
     */
    get options() {
        var options = super.options || {};
        if (!this.initialCategory) {
            return false;
        }
        var categoryIDs = this.selectionInfo.recordsIDs;
        options['order'] = this.uiConfigInfo.sortBy;
        options['limit'] = this.uiConfigInfo.limit;
        // category name id vadi dict first time filter render karva mate
        if (!this.isBrand) {
            options['get_categories'] = true;
        } else {
            options['get_brands'] = true;
        }
        options['categoryIDs'] = categoryIDs;
        options['categoryID'] = this.initialCategory;
        return options;
    }
    /**
     * @private
     * @returns {Array} domain
     */
    get domain() {
        if (!this.initialCategory) {
            return false;
        }
        var operator = '=';
        if (this.uiConfigInfo.includesChild) {
            operator = 'child_of';
        }
        let domain = [['public_categ_ids', operator, this.initialCategory]]
        if (this.isBrand) {
            domain = [['attribute_line_ids.value_ids', 'in', [this.initialCategory]]];
        }
        return domain;
    }
});
const initializedCarousels = new Set();
defineMixin("ProductCarouselMixins", (Base) => class extends Base {
    /**
 * Binds carousel events to a single carousel element.
 * @param {HTMLElement} $carousel The specific carousel element to bind events to.
 */
    _bindEvents() {
    }
});