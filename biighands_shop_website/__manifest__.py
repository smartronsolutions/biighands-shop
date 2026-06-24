# -*- coding: utf-8 -*-
{
    'name': 'Biighands Home',
    'version': '19.0.1.0',
    'category': 'Website',
    'depends': ['theme_prime', 'website_sale'],
    'data': [
        'views/header.xml',
        'views/home.xml',
        'views/fixes.xml',
        'views/shop.xml',
        'views/auth_pages.xml',
        'views/footer.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'biighands_shop_website/static/src/css/shop.css',
        ],
    },
    'installable': True,
    'license': 'LGPL-3',
}
