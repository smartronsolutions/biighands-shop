import { Interaction } from "@web/public/interaction";
import { rpc } from "@web/core/network/rpc";
import { _t } from "@web/core/l10n/translation";
import { markup } from "@odoo/owl";
import { utils as uiUtils } from "@web/core/ui/ui_service";
import { observeDynamicSnippet, unobserveDynamicSnippet } from "./dynamic_snippet_observer";
import { isPublicUser, _primeLoadExtras } from "./dynamic_snippet_hook";
import { renderToFragment } from "@web/core/utils/render";
import { registry } from "@web/core/registry";


// We will try to do cleaning in between releases.
export class DynamicSnippetBase extends Interaction {
    static selector = ".i-m-guessing-you-really-want-to-know";
    dynamicContent = {
        _window: { "t-on-resize": this.throttled(this._onWindowResize.bind(this)) },
    };
    setup() {
        super.setup();
        // consider preview mode as editableMode
        if (document.querySelector("#tp_wrap")) {
            this.editableMode = true;
        }
    }
    async willStart() {
        this._setDefaults();
        this._setDefaultDataSetsFromNode();
        if (!this.ObserverNeedsToBeSet) {
            await this._initiateRendering();
        }
    }
    start() {
        super.start();
        if (this.ObserverNeedsToBeSet) {
            observeDynamicSnippet(this.el, this._initiateRendering.bind(this));
        }
    }
    _setDefaults() {
        this.registryToUse = this.registryToUse || false;
        this.controllerRoute = false;
        this.bodyTemplate = false;
        this.bodySelector = false;
        this.displayLoader = true;
        this.snippetNodeAttrs = [];
        this.tpFieldsToMarkUp = [];
        this.IsAttrSet = false;
        this.noRendering = false;

        this.noDataTemplate = 'droggol_default_no_data_templ';
        this.noDataTemplateImg = '/theme_prime/static/src/img/no_data.svg';
        this.noDataTemplateString = _t("No products found!");
        this.noDataTemplateSubString = _t("Sorry, We couldn't find any products");
        this.displayAllProductsBtn = true;
        this.loaderTemplate = 'droggol_default_loader';
        this.isMobile = uiUtils.isSmall();
        this.updateBasedOnRegistry();
    }
    updateBasedOnRegistry() {
        if (this.registryToUse) {
            let snippetConfigFromRegistry = registry.category(this.registryToUse)?.get(this.currentSnippetID);
            let propsFromRegistry = snippetConfigFromRegistry?.interactionProps;
            // not sure why i'm still calling it widgets
            this.snippetWidgetsProps = snippetConfigFromRegistry.widgets;
            Object.assign(this, propsFromRegistry);
        }
    }
    get currentSnippetID() {
        return this.el.dataset.tpSnippetId;
    }
    destroy() {
        // Clear content.
        if (this.bodySelectorElement) {
            this.bodySelectorElement.innerHTML = "";
        }
        if (this.ObserverNeedsToBeSet) {
            unobserveDynamicSnippet(this.el);
        }
    }
    _onResize() {
        this.isMobile = uiUtils.isSmall();
    }
    async _initiateRendering() {
        // We didn't use d-none here beacuse otherwise odoo's visibility option will not work
        if (!this.isSnippetVisible && !this.editableMode) {
            this.el.classList.add('tp-hide-block');
            return;
        }
        this.el.classList.remove('tp-hide-block');
        let params = this.controllerParams;
        if (this.controllerRoute && Object.keys(params).length) {
            await this._renderPrimeTemplate();
        }
    }
    async _fetchData() {
        let params = {...this.controllerParams, fields: this.fieldsToFetch};
        return await rpc(this.controllerRoute, params);
    }
    _markUpResults(result) {
        return markup(result);
    }
    /**
    * @private
    * Master Oogway
    */
    _isMyTimeHasCome(dueDate) {
        if (!dueDate) { return true; }
        let eventTime = luxon.DateTime.now();
        if (dueDate.includes("-")) {
            eventTime = deserializeDateTime(dueDate);
        } else {
            eventTime = luxon.DateTime.fromISO(new Date(parseInt(dueDate) * 1000).toISOString());
        }
        return !(Math.floor(eventTime.diffNow().as("seconds")) > 0);
    }
    /**
    * @private
    */
    get isSnippetVisible() {
        if (!this?.extraInfo || Object.keys(this.extraInfo).length === 0) {
            return true;
        }
        const isCorrectPricelist = ["*", parseInt(document.documentElement.dataset.pricelistId)].includes(this?.extraInfo?.priceList);
        const startTime = this?.extraInfo?.startDate;
        const endTime = this?.extraInfo?.endDate;
        const isCorrectStartTime = startTime ? this._isMyTimeHasCome(startTime) : true;
        const isCorrectEndTime = endTime ? !this._isMyTimeHasCome(endTime) : true;
        if (isCorrectPricelist && isCorrectStartTime && isCorrectEndTime) {
            return true;
        }
        return false;
    }
    get fieldsToFetch() {
        return [];
    }
    /**
    * @private
    */
    get limit() {
        return false;
    }
    /**
     * @private
     */
    get options() {
        return false;
    }
    /**
     * @private
     */
    get sortBy() {
        return false;
    }
    /**
    * @private
    */
    get domain() {
        return false;
    }
    get bodySelectorElement() {
        let selector = this.bodySelector;
        return selector ? this.el.querySelector(selector) : this.el;
    }
    get extraLibs() {
        return [];
    }
    /**
     * @private
     */
    get controllerParams() {
        let { domain, limit, options, sortBy } = this;
        let params = {};
        if (domain) {
            params['domain'] = domain;
        }
        if (limit !== false) {
            params['limit'] = limit;
        }
        let order = sortBy;
        if (order) {
            params['order'] = order;
        }
        if (options) {
            params['options'] = options;
        }
        return params;
    }
    _setDefaultDataSetsFromNode() {
        this.snippetNodeAttrs.forEach(attr => {
            if (Object.keys(this.snippetNodeDataSet).includes(attr)) {
                let dataSetValue = this.snippetNodeDataSet[attr];
                this[attr] = dataSetValue !== undefined ? JSON.parse(dataSetValue) : false;
                this[`${attr}_init`] = dataSetValue !== undefined ? JSON.parse(dataSetValue) : false;
                if (this[attr]) {
                    this.IsAttrSet = true;
                }
            }
        });
    }
    // Funny hack
    JaysonStringify (data) {
        return JSON.stringify(data);
    }
    _onWindowResize() {
        this.isMobile = uiUtils.isSmall();
    }
    _reloadInteractionNode(data){
        let { selector, target } = data;
        if (!target && selector && !this.el.querySelectorAll(selector).length) {
            return;
        } else {
            target = target ? [target] : this.el.querySelectorAll(selector);
        }
        target.forEach((el) => {
            this.services["public.interactions"].stopInteractions(el);
            this.services["public.interactions"].startInteractions(el);
        })
    }
    _appendLoader () {
        if (this.displayLoader && this.loaderTemplate) {
            this._renderAndAppendQweb(this.loaderTemplate, 'd_loader_default', true);
        }
    }
    _responseHasData(data) {
        return data;
    }
    _processData(data) {
        return data;
    }
    _setDBData(data) {}
    _onSuccessResponse (response) {
        let hasData = this._responseHasData(response);
        if (hasData) {
            this._setDBData(response);
            if (this.noRendering) {
                return;
            }
            this._renderContent(this._processData(response));
        } else {
            this._appendNoDataTemplate();
        }
    }
    _cleanAttributes() {
        if (this.isPublicUser) {
            this.snippetNodeAttrs.forEach(attr => {
                this.el.removeAttribute(attr);
            });
        }
    }
    _cleanBeforeAppend() {
        // Clean up the DOM before appending new content
        // this.el.querySelector('.d_loader_default').innerHTML = "";
        // this.el.querySelector('.d_no_data_tmpl_default').innerHTML = "";
        // this.el.querySelector('.d_editor_tmpl_default').innerHTML = "";
    }
    // From now _modifyElementsAfterAppend is not much helpful as the changes made in this method
    // will have some side effects we might need to call updateContent manually after making changes
    // this is pure shit but let's keep it for now.
    _modifyElementsAfterAppend () {
        this.el.querySelector('.d_body_tmpl_default')?.classList.remove('d_body_tmpl_default');
        this._cleanAttributes();
    }
    _renderContent(data) {
        // Should remove this below observer shit someday we need to rework on few things.
        // May be we might remove publicWidget it self and implementation our own way to render snippet
        // In this particular version 16.0 publicWidget is bit changed.
        // But any way thanks to Quentin for everything :)
        this._cleanBeforeAppend();
        this._renderAndAppendQweb(this.bodyTemplate, 'd_body_tmpl_default', data);
        this._modifyElementsAfterAppend();
    }
    async _renderPrimeTemplate() {
        // for safety to avoid crash
        let defs = [this._fetchData()];
        if (!this.noRendering) {
            defs.push(_primeLoadExtras(this.extraLibs, this._appendLoader.bind(this)));
        }
        let [response, anotherResult] = await Promise.all(defs);
        this.response = response;
        this._onSuccessResponse(response);
        return response;
    }
    displayNotification(data) {
        this.services.notification.add(data.message, { ...data, sticky: false });
    }
    _renderAndAppendQweb(template, className, data) {
        // observer shit needed but wait for someone to report a bug don't want to spread shit here
        if (!template || !data) {
            // for safety
            return;
        }
        let $template = $(renderToFragment(template, { data, widget: this }));
        $template.addClass(className);
        // html() make sure template appends only once.
        this.bodySelectorElement.innerHTML = "";
        this.bodySelectorElement.appendChild($template[0]);
        // Basically help us to rebind events
        // in future we might need to directly use Colibri object to do this :)
        if (this.ObserverNeedsToBeSet) {
            this.updateContent();
        }
    }
    get isPublicUser() {
        return isPublicUser();
    }
    get snippetNodeDataSet() {
        return this.el.dataset;
    }
    get ObserverNeedsToBeSet() {
        return this.isPublicUser && odoo.dr_theme_config?.json_dynamic_snippet_config?.dr_lazy_load_snippets;
    }
}
registry.category("public.interactions").add('theme_prime.dynamic_snippet_base', DynamicSnippetBase);
registry.category("public.interactions.edit").add('theme_prime.dynamic_snippet_base', { Interaction: DynamicSnippetBase });