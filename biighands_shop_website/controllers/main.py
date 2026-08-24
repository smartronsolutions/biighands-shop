import base64

from odoo import fields, http
from odoo.exceptions import ValidationError
from odoo.addons.website_sale.controllers.main import WebsiteSale
from odoo.http import request


class BiighandsWebsiteSale(WebsiteSale):

    @http.route()
    def shop(self, page=0, category=None, search='', min_price=0.0, max_price=0.0, tags='', **post):
        """Use the atelier catalogue as the website's only product listing."""
        return request.redirect('/catalogue', code=302)


class BiighandsHome(http.Controller):

    @http.route(['/', '/home'], type='http', auth='public', website=True, sitemap=True)
    def home(self, **kwargs):
        ProductTemplate = request.env['product.template'].sudo()
        products = ProductTemplate.search(
            [('website_published', '=', True), ('sale_ok', '=', True), ('bh_featured', '=', True)],
            limit=6,
            order='sequence, id',
        )
        return request.render('biighands_shop_website.playground_home', {
            'featured_products': products,
        })

    @http.route(
        ['/catalogue', '/catalogue/page/<int:page>'],
        type='http', auth='public', website=True, sitemap=True,
    )
    def catalogue(self, page=0, collection=None, **kwargs):
        ProductTemplate = request.env['product.template'].sudo()
        base_domain = [('website_published', '=', True), ('sale_ok', '=', True)]
        published_products = ProductTemplate.search(base_domain, order='sequence, id')
        collection_records = published_products.mapped('bh_collection_id').sorted(
            key=lambda item: (item.sequence, item.name)
        )
        collections = {item.slug: item.name for item in collection_records}
        domain = list(base_domain)
        if collection in collections:
            domain.append(('bh_collection_id.slug', '=', collection))
        product_count = ProductTemplate.search_count(domain)
        url_args = {'collection': collection} if collection in collections else {}
        pager = request.website.pager(
            url='/catalogue',
            total=product_count,
            page=page,
            step=20,
            scope=5,
            url_args=url_args,
        )
        products = ProductTemplate.search(
            domain,
            order='sequence, id',
            limit=20,
            offset=pager['offset'],
        )
        return request.render('biighands_shop_website.playground_catalogue', {
            'products': products,
            'collections': collections,
            'active_collection': collection if collection in collections else 'all',
            'pager': pager,
        })

    @http.route(
        ['/atelier/product/<model("product.template"):product>', '/product/<string:slug>'],
        type='http', auth='public', website=True, sitemap=True,
    )
    def atelier_product(self, product=None, slug=None, **kwargs):
        if slug:
            product = request.env['product.template'].sudo().search([
                ('bh_slug', '=', slug), ('website_published', '=', True), ('sale_ok', '=', True),
            ], limit=1)
        if not product:
            return request.not_found()
        if not product.sudo().website_published:
            return request.not_found()
        return request.render('biighands_shop_website.playground_product', {
            'product': product.sudo(),
            'finishes': [value.strip() for value in (product.bh_finishes or '').split(',') if value.strip()],
            'glazing_options': [value.strip() for value in (product.bh_glazing or '').split(',') if value.strip()],
        })

    @http.route(
        '/atelier/quote/<model("product.template"):product>',
        type='http', auth='user', website=True, methods=['POST'], csrf=True,
    )
    def request_quote(self, product, **post):
        product = product.sudo()
        try:
            width = int(post.get('width_mm', 0))
            height = int(post.get('height_mm', 0))
            quantity = max(1, min(100, int(post.get('quantity', 1))))
        except (TypeError, ValueError) as exc:
            raise ValidationError('Please enter valid dimensions and quantity.') from exc

        if not (product.bh_min_width <= width <= product.bh_max_width):
            raise ValidationError('Width is outside the available range.')
        if not (product.bh_min_height <= height <= product.bh_max_height):
            raise ValidationError('Height is outside the available range.')

        finish = (post.get('finish') or '').strip()
        glazing = (post.get('glazing') or '').strip()
        available_finishes = [value.strip() for value in (product.bh_finishes or '').split(',') if value.strip()]
        available_glazing = [value.strip() for value in (product.bh_glazing or '').split(',') if value.strip()]
        if finish not in available_finishes or glazing not in available_glazing:
            raise ValidationError('Please select an available finish and glazing option.')

        finish_multiplier = {
            'Matte Black': 1.08, 'Anodized Bronze': 1.15, 'Champagne': 1.22,
            'American Walnut': 1.15, 'Smoked Oak': 1.10, 'Ebonized Ash': 1.20,
            'Graphite Velvet': 1.18, 'Wool Bouclé': 1.12, 'Silk Blend': 1.25,
        }.get(finish, 1.0)
        glazing_multiplier = {
            'Triple Glazing': 1.25, 'Laminated Acoustic': 1.18,
            'Cotton Lining': 1.10, 'Blackout Lining': 1.20, 'Thermal Lining': 1.15,
        }.get(glazing, 1.0)
        measure = width / 1000.0 if product.bh_price_unit == 'metre' else (width * height) / 1000000.0
        unit_price = product.list_price * measure * finish_multiplier * glazing_multiplier if product.list_price else 0.0
        order = request.env['sale.order'].sudo().create({
            'partner_id': request.env.user.partner_id.id,
            'origin': 'Website Atelier Configurator',
            'client_order_ref': 'Requested Quote — Website Atelier',
            'note': post.get('notes') or False,
            'bh_is_requested_quote': True,
            'bh_request_source': 'website_atelier',
            'bh_request_date': fields.Datetime.now(),
            'bh_requested_product_id': product.id,
            'bh_collection_id': product.bh_collection_id.id,
            'bh_width_mm': width,
            'bh_height_mm': height,
            'bh_area_sqm': (width * height) / 1000000.0,
            'bh_quantity': quantity,
            'bh_finish': finish,
            'bh_glazing': glazing,
            'bh_client_notes': post.get('notes') or False,
            'bh_price_unit': product.bh_price_unit,
            'order_line': [(0, 0, {
                'product_id': product.product_variant_id.id,
                'product_uom_qty': quantity,
                'price_unit': unit_price,
                'name': '%s — %s × %s mm — %s — %s' % (
                    product.name, width, height, finish, glazing,
                ),
                'bh_width_mm': width,
                'bh_height_mm': height,
                'bh_finish': finish,
                'bh_glazing': glazing,
                'bh_client_notes': post.get('notes'),
            })],
        })

        uploads = request.httprequest.files.getlist('reference_images')
        for upload in uploads[:6]:
            if upload and upload.filename:
                content = upload.read(8 * 1024 * 1024 + 1)
                if len(content) > 8 * 1024 * 1024:
                    raise ValidationError('%s is larger than 8 MB.' % upload.filename)
                if not (upload.mimetype or '').startswith('image/'):
                    raise ValidationError('Only image references can be uploaded.')
                request.env['ir.attachment'].sudo().create({
                    'name': upload.filename,
                    'datas': base64.b64encode(content),
                    'res_model': 'sale.order',
                    'res_id': order.id,
                    'mimetype': upload.mimetype,
                })

        return request.redirect(order.get_portal_url())

    @http.route('/my/quotes', type='http', auth='user', website=True, sitemap=False)
    def my_atelier_quotes(self, **kwargs):
        orders = request.env['sale.order'].search([
            ('partner_id', 'child_of', request.env.user.partner_id.commercial_partner_id.id),
            ('bh_is_requested_quote', '=', True),
        ], order='bh_request_date desc, id desc')
        attachments = request.env['ir.attachment'].sudo().search([
            ('res_model', '=', 'sale.order'),
            ('res_id', 'in', orders.ids),
            ('mimetype', '=like', 'image/%'),
        ], order='id') if orders else request.env['ir.attachment']
        references = {}
        for attachment in attachments:
            references.setdefault(attachment.res_id, []).append(attachment)
        return request.render('biighands_shop_website.playground_quotes', {
            'orders': orders,
            'references': references,
        })
