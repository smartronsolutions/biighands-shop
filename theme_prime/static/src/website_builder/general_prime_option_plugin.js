import { ClassAction } from "@html_builder/core/core_builder_action_plugin";
import { BorderConfigurator } from "@html_builder/plugins/border_configurator_option";
import { ShadowOption } from "@html_builder/plugins/shadow_option";
import { VerticalAlignmentOption } from "@html_builder/plugins/vertical_alignment_option";
import { after, ANIMATE, before, SNIPPET_SPECIFIC_END, VERTICAL_ALIGNMENT } from "@html_builder/utils/option_sequence";
import { Plugin } from "@html_editor/plugin";
import { withSequence } from "@html_editor/utils/resource";
import { registry } from "@web/core/registry";
import { BaseWebsiteBackgroundOption } from "@website/builder/plugins/options/background_option";

export class TpBgImageOption extends BaseWebsiteBackgroundOption {
    static selector = ".tp-editor-bg-image, .tp-editor-background-image";
    static defaultProps = {
        withColors: false,
        withImages: true,
        withShapes: false,
        withColorCombinations: false,
    };
}

export class TpBgColorAndShadowOption extends BaseWebsiteBackgroundOption {
    static selector = ".tp-editor-bg-color-n-shadow, .tp-editor-background-color-n-shadow";
    static template = "theme_prime.GeneralPrimeBorderNShadowOption";
    static components = {
        BorderConfigurator,
        ShadowOption,
        WebsiteBackgroundOption: BaseWebsiteBackgroundOption,
    };
}

class GeneralPrimeOptionPlugin extends Plugin {
    static id = "GeneralPrimeOption";
    resources = {
        dropzone_selector: {
            selector: ".tp-editor-copy-n-move",
            dropNear: ".tp-editor-copy-n-move",
        },
        is_movable_selector: { selector: ".tp-editor-copy-n-move", direction: "vertical" },
        change_current_options_containers_listeners: this.adjustClasses.bind(this),

        builder_options: [
            withSequence(before(SNIPPET_SPECIFIC_END), {
                template: "theme_prime.GeneralPrimeBadgeOption",
                selector: ".tp-badge",
            }),

            withSequence(VERTICAL_ALIGNMENT, {
                OptionComponent: VerticalAlignmentOption,
                selector: ".tp-editor-snippet-valign",
                applyTo: ".row",
                props: {
                    level: 1,
                },
            }),

            withSequence(after(ANIMATE), TpBgImageOption),

            withSequence(after(ANIMATE), TpBgColorAndShadowOption),
        ],

        builder_actions: {
            SetVerticalAlignmentAction,
        },
    };

    adjustClasses(optionsContainer) {
        // A fix was introduced in Odoo v19.0, where the *-bg-* classes were removed(see PR https://github.com/odoo/odoo/pull/230476).
        // Which force us to remove -bg- from our classes and introduced the new classes tp-editor-background-image and tp-editor-background-color-n-shadow.

        // These changes ensure backward compatibility with older Odoo versions.
        // The related compatibility function and these transitional classes can be safely removed in the future.
        for (const container of optionsContainer) {
            const deprecatedEls = container.element.querySelectorAll(".tp-editor-bg-color-n-shadow", ".tp-editor-bg-image");
            for (const deprecatedEl of deprecatedEls) {
                deprecatedEl.classList.replace("tp-editor-bg-color-n-shadow", "tp-editor-background-color-n-shadow");
                deprecatedEl.classList.replace("tp-editor-bg-image", "tp-editor-background-image");
            }
        }
    }
}

export class SetVerticalAlignmentAction extends ClassAction {
    static id = "tpSetVerticalAlignment";
    getPriority({ params: { mainParam: classNames } = { mainParam: "" } }) {
        return classNames === "align-items-stretch" ? 0 : 1;
    }
    isApplied({ params: { mainParam: classNames } }) {
        if (classNames === "align-items-stretch") {
            return true;
        }
        return super.isApplied(...arguments);
    }
}

registry.category("website-plugins").add(GeneralPrimeOptionPlugin.id, GeneralPrimeOptionPlugin);
