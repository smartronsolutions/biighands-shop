# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Droggol Infotech Private Limited. (<https://www.droggol.com/>)

from odoo import _, http
from odoo.addons.website_sale.controllers.cart import Cart
from odoo.http import request


class ThemePrimeCart(Cart):

    @http.route()
    def add_to_cart(self, product_template_id, product_id, quantity=1.0, uom_id=None, product_custom_attribute_values=None, no_variant_attribute_value_ids=None, linked_products=None, **kwargs):
        values = super().add_to_cart(product_template_id, product_id, quantity=quantity, uom_id=uom_id, product_custom_attribute_values=product_custom_attribute_values, no_variant_attribute_value_ids=no_variant_attribute_value_ids, linked_products=linked_products, **kwargs)
        if values and values.get('line_id'):
            product = request.env['product.product'].browse(product_id).exists()
            values['product_id'] = product.id
            values['product_name'] = product.name
        return values

    @http.route()
    def update_cart(self, line_id, quantity, product_id=None, **kwargs):
        vals = super().update_cart(line_id, quantity, product_id=product_id, **kwargs)
        vals['notification_info'] = {
            'order_amount_html': request.env['ir.qweb.field.monetary'].value_to_html(request.cart.amount_total, {'display_currency': request.cart.pricelist_id.currency_id or request.website.company_id.currency_id})
        }
        return vals

    @http.route()
    def clear_cart(self):
        # JAT: Return formatted order amount on clear cart(in sidebar) to properly update cart total in headers.
        super().clear_cart()
        request.session['website_sale_cart_quantity'] = request.cart.cart_quantity
        return {
            'notification_info': {
                'order_amount_html': request.env['ir.qweb.field.monetary'].value_to_html(request.cart.amount_total, {'display_currency': request.cart.pricelist_id.currency_id or request.website.company_id.currency_id})
            }
        }

    def _get_cart_notification_information(self, order, line_ids):
        values = super()._get_cart_notification_information(order, line_ids)
        if values:
            values['accessory_product_ids'] = order.order_line.filtered(lambda line: line.id in line_ids).mapped('product_id.product_tmpl_id')._get_website_accessory_product().mapped('product_tmpl_id').ids
            values['order_amount_html'] = request.env['ir.qweb.field.monetary'].value_to_html(order.amount_total, {'display_currency': order.pricelist_id.currency_id or request.website.company_id.currency_id})
        return values
