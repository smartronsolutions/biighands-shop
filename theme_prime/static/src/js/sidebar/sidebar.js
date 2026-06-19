import { Component, markup, onMounted, useChildSubEnv, useRef, useState } from "@odoo/owl";
import { useHotkey } from "@web/core/hotkeys/hotkey_hook";
import { rpc } from "@web/core/network/rpc";
import { useService } from "@web/core/utils/hooks";

export class Sidebar extends Component {
    static template = "theme_prime.Sidebar";
    static props = {
        title: { type: String, optional: true },
        icon: { type: String, optional: true },
        extraClass: { type: String, optional: true },
        fetchUrl: { type: String, optional: true },
        fetchParams: { type: Object, optional: true },
        contentHtml: { type: String, optional: true },
        position: { type: String, optional: true },
        loadingStr: { type: String, optional: true },
        close: { type: Function, optional: true },
    };
    static defaultProps = {
        title: "",
        icon: "",
        extraClass: "",
        contentHtml: "",
        position: "start",
        loadingStr: "",
    };
    setup() {
        this.data = useState(this.env.sidebarData);
        this.state = useState({
            loading: false,
            contentHtml: "contentHtml" in this.props ? markup(this.props.contentHtml) : false,
        });
        this.sidebarInstance = false;
        this.interactionService = useService("public.interactions");
        this.sidebarRef = useRef("sidebarRef");
        this.id = `sidebar_${this.data.id}`;
        useChildSubEnv({ sidebarId: this.id });
        useHotkey("escape", () => this.onEscape());
        onMounted(this._onMounted);
    }
    async _onMounted() {
        await this.getLazyContent();
        this.sidebarInstance = new Offcanvas(this.sidebarRef.el);
        this.sidebarRef.el.addEventListener("shown.bs.offcanvas", event => {
            this.interactionService.startInteractions(this.sidebarRef.el);
        });
        this.sidebarRef.el.addEventListener("hidden.bs.offcanvas", event => {
            this.data.close();
        });
        this.sidebarInstance.show();
    }
    async getLazyContent() {
        if (this.props.fetchUrl) {
            this.state.loading = true;
            const content = await rpc(this.props.fetchUrl, this.props.fetchParams);
            this.state.contentHtml = markup(content);
            this.state.loading = false;
        }
    }
    onEscape() {
        if (this.sidebarInstance) {
            this.sidebarInstance.hide();
        }
    }
}
