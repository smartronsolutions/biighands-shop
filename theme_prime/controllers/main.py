# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Droggol Infotech Private Limited. (<https://www.droggol.com/>)

import re
import string
from collections import defaultdict
import datetime
import ast

from odoo import _, http
from odoo.addons.website_sale.const import SHOP_PATH
from odoo.addons.website.controllers.main import Website
from odoo.addons.website_sale.controllers.main import WebsiteSale
from odoo.addons.website_sale_wishlist.controllers.main import WebsiteSaleWishlist
from odoo.addons.website_sale.controllers.combo_configurator import (WebsiteSaleComboConfiguratorController)
from odoo.addons.website_sale.controllers.product_configurator import (WebsiteSaleProductConfiguratorController)
from odoo.addons.website_sale.controllers.variant import WebsiteSaleVariantController
from odoo.http import request
from odoo.fields import Domain
from odoo.tools import html_escape

#TO-DO: KIG  replace /shop with SHOP_PATH


class ThemePrimeWebsiteSale(WebsiteSale):

    def _get_search_options(self, category=None, attribute_value_dict=None, tags=None, min_price=0.0, max_price=0.0, conversion_rate=1, **post):
        res = super()._get_search_options(category=category, attribute_value_dict=attribute_value_dict, tags=tags, min_price=min_price, max_price=max_price, conversion_rate=conversion_rate, **post)
        if request.httprequest.args.get('hide_out_of_stock'):
            res['hide_out_of_stock'] = request.httprequest.args.get('hide_out_of_stock')
        if post.get('rating') != 'skip' and request.httprequest.args.get('rating'):
            res['rating'] = request.httprequest.args.get('rating')
        return res

    def _shop_get_query_url_kwargs(self, search, min_price, max_price, order=None, tags=None, **kwargs):
        result = super()._shop_get_query_url_kwargs(search, min_price, max_price, order=order, tags=tags, **kwargs)
        result.update(
            hide_out_of_stock=kwargs.get('hide_out_of_stock'),
            rating=kwargs.get('rating'),
        )
        return result


    @http.route('/theme_prime/get_attribute_selection_dialog_content', type='jsonrpc', auth='public', website=True)
    def get_attribute_selection_dialog_content(self, domain, attribute_id, selected_attributes, attributes_ids, attrib_values, **kwargs):
        IrUiView = request.env['ir.ui.view']
        attributes = request.env['product.attribute'].browse(attribute_id)
        all_attributes = request.env['product.attribute'].browse(attributes_ids)
        attr_fake_qcontext = {
            'attributes': all_attributes,
            'attrib_set': set(selected_attributes),
            'attrib_values': {int(key): value for key, value in attrib_values.items()},
        }
        ProductTemplate = request.env['product.template']
        get_attrib_count = ProductTemplate._get_product_attrib_count(domain=domain, qcontext=attr_fake_qcontext)
        _config_shop_filters = request.website._get_dr_theme_config('json_shop_filters')
        # generated fake data for rendering template
        return IrUiView._render_template('theme_prime.tp_shop_filter_attributes', {
            'attributes': attributes, # current attribute only
            'show_limited_attribute_values': False,
            'attrib_set': set(selected_attributes),
            '_config_shop_filters': _config_shop_filters,
            '_filter_show_attribute_count': _config_shop_filters.get('show_attribute_count'),
            'attributes_ids': set(attributes_ids),
            'get_attrib_count': get_attrib_count,
            'selected_ratings': [],
        })

    # TODO: Check if we can use lazy option for count

    @http.route()
    def shop(self, page=0, category=None, search='', min_price=0.0, max_price=0.0, tags='', **post):
        if not request.website.has_ecommerce_access():
            return request.redirect('/web/login')
        response = super().shop(page=page, category=category, search=search, min_price=min_price, max_price=max_price, tags=tags, **post)
        theme_id = request.website.sudo().theme_id
        if theme_id and theme_id.name.startswith('theme_prime'):
            try:
                min_price = float(min_price)
            except ValueError:
                min_price = 0
            try:
                max_price = float(max_price)
            except ValueError:
                max_price = 0

            ProductTemplate = request.env['product.template']
            request_args = request.httprequest.args

            attribute_values = request_args.getlist('attribute_values')
            attribute_value_dict = self._get_attribute_value_dict(attribute_values)
            attribute_ids = set(attribute_value_dict.keys())

            fuzzy_search_term = response.qcontext.get('search') or search
            category = response.qcontext.get('category')
            if request.website._get_dr_theme_config('json_shop_filters')['show_category_count']:
                # Categories
                domain = self._prepare_filters_domain(search=fuzzy_search_term, attribute_value_dict=attribute_value_dict, min_price=min_price, max_price=max_price, **post)
                response.qcontext.update(get_category_count=ProductTemplate._get_product_category_count(domain=domain))
            if request.website._get_dr_theme_config('json_shop_filters')['show_attribute_count'] or request.website._get_dr_theme_config('json_shop_filters')['hide_extra_attrib_value']:
                # Attributes
                domain = self._prepare_filters_domain(search=fuzzy_search_term, category=category, min_price=min_price, max_price=max_price, **post)
                response.qcontext.update(get_attrib_count=ProductTemplate._get_product_attrib_count(domain=domain, qcontext=response.qcontext))

                # Rating
                domain = self._prepare_filters_domain(search=fuzzy_search_term, attribute_value_dict=attribute_value_dict, category=category, min_price=min_price, max_price=max_price, **{**post, 'rating': 'skip'})
                response.qcontext.update(get_ratings_count=ProductTemplate._get_product_rating_count(domain=domain))

            selected_ratings = []
            if request_args.get('rating'):
                selected_ratings = [int(value) for value in request_args.get('rating').split(',')]

            _config_shop_layout = request.website._get_dr_theme_config('json_shop_layout')

            view_mode = request_args.get('view_mode')
            if view_mode:
                request.session['view_mode'] = view_mode
            if not request.session.get('view_mode'):
                request.session['view_mode'] = _config_shop_layout.get('default_view_mode')
            if request.session['view_mode'] not in ['grid', 'list']:
                request.session['view_mode'] = _config_shop_layout.get('default_view_mode')

            if _config_shop_layout.get('layout') == 'prime':
                response.template = 'theme_prime.shop_layout'

            response.qcontext.update(
                _config_shop_layout=_config_shop_layout,
                _config_product_item=request.website._get_dr_theme_config('json_shop_product_item'),
                _config_shop_filters=request.website._get_dr_theme_config('json_shop_filters'),
                show_limited_attribute_values=request.website._get_dr_theme_config('json_shop_filters').get('show_limited_attribute_values', False),
                view_mode=request.session['view_mode'],
                page=page,
                domain_for_lazy_attribute=ast.literal_eval(str(self._prepare_filters_domain(search=fuzzy_search_term, category=category, min_price=min_price, max_price=max_price, **post))),
                attributes_ids=attribute_ids,
                selected_ratings=selected_ratings,
                selected_hide_out_of_stock=request_args.get('hide_out_of_stock'),
                selected_attributes=response.qcontext.get('attrib_set') or request_args.get('min_price') or request_args.get('max_price') or response.qcontext.get('tags') or selected_ratings or request_args.get('hide_out_of_stock')
            )
        return response

    def _prepare_filters_domain(self, search=None, category=None, attribute_value_dict=None, tags=None, min_price=0.0, max_price=0.0, conversion_rate=1, **post):
        options = self._get_search_options(category=category, attribute_value_dict=attribute_value_dict, tags=tags, min_price=min_price, max_price=max_price, conversion_rate=conversion_rate, **post)
        search_detail = request.website._search_get_details('products_only', None, options)[0]
        search_fields = search_detail['search_fields']
        base_domain = search_detail['base_domain']
        return request.env['product.template']._search_build_domain(base_domain, search, search_fields, search_detail.get('search_extra'))

    def _prepare_product_values(self, product, category, **kwargs):
        res = super()._prepare_product_values(product, category, **kwargs)
        if request.website._get_dr_theme_config('bool_show_products_nav'):
            ProductTemplate = request.env['product.template']
            res['prev_product_id'] = ProductTemplate.search([('website_sequence', '<', product.website_sequence)] + request.env['website'].sale_product_domain() + request.website.website_domain(), limit=1, order='website_sequence desc')
            res['next_product_id'] = ProductTemplate.search([('website_sequence', '>', product.website_sequence)] + request.env['website'].sale_product_domain() + request.website.website_domain(), limit=1, order='website_sequence')
        return res

    @http.route(f'{SHOP_PATH}/all-brands', type='http', auth='public', website=True, sitemap=True)
    def brands(self, search='', **kargs):
        is_disable_grouping = request.website._get_dr_theme_config('json_brands_page')['disable_brands_grouping']
        brands = request.website._get_brands([('name', 'ilike', search)] if search else [])
        attributes = brands.mapped('attribute_id')
        get_brand_count = request.env['product.template']._get_product_attrib_count(domain=request.env['website'].sale_product_domain(), qcontext={'attributes': attributes})
        brands = brands.filtered(lambda brand: brand.id in get_brand_count.keys())

        grouped_brands = defaultdict(list)
        if is_disable_grouping:
            grouped_brands = {'All Brands': brands}
        else:
            alphabet_range = string.ascii_uppercase
            grouped_brands.update((alphabet, []) for alphabet in alphabet_range)
            for brand in brands:
                first_char = str.upper(brand.name[:1])
                grouped_brands[first_char].append(brand)

        return request.render('theme_prime.all_brands', {'is_disable_grouping': is_disable_grouping, 'brands': brands, 'grouped_brands': grouped_brands, 'search': search, 'get_brand_count': get_brand_count})

    @http.route('/theme_prime/get_search_sidebar', type='jsonrpc', auth='public', website=True, sitemap=False, csrf=False)
    def search_sidebar(self, **post):
        return request.env['ir.ui.view']._render_template('theme_prime.search_sidebar')

    @http.route('/theme_prime/get_cart_sidebar', type='jsonrpc', auth='public', website=True, sitemap=False, csrf=False)
    def cart_sidebar(self, **post):
        return request.env['ir.ui.view']._render_template('theme_prime.cart_sidebar', values={'order': request.cart})

    @http.route('/theme_prime/get_categories_list', type='jsonrpc', auth='public', website=True, sitemap=False)
    def _get_categories_list(self, **post):
        return {
            'categories': request.env['product.public.category'].search_read(request.website.website_domain(), ['name', 'parent_id', 'child_id']),
            'category_count': request.env['product.template']._get_product_category_count(domain=request.website.website_domain()) if request.website._get_dr_theme_config('json_sidebar_config').get('category_sidebar_show_count') else {},
        }

    @http.route('/theme_prime/get_quick_view_html', type='jsonrpc', auth='public', website=True)
    def get_quick_view_html(self, options, **kwargs):
        IrUiView = request.env['ir.ui.view']
        product_tmpl_id = options.get('product_tmpl_id')
        product_id = options.get('product_id')
        extra = {}
        if product_id:
            product_variant = request.env['product.product'].browse(product_id)
            product_tmpl_id = product_variant.product_tmpl_id.id
            extra = {'dr_variant_id': product_variant}
            kwargs.update({'attribute_values': ','.join([str(p.id) for p in product_variant.product_template_attribute_value_ids.mapped('product_attribute_value_id')])})
        domain = Domain.AND([request.website.sale_product_domain(), [('id', '=', product_tmpl_id)]])
        product = request.env['product.template'].search(domain, limit=1)

        # If moved to another website or delete
        if not product:
            return False

        values = self._prepare_product_values(product, category='', search='', **kwargs)
        result = request.website.get_theme_prime_shop_config()
        values.update(result)
        values.update(extra)

        template = 'theme_prime.tp_product_quick_view'
        if options.get('variant_selector'):
            values['auto_add_product'] = product.product_variant_count == 1
            template = 'theme_prime.product_variant_selector_dialog'
        elif options.get('right_panel'):
            template = 'theme_prime.tp_product_right_panel'

        if options.get('main_product_classes'):
            values['main_product_classes'] = options.get('main_product_classes')
        else:
            values['main_product_classes'] = ''

        return IrUiView._render_template(template, values=values)


