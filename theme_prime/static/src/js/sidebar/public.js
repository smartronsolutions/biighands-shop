import { Sidebar } from "@theme_prime/js/sidebar/sidebar";
import { _t } from "@web/core/l10n/translation";
import { rpc } from "@web/core/network/rpc";
import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";
import wSaleUtils from "@website_sale/js/website_sale_utils";

//------------------------------------------------------------------------------
// Cart Sidebar
//------------------------------------------------------------------------------
export class CartSidebarInteraction extends Interaction {
    static selector = ".tp-cart-sidebar";
    dynamicContent = {
        ".tp-clear-cart": {
            "t-on-click": this.onClickClearCart,
        },
        ".tp-remove-line": {
            "t-on-click": this.onClickRemoveLine,
        },
        ".quantity": {
            "t-on-change.withTarget": this.locked(this.debounced(this.changeQuantity, 500)),
        },
        ".js_add_cart_json": {
            "t-on-click.prevent.withTarget": this.locked(this.incOrDecQuantity),
        },
        ".show_coupon": {
            "t-on-click": this.onClickShowCoupon,
        },
        ".a-submit": {
            "t-on-click": this.onClickApplyCoupon,
        },
    };
    async onClickClearCart(ev) {
        const data = await rpc("/shop/cart/clear")
        data["cart_quantity"] = data.cart_quantity || 0;
        wSaleUtils.updateCartNavBar(data);
        await this.refreshContent(data);
    }
    onClickRemoveLine(ev) {
        const qtyInputEl = ev.currentTarget.closest(".tp-product-card").querySelector(".quantity");
        qtyInputEl.value = 0;
        this._changeQuantity(qtyInputEl);
    }
    async changeQuantity(ev, currentTargetEl) {
        this._changeQuantity(currentTargetEl);
    }
    async _changeQuantity(input) {
        const qty = parseInt(input.value);
        const data = await this.waitFor(rpc("/shop/cart/update", {
            product_id: parseInt(input.dataset.productId),
            line_id: parseInt(input.dataset.lineId),
            quantity: qty
        }));
        wSaleUtils.updateCartNavBar(data);
        wSaleUtils.showWarning(data.warning);
        this.env.bus.trigger("cart_amount_changed", [data.amount, data.minor_amount]);
        this.refreshContent(data);
    }
    async incOrDecQuantity(ev, currentTargetEl) {
        ev.preventDefault();
        const input = currentTargetEl.closest(".css_quantity").querySelector("input");
        const maxQuantity = parseFloat(input.dataset.max || Infinity);
        const oldQuantity = parseFloat(input.value || 0);
        const newQuantity = currentTargetEl.querySelector("i").classList.contains("fa-minus")
            ? Math.min(Math.max(oldQuantity - 1, 0), maxQuantity)
            : Math.min(oldQuantity + 1, maxQuantity);
        if (oldQuantity !== newQuantity) {
            input.value = newQuantity;
            await this._changeQuantity(input);
        }
    }
    onClickShowCoupon(ev) {
        this.el.querySelector(".show_coupon").classList.add("d-none");
        this.el.querySelector(".coupon_form").classList.remove("d-none");
    }
    onClickApplyCoupon(ev) {
        ev.preventDefault();
        ev.currentTarget.closest("form").submit();
    }
    async refreshContent(data) {
        const content = await rpc("/theme_prime/get_cart_sidebar");
        this.services["public.interactions"].stopInteractions(this.el);
        this.el.innerHTML = "";
        this.el.insertAdjacentHTML("beforeend", content);
        this.services["public.interactions"].startInteractions(this.el);
        // If cart page & no qty in cart
        if (window.location.pathname == "/shop/cart" && !data.cart_quantity) {
            if (document.querySelector('.o_wsale_shorter_cart_summary')) {
                document.querySelector('.o_wsale_shorter_cart_summary').remove();
            }
            window.location = '/shop/cart';
        }
    }
}

registry.category("public.interactions").add("theme_prime.cart_sidebar_interaction", CartSidebarInteraction);

export class CartSidebar extends Interaction {
    static selector = ".tp-cart-sidebar-action";
    dynamicContent = {
        _root: {
            "t-on-click": this.onClick,
        },
    };
    onClick(ev) {
        ev.preventDefault();
        this.services.primeSidebar.add(Sidebar, {
            extraClass: "tp-cart-sidebar",
            loadingStr: _t("Loading Cart..."),
            fetchUrl: "/theme_prime/get_cart_sidebar",
            position: ev.currentTarget.dataset.position || "end",
        });
    }
}

registry.category("public.interactions").add("theme_prime.cart_sidebar", CartSidebar);

