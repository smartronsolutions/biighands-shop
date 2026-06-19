// [TO-DO] review file we need interactionProps only
import { registry } from '@web/core/registry';
import { _t } from "@web/core/l10n/translation";

let PRODUCTS_ACTIONS = ['rating', 'quick_view', 'add_to_cart', 'comparison', 'wishlist', 'category_info', 'label'];
let PRODUCTS_ACTIONS_2 = ['rating', 'category_info', 'add_to_cart', 'wishlist', 'comparison', 'description_ecommerce', 'label'];
let PRODUCTS_DATA = { models: ['product.template', 'product.product'], fields: ['name', 'list_price', 'dr_stock_label'], fieldsToMarkUp: ['price', 'list_price', 'dr_stock_label']}
let CATEGORIES_DATA = { fields: ['name'], fieldsToMarkUp: []};
let SELECTOR_DATA = { TpRecordSelector: { ...PRODUCTS_DATA, defaultVal: { selectionType: 'manual', recordsIDs: [], model: 'product.template'}}};
let EXTRA_OPTIONS = { TpExtraOpts: { startDate: '', endDate: '', priceList: '*' } };
let CATEGORY_SELECTOR_DATA = { TpRecordSelector: { ...CATEGORIES_DATA, defaultVal: { selectionType: 'manual', recordsIDs: [], model: 'product.public.category'}}};

registry.category('theme_prime_card_registry')
    .add('s_card_style_1', {supportedActions: PRODUCTS_ACTIONS})
    .add('s_card_style_2', {supportedActions: PRODUCTS_ACTIONS})
    .add('s_card_style_3', {supportedActions: [...new Set([...PRODUCTS_ACTIONS, ...['show_similar']])]})
    .add('s_card_style_4', {supportedActions: PRODUCTS_ACTIONS})
    .add('s_card_style_5', { supportedActions: [...new Set([...PRODUCTS_ACTIONS])]})
    .add('s_card_style_6', { supportedActions: [...new Set([...PRODUCTS_ACTIONS, ...['show_similar', 'colors']])]})
    .add('s_card_style_7', { supportedActions: [...new Set([...PRODUCTS_ACTIONS, ...['show_similar', 'colors']])]})
    .add('s_card_style_8', { supportedActions: [...new Set([...PRODUCTS_ACTIONS, ...['show_similar']])]})

registry.category('theme_prime_mobile_card_registry')
    .add('s_mobile_card_style_1', {supportedActions: []})
    .add('s_mobile_card_style_2', {supportedActions: []})

registry.category('theme_prime_small_card_registry')
    .add('tp_category_product_card_style_1', { supportedActions: ['add_to_cart', 'rating', 'category_info']})
    .add('tp_category_product_card_style_2', { supportedActions: ['add_to_cart', 'rating', 'category_info'] })
    .add('tp_category_product_card_style_3', { supportedActions: ['add_to_cart', 'rating', 'category_info'] });

registry.category('theme_prime_top_category_card_registry')
    .add('tp_category_category_card_style_1', { supportedActions: [] })
    .add('tp_category_category_card_style_2', { supportedActions: [] })

registry.category('theme_prime_two_column_card_registry')
    .add('tp_two_column_card_style_1', { supportedActions: PRODUCTS_ACTIONS_2})
    .add('tp_two_column_card_style_2', { supportedActions: ['rating', 'category_info', 'add_to_cart', 'wishlist', 'comparison', 'description_ecommerce', 'label', 'colors']})
    .add('tp_two_column_card_style_3', { supportedActions: ['rating', 'category_info', 'add_to_cart', 'wishlist', 'comparison', 'description_ecommerce', 'label', 'colors']});

registry.category('theme_prime_inner_content_card_registry')
    .add('tp_inner_content_card_style_1', { width: 225, maxProductCount: 5, supportedActions: ['rating'] })
    .add('tp_inner_content_card_style_2', { width: 210, maxProductCount: 5, supportedActions: ['add_to_cart', 'rating', 'category_info']})
    .add('tp_inner_content_card_style_3', { width: 200, maxProductCount: 5, supportedActions: ['add_to_cart', 'rating', 'category_info']});

