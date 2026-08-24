# -*- coding: utf-8 -*-
from odoo.api import Environment

from odoo.addons.biighands_shop_website.hooks import post_init_hook


def migrate(cr, version):
    """Replace legacy shop chrome and refresh atelier data on upgrade."""
    post_init_hook(Environment(cr, 1, {}))
