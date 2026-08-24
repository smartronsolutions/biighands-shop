# -*- coding: utf-8 -*-
"""Install-time catalogue for the Playground architectural atelier."""

PRODUCTS = [
    ('Sentry Inward-Opening Window', 'windows', 240, True),
    ('Linea 83 Slim-Frame Window', 'windows', 255, False),
    ('Aegis Screened Casement', 'windows', 265, True),
    ('Fortis 112 Heavy-Duty Casement', 'windows', 285, False),
    ('Meridian Six-Track Sliding Window', 'windows', 295, False),
    ('Alto Lift Window — Model A', 'windows', 630, False),
    ('Alto Lift Window — Model B', 'windows', 790, False),
    ('Alto Lift Window — Model C', 'windows', 990, True),
    ('Fortis 112 Combination Unit', 'doors', 315, False),
    ('Horizon Panoramic Sliding Door — Model A', 'doors', 460, True),
    ('Horizon Panoramic Sliding Door — Model B', 'doors', 650, False),
    ('Veil Roller Insect Screen', 'accessories', 100, False),
    ('Atelier Wardrobe Wall', 'carpentry', 630, True),
    ('Ridge Timber Panelling', 'carpentry', 250, False),
    ('Arca Display Cabinetry', 'carpentry', 490, False),
    ('Vela Sheer Drapery', 'curtains', 95, True),
    ('Nocturne Blackout Curtains', 'curtains', 130, False),
    ('Rialto Wave-Heading Drapes', 'curtains', 110, False),
    ('Bespoke Aluminium Profile', 'bespoke', 0, False),
    ('Bespoke Carpentry Commission', 'bespoke', 0, False),
]

PRODUCT_META = {
    'Sentry Inward-Opening Window': ('sentry-inward-window', 'sqm', 500, 2400, 600, 2600),
    'Linea 83 Slim-Frame Window': ('linea-83', 'sqm', 500, 2200, 600, 2600),
    'Aegis Screened Casement': ('aegis-casement', 'sqm', 500, 2400, 600, 2600),
    'Fortis 112 Heavy-Duty Casement': ('fortis-112', 'sqm', 500, 2600, 600, 2800),
    'Meridian Six-Track Sliding Window': ('meridian-6-track', 'sqm', 1200, 6000, 900, 2600),
    'Fortis 112 Combination Unit': ('fortis-112-combi', 'sqm', 1200, 3000, 2000, 2800),
    'Veil Roller Insect Screen': ('veil-roller-screen', 'sqm', 400, 1400, 800, 2300),
    'Atelier Wardrobe Wall': ('atelier-wardrobe-wall', 'sqm', 1200, 6000, 2000, 3200),
    'Ridge Timber Panelling': ('ridge-timber-panelling', 'sqm', 600, 6000, 600, 3200),
    'Arca Display Cabinetry': ('arca-display-cabinetry', 'sqm', 800, 5000, 900, 3200),
    'Vela Sheer Drapery': ('vela-sheer-drapery', 'metre', 600, 10000, 1200, 4500),
    'Nocturne Blackout Curtains': ('nocturne-blackout-curtains', 'metre', 600, 10000, 1200, 4500),
    'Rialto Wave-Heading Drapes': ('rialto-wave-drapes', 'metre', 600, 10000, 1200, 4500),
    'Bespoke Aluminium Profile': ('bespoke-aluminium-profile', 'sqm', 300, 8000, 300, 5000),
    'Bespoke Carpentry Commission': ('bespoke-carpentry', 'sqm', 300, 8000, 300, 5000),
}

PRODUCT_META.update({
    'Alto Lift Window — Model A': ('alto-lift-a', 'sqm', 600, 1500, 1500, 2600),
    'Alto Lift Window — Model B': ('alto-lift-b', 'sqm', 1500, 3000, 1500, 2600),
    'Alto Lift Window — Model C': ('alto-lift-c', 'sqm', 3000, 4800, 1500, 2600),
    'Horizon Panoramic Sliding Door — Model A': ('horizon-sliding-a', 'sqm', 1050, 3000, 1700, 3500),
    'Horizon Panoramic Sliding Door — Model B': ('horizon-sliding-b', 'sqm', 1050, 5000, 1700, 3800),
})

