/** @odoo-module **/

// TODO: JAT

import { patch } from "@web/core/utils/patch";
import { patchDynamicContent } from '@web/public/utils';
import { SearchBar } from "@website/snippets/s_searchbar/search_bar";
import { SearchBarResults } from "@website/snippets/s_searchbar/search_bar_results";
import { rpc } from "@web/core/network/rpc";
import { isMobileOS } from "@web/core/browser/feature_detection";
import { markup } from "@odoo/owl";


patch(SearchBarResults.prototype, {
    setup() {
        super.setup();
        patchDynamicContent(this.dynamicContent, {
            _root: {
                "t-att-style": () => {
                    const bcr = this.searchBarEl.getBoundingClientRect();
                    let width = bcr.width;
                    if (this.el.classList.contains("dr_search_wide")) {
                        width = bcr.width * 1.3;
                    }
                    return {
                        "max-width": `${width}px !important`,
                    };
                }
            }
        });
        // always open downwards in sidebar search
        if (this.searchBarEl.classList.contains("dr-sidebar-search")) {
            this.isDropup = false;
        }
    },
});

patch(SearchBar.prototype, {
    setup() {
        super.setup();
        patchDynamicContent(this.dynamicContent, {
            "a[data-type]": {
                't-on-click': (ev) => this._onClickSearchResult(ev)
            },
            ".o_searchbar_form": {
                't-on-submit': (ev) => this._onSubmitSearchResult(ev)
            },
        });
        this.advanceMode = odoo.dr_theme_config.json_product_search.advance_search;
        this.search_reports = odoo.dr_theme_config.json_product_search.search_report;
        this.options = { ...this.options,
            'pills_style': odoo.dr_theme_config.json_product_search.pills_style || '1',
            'single_column': isMobileOS() || this.el.classList.contains("dr_in_sidebar"),
        };
        this.advanceMode = this.advanceMode && this.searchType === 'products' ? true : false;
        if (this.advanceMode) {
            this.searchType = 'droggol';
        }
    },

    async fetch() {
        if (this.advanceMode) {
            const search_result = await rpc('/website/dr_search', {
                'term': this.inputEl.value,
                'max_nb_chars': Math.round(Math.max(this.autocompleteMinWidth, parseInt(this.el.clientWidth)) * 0.22),
                'options': this.options,
                'device_type': isMobileOS() ? 'mobile': 'desktop',
            });

            if (this.search_reports) {
                this.searchReportData = {
                    'search_term': this.inputEl.value,
                    'category_count': search_result.categories.results.length,
                    'product_count': search_result.products.results.length,
                    'autocomplete_count': search_result.autocomplete.results_count,
                    'suggestion_count': search_result.suggestions.results_count,
                }
            }
            this._markupRecords(search_result.products.results);
            this._markupRecords(search_result.categories.results);
            this._markupRecords(search_result.brands.results);
            this._markupRecords(search_result.suggestions.results);
            this._markupRecords(search_result.autocomplete.results);
            if (search_result.global_match) {
                search_result.global_match['name'] = markup(search_result.global_match['name'])
            }
            return {
                results: search_result,
            }
        } else {
            return super.fetch();
        }
    },

    _markupRecords: function (results) {
        const fieldNames = ['name', 'description', 'extra_link', 'detail', 'detail_strike', 'detail_extra'];
        results.forEach(record => {
            for (const fieldName of fieldNames) {
                if (record[fieldName]) {
                    if (typeof record[fieldName] === "object") {
                        for (const fieldKey of Object.keys(record[fieldName])) {
                            record[fieldName][fieldKey] = markup(record[fieldName][fieldKey]);
                        }
                    } else {
                        record[fieldName] = markup(record[fieldName]);
                    }
                }
            }
        });
    },

    _onClickSearchResult: function (ev) {
        if (this.search_reports) {
            var searchResultEl = ev.currentTarget;
            var search_type = searchResultEl.dataset.type;
            this.searchReportData['clicked_type'] = search_type;
            this.searchReportData['clicked_href'] = searchResultEl.getAttribute('href');
            if (search_type == 'product') {
                this.searchReportData['clicked_string'] = searchResultEl.querySelector('.h6').textContent.trim();;
            } else {
                this.searchReportData['clicked_string'] = searchResultEl.textContent.trim();;
            }
            this._addSearchReport(this.searchReportData);
        }
    },

    _onSubmitSearchResult: function (ev) {
        if (this.search_reports) {
            let searchReportData = {
                "search_term": this.inputEl.value,
                "clicked_type": "submit",
            }
            this._addSearchReport(searchReportData);
        }
    },

    _addSearchReport: function (searchReportData) {
        searchReportData['device_type'] = isMobileOS() ? 'mobile': 'desktop';
        rpc('/website/dr_search/add_report', searchReportData);
    },
});
