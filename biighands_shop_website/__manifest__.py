# -*- coding: utf-8 -*-
{
    'name': 'Biighands Shop Website',
    'summary': 'Screwfix-style eCommerce homepage and shop page for Biighands',
    'version': '19.0.1.0',
    'category': 'Website/eCommerce',
    'depends': ['website', 'website_sale', 'theme_prime'],
    'data': [
        'views/home.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'biighands_shop_website/static/src/css/shop.css',
            'biighands_shop_website/static/src/js/shop_banner.js',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
