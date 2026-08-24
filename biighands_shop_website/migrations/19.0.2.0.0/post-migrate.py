# -*- coding: utf-8 -*-
from odoo.api import Environment

from odoo.addons.biighands_shop_website.hooks import post_init_hook


def migrate(cr, version):
    """Apply the atelier catalogue when an existing installation is upgraded."""
    post_init_hook(Environment(cr, 1, {}))
