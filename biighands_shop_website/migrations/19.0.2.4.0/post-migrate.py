# -*- coding: utf-8 -*-
from odoo.api import Environment

from odoo.addons.biighands_shop_website.hooks import post_init_hook


def migrate(cr, version):
    """Refresh the complete atelier website after installing updated assets."""
    post_init_hook(Environment(cr, 1, {}))
