import { WebsiteRoot } from "@website/js/content/website_root";

document.querySelectorAll("[data-bs-toggle='tooltip']").forEach(el => {
    new Tooltip(el, {
        boundary: document.body,
    });
});

// Pricelist make selectable
WebsiteRoot.include({
    events: Object.assign({}, WebsiteRoot.prototype.events, {
        "click .dropdown-menu .tp-select-pricelist": "_onClickTpPricelist",
        "change .dropdown-menu .tp-select-pricelist": "_onChangeTpPricelist",
    }),
    _onClickTpPricelist: function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
    },
    _onChangeTpPricelist: function (ev) {
        window.location = ev.currentTarget.value;
    },
});
