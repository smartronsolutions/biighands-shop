import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

export class ProductPreviewSwatches extends Interaction {
    static selector = ".tp-product-preview-swatches";
    dynamicContent = {
        _window: {
            't-on-resize': this.debounced(this._updateVariantPreview, 250),
        },
    };
    setup() {
        this.ptavs = this.el.querySelectorAll('.tp-swatch');
        this.hiddenCountSpan = this.el.querySelector('span[name="hidden_ptavs_count"]');
        this.ptavCount = this.ptavs.length + Number(this.el.dataset.hiddenPtavCount ?? 0);
        this.displayedPTAVCount = 0;
        // Class `gap-1` on parent adds 4px margin for each ptav.
        this.margin = 6;
        this._updateVariantPreview();
    }
    _resetDisplay() {
        for (const child of this.el.children) {
            child.classList.add('d-none');
        }
    }
    _updateAndGetHiddenPTAVsWidth() {
        const hiddenPTAVCount = this.ptavCount - this.displayedPTAVCount;
        this.hiddenCountSpan.firstElementChild.textContent = `+${hiddenPTAVCount}`;
        this.hiddenCountSpan.classList.remove('d-none');
        return this.hiddenCountSpan.offsetWidth + this.margin * 2;
    }
    _showHiddenPTAVsElement(currentPTAV, remainingSpace) {
        let hiddenCountSpanWidth = this._updateAndGetHiddenPTAVsWidth();
        while (currentPTAV && hiddenCountSpanWidth >= remainingSpace) {
            const currentPTAVWidth = currentPTAV.offsetWidth;
            currentPTAV.classList.add("d-none");
            this.displayedPTAVCount--;
            hiddenCountSpanWidth = this._updateAndGetHiddenPTAVsWidth();
            remainingSpace += currentPTAVWidth;
            currentPTAV = currentPTAV.previousElementSibling;
        }
    }
    _updateVariantPreview() {
        this._resetDisplay();
        const containerWidth = this.el.offsetWidth;
        let usedWidth = 0;
        this.displayedPTAVCount = 0;
        for (const ptav of this.ptavs) {
            // Remove d-none to be able to get width.
            ptav.classList.remove('d-none');
            usedWidth += ptav.offsetWidth + this.margin;
            this.displayedPTAVCount++;
            const remainingSpace = containerWidth - usedWidth;
            const isLastPTAV = ptav === this.ptavs[this.ptavs.length - 1];
            const hasHiddenPtavs = isLastPTAV && this.ptavCount > this.displayedPTAVCount;
            if (usedWidth >= containerWidth || hasHiddenPtavs) {
                this._showHiddenPTAVsElement(ptav, remainingSpace);
                break;
            }
        }
    }
}

registry.category("public.interactions").add("theme_prime.product_preview_swatches", ProductPreviewSwatches);
registry.category("public.interactions.edit").add("theme_prime.product_preview_swatches", { Interaction: ProductPreviewSwatches });
