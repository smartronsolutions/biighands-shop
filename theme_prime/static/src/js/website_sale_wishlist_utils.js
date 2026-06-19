import wishlistUtils from '@website_sale_wishlist/js/website_sale_wishlist_utils';

const _updateWishlistNavBar = wishlistUtils.updateWishlistNavBar;
wishlistUtils.updateWishlistNavBar = function () {
    const wishlistProductIds = wishlistUtils.getWishlistProductIds();
    const wishButtons = document.querySelectorAll('.o_wsale_my_wish');
    wishButtons.forEach(button => {
        if (button.classList.contains('o_wsale_my_wish_hide_empty')) {
            button.classList.toggle('d-none', !wishlistProductIds.length);
        }
        button.querySelector('.my_wish_quantity').textContent = `${wishlistProductIds.length}`;
    });
    const wishlistQuantities = document.querySelectorAll('.my_wish_quantity');
    wishlistQuantities.forEach(quantity => {
        quantity.classList.toggle('d-none', !wishlistProductIds.length);
    });

    for (const counterEl of document.querySelectorAll('.tp-wishlist-counter')) {
        counterEl.textContent = `${wishlistProductIds.length}`;
    }

    _updateWishlistNavBar.apply(this, arguments);
};