class DroggolProductConfiguratorController(WebsiteSaleProductConfiguratorController):

    @http.route()
    def website_sale_should_show_product_configurator(self, product_template_id, ptav_ids, is_product_configured):
        if request.website._dr_website_has_theme_prime() and request.website._get_dr_theme_config('cart_config_type') == 'prime':
            # see commit message for more details
            product_template = request.env['product.template'].browse(product_template_id)
            single_product_variant = product_template.get_single_product_variant()
            return (not (single_product_variant.get('product_id') or is_product_configured))
        else:
            return super().website_sale_should_show_product_configurator(product_template_id, ptav_ids, is_product_configured)


class DroggolComboConfiguratorController(WebsiteSaleComboConfiguratorController):
    @http.route()
    def website_sale_combo_configurator_update_cart(self, *args, **kwargs):
        _super = super().website_sale_combo_configurator_update_cart(*args, **kwargs)
        theme_id = request.website.sudo().theme_id
        if theme_id and theme_id.name.startswith('theme_prime') and request.website._get_dr_theme_config('cart_flow') != 'default':
            product_id = kwargs.get('combo_product_id')
            product = request.env['product.product'].browse(int(product_id))
            _super.update({
                'dr_is_combo': True,
                'product_name': product.name,
                'product_id': int(product_id),
                'accessory_product_ids': product.accessory_product_ids and product.accessory_product_ids.mapped('product_tmpl_id').ids or []
            })
        return _super


class DroggolWishlist(WebsiteSaleWishlist):
    @http.route('/theme_prime/wishlist_general', auth="public", type='jsonrpc', website=True)
    def wishlist_general(self, product_id=False, **post):
        res = {}
        if product_id:
            res['wishlist_id'] = self.add_to_wishlist(product_id).id
        res.update({
            'products': request.env['product.wishlist'].with_context(display_default_code=False).current().mapped('product_id').ids,
            'name': request.env['product.product'].browse(product_id).name
        })
        return res


