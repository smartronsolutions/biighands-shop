# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Droggol Infotech Private Limited. (<https://www.droggol.com/>)

import logging

from odoo import api, SUPERUSER_ID

_logger = logging.getLogger(__name__)

def migrate(cr, version):
    env = api.Environment(cr, SUPERUSER_ID, {})

    # Pre/Post-migration? TODO
    for attribute in env['product.attribute'].with_context(active_test=False).search([('display_type', '=', 'radio_square')]):
        attribute.display_type = 'pills'
        attribute.dr_attribute_pills_style = 'default'
        _logger.info('Theme Prime v19 Migration: Changed display_type of attribute %s (ID: %s) from "radio_square" to "pills"' % (attribute.name, attribute.id))

    for attribute in env['product.attribute'].with_context(active_test=False).search([('display_type', '=', 'radio_circle')]):
        attribute.display_type = 'pills'
        attribute.dr_attribute_pills_style = 'circle'
        _logger.info('Theme Prime v19 Migration: Changed display_type of attribute %s (ID: %s) from "radio_circle" to "pills"' % (attribute.name, attribute.id))

    # Post Migration
    for attribute in env['product.attribute'].with_context(active_test=False).search([('display_type', '=', 'radio_image')]):
        attribute.display_type = 'image'
        for value in attribute.value_ids:
            value.image = value.dr_image
        _logger.info('Theme Prime v19 Migration: Changed display_type of attribute %s (ID: %s) from "radio_image" to "image"' % (attribute.name, attribute.id))

    mapping = {}
    for label in env['dr.product.label'].search([]):
        mapping[label.id] = env['product.ribbon'].create({
            'name': label.name,
            'text_color': label.text_color,
            'bg_color': label.background_color,
            'theme_prime_style': label.style,
        }).id

    for product in env['product.template'].with_context(active_test=False).search([('dr_label_id', '!=', False)]):
        product.write({'website_ribbon_id': mapping.get(product.dr_label_id.id)})

    _logger.info('Theme Prime v19 Migration: Migrated %s product labels to ribbons' % len(mapping))

    # not sure we should remove it or not as it just changed the asset
    # 'theme_prime/static/src/xml/frontend/image_hotspot.xml'
    # Remove assets
    paths = [
        'theme_prime/static/src/js/pwa/pwa.js',
        'theme_prime/static/src/js/website_sale_wishlist.js',
        'theme_prime/static/src/js/website_sale.js',
        'theme_prime/static/src/js/frontend/bottombar.js',
        'theme_prime/static/src/js/frontend/comparison.js',
        'theme_prime/static/src/js/editor/snippets.editor.js',
        'theme_prime/static/src/scss/wysiwyg_snippets.scss',
        'theme_prime/static/src/snippets/s_coming_soon_1/000.js',
        'theme_prime/static/src/snippets/s_gallery_1/000.js',
        'theme_prime/static/src/snippets/s_tp_countdown/000.js',
        'theme_prime/static/src/js/suggested_product_slider/suggested_product_slider.js',
        'theme_prime/static/src/js/suggested_product_slider/suggested_product_slider.xml',
        'theme_prime/static/src/xml/frontend/documents.xml',
        'theme_prime/static/src/scss/editor/editor.scss',
        'theme_prime/static/src/xml/editor/dialogs/snippet_configurator_dialog.xml',
        'theme_prime/static/src/js/editor/snippets/snippets.options.js',
        'theme_prime/static/lib/OwlCarousel2-2.3.4/assets/owl.carousel.css',
        'theme_prime/static/lib/OwlCarousel2-2.3.4/assets/owl.theme.default.css',
    ]
    assets_ids = env['ir.asset'].with_context(active_test=False).search([('path', 'in', paths)])
    if assets_ids:
        _logger.info('Theme Prime v19 Migration: Deleted %s asset(s): %s' % (len(assets_ids.ids), assets_ids.ids))
        assets_ids.unlink()
