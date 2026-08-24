# -*- coding: utf-8 -*-
from odoo.api import Environment

from odoo.addons.biighands_shop_website.hooks import post_init_hook


def migrate(cr, version):
    """Refresh the full-width atelier and shop pages after module upgrade."""
    post_init_hook(Environment(cr, 1, {}))
