# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Droggol Infotech Private Limited. (<https://www.droggol.com/>)

from odoo import _, models


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    def _verify_updated_quantity(self, order_line, product_id, new_qty, uom_id, **kwargs):
        if self.website_id and not self.website_id._dr_has_b2b_access():
            if new_qty > 0:
                return 0, _('You have no access.')
        return super()._verify_updated_quantity(order_line, product_id, new_qty, uom_id, **kwargs)

    def _get_free_delivery_details(self):
        self.ensure_one()
        if not self.only_services:
            valid_methods = self._get_delivery_methods().filtered(lambda x: x.free_over).sorted('amount')
            if valid_methods:
                free_over = valid_methods[0].amount
                order_amount = self._compute_amount_total_without_delivery()
                return {
                    'free_over': free_over,
                    'order_amount': order_amount,
                    'remaining_amount': free_over - order_amount,
                    'progress': order_amount * 100 / (free_over or 1),
                }
        return False
