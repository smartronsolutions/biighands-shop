import { PWAPromptDialog } from "@theme_prime/js/dialog/pwa_prompt_dialog";
import { cookie } from "@web/core/browser/cookie";
import { isDisplayStandalone, isIOS } from "@web/core/browser/feature_detection";
import { registry } from "@web/core/registry";
import { sprintf } from "@web/core/utils/strings";
import { Interaction } from "@web/public/interaction";

const html = document.documentElement;
const websiteID = html.getAttribute("data-website-id") || 0;

const deferredPrompt = new Promise(function (resolve, reject) {
    window.addEventListener("beforeinstallprompt", function (ev) {
        ev.preventDefault();
        resolve(ev);
    });
});

export class PWAInstallBanner extends Interaction {
    static selector = "#wrapwrap";
    async start() {
        if (odoo.dr_theme_config.pwa_active) {
            await this.activateServiceWorker();
        } else {
            await this.deactivateServiceWorker();
        }
    }
    showInstallBanner() {
        if (!isDisplayStandalone()) {
            if (!cookie.get(sprintf("tp-pwa-popup-%s", websiteID))) {
                this.services.dialog.add(PWAPromptDialog, {
                    websiteID: websiteID,
                    isIOS: isIOS(),
                    appName: odoo.dr_theme_config.pwa_name,
                    onInstall: () => {
                        deferredPrompt.then(prompt => {
                            prompt.prompt();
                        });
                    },
                }, {
                    onClose: () => {
                        cookie.set(sprintf("tp-pwa-popup-%s", websiteID), true);
                    },
                });
            }
        }
    }
    activateServiceWorker() {
        if (navigator.serviceWorker) {
            navigator.serviceWorker.register("/service_worker.js").then((registration) => {
                console.log("ServiceWorker registration successful with scope:", registration.scope);
                if (odoo.dr_theme_config.pwa_show_install_banner) {
                    if (isIOS()) {
                        this.showInstallBanner();
                    } else {
                        deferredPrompt.then(() => {
                            this.showInstallBanner();
                        });
                    }
                }
            }).catch(function (error) {
                console.log("ServiceWorker registration failed:", error);
            });
        }
    }
    deactivateServiceWorker() {
        if (navigator.serviceWorker) {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                registrations.forEach(r => {
                    r.unregister();
                    console.log("ServiceWorker removed successfully");
                });
            }).catch(function (err) {
                console.log("Service worker unregistration failed: ", err);
            });
        }
    }
}

registry.category("public.interactions").add("theme_prime.pwa_install_banner", PWAInstallBanner);
