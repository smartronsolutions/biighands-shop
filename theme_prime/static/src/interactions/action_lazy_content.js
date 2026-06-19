import { LazyContentDialog } from "@theme_prime/js/dialog/lazy_content_dialog";
import { Sidebar } from "@theme_prime/js/sidebar/sidebar";
import { rpc } from "@web/core/network/rpc";
import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

export class ActionLazyContent extends Interaction {
    static selector = ".tp-lazy-content";
    dynamicContent = {
        _root: {
            "t-on-click": this.onClick,
        },
    };
    setup() {
        this.title = false;
        this.content = false;
    }
    async onClick(ev) {
        ev.preventDefault();
        const { resId, resModel, field } = this.el.dataset;
        if (!this.content) {
            const result = await this.waitFor(
                rpc("/theme_prime/get_lazy_content", {
                    res_id: resId,
                    res_model: resModel,
                    fields: ["name", "icon"],
                    contentField: field,
                })
            );
            if (result && Object.keys(result)) {
                this.title = result["name"];
                this.content = result[field];
            }
        }
        if (this.el.dataset.popupStyle === "sidebar") {
            this.services.primeSidebar.add(Sidebar, {
                title: this.title,
                extraClass: "overflow-auto tp-lazy-content-sidebar",
                contentHtml: this.content,
                position: "end",
            });
        } else {
            this.services.dialog.add(LazyContentDialog, {
                title: this.title,
                footer: false,
                body: this.content,
            });
        }
    }
}

registry.category("public.interactions").add("theme_prime.action_lazy_content", ActionLazyContent);
