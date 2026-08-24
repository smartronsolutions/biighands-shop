# -*- coding: utf-8 -*-
from odoo import fields, models


class BhAtelierCollection(models.Model):
    _name = 'bh.atelier.collection'
    _description = 'Atelier Collection'
    _order = 'sequence, name'

    name = fields.Char(required=True, translate=True)
    slug = fields.Char(required=True, index=True)
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)
    product_count = fields.Integer(compute='_compute_product_count')

    _slug_unique = models.Constraint('UNIQUE(slug)', 'The collection URL slug must be unique.')

    def _compute_product_count(self):
        counts = self.env['product.template']._read_group(
            [('bh_collection_id', 'in', self.ids)],
            ['bh_collection_id'],
            ['__count'],
        )
        mapped = {collection.id: count for collection, count in counts}
        for collection in self:
            collection.product_count = mapped.get(collection.id, 0)


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    bh_collection_id = fields.Many2one(
        'bh.atelier.collection',
        string='Atelier Collection',
        ondelete='restrict',
        index=True,
    )
    bh_min_width = fields.Integer(string='Minimum Width (mm)', default=300)
    bh_max_width = fields.Integer(string='Maximum Width (mm)', default=6000)
    bh_min_height = fields.Integer(string='Minimum Height (mm)', default=300)
    bh_max_height = fields.Integer(string='Maximum Height (mm)', default=4000)
    bh_finishes = fields.Char(
        string='Available Finishes',
        default='Natural Silver,Matte Black,Anodized Bronze,Champagne',
    )
    bh_glazing = fields.Char(
        string='Glazing / Lining Options',
        default='Double Glazing,Triple Glazing,Laminated Acoustic',
    )
    bh_featured = fields.Boolean(string='Featured on Atelier Home')
    bh_slug = fields.Char(string='Atelier URL Slug', index=True)
    bh_product_type = fields.Char(string='System Type', translate=True)
    bh_tagline = fields.Char(string='Tagline', translate=True)
    bh_price_unit = fields.Selection([
        ('sqm', 'Per square metre'),
        ('metre', 'Per linear metre'),
    ], string='Estimate Unit', default='sqm', required=True)
    bh_opening = fields.Char(string='Opening', translate=True)
    bh_applications = fields.Char(string='Applications', translate=True)
    bh_specs = fields.Text(string='Technical Specifications', translate=True)
    bh_features = fields.Text(string='Key Features', translate=True)