COLLECTIONS = [
    ('windows', 'Windows'),
    ('doors', 'Doors'),
    ('accessories', 'Accessories'),
    ('carpentry', 'Carpentry'),
    ('curtains', 'Curtains'),
    ('bespoke', 'Bespoke'),
]


def post_init_hook(env):
    """Seed missing atelier products and make this module's home page active."""
    for legacy_xmlid in (
        'biighands_shop_website.bhs_header_view',
        'biighands_shop_website.bhs_footer_view',
        'biighands_shop_website.bhs_shop_layout_branding',
        'biighands_shop_website.bhs_fix_shop_title',
    ):
        legacy_view = env.ref(legacy_xmlid, raise_if_not_found=False)
        if legacy_view:
            legacy_view.sudo().active = False

    # Module upgrades must restore the complete atelier website even when an
    # older theme/header view was left active in the database.
    for xmlid in (
        'biighands_shop_website.playground_home',
        'biighands_shop_website.playground_header',
        'biighands_shop_website.playground_footer',
    ):
        view = env.ref(xmlid, raise_if_not_found=False)
        if view and not view.active:
            view.sudo().active = True

    Product = env['product.template'].sudo().with_context(active_test=False)
    AtelierCollection = env['bh.atelier.collection'].sudo().with_context(active_test=False)
    category_model = env['product.public.category'].sudo()
    categories = {}
    atelier_collections = {}

    for sequence, (key, label) in enumerate(COLLECTIONS, start=1):
        atelier = AtelierCollection.search([('slug', '=', key)], limit=1)
        if atelier:
            atelier.write({'name': label, 'sequence': sequence * 10, 'active': True})
        else:
            atelier = AtelierCollection.create({
                'name': label, 'slug': key, 'sequence': sequence * 10,
            })
        atelier_collections[key] = atelier
        category = category_model.search([('name', '=', label)], limit=1)
        if not category:
            category = category_model.create({'name': label})
        categories[key] = category

    for name, collection, price, featured in PRODUCTS:
        slug, price_unit, min_w, max_w, min_h, max_h = PRODUCT_META.get(
            name, (False, 'sqm', 600, 4800, 600, 3000)
        )
        product = Product.search([('name', '=', name)], limit=1)
        values = {
            'name': name,
            'sale_ok': True,
            'purchase_ok': False,
            'website_published': True,
            'list_price': price,
            'bh_slug': slug,
            'bh_price_unit': price_unit,
            'bh_min_width': min_w,
            'bh_max_width': max_w,
            'bh_min_height': min_h,
            'bh_max_height': max_h,
            'bh_collection_id': atelier_collections[collection].id,
            'bh_featured': featured,
            'public_categ_ids': [(6, 0, categories[collection].ids)],
            'description_sale': (
                'Made to measure by the Playground atelier. Final specification, '
                'site conditions and installation are confirmed in your quotation.'
            ),
        }
        if collection == 'curtains':
            values.update({
                'bh_finishes': 'Belgian Linen Sheer,Graphite Velvet,Wool Bouclé,Silk Blend',
                'bh_glazing': 'Unlined,Cotton Lining,Blackout Lining,Thermal Lining',
            })
        elif collection == 'carpentry':
            values.update({
                'bh_finishes': 'American Walnut,Smoked Oak,Ebonized Ash,Natural Maple',
                'bh_glazing': 'Not applicable',
            })
        elif collection == 'bespoke':
            values.update({
                'bh_finishes': 'To be confirmed',
                'bh_glazing': 'Not applicable',
            })
        if product:
            product.write(values)
        else:
            Product.create(values)

    # Preserve collection assignments from versions where bh_collection was a
    # Selection column. Odoo keeps the old column during this relational-field
    # migration, so any non-seeded products are migrated as well.
    env.cr.execute("""
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_template' AND column_name = 'bh_collection'
    """)
    if env.cr.fetchone():
        env.cr.execute("""
            SELECT id, bh_collection FROM product_template
            WHERE bh_collection IS NOT NULL AND bh_collection_id IS NULL
        """)
        for product_id, old_slug in env.cr.fetchall():
            atelier = atelier_collections.get(old_slug)
            if atelier:
                Product.browse(product_id).write({'bh_collection_id': atelier.id})
