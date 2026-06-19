import { MegaMenuOption } from "@website/builder/plugins/options/mega_menu_option";
import { useDomState } from "@html_builder/core/utils";
import { patch } from "@web/core/utils/patch";
import { useState, onMounted } from "@odoo/owl";

patch(MegaMenuOption.prototype, {
    setup() {
        super.setup();
        this.primeState = useState({
            isOptVisible: true,
        });
        this.primeDomState = useDomState((el) => ({
            onUpdateDom: this._updateDomState(el),
        }));
        onMounted(() => {
            this.primeState.isOptVisible = this.isCategorySyncEnabled(this.env.getEditingElement()) && this.productCategories.length;
        });
    },
    _updateDomState(el) {
        this.primeState.isOptVisible = this.isCategorySyncEnabled(el) && this.productCategories.length;
    },
    isCategorySyncEnabled(el) {
        return !el?.querySelector('section')?.classList?.contains('s_no_category_sync');
    }
});