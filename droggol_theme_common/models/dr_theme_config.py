# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Droggol Infotech Private Limited. (<https://www.droggol.com/>)

import json
import logging
from odoo import _, api, fields, models, tools

_logger = logging.getLogger(__name__)


class DrThemeConfig(models.Model):
    _name = 'dr.theme.config'
    _description = 'Droggol Theme Config'
    _rec_name = 'key'

    key = fields.Char(required=True)
    value = fields.Char()
    website_id = fields.Many2one('website')

    @api.model
    @tools.ormcache('website_id')
    def _get_all_config(self, website_id):
        result_configs = self._get_default_theme_config(website_id)
        all_config = self.search([('website_id', '=', website_id)])
        for config in all_config:
            try:
                if config.key.startswith('bool_'):
                    result_configs[config.key] = config.value == 'True'
                elif config.key.startswith('json_'):
                    config_value = json.loads(config.value)
                    if isinstance(config_value, dict) and result_configs.get(config.key):
                        result_configs[config.key].update(config_value)
                    else:
                        result_configs[config.key] = config_value
                elif config.key.startswith('int_'):
                    result_configs[config.key] = int(config.value)
                elif config.key.startswith('float_'):
                    result_configs[config.key] = float(config.value)
                else:
                    result_configs[config.key] = config.value
            except json.decoder.JSONDecodeError:
                _logger.warning("Theme Prime Config: Cannot parse '%s' with value '%s' ", config.key, config.value)
            except ValueError:
                _logger.warning("Theme Prime Config: Cannot parse '%s' with value '%s' ", config.key, config.value)
        return result_configs

    def _get_default_theme_config(self, website_id):
        website = self.env['website'].sudo().browse(website_id)
        return {
            'json_sidebar_config': {'category_sidebar_style': '2', 'category_sidebar_show_count': True, 'menu_sidebar_show_category': True, 'cart_sidebar_free_delivery_progress': False},
            'json_shop_layout': {'layout': 'prime', 'show_view_switcher': True, 'default_view_mode': 'grid', 'load_more_products': 'button'},
            'json_shop_product_item': {'style': '1', 'image_size': 'default', 'image_fill': 'cover', 'product_highlight_info': 'category', 'show_add_to_cart': True, 'show_wishlist': True, 'show_compare': True, 'show_quick_view': True, 'show_similar_products': True, 'show_rating': True, 'show_stock_label': False, 'show_secondary_image': True},
            'json_shop_filters': {'filter_style': '1', 'filter_position': 'left', 'show_in_sidebar': False, 'collapsible_category': True, 'collapsible_attribute': True, 'show_category_count': True, 'show_attribute_count': False, 'hide_extra_attrib_value': False, 'show_rating_filter': True, 'show_availability_filter': False, 'show_limited_attribute_values': False, 'attribute_value_limit': 20},
            'json_zoom': {'zoom_enabled': True, 'zoom_factor': 2},
            'json_product_recent_sales': {'enabled': True, 'mode': 'fake', 'fake_min_threshold': 3, 'fake_max_threshold': 15, 'duration': 24},
            'json_product_view_count': {'enabled': True, 'mode': 'fake', 'fake_min_threshold': 2, 'fake_max_threshold': 10},
            'bool_enable_ajax_load': False,
            'json_bottom_bar': {'show_bottom_bar': True, 'show_bottom_bar_on_scroll': False, 'filters': True, 'actions': ['tp_home', 'tp_search', 'tp_wishlist', 'tp_offer', 'tp_brands', 'tp_category', 'tp_orders']},
            'bool_sticky_add_to_cart': True,
            'json_general_language_pricelist_selector': {'hide_country_flag': False},
            'json_b2b_shop_config': {'dr_enable_b2b': False, 'dr_only_assigned_pricelist': False},
            'json_dynamic_snippet_config': {'dr_lazy_load_snippets': True, 'dr_snippets_max_item': 20},
            'json_mobile': {},
            'json_product_search': {'advance_search': True, 'search_category': True, 'search_brand': True, 'search_attribute': True, 'search_suggestion': True, 'search_limit': 8, 'pills_limit': 5, 'pills_style': '1', 'search_max_product': 6, 'search_fuzzy': True, 'search_fill_products': False, 'search_report': True, 'delete_search_report': 90},
            'json_brands_page': {'disable_brands_grouping': False},
            'cart_flow': 'default',
            'cart_config_type': 'prime',
            'theme_installed': website.theme_id and website.theme_id.name.startswith('theme_prime') or False,
            'pwa_active': website.dr_pwa_activated,
            'pwa_name': website.dr_pwa_name,
            'pwa_show_install_banner': website.dr_pwa_show_install_banner,
            'bool_show_bulk_price': False,
            'bool_show_products_nav': True,
        }

    def save_config(self, website_id, configs):
        all_config = self.search([('website_id', '=', website_id)])
        for key, value in configs.items():
            key, value = self._prepare_value_for_write(key, value)
            config = all_config.filtered(lambda c: c.key == key)
            if config:
                config.value = value
            else:
                self.create({'key': key, 'value': value, 'website_id': website_id})
        self.env.registry.clear_cache()
        return True

    def _prepare_value_for_write(self, key, value):
        if key.startswith('json_'):
            value = json.dumps(value)
        elif key.startswith('int_'):
            value = value
        return key.strip(), value
