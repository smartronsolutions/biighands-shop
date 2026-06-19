import { before, SNIPPET_SPECIFIC_END } from "@html_builder/utils/option_sequence";
import { Plugin } from "@html_editor/plugin";
import { withSequence } from "@html_editor/utils/resource";
import { registry } from "@web/core/registry";

class HeadingOptionPlugin extends Plugin {
    static id = "headingOption";
    resources = {
        builder_options: [
            withSequence(before(SNIPPET_SPECIFIC_END), {
                template: "theme_prime.HeadingOption1",
                selector: ".s_heading_1",
                applyTo: ".tp-heading-container",
            }),
            withSequence(before(SNIPPET_SPECIFIC_END), {
                template: "theme_prime.HeadingOption2",
                selector: ".s_heading_2",
                applyTo: ".tp-heading-container",
            }),
        ],
    };
}

registry.category("website-plugins").add(HeadingOptionPlugin.id, HeadingOptionPlugin);
