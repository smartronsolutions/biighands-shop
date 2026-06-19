# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Droggol Infotech Private Limited. (<https://www.droggol.com/>)

from PIL import ImageColor
from odoo import api, fields, models


class ProductRibbon(models.Model):
    _inherit = 'product.ribbon'

    theme_prime_style = fields.Selection([('1', 'Tag'), ('2', 'Badge'), ('3', 'Circle'), ('4', 'Square')], default='1', help='These styles are designed specifically for Theme Prime UI.', required=True)
    background_color_rgb = fields.Char(compute='_compute_background_color_rgb', store=True, string='Background Color RGB')

    @api.depends('bg_color')
    def _compute_background_color_rgb(self):
        for ribbon in self:
            ribbon.background_color_rgb = False
            if ribbon.bg_color:
                colors = ImageColor.getcolor(ribbon.bg_color, 'RGB')
                ribbon.background_color_rgb = '%s, %s, %s' % (colors[0], colors[1], colors[2])
