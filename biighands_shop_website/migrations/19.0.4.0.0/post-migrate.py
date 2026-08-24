from odoo import api, SUPERUSER_ID


def migrate(cr, version):
    from odoo.addons.biighands_shop_website.hooks import post_init_hook

    post_init_hook(api.Environment(cr, SUPERUSER_ID, {}))
