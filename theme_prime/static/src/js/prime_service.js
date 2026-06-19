import { markup } from "@odoo/owl";
import { CartConfirmationDialog } from "@theme_prime/js/dialog/cart_confirmation_dialog";
import { Sidebar } from "@theme_prime/js/sidebar/sidebar";
import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { renderToString } from "@web/core/utils/render";
import { session } from "@web/session";

export const primeService = {
    dependencies: ["notification", "dialog", "primeSidebar"],
    start(env, { notification, dialog, primeSidebar }) {
        return {
            get isB2bModeEnabled () {
                return session.is_website_user && odoo.dr_theme_config.json_b2b_shop_config && odoo.dr_theme_config.json_b2b_shop_config.dr_enable_b2b;
            },
            loginNotification() {
                let buttons = [{ name: _t("Log in"), onClick: () => { window.location = "/web/login"; } }];
                if (odoo.dr_theme_config.has_sign_up) {
                    buttons.push({ name: _t("Sign Up"), onClick: () => { window.location = "/web/signup"; } });
                } else {
                    buttons.push({ name: _t("Close"), onClick: () => {
                        document.querySelectorAll(".tp-login-notification").forEach(el => {
                            el.remove();
                        });
                    } });
                }
                notification.add(markup(renderToString("DroggolNotification", { productName: _t("Log in to place an order"), iconClass: "fa fa-sign-in", color: "primary", message: _t("Please log in first.") })), {
                    className: "tp-notification tp-rounded-border tp-login-notification tp-bg-soft-primary o_animate",
                    templateToUse: "theme_prime.NotificationGeneric",
                    buttons: buttons,
                });
            },
            stockNotification(info) {
                notification.add(markup(renderToString("DroggolNotification", { subIconClass: "fa fa-exclamation-circle", color: "danger", productID: info.productTmplID, productName: _t("Currently not in stock."), message: _t("Check again later.") })), {
                    className: "tp-notification tp-rounded-border tp-stock-notification tp-bg-soft-primary o_animate",
                    templateToUse: "theme_prime.NotificationGeneric",
                    type: "danger",
                    buttons: [{
                        name: _t("View"),
                        onClick: () => {
                            window.location = `/shop/${info.productTmplID}`;
                        }
                    }, {
                        name: _t("Close"),
                        onClick: () => {
                            document.querySelectorAll(".tp-stock-notification").forEach(el => {
                                el.remove();
                            });
                        }
                    }],
                });
            },
            cartFlowNotification(info) {
                notification.add(markup(renderToString("DroggolNotification", { color: "primary", productID: info.id, productName: info.name, message: _t("Added to your cart.") })), {
                    type: "primary",
                    className: "tp-notification tp-rounded-border tp-bg-soft-primary o_animate",
                    templateToUse: "theme_prime.NotificationGeneric",
                    buttons: [{ name: _t("View cart"), onClick: () => { window.location = "/shop/cart"; } }, { name: _t("Checkout"), onClick: () => { window.location = "/shop/checkout?express=1"; } }],
                });
            },
            cartFlowSidebar(position = "end") {
                primeSidebar.add(Sidebar, {
                    extraClass: "tp-cart-sidebar",
                    loadingStr: _t("Loading Cart..."),
                    fetchUrl: "/theme_prime/get_cart_sidebar",
                    position: position,
                });
            },
            cartFlowDialog(info) {
                dialog.add(CartConfirmationDialog, { info });
            },
        }
    }
}

registry.category("services").add("primeService", primeService);
