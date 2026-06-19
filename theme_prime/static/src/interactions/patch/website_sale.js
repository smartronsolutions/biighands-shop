import { markup } from "@odoo/owl";
import { Sidebar } from "@theme_prime/js/sidebar/sidebar";
import { loadBundle } from "@web/core/assets";
import { localization } from "@web/core/l10n/localization";
import { _t } from "@web/core/l10n/translation";
import { KeepLast } from "@web/core/utils/concurrency";
import { patch } from "@web/core/utils/patch";
import { renderToElement } from "@web/core/utils/render";
import { redirect } from '@web/core/utils/urls';
import { patchDynamicContent } from "@web/public/utils";
import { WebsiteSale } from "@website_sale/interactions/website_sale";
import wSaleUtils from "@website_sale/js/website_sale_utils";
import { bindCarousel } from '@theme_prime/interactions/dynamic_snippet/dynamic_snippet_hook';

export function getSearchParams(filters, searchParams) {
    const attributeValues = new Map();
    const tags = new Set();
    const ratings = new Set();
    let hideOutOfStock = false;
    for (const filter of filters) {
        if (filter.value) {
            if (filter.name === "attribute_value") {
                // Group attribute value ids by attribute id.
                const [attributeId, attributeValueId] = filter.value.split("-");
                const valueIds = attributeValues.get(attributeId) ?? new Set();
                valueIds.add(attributeValueId);
                attributeValues.set(attributeId, valueIds);
            } else if (filter.name === "tags") {
                tags.add(filter.value)
            } else if (filter.name === "rating") {
                ratings.add(filter.value)
            } else if (filter.name === "hide_out_of_stock") {
                hideOutOfStock = true;
            }
        }
    }
    // Aggregate all attribute values belonging to the same attribute into a single
    // `attribute_values` search param.
    for (const entry of attributeValues.entries()) {
        searchParams.append("attribute_values", `${entry[0]}-${[...entry[1]].join(",")}`);
    }
    // Aggregate all tags into a single `tags` search param.
    if (tags.size) {
        searchParams.set("tags", [...tags].join(","));
    }
    if (ratings.size) {
        searchParams.set("rating", [...ratings].join(","));
    }
    if (hideOutOfStock) {
        searchParams.set("hide_out_of_stock", 1);
    }
    return searchParams;
}

