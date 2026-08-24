# -*- coding: utf-8 -*-
from odoo import fields, models


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    bh_is_requested_quote = fields.Boolean(string='Requested Quote', default=False, index=True, copy=False)
    bh_request_source = fields.Selection([
        ('website_atelier', 'Website Atelier Configurator'),
        ('manual', 'Manual Atelier Request'),
    ], string='Request Source', copy=False)
    bh_request_date = fields.Datetime(string='Requested On', copy=False)
    bh_requested_product_id = fields.Many2one('product.template', string='Requested Product', copy=False)
    bh_collection_id = fields.Many2one('bh.atelier.collection', string='Atelier Collection', copy=False)
    bh_width_mm = fields.Integer(string='Requested Width (mm)', copy=False)
    bh_height_mm = fields.Integer(string='Requested Height (mm)', copy=False)
    bh_area_sqm = fields.Float(string='Area (m²)', digits=(12, 3), copy=False)
    bh_quantity = fields.Float(string='Requested Quantity', copy=False)
    bh_finish = fields.Char(string='Requested Finish', copy=False)
    bh_glazing = fields.Char(string='Glazing / Lining', copy=False)
    bh_client_notes = fields.Text(string='Customer Request Notes', copy=False)
    bh_price_unit = fields.Selection([
        ('sqm', 'Per square metre'),
        ('metre', 'Per linear metre'),
    ], string='Estimate Unit', copy=False)
    bh_reference_count = fields.Integer(string='Reference Images', compute='_compute_bh_reference_count')

    def _compute_bh_reference_count(self):
        Attachment = self.env['ir.attachment'].sudo()
        for order in self:
            order.bh_reference_count = Attachment.search_count([
                ('res_model', '=', 'sale.order'),
                ('res_id', '=', order.id),
                ('mimetype', '=like', 'image/%'),
            ]) if order.id else 0


class SaleOrderLine(models.Model):
    _inherit = 'sale.order.line'

    bh_width_mm = fields.Integer(string='Width (mm)')
    bh_height_mm = fields.Integer(string='Height (mm)')
    bh_finish = fields.Char(string='Finish')
    bh_glazing = fields.Char(string='Glazing / Lining')
    bh_client_notes = fields.Text(string='Atelier Notes')
