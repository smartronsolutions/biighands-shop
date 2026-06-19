from odoo import http
from odoo.addons.theme_prime.controllers.main import ThemePrimeWebsiteSale
from odoo.http import request


class EmptyShopCategory:
    name = 'Shop'

    def __bool__(self):
        return False


class BiighandsThemePrimeWebsiteSale(ThemePrimeWebsiteSale):

    @http.route()
    def shop(self, page=0, category=None, search='', min_price=0.0, max_price=0.0, tags='', **post):
        response = super().shop(
            page=page,
            category=category,
            search=search,
            min_price=min_price,
            max_price=max_price,
            tags=tags,
            **post
        )
        if hasattr(response, 'qcontext'):
            response.qcontext.setdefault('category', EmptyShopCategory())
        return response


class BiighandsHome(http.Controller):

    @http.route('/home', type='http', auth='public', website=True, sitemap=True)
    def home(self, **kwargs):
        products = request.env['product.template'].sudo().search(
            [('is_published', '=', True), ('sale_ok', '=', True)],
            limit=8,
            order='website_sequence asc',
        )
        return request.render('biighands_shop_website.home', {
            'featured_products': products,
        })
