import { patch } from "@web/core/utils/patch";
import { CarouselProduct } from "@website_sale/interactions/carousel_product";

patch(CarouselProduct.prototype, {
    setup() {
        super.setup();
        this.indicatorJustify = "center";
    },
    updateJustifyContent() {
        this.indicatorJustify = "center";
    },
});
