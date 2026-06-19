import VariantMixin from '@website_sale/js/variant_mixin';

const oldChangeCombinationStock = VariantMixin._onChangeCombinationStock;
const oldGetOptionalCombinationInfoParam = VariantMixin._getOptionalCombinationInfoParam;

VariantMixin._onChangeCombinationStock = function (ev, parent, combination) {
    // Override to prevent issues with multiple messages on the quick view page
    const has_max_combo_quantity = 'max_combo_quantity' in combination
    if (!combination.is_storable && !has_max_combo_quantity) {
        return;
    }

    if (!parent.matches('.js_main_product') || !combination.product_id) {
        // if we're not on product page or the product is dynamic
        return;
    }

    // Patch start: Scan all .oe_website_sale instead of only the first one
    document.querySelectorAll('.oe_website_sale').forEach(websiteSale => {
        websiteSale.querySelectorAll('.availability_message_' + combination.product_template).forEach(el => el.remove());
    });
    // Patch end

    oldChangeCombinationStock.apply(this, arguments);
};

VariantMixin._getOptionalCombinationInfoParam = function (product) {
    const result = oldGetOptionalCombinationInfoParam.apply(this, arguments);
    // whatever view is set for images, quick view only render carousel
    Object.assign(result, {
        'quick_view': product?.closest('.tp-product-quick-view-layout') ? 'true' : 'false'
    });

    return result;
};
