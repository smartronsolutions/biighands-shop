import { registry } from "@web/core/registry";

let PrimeSnippets = registry.category('theme_prime.dynamic_snippet_registry').getEntries() || [];
const BaseEditor = I => class extends I {
    setup() {
        super.setup();
        this.editableMode = true;
    }
};

PrimeSnippets.forEach(IntersectionElement => {
    if (IntersectionElement.length) {
        registry.category("public.interactions").add(IntersectionElement[0], IntersectionElement[1]);
        registry.category("public.interactions.edit").add(IntersectionElement[0], { Interaction: IntersectionElement[1], mixin: BaseEditor, });
    }
});