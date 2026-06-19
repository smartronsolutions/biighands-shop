/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { Notification } from "@web/core/notifications/notification";

// better to have service :)
Notification.template = "droggol_theme_common.NotificationWowl";
patch(Notification.prototype, {
    props: {...Notification.props, type: {type: String, optional: true, validate: (t) => ["primary", "warning", "danger", "success", "info"].includes(t)}},
    setup() {
        this.templateToUse = this.props.templateToUse || "web.NotificationWowl";
        super.setup();
    }
});
Notification.props['templateToUse'] = { type: String, optional: true };