registry.category('tp_inner_content_snippet_registry')
    .add('s_inner_dynamic_products_block', { widgets: { ...SELECTOR_DATA, TpUiComponent: { cardRegistry: 'theme_prime_inner_content_card_registry', defaultVal: { style: 'tp_inner_content_card_style_1', activeActions: PRODUCTS_ACTIONS}}, ...EXTRA_OPTIONS}, interactionProps: { bodyTemplate: 's_inner_dynamic_products_block_template', bodySelector: '.s_inner_dynamic_products_block', snippetNodeAttrs: ['selectionInfo'], controllerRoute: '/theme_prime/get_products_data'}});

registry.category('theme_prime_snippet_registry')
    .add('s_d_products_snippet', { widgets: { ...SELECTOR_DATA, TpUiComponent: { cardRegistry: 'theme_prime_card_registry', defaultVal: { style: 's_card_style_1', mode: 'slider', ppr: 4, activeActions: PRODUCTS_ACTIONS, mobileConfig: { style: 'default', mode: 'default' } } }, ...EXTRA_OPTIONS }, defaultValue: { hasSwitcher: true, }, interactionProps: { controllerRoute: "/theme_prime/get_products_data", snippetNodeAttrs: ['selectionInfo'], bodyTemplate: 'd_s_cards_wrapper', bodySelector: '.s_d_products_snippet' } })
    .add('s_d_single_product_count_down', { widgets: { ...SELECTOR_DATA, ...EXTRA_OPTIONS }, defaultValue: { recordsLimit: 5 }, interactionProps: { snippetNodeAttrs: ['selectionInfo'], controllerRoute: "/theme_prime/get_products_data", bodyTemplate: 's_d_single_product_count_down_temp', bodySelector: '.s_d_single_product_count_down' } })
    .add('s_two_column_cards', { widgets: { ...SELECTOR_DATA, TpUiComponent: { cardRegistry: 'theme_prime_two_column_card_registry', defaultVal: { style: 'tp_two_column_card_style_1', mode: 'slider', activeActions: PRODUCTS_ACTIONS_2 } }, ...EXTRA_OPTIONS }, interactionProps: { bodyTemplate: 'd_s_cards_wrapper', bodySelector: '.s_two_column_cards', snippetNodeAttrs: ['selectionInfo', 'uiConfigInfo'], controllerRoute: '/theme_prime/get_products_data' } })
    .add('s_d_products_grid', { widgets: { ...SELECTOR_DATA, ...EXTRA_OPTIONS }, defaultValue: { recordsLimit: 9 }, interactionProps: { bodyTemplate: 's_d_products_grid_tmpl', snippetNodeAttrs: ['selectionInfo'], bodySelector: '.s_d_products_grids', controllerRoute: '/theme_prime/get_products_data' } })
    .add('s_d_categories_tabs_snippet', { widgets: { ...CATEGORY_SELECTOR_DATA, TpUiComponent: { cardRegistry: 'theme_prime_card_registry', defaultVal: { style: 's_card_style_1', sortBy: 'list_price asc', tabStyle: 'tp-dynamic-snippet-prime-tab-1', mode: 'slider', limit: 8, ppr: 4, includesChild: true, activeActions: PRODUCTS_ACTIONS, mobileConfig: { style: 'default', mode: 'default' } } }, ...EXTRA_OPTIONS }, interactionProps: { bodySelector: '.s_d_categories_tabs_snippet', snippetNodeAttrs: ['selectionInfo'], controllerRoute: '/theme_prime/get_products_by_category', bodyTemplate: 'd_s_category_cards_wrapper', noDataTemplateSubString: _t("Sorry, We couldn't find any products under this category") } })
    .add('s_products_by_brands_tabs', { widgets: { TpRecordSelector: { model: 'product.attribute.value', fields: ['name'], isBrand: true, fieldsToMarkUp: [], defaultVal: { selectionType: 'manual', recordsIDs: [], model: 'product.attribute.value' } }, TpUiComponent: { cardRegistry: 'theme_prime_card_registry', defaultVal: { tabStyle: 'tp-dynamic-snippet-prime-tab-1', style: 's_card_style_1', sortBy: 'list_price asc', mode: 'slider', ppr: 4, activeActions: PRODUCTS_ACTIONS, limit: 6, mobileConfig: { style: 'default', mode: 'default' } } } }, interactionProps: { bodySelector: '.s_products_by_brands_tabs', snippetNodeAttrs: ['selectionInfo'], controllerRoute: '/theme_prime/get_products_by_category', bodyTemplate: 'd_s_category_cards_wrapper', noDataTemplateSubString: _t("Sorry, We couldn't find any products under this brand") } })
    .add('s_d_brand_snippet', { widgets: { TpRecordSelector: { model: 'product.attribute.value', fields: ['name'], isBrand: true, fieldsToMarkUp: [], defaultVal: { selectionType: 'manual', recordsIDs: [], model: 'product.attribute.value' } }, TpUiComponent: { cardRegistry: 'theme_prime_brand_card_registry', defaultVal: { style: 'tp_brand_card_style_1', mode: 'slider' } }, ...EXTRA_OPTIONS }, interactionProps: { controllerRoute: '/theme_prime/get_brands', bodyTemplate: 's_d_brand_snippet', bodySelector: '.s_d_brand_snippet', displayAllProductsBtn: false, snippetNodeAttrs: ["selectionInfo", "uiConfigInfo", "extraInfo"], noDataTemplateString: _t("No brands are found!"), noDataTemplateSubString: _t("Sorry, We couldn't find any brands right now") } })
    .add('s_brands_small', { widgets: { TpRecordSelector: { model: 'product.attribute.value', fields: ['name'], isBrand: true, fieldsToMarkUp: [], defaultVal: { selectionType: 'manual', recordsIDs: [], model: 'product.attribute.value' } } }, defaultValue: { recordsLimit: 8 }, interactionProps: { controllerRoute: '/theme_prime/get_brands_category_data', bodyTemplate: 's_category_brands', snippetNodeAttrs: ['selectionInfo'] } })
    .add('s_category_small', { widgets: { ...CATEGORY_SELECTOR_DATA }, defaultValue: { recordsLimit: 8 }, interactionProps: { controllerRoute: '/theme_prime/get_brands_category_data', bodyTemplate: 's_category_brands', snippetNodeAttrs: ['selectionInfo'] } })
    .add('s_d_single_category_snippet', { widgets: { ...CATEGORY_SELECTOR_DATA, TpUiComponent: { cardRegistry: 'theme_prime_small_card_registry', defaultVal: { style: 'tp_category_product_card_style_1', sortBy: 'list_price asc', activeActions: ['add_to_cart', 'rating', 'category_info'], includesChild: true } }, ...EXTRA_OPTIONS }, defaultValue: { recordsLimit: 1 }, interactionProps: { bodyTemplate: 's_single_category_snippet', bodySelector: '.s_d_single_category_snippet', snippetNodeAttrs: ["selectionInfo"], controllerRoute: '/theme_prime/get_products_by_category' } })
    .add('s_d_single_product_snippet', { widgets: { TpRecordSelector: { ...PRODUCTS_DATA, ...{ models: ['product.template'] }, defaultVal: { selectionType: 'manual', recordsIDs: [], model: 'product.template' } }, ...EXTRA_OPTIONS }, defaultValue: { recordsLimit: 1 }, interactionProps: { snippetNodeAttrs: ['selectionInfo', 'extraInfo'], bodyTemplate: 's_single_product_snippet', controllerRoute: '/theme_prime/get_quick_view_html', bodySelector: '.d_single_product_container', noDataTemplateString: _t("No product found"), noDataTemplateSubString: _t("Sorry, this product is not available right now"), displayAllProductsBtn: false } })
    .add('s_d_single_product_cover_snippet', { widgets: { TpRecordSelector: { ...PRODUCTS_DATA, ...{ models: ['product.template'] }, defaultVal: { selectionType: 'manual', recordsIDs: [], model: 'product.template' } }, ...EXTRA_OPTIONS }, defaultValue: { recordsLimit: 1 }, interactionProps: { snippetNodeAttrs: ['selectionInfo', 'extraInfo'], controllerRoute: '/theme_prime/get_quick_view_html', bodyTemplate: 's_d_single_product_cover_snippet', bodySelector: '.s_d_single_product_cover_snippet' } })
    .add('s_d_product_count_down', { widgets: { ...SELECTOR_DATA, ...EXTRA_OPTIONS }, defaultValue: { noSnippet: true }, interactionProps: { bodyTemplate: 's_d_product_count_down_template', bodySelector: '.s_d_product_count_down_body', snippetNodeAttrs: ['selectionInfo'], controllerRoute: '/theme_prime/get_products_data' } })
    .add('s_tp_products_rating', { widgets: { TpRecordSelector: { ...PRODUCTS_DATA, ...{ models: ['product.template'] }, defaultVal: { selectionType: 'manual', recordsIDs: [], model: 'product.template' } }, TpUiComponent: { cardRegistry: 'theme_prime_ratings_card_registry', defaultVal: { style: 'tp_rating_snippet_style_1', mode: 'slider' } } }, interactionProps: { bodyTemplate: 'tp_rating_snippet_content', bodySelector: '.s_tp_products_rating', snippetNodeAttrs: ['selectionInfo'], controllerRoute: '/theme_prime/get_products_data' } })
    .add('s_d_product_small_block', { widgets: { ...SELECTOR_DATA, ...EXTRA_OPTIONS }, defaultValue: { noSnippet: true }, interactionProps: { bodyTemplate: 's_d_product_small_block_template', bodySelector: '.s_d_product_small_block_body', snippetNodeAttrs: ['selectionInfo'], controllerRoute: '/theme_prime/get_products_data' } })
    .add('s_d_image_products_block', { widgets: { ...SELECTOR_DATA, ...EXTRA_OPTIONS }, defaultValue: { hasSwitcher: true }, interactionProps: { bodyTemplate: 's_d_image_products_block_tmpl', snippetNodeAttrs: ['selectionInfo'], bodySelector: '.s_d_image_products_block', controllerRoute: '/theme_prime/get_products_data' } })
    .add('s_d_top_categories', { widgets: { ...CATEGORY_SELECTOR_DATA, TpUiComponent: { cardRegistry: 'theme_prime_top_category_card_registry', defaultVal: { style: 'tp_category_category_card_style_1', sortBy: 'list_price asc', includesChild: true } }, ...EXTRA_OPTIONS }, defaultValue: { recordsLimit: 3 }, interactionProps: { bodyTemplate: 's_top_categories_snippet', bodySelector: '.s_d_top_categories_container', controllerRoute: '/theme_prime/get_top_categories', snippetNodeAttrs: ["selectionInfo", "uiConfigInfo", "extraInfo"], noDataTemplateString: _t("No categories found!"), noDataTemplateSubString: false, displayAllProductsBtn: false } })
    .add('s_category_snippet', { widgets: { ...CATEGORY_SELECTOR_DATA, TpUiComponent: { cardRegistry: 'theme_prime_category_card_registry', defaultVal: { style: 's_tp_category_style_1' } }, ...EXTRA_OPTIONS }, interactionProps: { bodySelector: '.s_category_snippet', snippetNodeAttrs: ['selectionInfo', 'uiConfigInfo', 'extraInfo'], bodyTemplate: 's_tp_category_wrapper_template', controllerRoute: '/theme_prime/get_categories_info' } })
    .add('s_product_listing_cards', { widgets: { TpUiComponent: { cardRegistry: 'theme_prime_product_list_cards', defaultVal: { header: 'tp_product_list_header_1', style: 'tp_product_list_cards_1', limit: 5, activeActions: ['rating'], bestseller: true, newArrived: true, discount: true } }, ...EXTRA_OPTIONS }, defaultValue: { noSelection: true, maxValue: 5, minValue: 2 }, interactionProps: { bodyTemplate: 'd_s_cards_listing_wrapper', bodySelector: '.s_product_listing_cards', controllerRoute: '/theme_prime/get_listing_products', snippetNodeAttrs: ['selectionInfo', 'uiConfigInfo', 'extraInfo'] } })
    .add('s_image_product_listing_cards', { widgets: { TpUiComponent: { cardRegistry: 'theme_prime_product_list_cards', defaultVal: { header: 'tp_product_list_header_1', style: 'tp_product_list_cards_1', limit: 5, activeActions: ['rating'], bestseller: true, newArrived: true, discount: true } }, ...EXTRA_OPTIONS }, defaultValue: { noSelection: true, maxValue: 5, minValue: 2 }, interactionProps: { bodyTemplate: 'd_s_cards_listing_wrapper', bodySelector: '.s_product_listing_cards', controllerRoute: '/theme_prime/get_listing_products', snippetNodeAttrs: ['selectionInfo', 'uiConfigInfo', 'extraInfo'] } })
    .add('s_tp_mega_menu_category_snippet', { widgets: { ...CATEGORY_SELECTOR_DATA, TpUiComponent: { cardRegistry: 'theme_prime_mega_menu_cards', defaultVal: { style: 's_tp_hierarchical_category_style_1', childOrder: 'sequence', productListing: 'newArrived', limit: 5, activeActions: ['brand', 'label', 'count'] } }, ...EXTRA_OPTIONS }, defaultValue: { maxValue: 10, minValue: 2 }, interactionProps: { bodySelector: '.s_tp_mega_menu_category_snippet_wrapper', bodyTemplate: 's_tp_hierarchical_category_wrapper', controllerRoute: '/theme_prime/get_megamenu_categories', snippetNodeAttrs: ['selectionInfo', 'uiConfigInfo', 'extraInfo'] } })
    .add('s_mega_menu_category_tabs_snippet', { widgets: { ...CATEGORY_SELECTOR_DATA, TpUiComponent: { cardRegistry: 'theme_prime_mega_menu_tabs_styles', defaultVal: { style: 'tp_mega_menu_tab_style_1', childOrder: 'sequence', menuLabel: true, onlyDirectChild: false, categoryTabsConfig: { activeRecordID: false, records: [] } } }, ...EXTRA_OPTIONS }, defaultValue: { noSwicher: true, lazy: true }, interactionProps: { bodySelector: '.s_category_tabs_snippet', bodyTemplate: 's_category_tabs_snippet_wrapper', controllerRoute: '/theme_prime/get_megamenu_categories', snippetNodeAttrs: ['selectionInfo', 'uiConfigInfo', 'extraInfo'] } })
    .add('s_product_listing_tabs', { widgets: { ...CATEGORY_SELECTOR_DATA, TpUiComponent: { cardRegistry: 'theme_prime_card_registry', defaultVal: { mode: 'slider', ppr: 4, tabStyle: 'tp-dynamic-snippet-prime-tab-1', style: 's_card_style_1', limit: 20, activeActions: PRODUCTS_ACTIONS, bestseller: true, newArrived: true, discount: true, mobileConfig: { style: 'default', mode: 'default' } } }, ...EXTRA_OPTIONS }, defaultValue: { forceVisible: true }, interactionProps: { bodyTemplate: 'd_s_category_cards_wrapper', noDataTemplateSubString: _t("Sorry, We couldn't find any products under this category"), controllerRoute: '/theme_prime/get_tab_listing_products', bodySelector: '.s_product_listing_tabs', supportedTypes: ['bestseller', 'discount', 'newArrived'], snippetNodeAttrs: ['selectionInfo', 'uiConfigInfo', 'extraInfo'] } })
    .add('s_d_suggested_product_slider', { interactionProps: { bodyTemplate: 's_d_products_grid_tmpl_suggested', bodySelector: '.tp-suggested-products-cards', controllerRoute: '/theme_prime/get_products_data', snippetNodeAttrs: ['selectionInfo'] } });

