# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Droggol Infotech Private Limited. (<https://www.droggol.com/>)

from odoo import fields, models
from odoo.addons.website.models import ir_http
from odoo.http import request


class DrProductsMixin(models.AbstractModel):
    _name = 'dr.products.mixin'
    _description = 'Products Mixin'

    dr_show_out_of_stock = fields.Char(compute='_compute_dr_show_out_of_stock', compute_sudo=True)

    def _compute_dr_show_out_of_stock(self):
        website = ir_http.get_request_website()
        for product in self:
            product.dr_show_out_of_stock = ''
            if website and website._get_dr_theme_config('json_shop_product_item').get('show_stock_label') and not product.allow_out_of_stock_order and product.is_storable:
                free_qty = product.with_context(warehouse_id=website.warehouse_id.id).free_qty if product._name == 'product.product' else product.dr_free_qty
                if product.show_availability and free_qty <= product.available_threshold:
                    product.dr_show_out_of_stock = int(free_qty)
                if free_qty <= 0:
                    product.dr_show_out_of_stock = 'OUT_OF_STOCK'

    def _get_product_pricelist_offer(self):
        website_id = self.env['website'].get_current_website()
        if website_id._dr_has_b2b_access():
            price_rule_id = request.pricelist._get_product_rule(self, 1)
            if price_rule_id:
                price_rule_id = self.env['product.pricelist.item'].browse(price_rule_id)
                if price_rule_id.date_end:
                    return {
                        'rule': price_rule_id,
                        'offer_msg': price_rule_id.dr_offer_msg,
                        'offer_finish_msg': price_rule_id.dr_offer_finish_msg,
                        'date_end': price_rule_id.date_end.strftime('%Y-%m-%d %H:%M:%S'),
                    }
        return False

    def _dr_get_ribbon(self, price_vals=None, auto_assign_ribbons=None, variant=None):
        self.ensure_one()
        if self._name == 'product.product':
            product_tmpl = self.product_tmpl_id
            return product_tmpl._get_ribbon(price_vals=price_vals, auto_assign_ribbons=auto_assign_ribbons, variant=variant)
        return self._get_ribbon(price_vals=price_vals, auto_assign_ribbons=auto_assign_ribbons, variant=variant)

    def _dr_get_previewed_attribute_values(self, category=None, product_query_params=None):
        self.ensure_one()
        if self._name == 'product.product':
            product_tmpl = self.product_tmpl_id
            return product_tmpl._get_previewed_attribute_values(category=category, product_query_params=product_query_params)
        return self._get_previewed_attribute_values(category=category, product_query_params=product_query_params)