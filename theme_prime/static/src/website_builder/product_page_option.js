import { useDomState } from "@html_builder/core/utils";
import { patch } from "@web/core/utils/patch";
import { ProductPageOption } from "@website_sale/website_builder/product_page_option";

patch(ProductPageOption.prototype, {
    setup() {
        super.setup();
        this.customDomState = useDomState((el) => {
            return {
                isThemePrime: el.querySelector("#product_detail").classList.contains('tp-product-page-container'),
            };
        });
    }
});