registry.category('theme_prime_mega_menus')
    .add('s_tp_mega_menu_category_snippet', { widgets: { ...CATEGORY_SELECTOR_DATA, TpUiComponent: { cardRegistry: 'theme_prime_mega_menu_cards', defaultVal: { style: 's_tp_hierarchical_category_style_1', childOrder: 'sequence', productListing: 'newArrived', limit: 5, activeActions: ['brand', 'label', 'count'] } } }, defaultValue: { maxValue: 10, minValue: 2} })
    .add('s_mega_menu_category_tabs_snippet', { widgets: { ...CATEGORY_SELECTOR_DATA, TpUiComponent: { cardRegistry: 'theme_prime_mega_menu_tabs_styles', defaultVal: { style: 'tp_mega_menu_tab_style_1', childOrder: 'sequence', menuLabel: true, onlyDirectChild: false, categoryTabsConfig: { activeRecordID: false, records: [] } } } }, defaultValue: { noSwicher: true, lazy: true} })
    .add('s_category_snippet', { widgets: { ...CATEGORY_SELECTOR_DATA, TpUiComponent: { cardRegistry: 'theme_prime_category_card_registry', defaultVal: { style: 's_tp_category_style_1' } } }});

registry.category('theme_prime_ratings_card_registry')
    .add('tp_rating_snippet_style_1', { supportedActions: [] })
    .add('tp_rating_snippet_style_2', { supportedActions: [] })
    .add('tp_rating_snippet_style_3', { supportedActions: [] })
    .add('tp_rating_snippet_style_4', { supportedActions: [] });