class ThemePrimeWebsiteSaleVariantController(WebsiteSaleVariantController):

    @http.route()
    def get_combination_info_website(self, product_template_id, product_id, combination, add_qty, uom_id=None, **kwargs):
        res = super().get_combination_info_website(product_template_id=product_template_id, product_id=product_id, combination=combination, add_qty=add_qty, uom_id=uom_id, **kwargs)
        website = request.website
        if res.get('carousel', False) and website.product_page_image_layout == 'grid' and kwargs.get('quick_view', False):
            product_template_id = product_template_id and int(product_template_id)
            product_template = request.env['product.template'].browse(product_template_id)
            product = request.env['product.product'].browse(res['product_id'])
            res['carousel'] = request.env['ir.ui.view']._render_template(
                'theme_prime.tp_carousel_only_slider',
                values={
                    'product': product_template,
                    'product_variant': product,
                    'website': website,
                },
            )
        return res


class ThemePrimeMainClass(http.Controller):

    # ----------------------------------------------------------
    # Helper methods
    # ----------------------------------------------------------
    # This method is needs to be clean in next version we will do refactor
    # Currently our rendering process is weird.
    def _get_products(self, domain=None, fields=[], limit=25, order=None, options={}):
        pricelist = request.pricelist
        final_domain = request.website.sale_product_domain()
        if domain:
            final_domain = Domain.AND([final_domain, domain])
        res_model = options.get('model')
        if res_model != 'product.product':
            res_model = 'product.template'
        options['model'] = res_model
        product_tmpl_ids = []
        temp_order = order
        if order == 'last_viewed':
            product_tmpl_ids = self._get_last_viewed_products(domain, res_model, limit)
            final_domain = [('id', 'in', product_tmpl_ids)]
            order = None

        # bestseller is not a real field
        bestseller_ids, old_limit = [], limit
        if order == 'bestseller':
            bestseller_ids, limit, order = self._get_bestseller_products(old_limit)

        products = request.env[res_model].with_context(pricelist=pricelist.id).search(final_domain, limit=limit, order=order)

        if temp_order == 'last_viewed' and len(product_tmpl_ids):
            products = products.sorted(lambda p: product_tmpl_ids.index(p.id))
        default_fields = ['id', 'name', 'website_url', 'default_code']
        if 'rating_ids' in fields:
            fields.remove('rating_ids')
            options['rating_info'] = True
        fields = set(default_fields + fields)

        if bestseller_ids:
            bestseller_ids_filtered = set(bestseller_ids) & set(products.ids)
            bestseller_sorted_ids = [p_id for p_id in bestseller_ids if p_id in bestseller_ids_filtered]
            remain_products = set(products.ids) - set(bestseller_sorted_ids)
            final_product_ids = bestseller_sorted_ids + list(remain_products)
            products = request.env[res_model].with_context(pricelist=pricelist.id).browse(final_product_ids[:old_limit])

        return self._prepare_product_data(products, fields, pricelist, options)

    def _get_last_viewed_products(self, domain, res_model, limit):
        domain = Domain.AND([[('website_published', '=', True)], request.website.get_current_website().website_domain(), domain])
        products = request.env['website.snippet.filter']._get_products_latest_viewed(request.website, limit, domain)
        return products.mapped("product_tmpl_id").ids if len(products) and res_model == 'product.template' else products.ids

    def _prepare_product_data(self, products, fields, pricelist, options=None):

        options = options or {}
        price_public_visibility = request.website._dr_has_b2b_access()
        visibility_label = False
        showStockLabel = False
        res_model = options.get('model', 'product.template')

        if not price_public_visibility:
            visibility_label = self._get_tp_view_template('theme_prime.tp_b2b_price_label')

        extra_data = {'rating', 'offer_data', 'dr_stock_label', 'colors'} & set(fields)
        fields = list(set(fields) - extra_data)

        if 'dr_stock_label' in extra_data:
            showStockLabel = request.website._get_dr_theme_config('json_shop_product_item').get('show_stock_label')
        currency_id = pricelist.currency_id or request.website.company_id.currency_id

        result = products.read(fields)
        for res_product, product in zip(result, products):
            if res_model == 'product.product':
                combination_info = product.product_tmpl_id._get_combination_info(product_id=product.id)
                res_product['name'] = product.with_context(display_default_code=False).display_name
            else:
                combination_info = product._get_combination_info(only_template=True)
            res_product.update(combination_info)
            price_info = self._get_computed_product_price(product, res_product, price_public_visibility, visibility_label, currency_id)
            res_product.update(price_info)
            res_product['product_variant_id'] = product._get_first_possible_variant_id() if res_model == 'product.template' else product.id

            # Images
            res_product['img_small'] = request.website.image_url(product, 'image_256')
            res_product['img_medium'] = request.website.image_url(product, 'image_512')
            res_product['img_large'] = request.website.image_url(product, 'image_1024')

            # short Description
            if 'description_ecommerce' in fields:
                description = res_product.get('description_ecommerce')
                res_product['short_description'] = description[:100] + '...' if description and len(description) > 100 else description or False
            # label and color
            if 'colors' in extra_data:
                product_template = product
                if res_model != 'product.template':
                    product_template = product.product_tmpl_id
                product_ptavs_data = product._dr_get_previewed_attribute_values().get(product_template.id, {})
                product_ptavs = []
                colors_template = ''
                attribute_name = False
                if product_ptavs_data:
                    product_ptavs = product_ptavs_data.get('ptavs_data')
                    if product_ptavs and len(product_ptavs):
                        attribute_name = product_ptavs[0].get('ptav').attribute_id.name
                        colors_template = self._get_tp_view_template('theme_prime.product_preview_swatches', {'product_ptavs_data': product_ptavs_data, 'product_ptavs': product_ptavs, 'parent_selector': '.card', 'img_selector': '.d-product-img', 'link_selector': '.d_product_box'})
                res_product['colors'] = colors_template
                res_product['attribute_name'] = attribute_name
            # label and color
            if 'website_ribbon_id' in fields and product.website_ribbon_id and res_product.get('product_variant_id', False):
                product_variant = request.env['product.product'].browse(res_product.get('product_variant_id', False))
                label = product.sudo()._dr_get_ribbon(price_vals=combination_info, variant=product_variant)
                res_product['label'] = label
                res_product['label_id'] = label.id
                res_product['label_template'] = self._get_tp_view_template('theme_prime.product_label', {'label': label})
            if 'dr_stock_label' in extra_data and showStockLabel and product.dr_show_out_of_stock:
                res_product['dr_stock_label'] = self._get_tp_view_template('theme_prime.product_label', {'product': product, 'stock': True})
                res_product['dr_show_out_of_stock'] = product.dr_show_out_of_stock
            # rating
            if 'offer_data' in extra_data:
                offer = product._get_product_pricelist_offer()
                if offer:
                    rule = offer.get('rule')
                    res_product['offer_data'] = {
                        'date_end': offer.get('date_end'),
                        'offer_msg': rule.dr_offer_msg,
                        'offer_finish_msg': rule.dr_offer_finish_msg
                    }

            if 'rating' in extra_data or options.get('rating_info', False):
                rating_avg = product.sudo().rating_avg
                res_product['rating'] = self._get_rating_template(rating_avg)
                res_product['rating_avg'] = rating_avg
                if options.get('rating_info', False):
                    rating_record = product.sudo().rating_ids.filtered(lambda r: not r.is_internal).sorted(key=lambda r: (r.rating, r.create_date), reverse=True)
                    if rating_record:
                        rating_record = rating_record[:1]
                        attachment = rating_record.message_id and rating_record.message_id.attachment_ids and rating_record.message_id.attachment_ids[0] or False
                        if attachment:
                            attachment = attachment.sudo()
                        res_product['rating_info'] = {
                            'res_partner_name': rating_record.partner_id.name,
                            'rating_image_url': rating_record.rating_image_url,
                            'rating': self._get_rating_template(rating_record.rating),
                            'res_partner_id': rating_record.partner_id.id,
                            'res_partner_state': rating_record.partner_id.state_id.name or False,
                            'res_partner_country': rating_record.partner_id.country_id.name or False,
                            'comment': rating_record.feedback or False,
                            'avatar': '/web/image/mail.message/' + str(rating_record.message_id.id) + '/author_avatar/50x50',
                            'attachment_url': f"/web/image/{attachment.id}?access_token={attachment._get_raw_access_token()}&filename={attachment.name}" if attachment else False,
                        }
            # images
            if 'product_variant_ids' in fields:
                res_product['images'] = product.product_variant_ids.ids
            # website_category
            if 'public_categ_ids' in fields and product.public_categ_ids:
                first_category = product.public_categ_ids[0]
                res_product['category_info'] = {
                    'name': first_category.name,
                    'id': first_category.id,
                    'website_url': '/shop/category/' + str(first_category.id),
                }
            # brand
            if 'dr_brand_value_id' in fields:
                res_product['brand_info'] = False
                if product.dr_brand_value_id:
                    res_product['brand_info'] = {
                        'name': product.dr_brand_value_id.name,
                        'id': product.dr_brand_value_id.id,
                    }
        return result

    def _get_computed_product_price(self, product, product_data, price_public_visibility, visibility_label, currency_id):
        FieldMonetary = request.env['ir.qweb.field.monetary']
        monetary_options = {'display_currency': currency_id}
        return {
            'visibility': price_public_visibility,
            'price_raw': product_data['price'] if price_public_visibility else visibility_label,
            'list_price_raw': product_data['list_price'] if price_public_visibility else ' ',
            'price': FieldMonetary.value_to_html(product_data['price'], monetary_options) if price_public_visibility else visibility_label,
            'list_price': FieldMonetary.value_to_html(product_data['list_price'], monetary_options) if price_public_visibility else ' '
        }

    def _get_tp_view_template(self, tmpl, values={}):
        IrUiView = request.env['ir.qweb']
        values.update({'request': request})
        return IrUiView._render(tmpl, values=values, minimal_qcontext=True)

    def _get_bestseller_products(self, old_limit):
        past_date = datetime.datetime.now() - datetime.timedelta(days=30)
        result = request.env['sale.report'].sudo().read_group([('date', '>', past_date), ('website_id', '=', request.website.id), ('state', 'in', ['sale', 'done'])], ['product_tmpl_id', 'product_uom_qty:sum'], ['product_tmpl_id'], orderby="product_uom_qty desc")
        return [product_line['product_tmpl_id'][0] for product_line in result], None if len(result) else old_limit, None

    def _get_shop_related_data(self, options):
        shop_data = {}
        if (options.get('shop_config_params')):
            shop_data['shop_config_params'] = request.website.get_theme_prime_shop_config()
        if (options.get('wishlist_enabled')) and shop_data.get('shop_config_params', {}).get('is_wishlist_active'):
            shop_data['wishlist_products'] = request.env['product.wishlist'].with_context(display_default_code=False).current().mapped('product_id').ids
        return shop_data

    def _get_rating_template(self, rating_avg, rating_count=False):
        return request.website._get_theme_prime_rating_template(rating_avg, rating_count)

    def _get_categories(self, domain=[], fields=['name', 'display_name', 'id'], limit=20, order=None, extras={}):
        final_domain = Domain.AND([request.website.website_domain(), domain])
        final_list = False
        # Pure Shit
        if extras.get('count', False):
            count_dict = {k: v for k, v in sorted(self.get_categories_count().items(), key=lambda item: item[1], reverse=True)}
        if order == 'count':
            order = 'sequence asc'
            category_ids = count_dict.keys()
            final_list = [i for i in category_ids if i not in extras.get('ids', [])][:limit]
            final_domain = Domain.AND([[['id', 'in', final_list]], final_domain])
        result = request.env['product.public.category'].search_read(final_domain, fields=fields + ['display_name'], limit=limit, order=order)
        for res in result:
            if extras.get('count', False):
                res.update({'count': count_dict.get(res.get('id'), 0)})
        if final_list:
            final_result = []
            for res_id in final_list:
                for res in result:
                    if res.get('id') == res_id:
                        final_result.append(res)
            return final_result
        return result

    def _get_products_for_top_categories(self, params):
        result = {}
        categoryIDs = params.get('categoryIDs')
        order = params.get('sortBy')
        operator = '='
        if params.get('includesChild'):
            operator = 'child_of'
        initial_domain = Domain.AND([request.website.website_domain(), [('website_published', '=', True)]])
        for id in categoryIDs:
            domain = Domain.AND([initial_domain, [['public_categ_ids', operator, id]]])
            products = self._get_products(domain, ['id'], 4, order)
            result[id] = [product['id'] for product in products]
        return result

    def _get_pricelist_data(self, fields=['name'], limit=20, order=None, extras={}):
        pricelists = request.env['product.pricelist'].search([('id', 'in', request.website.get_pricelist_available(show_visible=True).ids)], limit=limit, order=order)
        result = []
        for pricelist in pricelists:
            data = pricelist.read(fields)[0]
            data.update({'symbol': pricelist.currency_id.symbol, 'title': 'Pricelist', 'subtitle': data.get('name')})
            result.append(data)
        return {'active_pricelist': request.pricelist.id, 'pricelists': result}

    @http.route('/theme_prime/tp_create_collection', type='jsonrpc', auth='user', website=True, sitemap=False)
    def tp_create_collection(self, model, recordsIDs=[], name='', extras={}, **post):
        snippetCollection = request.env['dr.snippet.records.collection']
        relatedField = snippetCollection._dr_get_related_field(model)
        data = {
            'name': name,
            'dr_res_model': model,
            'website_id': request.website.id,
        }
        data[relatedField] = [(6, 0, recordsIDs)]
        snippetCollection.create(data)

    @http.route('/theme_prime/tp_search_read', type='jsonrpc', auth='user', website=True, sitemap=False)
    def _tp_search_read(self, model, domain=None, fields=[], order=None, limit=20, extras={}, **post):
        if extras.get('activePricelist'):
            request.session['website_sale_current_pl'] = extras.get('activePricelist')
        if model in ['product.template', 'product.product']:
            if extras.get('show_suggestion', False):
                order = 'bestseller'
            return self._get_products(domain, fields, limit, order, {'model': model})
        elif model == 'product.public.category':
            extras.update({'count': True})
            if extras.get('show_suggestion', False):
                order = 'count'
            return self._get_categories(domain, fields, limit, order, extras)
        elif model == 'product.attribute.value':
            if extras.get('brands'):
                brand_attributes = request.website._get_brand_attributes()
                domain = Domain.AND([domain, [('attribute_id', 'in', brand_attributes.ids)]])
                return request.env[model].with_context(show_attribute=False).search_read(domain, fields=fields, limit=limit, order=order)
            return request.env[model].search_read(domain, fields=fields, limit=limit, order=order)
        elif model in ['product.ribbon', 'product.tag']:
            if model == 'product.ribbon':
                domain = Domain.AND([domain, [('assign', '=', 'manual')]])
            return request.env[model].search_read(domain, fields=fields, limit=limit, order=order)
        elif model == 'product.pricelist':
            return self._get_pricelist_data(fields=fields, limit=limit, order=order, extras=extras)
        elif model == 'website' and extras.get('themeConfig', False):
            return request.website.get_dr_theme_config()
        elif model == 'dr.snippet.records.collection':
            domain = Domain.AND([request.website.website_domain(), domain])
            snippetCollectionsModel = request.env[model]
            snippetCollections = request.env[model].search(domain, limit=limit)
            if snippetCollections and extras.get('unlink', False):
                snippetCollections.unlink()
                return []
            data = []
            related_field = snippetCollectionsModel._dr_get_related_field(extras.get('dr_res_model'))
            for record in snippetCollections:
                related_records = record[related_field].ids
                data.append({'name': record.name, 'id': record.id, 'recordIDs': related_records, 'count': len(related_records)})
            return data
        elif model == 'ir.ui.view' and extras.get('templateIDs'):
            templateIDs = extras.get('templateIDs')
            views = request.env['ir.ui.view'].sudo().search([('key', 'in', templateIDs)])
            Qweb = request.env['ir.qweb'].sudo()
            viewData = []
            for tmpl in templateIDs:
                view = views.filtered(lambda x: x.key == tmpl)
                if view:
                    view = view[0]
                    view_keys = view.key.split('.')
                    imgSrc = view_keys[1]
                    snippetName = view.name
                    if extras.get('registryToUse') == 'theme_prime_snippet_registry' and imgSrc == 's_mega_menu_category_tabs_snippet':
                        imgSrc = 's_tp_categories_menu'
                        snippetName = 'Categories Menu'
                    viewData.append({
                        'id': view_keys[1],
                        'html': Qweb._render(view.id, {"dr_uid": datetime.datetime.now().microsecond}, minimal_qcontext=True),
                        'subtitle': snippetName,
                        'imgSrc': '/theme_prime/static/src/img/dynamic_snippet/%s.jpg' % imgSrc,
                        'icon': 'theme_prime.icon_grid_1_2',
                        'title': 'Choose a Snippet'
                    })
            return viewData

    @http.route('/theme_prime/get_similar_products_sidebar', type='jsonrpc', auth='public', website=True, sitemap=False, csrf=False)
    def get_similar_products_sidebar(self, productID, **post):
        products = request.env['product.template'].browse(int(productID)).alternative_product_ids
        variants = request.env['product.product'].sudo().browse(product._get_first_possible_variant_id() for product in products)
        variants.fetch()
        product_variants = dict(zip(products, variants))
        return request.env['ir.ui.view']._render_template('theme_prime.similar_products_sidebar', values={'products': products, 'product_variants': product_variants, '_config_product_item': request.website._get_dr_theme_config('json_shop_product_item')})

    @http.route('/theme_prime/get_tab_listing_products', type='jsonrpc', auth='public', website=True)
    def get_tab_listing_products(self, domain=None, fields=[], options={}, limit=25, order=None, **kwargs):
        result = {}
        if options.get('categoryID', False):
            category_domain = [('id', '=', options.get('categoryID'))]
            category = self._get_categories(category_domain)
            if category:
                result['listing_category'] = category
                if domain:
                    domain = Domain.AND([domain, [('public_categ_ids', 'child_of', options.get('categoryID'))]])
        result['products'] = self._get_products(domain, fields, limit, order)
        result.update(self._get_shop_related_data(options))
        return result

    @http.route('/theme_prime/get_brands_category_data', type='jsonrpc', auth='public', website=True)
    def get_brands_category_data(self, domain=None, fields=[], options={}):
        if options.get('model') in ['product.attribute.value', 'product.public.category']:
            if options.get('model') == 'product.attribute.value':
                fields += ['attribute_id']
            result = self._tp_search_read(options.get('model'), domain, fields)
            if options.get('model') == 'product.attribute.value':
                brands_attribute = request.website._get_brand_attributes()
                get_brand_count = request.env['product.template']._get_product_attrib_count(domain=request.env['website'].sale_product_domain(), qcontext={'attributes': brands_attribute})
                for res in result:
                    res['count'] = get_brand_count.get(res.get('id'))
            return result

    @http.route('/theme_prime/get_listing_products', type='jsonrpc', auth='public', website=True)
    def get_listing_products(self, domain=None, fields=[], options={}, limit=5, **kwargs):
        result = {}
        # [TO-DO] even snippet don't allow manual selection it will set the attrs
        domain = None if options.get('mode') == 'manual' else domain
        if options.get('bestseller'):
            result['bestseller'] = self._get_products(domain, fields, limit, 'bestseller')
        if options.get('newArrived'):
            result['newArrived'] = self._get_products(domain, fields, limit, 'create_date desc')
        if options.get('discount'):
            if domain:
                domain = Domain.AND([[("dr_has_discount", "!=", False)], domain])
            else:
                domain = [["dr_has_discount", "!=", False]]
            result['discount'] = self._get_products(domain, fields, limit)
        final = {}
        final['products'] = result
        final.update(self._get_shop_related_data(options))
        return final

    @http.route('/theme_prime/get_products_data', type='jsonrpc', auth='public', website=True)
    def get_products_data(self, domain=None, fields=[], options={}, limit=25, order=None, **kwargs):
        result = {
            'products': self._get_products(domain, fields, limit, order, options),
        }
        result.update(self._get_shop_related_data(options))
        return result

    @http.route('/theme_prime/get_products_by_category', type='jsonrpc', auth='public', website=True)
    def get_products_by_category(self, domain, fields=[], options={}, **kwargs):
        final_domain = Domain.AND([[('website_published', '=', True)], domain])
        result = {
            'products': self._get_products(domain=final_domain, fields=fields, order=options.get('order', False), limit=options.get('limit', False), options=options),
        }
        result.update(self._get_shop_related_data(options))
        if (options.get('get_categories')):
            # get category names for snippet
            domain = [('id', 'in', options.get('categoryIDs'))]
            result['categories'] = self._get_categories(domain)
        if (options.get('get_brands')):
            # get category names for snippet
            domain = [('id', 'in', options.get('categoryIDs'))]
            result['categories'] = request.website._get_brands(domain).read(['name', 'id'])
        return result

    @http.route('/theme_prime/get_top_categories', type='jsonrpc', auth='public', website=True)
    def get_top_categories(self, options={}):
        params = options.get('params')
        result = []
        website_sale_domain = request.website.sale_product_domain()
        if params:
            categoryIDs = params.get('categoryIDs')
            if categoryIDs:
                domain = [('id', 'in', categoryIDs)]
                category_names = {i['id']: i['name'] for i in self._get_categories(domain)}
                # Update categoryIDs if already set category moved to other website
                categoryIDs = category_names.keys()
                params['categoryIDs'] = categoryIDs
                categories = self._get_products_for_top_categories(params)
                price_public_visibility = request.website._dr_has_b2b_access()
                for category_id in categoryIDs:
                    category_data = {}
                    product_ids = categories.get(category_id)
                    category_data['name'] = category_names.get(category_id)
                    category_data['id'] = category_id
                    category_data['website_url'] = '/shop/category/' + str(category_id)
                    category_data['productIDs'] = product_ids
                    final_domain = Domain.AND([website_sale_domain, [('public_categ_ids', 'child_of', category_id)]])
                    products = self._get_products(domain=final_domain, fields=[], limit=1, order="list_price asc")
                    if len(products):
                        category_data['min_price'] = products[0].get('price')
                        category_data['price_public_visibility'] = price_public_visibility
                    result.append(category_data)
        return result

    @http.route(['/theme_prime/get_lazy_content'], type='jsonrpc', website=True, auth="public")
    def get_lazy_content(self, res_id, res_model, fields, contentField, **post):
        record = request.env[res_model].browse(int(res_id)).sudo()
        vals = record.read(fields)[0]
        vals[contentField] = request.env['ir.qweb.field.html'].record_to_html(record, contentField, {})
        return vals

    @http.route('/theme_prime/get_categories_count', type='jsonrpc', auth='public', website=True)
    def get_categories_count(self):
        return request.env['product.template']._get_product_category_count(domain=request.env['website'].sale_product_domain())

    @http.route('/theme_prime/get_categories_info', type='jsonrpc', auth='public', website=True)
    def get_categories_info(self, fields=[], options={}, **kwargs):
        categoryIDs = options.get('categoryIDs', [])
        fields = ['name', 'display_name', 'id'] + fields
        domain = Domain.AND([request.website.website_domain(), [('id', 'in', categoryIDs)]])
        categories = request.env['product.public.category'].search(domain)
        result = categories.read(fields)
        if options.get('getCount', False):
            get_category_count = self.get_categories_count()
        for res_category, category in zip(result, categories):
            if 'dr_category_label_id' in fields and category.dr_category_label_id:
                category_label = category.dr_category_label_id
                res_category['category_lable_info'] = {
                    'id': category_label.id,
                    'name': category_label.name,
                    'background_color': category_label.background_color,
                    'text_color': category_label.text_color,
                }
            if options.get('getCount', False):
                res_category['count'] = get_category_count.get(category.id, 0)
            res_category['website_url'] = '/shop/category/' + str(category.id)
            res_category['image_url'] = '/web/image?model=product.public.category&id=%d&field=image_512' % (category.id)
            res_category['cover_image'] = '/web/image?model=product.public.category&id=%d&field=dr_category_cover_image' % (category.id)
        return result

    @http.route('/theme_prime/get_brands', type='jsonrpc', auth='public', website=True)
    def get_brands(self, fields=['id', 'name', 'attribute_id'], options={}):
        if 'categories' in options:
            domain = Domain.AND([request.website.sale_product_domain(), [('public_categ_ids', 'child_of', options.get('categories'))]])
            brands = request.env['product.template'].search(domain).mapped('dr_brand_value_id')[:options.get('limit', 12)]
        if options.get('recordsIDs'):
            brands = request.website._get_brands([('id', 'in', options.get('recordsIDs'))], options.get('limit', 12))
            domain = request.env['website'].sale_product_domain()
        brands_attribute = request.website._get_brand_attributes()
        get_attrib_count = request.env['product.template']._get_product_attrib_count(domain=domain, qcontext={'attributes': brands_attribute})
        return [{**brand_data, 'product_count': get_attrib_count.get(brand_data['id'], 0)} for brand_data in brands.read(fields)]

    @http.route('/theme_prime/get_preview_body', type='http', auth="user", website=True, sitemap=False, multilang=False)
    def get_preview_body(self, **kw):
        return request.env['ir.ui.view']._render_template('theme_prime.tp_preview_body', {'mobile': kw.get('mobile')})

    @http.route('/theme_prime/get_megamenu_categories', type='jsonrpc', auth='public', website=True)
    def get_megamenu_categories(self, options={}, limit=5, fields=['name', 'id'], order='count', **kwargs):
        category_ids = request.env['product.public.category'].browse(options.get('categoryIDs', [])).exists().ids
        final_domain = Domain.AND([request.website.website_domain(), [('parent_id', 'child_of', category_ids)]])
        categories = request.env['product.public.category'].search(final_domain, limit=None)

        all_categories = []
        all_category_count = request.env['product.template']._get_product_category_count(request.env['website'].sale_product_domain())
        for category in categories:
            all_categories.append({
                'id': category.id, 'name': category.name, 'parent_id': category.parent_id.id,
                'count': all_category_count.get(category['id'], 0),
                'website_url': '/shop/category/' + str(category.id),
                'image_url': '/web/image?model=product.public.category&id=%d&field=image_512' % (category.id),
                'cover_image': '/web/image?model=product.public.category&id=%d&field=dr_category_cover_image' % (category.id),
                'dr_category_icon': '/web/image?model=product.public.category&id=%d&field=dr_category_icon' % (category.id),
                'category_label_info': category.dr_category_label_id and {f: category.dr_category_label_id[f] for f in ['name', 'background_color', 'text_color']} or False,
            })

        parent_categories = filter(lambda category: category.get('id') in category_ids, all_categories)
        return [self._get_megamenu_child_categories(category_id, limit, all_categories, order, options) for category_id in parent_categories]

    def _get_megamenu_child_categories(self, parent_category, limit, all_categories, order, options):
        child_categories = [categ for categ in all_categories if categ.get('parent_id') == parent_category.get('id')]
        if not child_categories:
            return {'category': parent_category, 'child': []}
        if order == 'count' or not order:
            child_categories = sorted(child_categories, key=lambda category: category.get('count', 0), reverse=True)
        child_categories = child_categories[:limit]
        remain_limit = limit - len(child_categories)

        if remain_limit <= 0 or options.get('onlyDirectChild', False):
            return {'category': parent_category, 'child': child_categories}
        for child_category in child_categories[:]:
            new_born_child = self._get_megamenu_child_categories(child_category, remain_limit, all_categories, order, options).get('child')
            child_categories.extend(new_born_child)
            remain_limit = limit - len(child_categories)
            if remain_limit <= 0:
                break
        return {'category': parent_category, 'child': child_categories}


