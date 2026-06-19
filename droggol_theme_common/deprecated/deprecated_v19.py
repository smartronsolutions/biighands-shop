# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Droggol Infotech Private Limited. (<https://www.droggol.com/>)

from odoo import fields, models


class DrProductLabel(models.Model):
    _name = 'dr.product.label'
    _description = 'Product Label'

    name = fields.Char(required=True, translate=True)
    background_color = fields.Char('Background Color', default='#000000')
    text_color = fields.Char('Text Color', default='#FFFFFF')
    style = fields.Selection([('1', 'Tag'), ('2', 'Badge'), ('3', 'Circle'), ('4', 'Square')], default='1', required=True)
    active = fields.Boolean(default=True)


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    dr_label_id = fields.Many2one('dr.product.label', string='Label')


class ProductAttributeValue(models.Model):
    _inherit = 'product.attribute.value'

    dr_image = fields.Binary('Value Image')