registry.category('theme_prime_category_card_registry')
    .add('s_tp_category_style_1', { supportedActions:[] })
    .add('s_tp_category_style_2', { supportedActions: [] })
    .add('s_tp_category_style_3', { supportedActions: [] })
    .add('s_tp_category_style_4', { supportedActions: [] })
    .add('s_tp_category_style_5', { supportedActions: [] })
    .add('s_tp_category_style_6', { supportedActions: [] });

registry.category('theme_prime_brand_card_registry')
    .add('tp_brand_card_style_1', { supportedActions:[] })
    .add('tp_brand_card_style_2', { supportedActions: [] })
    .add('tp_brand_card_style_3', { supportedActions: [] })
    .add('tp_brand_card_style_4', { supportedActions: [] })
    .add('tp_brand_card_style_5', { supportedActions: [] })

registry.category('theme_prime_product_list_cards')
    .add('tp_product_list_cards_1', {supportedActions: ['rating']})
    .add('tp_product_list_cards_2', {supportedActions: ['rating']})
    .add('tp_product_list_cards_3', {supportedActions: ['rating', 'add_to_cart']})
    .add('tp_product_list_cards_4', {supportedActions: ['rating', 'add_to_cart', 'wishlist', 'quick_view']});

registry.category('theme_prime_product_list_cards_headers')
    .add('tp_product_list_header_1', {})
    .add('tp_product_list_header_2', {})
    .add('tp_product_list_header_3', {});

