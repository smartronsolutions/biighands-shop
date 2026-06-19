import { Plugin } from "@html_editor/plugin";
import { withSequence } from "@html_editor/utils/resource";
import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";

export const CUSTOM_THEME_OPTIONS = 90;

class CustomThemeOptionPlugin extends Plugin {
    static id = "customThemeOption";
    static dependencies = ["coreBuilderAction", "customizeWebsite"];

    resources = {
        theme_options: [
            withSequence(
                CUSTOM_THEME_OPTIONS,
                this.getThemeOptionBlock("theme-prime", _t("Theme Prime"), {
                    template: "theme_prime.CustomThemeOption",
                })
            ),
        ],
    };

    getThemeOptionBlock(id, name, options) {
        // TODO Have a specific kind of options container that takes the specific parameters like name, no element, no selector...
        const el = this.document.createElement("div");
        el.dataset.name = name;
        this.document.body.appendChild(el); // Currently editingElement needs to be isConnected

        options.selector = "*";

        return {
            id: id,
            element: el,
            hasOverlayOptions: false,
            headerMiddleButton: false,
            isClonable: false,
            isRemovable: false,
            options: [options],
            optionsContainerTopButtons: [],
            snippetModel: {},
        };
    }
}

registry.category("website-plugins").add(CustomThemeOptionPlugin.id, CustomThemeOptionPlugin);
