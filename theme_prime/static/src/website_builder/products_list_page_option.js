import { useDomState } from "@html_builder/core/utils";
import { patch } from "@web/core/utils/patch";
import { ProductsListPageOption } from "@website_sale/website_builder/products_list_page_option";

patch(ProductsListPageOption.prototype, {
    setup() {
        super.setup();
        this.customDomState = useDomState((editingElement) => {
            return {
                isThemePrime: editingElement.classList.contains('tp-shop-page-container'),
            };
        });
    }
});
