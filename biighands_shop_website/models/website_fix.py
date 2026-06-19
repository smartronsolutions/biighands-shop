# -*- coding: utf-8 -*-
from odoo import models
from odoo.http import request


class Website(models.Model):
    _inherit = 'website'

    def _compute_shop_page_container(self):
        # theme_prime's version does env.context['category'] (no .get()),
        # raising KeyError when 'category' is absent.
        # We call it normally (so ORM's computing flag stays on original self),
        # and catch the KeyError as a fallback.
        try:
            super()._compute_shop_page_container()
        except (KeyError, AttributeError):
            for rec in self:
                rec.shop_page_container = 'container'


class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    @classmethod
    def _dispatch(cls, endpoint):
        # Belt-and-suspenders: inject 'category' into request.env and
        # request.website so any code path that reads env.context['category']
        # on shop pages finds it rather than raising KeyError.
        try:
            if '/shop' in request.httprequest.path:
                cat_raw = request.httprequest.args.get('category', '')
                cat_id = int(cat_raw) if cat_raw.isdigit() else 0
                if 'category' not in request.env.context:
                    request.env = request.env.with_context(category=cat_id)
                website = getattr(request, 'website', None)
                if website is not None and 'category' not in website.env.context:
                    request.website = website.with_context(category=cat_id)
        except Exception:
            pass
        return super()._dispatch(endpoint)
