# -*- coding: utf-8 -*-
from odoo import models
from odoo.http import request


class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    @classmethod
    def _dispatch(cls, endpoint):
        # Fix: theme_prime's website.shop_page_container compute does
        # env.context['category'] directly — raises KeyError when absent.
        # We patch request.website with 'category' in context so the compute
        # finds it before QWeb evaluates website.shop_page_container.
        try:
            if '/shop' in request.httprequest.path:
                website = getattr(request, 'website', None)
                if website is not None and 'category' not in website.env.context:
                    cat_raw = request.httprequest.args.get('category', '')
                    cat_id = int(cat_raw) if cat_raw.isdigit() else 0
                    request.website = website.with_context(category=cat_id)
        except Exception:
            pass
        return super()._dispatch(endpoint)
