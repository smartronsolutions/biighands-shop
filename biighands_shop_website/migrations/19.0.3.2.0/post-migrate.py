# -*- coding: utf-8 -*-
from odoo.api import Environment

from odoo.addons.biighands_shop_website.hooks import post_init_hook


def migrate(cr, version):
    """Refresh atelier data after adding requested-quote tracking fields."""
    env = Environment(cr, 1, {})
    post_init_hook(env)
    orders = env['sale.order'].sudo().search([
        ('origin', '=', 'Website Atelier Configurator'),
        ('bh_is_requested_quote', '=', False),
    ])
    for order in orders:
        line = order.order_line.filtered(lambda item: not item.display_type)[:1]
        if not line:
            continue
        template = line.product_id.product_tmpl_id
        order.write({
            'bh_is_requested_quote': True,
            'bh_request_source': 'website_atelier',
            'bh_request_date': order.date_order,
            'bh_requested_product_id': template.id,
            'bh_collection_id': template.bh_collection_id.id,
            'bh_width_mm': line.bh_width_mm,
            'bh_height_mm': line.bh_height_mm,
            'bh_area_sqm': (line.bh_width_mm * line.bh_height_mm) / 1000000.0,
            'bh_quantity': line.product_uom_qty,
            'bh_finish': line.bh_finish,
            'bh_glazing': line.bh_glazing,
            'bh_client_notes': line.bh_client_notes or order.note,
        })
