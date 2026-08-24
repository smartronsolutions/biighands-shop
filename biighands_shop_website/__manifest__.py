# -*- coding: utf-8 -*-
{
    'name': 'Playground Website',
    'version': '19.0.4.0.22',
    'category': 'Website',
    'depends': ['website_sale'],
    'data': [
        'security/ir.model.access.csv',
        'views/playground_header.xml',
        'views/product_views.xml',
        'views/sale_order_views.xml',
        'views/playground.xml',
        'views/auth_pages.xml',
        'views/playground_footer.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'biighands_shop_website/static/src/css/playground.css',
            'biighands_shop_website/static/src/css/villa_finishes.css',
            'biighands_shop_website/static/src/css/readability.css',
            'biighands_shop_website/static/src/js/playground.js',
        ],
    },
    'post_init_hook': 'post_init_hook',
    'installable': True,
    'license': 'LGPL-3',
}
