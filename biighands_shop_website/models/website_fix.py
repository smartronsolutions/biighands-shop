# -*- coding: utf-8 -*-
# Backup fix — in case theme_prime/views/shop_layout.xml update hasn't applied yet.
# The real fix is in theme_prime/views/shop_layout.xml line 8.
from odoo import models


class Website(models.Model):
    _inherit = 'website'

    def _compute_shop_page_container(self):
        try:
            super()._compute_shop_page_container()
        except (KeyError, AttributeError):
            for rec in self:
                rec.shop_page_container = 'container'