registry.category('theme_prime_mega_menu_tabs_styles')
    .add('tp_mega_menu_tab_style_1', { supportedActions:[] })
    .add('tp_mega_menu_tab_style_2', { supportedActions: [] })

registry.category('theme_prime_mega_menu_cards')
    .add('s_tp_hierarchical_category_style_1', {supportedActions: ['limit', 'brand', 'label', 'count', 'style', 'background']})
    .add('s_tp_hierarchical_category_style_2', {supportedActions: ['limit', 'brand', 'label', 'count', 'style', 'background']})
    .add('s_tp_hierarchical_category_style_3', {supportedActions: ['limit', 'brand', 'label', 'count', 'style', 'background']})
    .add('s_tp_hierarchical_category_style_4', {supportedActions: ['limit', 'brand', 'label', 'count', 'style', 'background']})
    .add('s_tp_hierarchical_category_style_5', {supportedActions: ['productListing', 'limit', 'brand', 'label', 'count', 'style', 'background']})
    .add('s_tp_hierarchical_category_style_6', {supportedActions: ['limit', 'brand', 'label', 'count', 'style', 'background']})
    .add('s_tp_hierarchical_category_style_7', {supportedActions: ['limit', 'brand', 'label', 'count', 'style', 'background']})
    .add('s_tp_hierarchical_category_style_8', {supportedActions: ['limit', 'brand', 'label', 'count', 'style', 'background']})
    .add('s_tp_hierarchical_category_style_9', {supportedActions: ['limit', 'brand', 'label', 'count', 'style', 'background']})
    .add('s_tp_hierarchical_category_style_10', {supportedActions: ['limit', 'brand', 'label', 'count', 'style', 'background']})
    .add('s_tp_hierarchical_category_style_11', {supportedActions: ['limit', 'brand', 'label', 'count', 'style', 'background']});