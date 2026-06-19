# -*- coding: utf-8 -*-
from odoo import models, api


class Website(models.Model):
    _inherit = 'website'

    def _compute_shop_page_container(self):
        # theme_prime accesses env.context['category'] directly (without .get()),
        # which raises KeyError when the shop page is visited without a category
        # filter. Ensure 'category' is always present before calling super().
        if 'category' not in self.env.context:
            self = self.with_context(category=0)
        return super()._compute_shop_page_container()
