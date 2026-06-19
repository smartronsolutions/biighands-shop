import { BorderConfigurator } from "@html_builder/plugins/border_configurator_option";
import { after, ANIMATE } from "@html_builder/utils/option_sequence";
import { Plugin } from "@html_editor/plugin";
import { withSequence } from "@html_editor/utils/resource";
import { registry } from "@web/core/registry";
import { BaseWebsiteBackgroundOption } from "@website/builder/plugins/options/background_option";

export class TpTestimonialOption extends BaseWebsiteBackgroundOption {
    static selector = ".tp-blockquote";
    static template = "theme_prime.TestimonialOption";
    static components = {
        BorderConfigurator,
        WebsiteBackgroundOption: BaseWebsiteBackgroundOption,
    };
}

class TestimonialOptionPlugin extends Plugin {
    static id = "TestimonialOption";
    resources = {
        mark_color_level_selector_params: [{ selector: ".tp-blockquote" }],
        builder_options: [
            withSequence(after(ANIMATE), TpTestimonialOption),
        ],
    };
}

registry.category("website-plugins").add(TestimonialOptionPlugin.id, TestimonialOptionPlugin);
