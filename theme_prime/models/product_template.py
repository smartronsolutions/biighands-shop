# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Droggol Infotech Private Limited. (<https://www.droggol.com/>)

from odoo.tools import SQL
from odoo import models, fields, api, tools
from odoo.http import request


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    dr_has_discount = fields.Boolean(compute="_compute_dr_has_discount", search="_search_dr_has_discount")

    def _search_dr_has_discount(self, operator, value):
        pricelist_id = self.env.context.get('pricelist')
        if pricelist_id:
            discounted_product_ids = self._get_product_pricelist_data(pricelist_id)
            if operator not in ('not in', 'in'):
                operator = 'in' if operator == '!=' else 'not in'
            return [('id', operator, discounted_product_ids)]
        return []

    def _need_catch_update(self, pricelist_id, catch_date):
        catch_date_obj = fields.Datetime.to_datetime(catch_date)
        item_ids_catch = self._pricelist_items_for_date(pricelist_id, catch_date)
        item_ids_now = self._pricelist_items_for_date(pricelist_id, fields.Datetime.to_string(fields.Datetime.now()))
        if set(item_ids_catch) != set(item_ids_now):
            return True

        product_grouped_data = self.env['product.template'].formatted_read_group(domain=[('sale_ok', '=', True)], aggregates=['write_date:max'], groupby=['sale_ok'])
        if product_grouped_data:
            product_date = product_grouped_data[0].get('write_date:max')
            if product_date > catch_date_obj:
                return True
        return False

    @api.model
    def _pricelist_items_for_date(self, pricelist_id, date):
        self.env.cr.execute(
            """ SELECT item.id FROM product_pricelist_item AS item
                WHERE (item.pricelist_id = %s) AND (item.date_start IS NULL OR item.date_start<=%s) AND (item.date_end IS NULL OR item.date_end>=%s)
            """, (pricelist_id, date, date))
        return [x[0] for x in self.env.cr.fetchall()]

    def _get_product_pricelist_data(self, pricelist_id):
        discounted_product_ids, catch_date = self._get_product_pricelist_cache(pricelist_id)
        need_catch_update = self._need_catch_update(pricelist_id, catch_date)
        if need_catch_update:
            self.env.registry.clear_cache()
            discounted_product_ids, catch_date = self._get_product_pricelist_cache(pricelist_id)
        return discounted_product_ids

    @tools.ormcache('pricelist_id')
    def _get_product_pricelist_cache(self, pricelist_id):
        website = self.env['website'].get_current_website()
        products = self.sudo().search(website.sale_product_domain())    # Need sudo so all products are calculated
        discounted_product_ids = []
        all_products_prices = products._get_sales_prices(website)
        for p_id, price_data in all_products_prices.items():
            if price_data.get('base_price'):
                discounted_product_ids.append(p_id)
        return discounted_product_ids, fields.Datetime.to_string(fields.Datetime.now())

    def _dr_process_product_data(self, product_pricelist_data, product):
        return {'display_name': product_pricelist_data['display_name'], 'price': product_pricelist_data['price'], 'id': product_pricelist_data['product_template_id']}

    def _compute_dr_has_discount(self):
        for product in self:
            product.dr_has_discount = False

    def _get_product_category_count(self, domain=[]):
        from_clause, where_clause = self._dr_prepare_query_parts(domain)
        query = SQL(
            """
                SELECT
                    count(product_template.id),
                    product_public_category.parent_path as path,
                    product_public_category.parent_id as parent_id,
                    product_public_category.id as product_public_category_id
                FROM product_public_category_product_template_rel
                    JOIN product_template ON product_template.id = product_public_category_product_template_rel.product_template_id
                    %(from_clause)s
                    JOIN product_public_category ON product_public_category.id = product_public_category_product_template_rel.product_public_category_id
                WHERE %(where_clause)s
                GROUP BY product_public_category.id;
            """,
            from_clause=from_clause,
            where_clause=where_clause,
        )

        self.env.cr.execute(query)
        query_res = self.env.cr.dictfetchall()

        website = self.env['website'].get_current_website()
        all_categ = self.env['product.public.category'].search(website.website_domain())
        all_categ_data = [{'path': pc.parent_path, 'parent_id': pc.parent_id.id, 'product_public_category_id': pc.id} for pc in all_categ]

        result_count = dict([(categ.id, 0) for categ in all_categ])

        for line in all_categ_data:
            for line2 in query_res:
                if line.get('parent_id'):
                    path_pattern = '/%s/' % line.get('product_public_category_id')
                    if path_pattern in line2.get('path'):
                        result_count[line.get('product_public_category_id')] += line2.get('count')
                else:
                    path_pattern = '%s/' % line.get('product_public_category_id')
                    if line2.get('path').startswith(path_pattern):
                        result_count[line.get('product_public_category_id')] += line2.get('count')

        return result_count

    def _get_product_attrib_count(self, domain=[], qcontext=None):
        from_clause, where_clause = self._dr_prepare_query_parts(domain)
        active_attributes = qcontext['attributes'].ids
        filtered_values = qcontext.get('attrib_set', {})
        filtered_attributes = list(qcontext.get('attrib_values', {}).keys())

        if not filtered_values:
            query = SQL("""
                SELECT
                    rel.product_attribute_value_id AS value_id,
                    COUNT(*) AS product_count
                FROM product_template_attribute_value rel
                WHERE rel.attribute_id = ANY(%(active_attributes)s::int[])
                  AND EXISTS (
                        SELECT 1
                        FROM product_template
                        WHERE product_template.id = rel.product_tmpl_id
                          AND %(where_clause)s
                  )
                GROUP BY rel.product_attribute_value_id
            """,
            where_clause=where_clause,
            active_attributes=list(active_attributes)
            )
            self.env.cr.execute(query)
            results = self.env.cr.dictfetchall()
        else:
            query = SQL("""
                WITH
                    required AS (  -- attributes that have any selected values
                        SELECT DISTINCT pav.attribute_id
                        FROM product_attribute_value pav
                        WHERE pav.id = ANY(%(filtered_values)s::int[])
                    ),
                    targets AS (    -- facets you want to display
                        SELECT unnest(%(active_attributes)s::int[]) AS target_attribute_id
                    ),
                    -- For each target facet, keep products that satisfy ALL required attributes EXCEPT the target facet
                    filtered_products_per_attr AS (
                        SELECT
                            product_template.id AS product_id,
                            t.target_attribute_id
                        FROM product_template
                        CROSS JOIN targets t
                        WHERE %(where_clause)s
                        AND NOT EXISTS (
                                SELECT 1
                                FROM required r
                                WHERE r.attribute_id <> t.target_attribute_id
                                AND NOT EXISTS (
                                        SELECT 1
                                        FROM product_template_attribute_value rel
                                        WHERE rel.product_tmpl_id = product_template.id
                                        AND rel.attribute_id = r.attribute_id
                                        AND rel.product_attribute_value_id = ANY(%(filtered_values)s::int[])
                                )
                        )
                    ),
                    -- Count values on top of the per-attribute filtered product sets
                    counts_disj AS (
                        SELECT
                            rel.attribute_id        AS attribute_id,
                            rel.product_attribute_value_id AS value_id,
                            COUNT(DISTINCT f.product_id) AS product_count
                        FROM product_template_attribute_value rel
                        JOIN filtered_products_per_attr f
                        ON f.product_id = rel.product_tmpl_id
                        AND f.target_attribute_id = rel.attribute_id
                        GROUP BY rel.attribute_id, rel.product_attribute_value_id
                    )
                    -- return all values for active facets (including 0s)
                    SELECT
                        pav.id AS value_id,
                        COALESCE(c.product_count, 0) AS product_count
                    FROM product_attribute_value pav
                    JOIN product_attribute pa
                    ON pa.id = pav.attribute_id
                    LEFT JOIN counts_disj c
                    ON c.value_id = pav.id
                    WHERE pav.active = TRUE
                    AND pa.id = ANY(%(active_attributes)s::int[])
                    ORDER BY pa.name, pav.name;
            """,
            where_clause=where_clause,
            active_attributes=list(active_attributes),
            filtered_attributes_count=len(filtered_attributes),
            filtered_values=list(filtered_values)
            )

            self.env.cr.execute(query)
            results = self.env.cr.dictfetchall()
        return {row['value_id']: int(row['product_count']) for row in results}

    def _get_product_rating_count(self, domain=[]):
        from_clause, where_clause = self._dr_prepare_query_parts(domain)
        query = SQL(
            """
                SELECT avg_rating, count(*) FROM (
                    SELECT FLOOR(avg(rating)) as avg_rating, rating_rating.res_id FROM rating_rating JOIN product_template ON product_template.id = rating_rating.res_id %(from_clause)s
                        WHERE (%(where_clause)s) AND rating_rating.res_model = 'product.template' AND rating_rating.is_internal = False
                GROUP BY rating_rating.res_id) AS rating_count group by avg_rating;
            """,
            from_clause=from_clause,
            where_clause=where_clause,
        )
        self.env.cr.execute(query)
        query_result = dict(self.env.cr.fetchall())
        total = 0
        ratings_result = {rating: 0 for rating in range(1, 6)}
        for result in range(5, 0, -1):
            total += query_result.get(result, 0)
            ratings_result[result] = total
        return ratings_result

    def _dr_prepare_query_parts(self, domain):
        query = self._search(domain, bypass_access=True)
        # TODO
        # self._apply_ir_rules(query)
        return SQL(' '), query.where_clause

    def _search_render_results(self, fetch_fields, mapping, icon, limit):
        current_website = self.env['website'].get_current_website()
        if not current_website._dr_has_b2b_access():
            mapping.pop("detail", None)
        return super()._search_render_results(fetch_fields, mapping, icon, limit)

    # Below block is to support fallback products
    @api.model
    def _search_fetch(self, search_detail, search, limit, order):
        if search_detail.get('dr_search_domain'):
            search_detail['base_domain'].append(search_detail.get('dr_search_domain'))
            search = False
        return super()._search_fetch(search_detail, search, limit, order)

    @api.model
    def _search_get_detail(self, website, order, options):
        result = super()._search_get_detail(website, order, options)
        if options.get('dr_search_domain'):
            result['dr_search_domain'] = options.get('dr_search_domain')
        return result