//------------------------------------------------------------------------------
// Search Sidebar
//------------------------------------------------------------------------------
export class SearchSidebarComponent extends Sidebar {
    async _onMounted() {
        await super._onMounted();
        // this.$(".o_searchbar_form").addClass("dr_in_sidebar");
        // this.trigger_up("widgets_start_request", {
        //     $target: this.$(".o_searchbar_form"),
        // });
        // this.$(".o_searchbar_form").removeClass("o_wait_lazy_js");
    }
}

export class SearchSidebar extends Interaction {
    static selector = ".tp-search-sidebar-action";
    dynamicContent = {
        _root: {
            "t-on-click": this.onClick,
        },
    };
    onClick(ev) {
        this.services.primeSidebar.add(SearchSidebarComponent, {
            title: _t("Search"),
            icon: "dri dri-search",
            extraClass: "tp-search-sidebar",
            fetchUrl: "/theme_prime/get_search_sidebar",
            position: ev.currentTarget.dataset.position || "end",
        });
    }
}

registry.category("public.interactions").add("theme_prime.search_sidebar", SearchSidebar);

//------------------------------------------------------------------------------
// Account Info Sidebar
//------------------------------------------------------------------------------
export class AccountInfoSidebar extends Interaction {
    static selector = ".tp-account-info-sidebar-action";
    dynamicContent = {
        _root: {
            "t-on-click": this.onClick,
        },
    };
    onClick(ev) {
        ev.preventDefault();
        const accountInfoSidebarEl = document.querySelector(".tp-account-info-sidebar");
        accountInfoSidebarEl.classList.remove("offcanvas-start", "offcanvas-end");
        accountInfoSidebarEl.classList.add(ev.currentTarget.dataset.position ? `offcanvas-${ev.currentTarget.dataset.position}` : "offcanvas-end");
        accountInfoSidebarEl.removeAttribute("aria-hidden"); // Restore animation
        Offcanvas.getOrCreateInstance(accountInfoSidebarEl).show();
    }
}

registry.category("public.interactions").add("theme_prime.account_info_sidebar", AccountInfoSidebar);

//------------------------------------------------------------------------------
// Category Sidebar
//------------------------------------------------------------------------------
export class CategorySidebarComponent extends Sidebar {
    static template = "theme_prime.CategorySidebar";
    setup() {
        super.setup();
        this.config = odoo.dr_theme_config.json_sidebar_config;

        this.state.categories = [];
        this.state.categoriesCount = 0;
        this.state.displayCategories = [];
        this.state.displayParentCategory = false;
    }
    async getLazyContent() {
        this.state.loading = true;
        const { categories, category_count } = await rpc("/theme_prime/get_categories_list");
        this.state.categories = categories;
        this.state.categoriesCount = category_count;
        this.state.displayCategories = categories.filter(category => !category.parent_id);
        this.state.displayParentCategory = false;
        this.state.loading = false;
    }
    onClickBack(ev, parentCategory) {
        ev.preventDefault();
        let parentCategories = this.state.categories.filter(category => !category.parent_id);
        let parentCategoryId = false;
        if (parentCategory && parentCategory.parent_id) {
            parentCategoryId = parentCategory.parent_id[0];
            const siblingCategories = this.state.categories.filter(category => category.id == parentCategoryId)[0]["child_id"];
            parentCategories = this.state.categories.filter(category => siblingCategories.includes(category.id));
        }
        this.state.displayCategories = parentCategories;
        this.state.displayParentCategory = parentCategoryId;
    }
    onClickCategory(ev, category) {
        if (category.child_id.length) {
            ev.preventDefault();
            this.state.displayCategories = this.state.categories.filter(cat => category.child_id.includes(cat.id));
            this.state.displayParentCategory = category;
        }
    }
}

export class CategorySidebar extends Interaction {
    static selector = ".tp-category-action";
    dynamicContent = {
        _root: {
            "t-on-click": this.onClick,
        },
    };
    async onClick(ev) {
        this.services.primeSidebar.add(CategorySidebarComponent, {
            extraClass: "tp-category-sidebar",
            loadingStr: _t("Loading Categories..."),
            position: ev.currentTarget.dataset.position || "end",
        });
    }
}

registry.category("public.interactions").add("theme_prime.category_sidebar", CategorySidebar);

//------------------------------------------------------------------------------
// Similar Product Sidebar
//------------------------------------------------------------------------------
export class SimilarProductSidebar extends Interaction {
    static selector = ".tp_show_similar_products";
    dynamicContent = {
        _root: {
            "t-on-click": this.onClick,
        },
    };
    async onClick(ev) {
        this.services.primeSidebar.add(Sidebar, {
            title: _t("Similar Products"),
            icon: "fa fa-clone",
            extraClass: "tp-similar-products-sidebar",
            fetchUrl: "/theme_prime/get_similar_products_sidebar",
            fetchParams: { productID: parseInt(ev.currentTarget.dataset.productTemplateId) },
            position: ev.currentTarget.dataset.position || "end",
        });
    }
}

registry.category("public.interactions").add("theme_prime.similar_product_sidebar", SimilarProductSidebar);
