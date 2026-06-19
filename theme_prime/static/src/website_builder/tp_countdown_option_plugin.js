import { Plugin } from "@html_editor/plugin";
import { registry } from "@web/core/registry";
import { BuilderAction } from "@html_builder/core/builder_action";
import { withSequence } from "@html_editor/utils/resource";
import { before, SNIPPET_SPECIFIC_END } from "@html_builder/utils/option_sequence";

class TPCountdownOptionPlugin extends Plugin {
    static id = "tpCountdownOption";
    resources = {
         builder_options: [
            withSequence(before(SNIPPET_SPECIFIC_END), {
                template: "theme_prime.CountdownOptionPlugin",
                selector: ".tp-countdown",
            }),
        ],
        builder_actions: {
            ReloadCountdownAction,
        },
        so_content_addition_selector: [".tp-countdown"],
    };
}

export class ReloadCountdownAction extends BuilderAction {
    static id = "tpReloadCountdown";
    apply({ editingElement }) {
        return this.dispatchTo("update_interactions", editingElement);
    }
}

registry.category("website-plugins").add(TPCountdownOptionPlugin.id, TPCountdownOptionPlugin);
