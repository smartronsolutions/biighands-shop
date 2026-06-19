# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Droggol Infotech Private Limited. (<https://www.droggol.com/>)

{
    'name': 'Theme Prime',
    'description': 'Powerful multipurpose eCommerce theme suitable for all kind of businesses like Electronics, Fashion, Sports, Beauty, Furniture and many more.',
    'summary': 'Powerful multipurpose eCommerce theme suitable for all kind of businesses like Electronics, Fashion, Sports, Beauty, Furniture and many more.',
    'category': 'Theme/eCommerce',
    'version': '19.0.1.4',
    'depends': ['droggol_theme_common'],

    'license': 'OPL-1',
    'author': 'Droggol Infotech Private Limited',
    'company': 'Droggol Infotech Private Limited',
    'maintainer': 'Droggol Infotech Private Limited',
    'website': 'https://www.droggol.com/',

    'price': 339.00,
    'currency': 'USD',
    'live_test_url': 'https://prime-19-electronics-1.droggol.com/',

    'images': [
        'static/description/prime_cover.png',
        'static/description/prime_screenshot.gif',
    ],
    'data': [
        'data/theme.ir.attachment.csv',

        'views/sidebar.xml',
        'views/templates.xml',
        'views/components.xml',
        'views/layout.xml',
        'views/shop_layout.xml',
        'views/product_detail_page.xml',
        'views/pages.xml',
        'views/snippets.xml',
        'views/svg_images.xml',

        # Headers / Footers
        'views/headers.xml',
        'views/preheaders.xml',
        'views/footers.xml',

        # Snippets
        'views/snippets/dynamic_snippets.xml',
        'views/snippets/s_banner.xml',
        'views/snippets/s_blog.xml',
        'views/snippets/s_clients.xml',
        'views/snippets/s_coming_soon.xml',
        'views/snippets/s_countdown.xml',
        'views/snippets/s_cover.xml',
        'views/snippets/s_cta.xml',
        'views/snippets/s_gallery.xml',
        'views/snippets/s_heading.xml',
        'views/snippets/s_icon_block.xml',
        'views/snippets/s_info_block.xml',
        'views/snippets/s_pricing.xml',
        'views/snippets/s_shop_offer.xml',
        'views/snippets/s_stats.xml',
        'views/snippets/s_subscribe.xml',
        'views/snippets/s_team.xml',
        'views/snippets/s_testimonial.xml',
    ],
    'assets': {
        'theme_prime.range_slider': [
            'theme_prime/static/lib/noUiSlider-15.8.1/nouislider.js',
            'theme_prime/static/lib/noUiSlider-15.8.1/nouislider.css',
        ],
        'theme_prime.drift_zoom': [
            'theme_prime/static/lib/drift-master-1.5.0/dist/**/*',
        ],
        'theme_prime.swiper': [
            'theme_prime/static/lib/swiper-12.0.2/swiper-bundle.js',
            'theme_prime/static/lib/swiper-12.0.2/swiper-bundle.css',
        ],
        'web.assets_frontend': [
            ('prepend', 'theme_prime/static/src/js/website_sale_utils.js'),

            # Frontend
            'theme_prime/static/src/js/prime_service.js',
            'theme_prime/static/src/js/cart_service.js',
            'theme_prime/static/src/js/website.js',
            'theme_prime/static/src/js/website_sale_wishlist_utils.js',
            ('before', 'website_sale/static/src/interactions/website_sale.js', 'theme_prime/static/src/js/variant_mixin.js'),

            'theme_prime/static/src/js/sidebar/**/*',
            'theme_prime/static/src/js/dialog/**/*',
            'theme_prime/static/src/js/searchbar/**/*',
            'theme_prime/static/src/interactions/**/*',

            'theme_prime/static/src/scss/theme.scss',
            'theme_prime/static/src/scss/rtl.scss',
            'theme_prime/static/src/scss/variants.scss',
            'theme_prime/static/src/scss/website.scss',
            'theme_prime/static/src/scss/website_sale.scss',
            'theme_prime/static/src/scss/sliders.scss',
            'theme_prime/static/src/scss/icon-packs/website.scss',
            'theme_prime/static/src/scss/utils.scss',
            'theme_prime/static/src/scss/snippets/cards.scss',
            'theme_prime/static/src/scss/front_end/dynamic_snippets.scss',
            'theme_prime/static/src/scss/front_end/category_filters.scss',
            'theme_prime/static/src/scss/front_end/image_hotspot.scss',
            'theme_prime/static/src/scss/snippets/2_col_deal.scss',
            'theme_prime/static/src/scss/snippets/image_products.scss',
            'theme_prime/static/src/scss/front_end/bottom_bar.scss',
            'theme_prime/static/src/snippets/s_blog_posts/000.scss',
            ('before', 'html_editor/static/src/scss/html_editor.common.scss', 'theme_prime/static/src/scss/container.scss'),

            # Core
            'theme_prime/static/src/components/notification/notification.xml',

            # Snippets
            'theme_prime/static/src/snippets/**/*.js',
            ('remove', 'theme_prime/static/src/snippets/**/*.edit.js'),

            'theme_prime/static/src/snippets/s_tp_countdown/000.xml',
            'theme_prime/static/src/xml/frontend/dynamic_snippets.xml',
            'theme_prime/static/src/xml/cards.xml',
            'theme_prime/static/src/xml/listing_cards.xml',
            'theme_prime/static/src/xml/frontend/utils.xml',
            'theme_prime/static/src/xml/frontend/category_filters.xml',
            'theme_prime/static/src/xml/frontend/2_col_deal.xml',
            'theme_prime/static/src/xml/frontend/s_image_products.xml',
            'theme_prime/static/src/xml/frontend/s_product_grid.xml',
            'theme_prime/static/src/xml/frontend/rating.xml',
            'theme_prime/static/src/xml/frontend/hierarchical_category_templates.xml',
            'theme_prime/static/src/xml/frontend/s_category.xml',
            'theme_prime/static/src/xml/frontend/inner_blocks.xml',
            'theme_prime/static/src/xml/frontend/brands.xml',
            'theme_prime/static/src/xml/frontend/image_hotspot.xml',   # TODO: kishan
            'theme_prime/static/src/xml/website_sale.xml',
        ],
        'web._assets_primary_variables': [
            'theme_prime/static/src/scss/primary_variables.scss',
            'theme_prime/static/src/scss/mixins.scss',
        ],
        'web._assets_frontend_helpers': [
            'theme_prime/static/src/scss/bootstrap_overridden.scss',
        ],
        'website.website_builder_assets': [
            'droggol_theme_common/static/src/js/hooks.js',
            'theme_prime/static/src/interactions/dynamic_snippet/dynamic_snippet_registry.js',
            'theme_prime/static/src/components/**/*',
            'theme_prime/static/src/website_builder/**/*',
        ],
        'website.assets_edit_frontend': [
            'theme_prime/static/src/snippets/**/*.edit.js',
        ],
        'html_builder.iframe_add_dialog': [
            'theme_prime/static/src/scss/snippet_viewer.scss',
        ],
    },
}
