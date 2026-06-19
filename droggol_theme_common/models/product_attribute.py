# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Droggol Infotech Private Limited. (<https://www.droggol.com/>)

from odoo import api, fields, models, _


class ProductAttribute(models.Model):
    _inherit = 'product.attribute'

    dr_is_show_shop_search = fields.Boolean('Show Searchbar in Shop Filter', default=False)
    dr_attribute_popup_id = fields.Many2one('dr.website.content', string='Guide', domain='[("content_type", "=", "attribute_popup")]')
    dr_attribute_pills_style = fields.Selection([
        ('default', 'Default'),
        ('circle', 'Circle'),
    ], default='default', string='Style (Pills)')
    dr_radio_image_style = fields.Selection([
        ('default', 'Default'),
        ('image', 'Image'),
        ('image_compact', 'Image (Compact)'),
        ('image_text', 'Image + Text'),
    ], default='default', string='Style (Image)')
    dr_search_suggestion = fields.Selection([('auto', 'Autocomplete'), ('auto_suggestion', 'Autocomplete & Suggestion')], string='Search Suggestion Type')
    dr_is_brand = fields.Boolean('Is Brand?')

    @api.onchange('dr_is_brand')
    def _onchange_dr_is_brand(self):
        self.display_type = 'image'

    def open_create_brand_value(self):
        return {
            'type': 'ir.actions.act_window',
            'name': _('Brand'),
            'res_model': 'product.attribute.value',
            'view_mode': 'form',
            'target': 'new',
            'views': [[False, 'form']],
            'context': {'default_attribute_id': self.id}
        }

    def _get_shop_filter_attributes_info(self, _config_shop_filters={}, hide_extra_value=False, count_list=None, selected=[]):
        if self.display_type == "select":
            # Do not hide extra values for select type
            return {
                'attribute_values': self.value_ids,
                'total_attribute_to_display': 0,
            }
        attribute_values = self.value_ids
        selected_attribute_val_ids = list(selected) if selected else []
        selected_attribute_values = self.env['product.attribute.value']
        if selected_attribute_val_ids:
            selected_attribute_values = attribute_values.filtered(lambda v: v.id in selected_attribute_val_ids)

        if hide_extra_value:
            attribute_values = attribute_values.filtered(lambda v: v.id in count_list and count_list[v.id] != 0)

        _config_attribute_value_limit = _config_shop_filters.get('attribute_value_limit', 20)
        # Get non-selected values limited by config
        non_selected_values = attribute_values.filtered(lambda v: v.id not in selected_attribute_val_ids)
        limited_non_selected = non_selected_values[:_config_attribute_value_limit]

        return {
            'attribute_values': selected_attribute_values + limited_non_selected,
            'total_attribute_to_display': len(attribute_values) - _config_attribute_value_limit - len(selected_attribute_val_ids),
        }

class ProductAttributeValue(models.Model):
    _inherit = 'product.attribute.value'

    dr_brand_description = fields.Text('Description', translate=True)
    ds_name = fields.Char('Search DS Name', compute="_compute_ds_name", search="_search_ds_name")
    image = fields.Image(max_width=256, max_height=256)  # Existing field: Increased image size

    def _compute_ds_name(self):
        for attr in self:
            attr.ds_name = attr.name

    @api.model
    def _search_ds_name(self, operator, value):
        return [('name', operator, value)]


class ProductTemplateAttributeValue(models.Model):
    _inherit = 'product.template.attribute.value'

    dr_thumb_image = fields.Image('Swatch Image', max_width=128, max_height=128)

    def init(self):
        """ create index for faster search """
        self.env.cr.execute("""CREATE INDEX IF NOT EXISTS ptav_attr_val_tmpl_idx ON product_template_attribute_value (attribute_id, product_attribute_value_id, product_tmpl_id)""")
        self.env.cr.execute("""CREATE INDEX IF NOT EXISTS ptav_tmpl_attr_val_idx ON product_template_attribute_value (product_tmpl_id, attribute_id, product_attribute_value_id)""")
        super().init()

    def _get_extra_price(self, combination_info):
        if not combination_info.get('has_b2b_access', True):
            return 0.0
        return super()._get_extra_price(combination_info)


class ProductTemplateAttributeLine(models.Model):
    _inherit = 'product.template.attribute.line'

    dr_attribute_popup_id = fields.Many2one('dr.website.content', string='Guide', domain='[("content_type", "=", "attribute_popup")]')
