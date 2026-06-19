# -*- coding: utf-8 -*-
from odoo import models


class Website(models.Model):
    _inherit = 'website'

    def _compute_shop_page_container(self):
        # theme_prime accesses env.context['category'] directly (KeyError when absent).
        # Ensure it's always present before delegating to the real compute.
        if 'category' not in self.env.context:
            self = self.with_context(category=0)
        try:
            return super()._compute_shop_page_container()
        except AttributeError:
            # Method doesn't exist in this Odoo/theme version — nothing to do.
            pass
