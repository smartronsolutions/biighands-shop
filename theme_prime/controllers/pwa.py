# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Droggol Infotech Private Limited. (<https://www.droggol.com/>)

import base64
import io
import json

try:
    from werkzeug.utils import send_file
except ImportError:
    from odoo.tools._vendor.send_file import send_file

from odoo import _, http
from odoo.http import request
from odoo.tools import file_open, file_path
from odoo.tools.mimetypes import guess_mimetype


class ThemePrimePWA(http.Controller):

    @http.route('/pwa/<int:website_id>/manifest.json', type='http', auth='public', website=True)
    def get_pwa_manifest(self, website_id, **kargs):
        manifest_data = {"fake": 1}
        website = request.website
        if website and website.id == website_id and website.dr_pwa_activated:
            manifest_data = {
                "name": website.dr_pwa_name,
                "short_name": website.dr_pwa_short_name,
                "display": "standalone",
                "background_color": website.dr_pwa_background_color,
                "theme_color": website.dr_pwa_theme_color,
                "id": website.dr_pwa_start_url,
                "start_url": website.dr_pwa_start_url,
                "scope": "/",
                "icons": [{
                    "src": "/web/image/website/%s/dr_pwa_icon_192/192x192" % website.id,
                    "sizes": "192x192",
                    "type": "image/png",
                }, {
                    "src": "/web/image/website/%s/dr_pwa_icon_512/512x512" % website.id,
                    "sizes": "512x512",
                    "type": "image/png",
                }]
            }
            if website.dr_pwa_screenshots:
                manifest_data['screenshots'] = [{
                    "src": "/web/image/dr.pwa.screenshots/%s/image" % screenshot.id,
                    "type": "image/jpg",
                    "sizes": screenshot.sizes,
                    "form_factor": screenshot.form_factor,
                } for screenshot in website.dr_pwa_screenshots]
            if website.dr_pwa_shortcuts:
                manifest_data['shortcuts'] = [{
                    "name": shortcut.name,
                    "short_name": shortcut.short_name or '',
                    "description": shortcut.description or '',
                    "url": shortcut.url,
                    "icons": [{"src": "/web/image/dr.pwa.shortcuts/%s/icon/192x192" % shortcut.id, "sizes": "192x192"}]
                } for shortcut in website.dr_pwa_shortcuts]
        return request.make_response(
            data=json.dumps(manifest_data),
            headers=[('Content-Type', 'application/json')]
        )

    @http.route('/service_worker.js', type='http', auth='public', website=True, sitemap=False)
    def get_pwa_service_worker(self, **kargs):
        website = request.website
        offline_bool = 'true' if website.dr_pwa_offline_page else 'false'
        data = file_open('theme_prime/static/src/js/service_worker.js', 'rb').read().decode()
        data = data.replace('"##1##"', str(website.dr_pwa_version))
        data = data.replace('"##2##"', offline_bool)

        return request.make_response(
            data=data,
            headers=[('Content-Type', 'text/javascript')]
        )

    @http.route('/pwa/offline_page', type='http', auth='public', website=True, cors='*', sitemap=False)
    def get_pwa_offline_page(self, **kargs):
        return request.render('theme_prime.pwa_offline_page', {})

    @http.route('/pwa/logo.png', type='http', auth='public', website=True, cors='*', sitemap=False)
    def get_pwa_logo(self, **kargs):
        website = request.website
        imgname = 'logo'
        imgext = '.png'
        if not website.logo:
            response = http.Stream.from_path(file_path('web/static/img/nologo.png')).get_response()
        else:
            image_base64 = base64.b64decode(website.logo)
            image_data = io.BytesIO(image_base64)
            mimetype = guess_mimetype(image_base64, default='image/png')
            imgext = '.' + mimetype.split('/')[1]
            if imgext == '.svg+xml':
                imgext = '.svg'
            response = send_file(image_data, request.httprequest.environ, download_name=imgname + imgext, mimetype=mimetype, last_modified=website.write_date)
        return response
