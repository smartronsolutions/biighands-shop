# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Droggol Infotech Private Limited. (<https://www.droggol.com/>)

from odoo import api, models


class ThemePrime(models.AbstractModel):
    _inherit = 'theme.utils'

    prime_category_style_templates = [
        'theme_prime.filmstrip_categories_prime_1',
        'theme_prime.filmstrip_categories_prime_2',
        'theme_prime.filmstrip_categories_prime_3',
        'theme_prime.filmstrip_categories_prime_4',
        'theme_prime.filmstrip_categories_prime_5',
    ]

    @api.model
    def enable_view(self, xml_id):
        if xml_id in self.prime_category_style_templates:
            for template in self.prime_category_style_templates:
                self.disable_view(template)
        super().enable_view(xml_id)

    @api.model
    def _reset_default_config(self):
        header_styles = list(range(1, 9))
        for style in header_styles:
            self.disable_view('theme_prime.template_header_style_%s' % style)

        footer_styles = list(range(1, 11))
        for style in footer_styles:
            self.disable_view('theme_prime.template_footer_style_%s' % style)

        super()._reset_default_config()

    @api.model
    def _theme_prime_post_copy(self, mod):
        self.enable_view('theme_prime.prime_cta_wrapper')
        self.enable_view('theme_prime.filmstrip_categories_prime_3')