patch(WebsiteSale.prototype, {
    setup() {
        super.setup();
        this.keepLast = new KeepLast();
        this.driftImages = [];

        patchDynamicContent(this.dynamicContent, {
            ".tp-load-more-btn": { "t-on-click": this.onClickLoadMoreBtn.bind(this) },
            ".tp-bulk-price-block": { "t-on-click": this.onClickBulkQty.bind(this) },
            ".tp-open-filter-sidebar": { "t-on-click": this.onClickOpenFilterSidebar.bind(this) },
        });

        this.onClickOpenFilterSidebarBound = this.onClickOpenFilterSidebar.bind(this);
        const filterToggleBtns = document.querySelectorAll(".tp-filter-bottom-sidebar-toggle");
        filterToggleBtns.forEach(btn => {
            btn.removeEventListener("click", this.onClickOpenFilterSidebarBound);
            btn.addEventListener("click", this.onClickOpenFilterSidebarBound);
        });
    },
    async willStart() {
        const zoomConfig = odoo.dr_theme_config.json_zoom;
        if (zoomConfig.zoom_enabled) {
            await loadBundle("theme_prime.drift_zoom");
        }
    },
    start() {
        if (this.el.querySelector(".tp-load-more-on-scroll")) {
            this.loadMoreObserver = new IntersectionObserver(entries => {
                entries.forEach((entry) => {
                    if (entry.intersectionRatio > 0) {
                        this.loadMoreProducts(this.el.querySelector(".tp-load-more-on-scroll").getAttribute("href"));
                        this.el.querySelector(".tp-load-more-on-scroll").remove();
                    }
                })
            }, {});
            this.loadMoreObserver.observe(this.el.querySelector(".tp-load-more-on-scroll"));
        }
        super.start();
    },
    _startZoom() {
        const zoomConfig = odoo.dr_theme_config.json_zoom;
        if (zoomConfig.zoom_enabled) {
            const namespace = localization === "rtl" ? "tp-rtl" : "tp";
            const images = this.el.querySelectorAll(".product_detail_img");
            for (const image of images) {
                image.classList.add("cursor-pointer");
                const imageVals = { namespace: namespace, sourceAttribute: "src", inlineOffsetY: -50, paneContainer: image.parentElement, zoomFactor: zoomConfig.zoom_factor || 2, inlinePane: 992, touchDelay: 500 };
                const zoomImage = image.dataset.zoomImage;
                if (zoomImage) {
                    imageVals.sourceAttribute = "data-zoom-image";
                    this.driftImages.push(new Drift(image, imageVals));
                }
            }
        } else {
            super._startZoom(...arguments);
        }
    },
    _onChangeCombination(ev, parent, combination) {
        // Discount percentage
        const priceContainer = parent.querySelector("div[name='product_price_container']");
        if (priceContainer) {
            let percentageEl = priceContainer.querySelector(".tp-discount-percentage");
            if (combination.has_discounted_price) {
                const percentage = Math.round((combination.list_price - combination.price) / combination.list_price * 100);
                if (percentage) {
                    const percentageText = `(${percentage}% OFF)`;
                    if (percentageEl) {
                        percentageEl.textContent = percentageText;
                    } else {
                        percentageEl = document.createElement("small");
                        percentageEl.className = "tp-discount-percentage d-none d-md-inline-block";
                        percentageEl.textContent = percentageText;
                        priceContainer.appendChild(percentageEl);
                    }
                } else if (percentageEl) {
                    percentageEl.remove();
                }
            } else if (percentageEl) {
                percentageEl.remove();
            }
        }

        // Product Price Offer
        const productPriceOfferContainer = parent.querySelector(".tp-product-price-offer-container");
        if (productPriceOfferContainer) {
            productPriceOfferContainer.innerHTML = "";
            if (combination.product_price_offer && typeof combination.product_price_offer === "object") {
                const offerElement = renderToElement("theme_prime.ProductPriceOffer", combination.product_price_offer);
                productPriceOfferContainer.appendChild(offerElement);
                this.services["public.interactions"].stopInteractions(productPriceOfferContainer);
                this.services["public.interactions"].startInteractions(productPriceOfferContainer);
            }
        }

        // Bulk Price
        const bulkPriceContainer = parent.querySelector(".tp-bulk-price-container");
        if (bulkPriceContainer) {
            bulkPriceContainer.innerHTML = "";
        }
        if (combination.bulk_price && combination.bulk_price.length) {
            let doRenderPrices = combination.bulk_price.length === 1 ? combination.bulk_price[0].qty > 1 : true;
            if (doRenderPrices && bulkPriceContainer) {
                const inputQtyEl = parent.querySelector("input[name='add_qty']");
                const inputQty = inputQtyEl ? parseInt(inputQtyEl.value) : 1;
                const bulkElement = renderToElement("theme_prime.BulkPrice", {
                    prices: combination.bulk_price,
                    inputQty: inputQty,
                    markup,
                    parseInt,
                });
                bulkPriceContainer.appendChild(bulkElement);
            }
        }

        // Extra Fields
        if (combination.tp_extra_fields) {
            const extraFields = parent.querySelector(".tp_extra_fields");
            if (extraFields) {
                extraFields.replaceWith(
                    (() => {
                        const tempDiv = document.createElement("div");
                        tempDiv.innerHTML = combination.tp_extra_fields;
                        return tempDiv.firstElementChild;
                    })()
                );
            }
        }

        super._onChangeCombination(...arguments);

        if (this.el.closest('.tp-product-variant-selector-modal-dialog')) {
            this.el.querySelector('.carousel').classList.add("d_shop_product_details_carousel");
        }
        if (this.el.closest('.d_single_product_container')) {
            this.el.closest(".d_single_product_container").dispatchEvent(new CustomEvent('tp-reload-swiper-node'));
        }
    },
    _updateProductImage(productContainer, newImages) {
        super._updateProductImage(...arguments);
        const container = productContainer.closest('.tp-show-variant-image');
        if (container) {
            const imageEl = container.querySelector('.tp-variant-image');
            const carousel = productContainer.querySelector(this._getProductImageContainerSelector());
            const src = carousel.querySelector('.product_detail_img').attributes.src.value;
            if (src !== imageEl.src) {
                imageEl.classList.remove("tp-product-image-fade-animation");
                imageEl.src = src;
                imageEl.addEventListener('load', () => {
                    imageEl.classList.add("tp-product-image-fade-animation");
                }, { once: true });
            }
        }
        // Bind navigation events for Carousel blocks on variant change
        bindCarousel({productContainer, editablemode:this._isEditorEnabled()});
    },
    onClickReviewsLink() {
        if (document.querySelector('#o_product_page_reviews_content')) {
            super.onClickReviewsLink(...arguments);
        }
    },
    onClickBulkQty(ev) {
        const parent = wSaleUtils.getClosestProductForm(ev.currentTarget);
        const qtyInput = parent.querySelector("input[name='add_qty']");
        if (qtyInput) {
            qtyInput.value = ev.currentTarget.dataset.qty;
            qtyInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
    },
    _setUrlHash() {
        if (!this.el.classList.contains("tp-ignore-variant-change-url")) {
            super._setUrlHash(...arguments);
        }
    },
    onChangeAttribute(ev) {
        // Prevent range slider on change
        if (ev.currentTarget.classList.contains("tp-slider")) {
            return;
        }

        const productGrid = this.el.querySelector(".o_wsale_products_grid_table_wrapper");
        if (productGrid) {
            productGrid.classList.add("opacity-50");
        }
        const form = wSaleUtils.getClosestProductForm(ev.currentTarget);
        const filters = form.querySelectorAll("input:checked, select");
        const url = new URL(form.action);
        const searchParams = url.searchParams;
        redirect(`${url.pathname}?${this.getSearchParams(filters, searchParams).toString()}`);
    },
    getSearchParams(filters, searchParams) {
        return getSearchParams(filters, searchParams);
    },
    onClickLoadMoreBtn(ev) {
        ev.preventDefault();
        this.loadMoreProducts(ev.currentTarget.getAttribute("href"));
        ev.currentTarget.remove();
    },
    loadMoreProducts(url) {
        const loader = renderToElement("theme_prime.Loader", { height: "20vh" });
        const pager = this.el.querySelector(".tp-product-pager");
        if (pager) {
            pager.appendChild(loader);
        }

        this.keepLast.add(
            fetch(url, { method: "GET" })
            .then(response => response.text())
        ).then(data => {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = data;

            const newItems = tempDiv.querySelectorAll(".tp-product-item");
            let lastItem = this.el.querySelector(".tp-product-item:last-child");
            newItems.forEach(item => {
                lastItem.after(item);
                lastItem = item;
            });

            const newPager = tempDiv.querySelector(".tp-product-pager");
            const oldPager = this.el.querySelector(".tp-product-pager");
            if (newPager && oldPager) {
                oldPager.replaceWith(newPager);
            }

            this.services["public.interactions"].stopInteractions(this.el);
            this.services["public.interactions"].startInteractions(this.el);
        });
    },
    onClickOpenFilterSidebar(ev) {
        ev.preventDefault();
        // Clear sliders
        document.querySelectorAll(".tp-slider").forEach(el => {
            el.noUiSlider && el.noUiSlider.destroy();
        })

        const el = document.createElement("div");
        el.classList.add("oe_website_sale", "tp-scrollable-y", "flex-grow-1", "px-3");
        el.insertAdjacentHTML("beforeend", document.querySelector(".tp-filters-container").getHTML());

        this.services.primeSidebar.add(Sidebar, {
            title: _t("Filters"),
            icon: "fa fa-filter",
            extraClass: "tp-shop-filter-sidebar",
            contentHtml: el.outerHTML,
        });
    },
    destroy() {
        if (this.loadMoreObserver && this.el.querySelector(".tp-load-more-on-scroll")) {
            this.loadMoreObserver.unobserve(this.el.querySelector(".tp-load-more-on-scroll"));
        }
        this.driftImages.forEach(drift => { drift.disable() });
    }
});
