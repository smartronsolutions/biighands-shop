/** @odoo-module **/

function addViewProductButtons(root = document) {
    if (!document.querySelector(".tp-shop-page")) {
        return;
    }

    const cards = [];
    if (root.matches?.(".tp-product-wrapper")) {
        cards.push(root);
    }
    cards.push(...root.querySelectorAll(".tp-product-wrapper"));

    cards.forEach((card) => {
        if (!card.closest(".tp-shop-page")) {
            return;
        }
        const actions = card.querySelector(".tp-add-to-cart-btn");
        const productLink = card.querySelector(
            ".tp-product-image-container[href], .tp-product-title a[href]"
        );
        if (!productLink) {
            return;
        }

        if (actions && !actions.querySelector(".bhs-view-product-btn")) {
            const viewButton = document.createElement("a");
            viewButton.href = productLink.href;
            viewButton.className = "bhs-view-product-btn";
            viewButton.setAttribute("aria-label", "View product");
            viewButton.innerHTML = '<i class="fa fa-eye me-1"></i> View Product';
            actions.prepend(viewButton);
        }

        const content = card.querySelector(".tp-product-content");
        const price = content?.querySelector(".product_price");
        if (!content || !price || content.querySelector(".bhs-mobile-product-actions")) {
            return;
        }

        const mobileActions = document.createElement("div");
        mobileActions.className = "bhs-mobile-product-actions";
        mobileActions.innerHTML = `
            <a href="${productLink.href}" class="bhs-mobile-view-btn">
                <i class="fa fa-eye"></i><span>View</span>
            </a>
            <a href="#" role="button" class="a-submit bhs-mobile-cart-btn" aria-label="Add to cart">
                <i class="dri dri-cart"></i><span>Add to Cart</span>
            </a>
        `;
        price.insertAdjacentElement("afterend", mobileActions);
    });
}

function startShopEnhancements() {
    addViewProductButtons();

    const shopPage = document.querySelector(".tp-shop-page");
    if (!shopPage) {
        return;
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    addViewProductButtons(node);
                }
            }
        }
    });
    observer.observe(shopPage, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startShopEnhancements, { once: true });
} else {
    startShopEnhancements();
}
