# -*- coding: utf-8 -*-
from odoo.api import Environment

from odoo.addons.biighands_shop_website.hooks import post_init_hook


def migrate(cr, version):
    """Restore all current atelier pages and catalogue data on every upgrade."""
    post_init_hook(Environment(cr, 1, {}))
