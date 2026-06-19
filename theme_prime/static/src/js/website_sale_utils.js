import wSaleUtils from "@website_sale/js/website_sale_utils";

const _updateCartNavBar = wSaleUtils.updateCartNavBar;
wSaleUtils.updateCartNavBar = function (data) {
    document.querySelectorAll(".dr-update-cart-total").forEach(el => {
        if (data.notification_info && data.notification_info.order_amount_html) {
            el.innerHTML = data.notification_info.order_amount_html;
        }
    });
    _updateCartNavBar.apply(this, arguments);
};
