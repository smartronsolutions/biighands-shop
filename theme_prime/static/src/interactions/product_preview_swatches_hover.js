import { Interaction } from "@web/public/interaction";
import { registry } from "@web/core/registry";

export class ProductPreviewSwatchesHover extends Interaction {
    static selector = ".tp-product-preview-swatches";
    dynamicContent = {
        ".tp-swatch": {
            "t-on-mouseenter": this._mouseEnter,
            "t-on-mouseleave": this._mouseLeave,
            "t-on-click": this._onClick,
        },
    };
    setup() {
        this.productImg = this.el.closest(this.el.dataset.parentSelector).querySelector(this.el.dataset.imgSelector);
        this.productLink = this.el.closest(this.el.dataset.parentSelector).querySelector(this.el.dataset.linkSelector);
        this.originalImgSrc = this.productImg.getAttribute("src");
    }
    _mouseEnter(ev) {
        if (!this.env.isSmall) {
            const variantImageSrc = ev.target.dataset.variantImage;
            if (!variantImageSrc) {
                return;
            }
            this._setImgSrc(variantImageSrc);
        }
    }
    _mouseLeave() {
        if (!this.env.isSmall) {
            this._setImgSrc();
        }
    }
    _setImgSrc(imageSrc) {
        this.productImg.classList.remove("tp-product-preview-active");
        this.productImg.src = imageSrc || this.originalImgSrc;
        this.productImg.addEventListener("load", () => {
            if (imageSrc) {
                this.productImg.classList.add("tp-product-preview-active");
            }
        }, { once: true });
    }
    _onClick(ev) {
        if (this.env.isSmall) {
            ev.preventDefault();
            const targetElement = ev.target.closest(".tp-swatch");
            this.productLink.href = targetElement.href;
            const variantImageSrc = targetElement.dataset.variantImage;
            if (!variantImageSrc) {
                return;
            }
            this._setImgSrc(variantImageSrc);
        }
    }
}

registry.category("public.interactions").add("theme_prime.product_preview_swatches_hover", ProductPreviewSwatchesHover);
