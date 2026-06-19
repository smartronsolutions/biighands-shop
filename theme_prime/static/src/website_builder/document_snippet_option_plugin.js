import { BuilderAction } from "@html_builder/core/builder_action";
import { before, SNIPPET_SPECIFIC_END } from "@html_builder/utils/option_sequence";
import { Plugin } from "@html_editor/plugin";
import { withSequence } from "@html_editor/utils/resource";
import { registry } from "@web/core/registry";
import { renderToElement } from "@web/core/utils/render";

class DocumentSnippetOptionPlugin extends Plugin {
    static id = "documentSnippetOption";
    static dependencies = ["builderActions", "media"];
    static shared = ["openMediaDialog"];
    resources = {
        on_snippet_dropped_handlers: this.onSnippetDropped.bind(this),
        builder_options: [
            withSequence(before(SNIPPET_SPECIFIC_END), {
                selector: ".s_tp_documents_snippet",
                template: "theme_prime.DocumentSnippetOption",
            }),
        ],
        builder_actions: {
            AddDocumentAction,
        },
    };
    openMediaDialog(el) {
        return new Promise((resolve) => {
            const onClose = this.dependencies.media.openMediaDialog({
                visibleTabs: ['DOCUMENTS'],
                save: async (mediaEl, selectedMedia, activeTab) => {
                    if (activeTab === "DOCUMENTS") {
                        if (el.querySelector(".alert")) {
                            el.querySelector(".alert").remove();
                        }
                        const document = {
                            mimetype: mediaEl.querySelector(".o_file_image").dataset.mimetype,
                            url: mediaEl.querySelector("a").href,
                            name: mediaEl.querySelector(".o_file_image").getAttribute("title"),
                        };
                        const template = renderToElement("theme_prime.DocumentElement", { document });
                        el.querySelector(".s_tp_documents_snippet_row").appendChild(template);
                    }
                    resolve(true);
                },
            });
            onClose.then(resolve);
        });
    }
    async onSnippetDropped({ snippetEl }) {
        if (snippetEl.matches(".s_tp_documents_snippet")) {
            const result = await this.openMediaDialog(snippetEl);
            if (!result) {
                snippetEl.remove();
            }
        }
    }
}

export class AddDocumentAction extends BuilderAction {
    static id = "addDocument";
    static dependencies = ["documentSnippetOption"];
    setup() {
        this.preview = false;
    }
    async apply({ editingElement: el }) {
        await this.dependencies.documentSnippetOption.openMediaDialog(el);
    }
}

registry.category("website-plugins").add(DocumentSnippetOptionPlugin.id, DocumentSnippetOptionPlugin);


class TpSingleProductCoverSnippetOptionPlugin extends Plugin {
    static id = "TpSingleProductCoverSnippetOptionPlugin";
    static dependencies = ["builderActions"];
    resources = {
        builder_options: [
            withSequence(before(SNIPPET_SPECIFIC_END), {
                selector: ".s_d_single_product_cover_snippet_wrapper",
                template: "theme_prime.ShowProductVariantImage",
            }),
        ],
    };
}

registry.category("website-plugins").add(TpSingleProductCoverSnippetOptionPlugin.id, TpSingleProductCoverSnippetOptionPlugin);
