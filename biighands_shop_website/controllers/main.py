# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request


class BiighandsShopHome(http.Controller):

    @http.route('/home', type='http', auth='public', website=True, sitemap=True)
    def home(self, **kwargs):
        env = request.env
        featured = env['product.template'].sudo().search(
            [('is_published', '=', True), ('sale_ok', '=', True)],
            limit=4,
            order='website_sequence asc',
        )
        return request.render('biighands_shop_website.home', {
            'featured_products': featured,
        })