class ThemeWebsite(Website):

    @http.route('/website/dr_search', type='jsonrpc', auth="public", website=True, sitemap=False)
    def dr_search(self, term, max_nb_chars, options, **kw):

        fuzzy_term, global_match = False, False
        search_config = request.website._get_dr_theme_config('json_product_search')
        # has_formulate = self._dr_has_formulate(search_config)      # TODO: MAYBE REMOVE THIS
        fuzzy_enabled = search_config.get('search_fuzzy')
        search_description = search_config.get('search_description', False)
        search_types = ['products', 'categories', 'brands', 'autocomplete', 'suggestions']
        results = {search_type: {'results': [], 'results_count': 0, 'parts': {}} for search_type in search_types}

        raw_term = term
        options = {'allowFuzzy': False, 'displayDescription': search_description, 'displayDetail': True, 'displayExtraLink': True, 'displayImage': True, 'display_currency': request.website.currency_id}
        if fuzzy_enabled:
            search_details = request.website._search_get_details('products', 'name asc', {**options, 'allowFuzzy': True})
            term = request.website._search_find_fuzzy_term(search_details, raw_term) or raw_term
            fuzzy_term = term.lower() != raw_term.lower() and term

        product_limit = max(min(search_config.get('search_max_product'), 8), 3)
        if product_limit:
            results['products'] = self.autocomplete(search_type='products_only', term=term, order='name asc', limit=product_limit, options=options)

        pills_limit = raw_pills_limit = min(search_config.get('pills_limit'), 6)

        def _match_categories(trm, p_limit, match_any_word=None):
            category_result = self._match_category(term=trm, limit=pills_limit, parts=True, match_any_word=match_any_word)
            p_limit = p_limit - len(category_result)
            return {'results': [{'id': categ[0].id, 'name': self.format_result(categ[1], categ[0].ds_name)} for categ in category_result], 'results_count': len(category_result), 'parts': {}}, p_limit

        def _match_brands(trm, p_limit, match_any_word=None):
            splited_terms = trm.split(' ')
            brand_attributes = request.website._get_brand_attributes()
            trm_domain = Domain.OR([[('ds_name', 'ilike', tm)] for tm in splited_terms]) if match_any_word else [('ds_name', 'ilike', trm)]
            matched_brands = request.env['product.attribute.value'].search(Domain.AND([trm_domain, [('attribute_id', 'in', brand_attributes.ids)]]))
            return {'results': [{'id': brand.id, 'attribute_id': brand.attribute_id.id, 'name': self.format_result(splited_terms, brand.ds_name)} for brand in matched_brands], 'results_count': len(matched_brands), 'parts': {}}

        if search_config.get('search_category'):
            results['categories'], pills_limit = _match_categories(term, pills_limit)

        if search_config.get('search_brand') and pills_limit:
            results['brands'] = _match_brands(term, pills_limit)

        # if no pills matched and suggestion are on we lighten the match conditions
        if pills_limit == raw_pills_limit and search_config.get('search_suggestion'):
            suggest_term = ' '.join([w for w in term.split() if len(w) > 2])    # we only suggest if string is more then 2 char
            if suggest_term and search_config.get('search_category'):
                results['categories'], pills_limit = _match_categories(suggest_term, pills_limit, match_any_word=True)
            if suggest_term and pills_limit and search_config.get('search_brand'):
                results['brands'] = _match_brands(suggest_term, pills_limit, match_any_word=True)

        # suggestion search
        remain_limit = max(min(search_config.get('search_limit'), 10), 5)
        if search_config.get('search_attribute') or search_config.get('search_suggestion'):
            words = [i for i in term.split(' ') if i]   # split and filter spaces
            matchs, matched_dicts = False, {}
            for word in words:
                if matchs:
                    for match in matchs:
                        match_dict = matched_dicts[match]
                        if match_dict['remaining_words']:
                            match_dict['remaining_words'].append(word)
                        else:
                            unmatched_record_name = match_dict['unmatched_record_name']
                            regex_match = re.search(re.escape(word), unmatched_record_name, re.IGNORECASE)
                            if regex_match:
                                match_dict['matched_words'].append(word)
                                match_dict['unmatched_record_name'] = re.sub(re.escape(word), ' ', unmatched_record_name, flags=re.I)
                            else:
                                match_dict['remaining_words'].append(word)
                else:
                    matchs = self._match_attr_or_category(word)
                    if matchs:
                        for match in matchs:
                            matched_dicts[match] = match_dict = {'match': match, 'matched_words': [word], 'remaining_words': []}
                            match_dict['unmatched_record_name'] = re.sub(re.escape(match_dict['matched_words'][0]), ' ', match.ds_name, flags=re.I)

            match_list_raw = list(matched_dicts.values())
            match_list_raw.sort(key=lambda m: len(m['matched_words']), reverse=True)

            # filter matched result and remove the duplicate matches from the synonyms
            match_list, matched_ids = [], []
            for matched_dict in match_list_raw:
                matched_record = matched_dict['match']
                if matched_record.id not in matched_ids:
                    matched_ids.append(matched_record.id)
                    match_list.append(matched_dict)

            autocomplete_result = []

            for match_dict in match_list:
                autocomplete_data = []
                if match_dict['remaining_words']:
                    autocomplete_data = self._get_autocomplete_data(match_dict, remain_limit, search_config)
                elif not search_config.get('search_category') and match_dict['match']._name == 'product.public.category':
                    autocomplete_result.append(self.generate_result_dict(match_dict['match'], False, match_dict['matched_words'], ''))
                    remain_limit -= 1
                    if not remain_limit:
                        break

                if not match_dict['remaining_words']:
                    # if no remaining_words that means full data matched with record so suggestions become autocomplete
                    autocomplete_data += self._get_suggestions_data(match_dict, autocomplete_result, remain_limit, search_config, ignore_config=True)
                remain_limit -= len(autocomplete_data)
                autocomplete_result.extend(autocomplete_data)
                if not remain_limit:
                    break

            suggestions_result = []
            for match_dict in match_list:
                suggestions_data = self._get_suggestions_data(match_dict, autocomplete_result, min(remain_limit, 5), search_config)
                remain_limit -= len(suggestions_data)
                suggestions_result.extend(suggestions_data)
                if not remain_limit:
                    break

            results['autocomplete'] = {'results': autocomplete_result, 'results_count': len(autocomplete_result), "parts": {"name": True, "website_url": True}}
            results['suggestions'] = {'results': suggestions_result, 'results_count': len(suggestions_result), "parts": {"name": True, "website_url": True}}

            global_match = False
            # matchs = matchs[0]
            if matchs and len(matchs) == 1 and (results['autocomplete'].get('results_count') or results['suggestions'].get('results_count')):
                if matchs[0]._name == 'product.public.category':
                    fixed_str = _('View all products with category')
                    global_match = {'name': f'{fixed_str} <b class="">{matchs[0].ds_name}</b>', 'website_url': f'{SHOP_PATH}/category/{matchs[0].id}'}
                else:
                    fixed_str = _('View all products with')
                    global_match = {'name': f'{fixed_str} {matchs.attribute_id.name.lower()} <b class="">{matchs.ds_name}</b>', 'website_url': f'{SHOP_PATH}?&attribute_values={matchs.attribute_id.id}-{matchs.id}'}

        # fill in the extra products is keyword does not match with normal products
        result_for_autocomplete = results['autocomplete']['results'] or results['suggestions']['results']
        if search_config.get('search_fill_products') and results['products']['results_count'] == 0 and result_for_autocomplete:
            domain_all = []
            for autocomplete_dict in result_for_autocomplete:
                domain, catgory_id, attribute_value_od = [], autocomplete_dict.get('category'), autocomplete_dict.get('attribute')
                if catgory_id:
                    domain.append(('public_categ_ids', 'child_of', [catgory_id]))
                if attribute_value_od:
                    domain.append(('attribute_line_ids.value_ids', 'in', [attribute_value_od]))
                domain_all.append(domain)
            # TODO: Improve this. Here is the simple hack to trick autocomplete and ignore search term use our domain, This will save tons of extra code
            options['dr_search_domain'] = Domain.OR(domain_all)
            results['products'] = self.autocomplete(search_type='products_only', term=term, order='name asc', limit=product_limit, options=options)

        search_result = {**results, 'fuzzy_search': fuzzy_term, 'results': [], 'global_match': global_match, 'result_length': sum([results.get(r_type, {}).get('results_count', 0) for r_type in search_types])}

        if search_config.get('search_report') and search_result["result_length"] == 0:
            report_data = {
                'search_term': term,
                'device_type': kw.get('device_type')
            }
            request.env['dr.search.report']._add_report_entry(report_data)
        search_result['SHOP_PATH'] = SHOP_PATH
        return search_result

    def _get_autocomplete_data(self, match_dict, remain_limit, search_config):
        match, remaining_words, matched_words = match_dict['match'], match_dict['remaining_words'], match_dict['matched_words']
        results = []
        if search_config.get('search_attribute') and remaining_words and match:
            for related_match, word in self.match_remaining_words(match, remaining_words):
                results.append(self.generate_result_dict(match, related_match, matched_words, word))
                matched_words.append(word)
                if len(results) >= remain_limit:
                    break
        return results

    def _get_suggestions_data(self, match_dict, autocomplete_data, remain_limit, search_config, ignore_config=False):
        results = []
        match, matched_words = match_dict['match'], match_dict['matched_words']
        if (search_config.get('search_suggestion') or ignore_config) and remain_limit > 0:
            if match._name == 'product.public.category':
                for related_match in self._category_counterpart_iterator(match, search_type=['auto_suggestion']):
                    term = self.generate_result_dict(match, related_match, matched_words)
                    if not self.is_search_added(autocomplete_data, results, term):
                        results.append(term)
                    if len(results) >= remain_limit:
                        break
            else:
                domain = request.website.sale_product_domain() + [('attribute_line_ids.value_ids', 'in', match.ids)]
                all_related_records = request.env['product.template'].with_context(bin_size=True).search(domain).mapped('public_categ_ids')
                for related_match in all_related_records:
                    term = self.generate_result_dict(match, related_match, matched_words)
                    if not self.is_search_added(autocomplete_data, results, term):
                        results.append(term)
                    if len(results) >= remain_limit:
                        break
        return results

    def _match_attr_or_category(self, term, return_on_match=True):
        result = self._match_category(term=term)
        if not result:
            result = self._match_attr(term)
        return result

    def _match_category(self, term=False, categories_ids=[], limit=None, parts=None, match_any_word=None):
        CSD = request.env['product.public.category']._get_search_db(request.website)
        return CSD.search(term=term, categories_ids=categories_ids, limit=limit, parts=parts, match_any_word=match_any_word)

    def _match_attr(self, term):
        all_active_attributes = self._website_active_attributes()
        matched_values = request.env['product.attribute.value']
        if all_active_attributes:
            matched_values = matched_values.search([('ds_name', 'ilike', term), ('attribute_id', 'in', all_active_attributes.ids)])
        return matched_values

    def _website_active_attributes(self):
        all_products = request.env['product.template'].with_context(bin_size=True).search(request.website.sale_product_domain())
        return request.env['product.attribute'].search([
            ('product_tmpl_ids', 'in', all_products.ids), ('visibility', '=', 'visible'), ('dr_search_suggestion', '!=', False)
        ])

    def match_remaining_words(self, match, remaining_words):
        if match._name == 'product.public.category':
            for word in remaining_words:
                for attribute_value in self._category_counterpart_iterator(match):
                    regex_match = re.search(re.escape(word), attribute_value.ds_name, re.IGNORECASE)
                    if regex_match:
                        yield attribute_value, word

        if match._name == 'product.attribute.value':
            domain = request.website.sale_product_domain() + [('attribute_line_ids.value_ids', 'in', match.ids)]
            related_categories = request.env['product.template'].with_context(bin_size=True).search(domain).mapped('public_categ_ids')
            categories = self._match_category(categories_ids=related_categories.ids)
            for word in remaining_words:
                for category in categories:
                    regex_match = re.search(re.escape(word), category.ds_name, re.IGNORECASE)
                    if regex_match:
                        yield category, word

    def _category_counterpart_iterator(self, category_dst, search_type=['auto_suggestion', 'auto']):
        category = request.env['product.public.category'].browse(category_dst.id)
        attribute_values = category.mapped('product_tmpl_ids.attribute_line_ids').filtered(lambda line: line.attribute_id.dr_search_suggestion in search_type).mapped('value_ids')
        for value in attribute_values:
            yield value

        # Child category
        child_categories = request.env['product.public.category'].search([('parent_id', 'child_of', category.id)]) - category
        child_attribute_values = child_categories.mapped('product_tmpl_ids.attribute_line_ids').filtered(lambda line: line.attribute_id.dr_search_suggestion in search_type).mapped('value_ids')   # plus to maintain order
        for value in child_attribute_values:
            if value not in attribute_values:
                yield value

    def generate_result_dict(self, primary_match, secondary_match, matched_words, word=False):
        category, attribute = (primary_match, secondary_match) if primary_match._name == 'product.public.category' else (secondary_match, primary_match)
        attribute_str = f"attribute_values={attribute.attribute_id.id}-{attribute.id}" if attribute else ''  # just for category
        return {
            'name': self.format_result(matched_words + (word and [word] or []), f"{primary_match.ds_name} {secondary_match and secondary_match.ds_name or ''}"),
            'website_url': f"{SHOP_PATH}/category/{category.id}/?{attribute_str}",
            'category': category and category.id,
            'attribute': attribute and attribute.id
        }

    def format_result(self, matched_words, value):
        pattern = '|'.join(map(re.escape, matched_words))
        parts = re.split(f'({pattern})', value, flags=re.IGNORECASE)
        if len(parts) > 1:
            value = request.env['ir.ui.view'].sudo()._render_template("website.search_text_with_highlight", {'parts': parts})
            html_val = request.env[('ir.qweb.field.html')].value_to_html(value, {'template_options': {}})
            return html_escape(html_val)
        return False

    def is_search_added(self, autocomplete_result, suggestions_results, new_term):
        auto_found = len([term for term in autocomplete_result if new_term['website_url'] == term['website_url']])
        sugg_found = len([term for term in suggestions_results if new_term['website_url'] == term['website_url']])
        return auto_found + sugg_found

    def _dr_has_formulate(self, search_config):    # for performance
        if search_config.get('search_attribute') or search_config.get('search_suggestion'):
            formulate_category = request.env['product.public.category'].search(([('dr_search_formulate', '=', True)] + request.website.website_domain()), limit=1)
            if formulate_category:
                request.update_context(dr_formulate=True)
            return len(formulate_category)
        return False

    @http.route('/website/dr_search/add_report', type='jsonrpc', auth="public", website=True, sitemap=False)
    def dr_search_report(self, **kw):
        request.env['dr.search.report']._add_report_entry(kw)
        return {}
