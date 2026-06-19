from urllib.parse import urlencode

from odoo import http
from odoo.addons.website_sale.const import SHOP_PATH
from odoo.addons.theme_prime.controllers.main import ThemePrimeWebsiteSale
from odoo.http import request


class EmptyShopCategory:
    id = False
    name = 'Shop'
    parent_id = False
    child_id = False

    def __bool__(self):
        return False


class BiighandsThemePrimeWebsiteSale(ThemePrimeWebsiteSale):

    def _get_keep_query_url(self):
        def keep(path=None, **kw):
            query = request.httprequest.args.to_dict(flat=False)
            for key, value in kw.items():
                if value in (None, False, 0, '0'):
                    query.pop(key, None)
                elif isinstance(value, (list, tuple, set)):
                    query[key] = list(value)
                else:
                    query[key] = [value]

            url = path or request.httprequest.path
            query_string = urlencode(query, doseq=True)
            return query_string and '%s?%s' % (url, query_string) or url
        return keep

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
            response.qcontext.setdefault('keep', self._get_keep_query_url())
            response.qcontext.setdefault('shop_path', SHOP_PATH)
        return response


class BiighandsHome(http.Controller):

    @http.route('/home', type='http', auth='public', website=True, sitemap=True)
    def home(self, **kwargs):
        ProductTemplate = request.env['product.template'].sudo()
        products = ProductTemplate.search(
            [('website_published', '=', True), ('sale_ok', '=', True)],
            limit=8,
            order='create_date desc, id desc',
        )
        if not products:
            products = ProductTemplate.search(
                [('sale_ok', '=', True)],
                limit=8,
                order='create_date desc, id desc',
            )
        return request.render('biighands_shop_website.home', {
            'featured_products': products,
        })
