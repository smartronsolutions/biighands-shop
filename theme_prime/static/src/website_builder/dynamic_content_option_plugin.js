import { before, SNIPPET_SPECIFIC_END } from "@html_builder/utils/option_sequence";
import { Plugin } from "@html_editor/plugin";
import { withSequence } from "@html_editor/utils/resource";
import { registry } from "@web/core/registry";
import { TpSnippetConfigDialog } from "@theme_prime/components/dialog";
import { BuilderAction } from "@html_builder/core/builder_action";
import { ALIGNMENT_STYLE_PADDING } from "@html_builder/utils/option_sequence";
import {REPLACE_MEDIA_EXCLUDE} from "@html_builder/plugins/image/image_tool_option_plugin";
import { BaseOptionComponent, useDomState } from "@html_builder/core/utils";
import { uniqueId } from "@web/core/utils/functions";
import { BorderConfigurator } from "@html_builder/plugins/border_configurator_option";
import { BuilderColorPicker } from "@html_builder/core/building_blocks/builder_colorpicker";
import { Domain } from "@web/core/domain";
import { renderToElement } from "@web/core/utils/render";

export function getWebsiteCompatibleDomain(services, subDomain) {
    return Domain.and([
        subDomain,
        Domain.or([
            [["website_id", "=", false]],
            [["website_id", "=", services.website.currentWebsite.id]],
        ]),
    ]).toList()
}
class TpDynamicSnippetOptionPlugin extends Plugin {
    static id = "TpDynamicSnippetOptionPlugin";
    static dependencies = ["builderActions", "dialog", "history"];
    static shared = ["openSnippetConfigurator", "applySnippetChanges"];
    resources = {
        normalize_handlers: this.normalize.bind(this),
        on_snippet_dropped_handlers: this.onSnippetDropped.bind(this),
        builder_options: [
            withSequence(before(SNIPPET_SPECIFIC_END), {
                selector: ".tp-dynamic-snippet-prime, .s_dynamic_inner_content",
                template: "theme_prime.DynamicSnippetOption",
            }),
        ],
        dropzone_selector: {
            selector: ".s_dynamic_inner_content",
            dropNear: "p, h1, h2, h3, blockquote, .s_dynamic_inner_content, section",
            exclude: ".tp-dynamic-snippet-prime",
        },
        so_content_addition_selector: [".s_d_product_inner_content_wrapper"],
        builder_actions: { TpSnippetBuilderAction },
    }
    normalize(element) {
        for (const snippetEl of element.querySelectorAll(".s_no_category_sync")) {
            if (snippetEl.querySelector(".tp-config-link")) {
                snippetEl.querySelector(".tp-config-link").addEventListener("click", this._openDialog.bind(this, snippetEl));
            }
        }
    }
    onSnippetDropped({ snippetEl }) {
        if (snippetEl.matches(".tp-dynamic-snippet-prime") || snippetEl.matches(".s_dynamic_inner_content")) {
            this._openDialog(snippetEl);
            return;
        }
        const internalNodes = snippetEl.querySelectorAll(".tp-dynamic-snippet-prime");
        if (internalNodes.length) {
            internalNodes.forEach(node => this._openDialog(node));
        }
    }
    destroy() {
        super.destroy();
        for (const snippetEl of this.editable.querySelectorAll(".s_no_category_sync")) {
            if (snippetEl.querySelector(".tp-config-link")) {
                snippetEl.querySelector(".tp-config-link").removeEventListener("click", this._openDialog);
            }
        }
    }
    getRegistryToUse(snippetEl) {
        let registryFromDataset = snippetEl.dataset.tpSnippetRegistry;
        if (!registryFromDataset) {
            registryFromDataset = snippetEl.parentElement.classList.contains('o_mega_menu') ? 'theme_prime_mega_menus' : 'theme_prime_snippet_registry';
        }
        return registryFromDataset;
    }
    _openDialog(snippetEl) {
        this.dependencies.dialog.addDialog(TpSnippetConfigDialog, {
            ...this._getConfiguratorParams(snippetEl),
            save: (data) => {this.applySnippetChanges(snippetEl, {}, data)},
            onDiscard: () => { this._onDiscardChanges(snippetEl) },
        });
    }
    openSnippetConfigurator(editingElement) {
        return new Promise((resolve) => {
            const onClose = this.dependencies.dialog.addDialog(TpSnippetConfigDialog, {
                ...this._getConfiguratorParams(editingElement),
                save: (data) => {
                    resolve(data);
                },
                onDiscard: () => { this._onDiscardChanges(editingElement); },
            });
            onClose.then(resolve);
        });
    }
    _getConfiguratorParams(snippetEl) {
        this.usedAttrs = [];
        let registryToUse = this.getRegistryToUse(snippetEl);
        let snippet = this._getCurrentSnippetId(snippetEl);
        let snippetConfig = registry.category(registryToUse).get(snippet);
        let defaultValue = snippetConfig.defaultValue || {};
        let params = { registryToUse: registryToUse, videoURL: defaultValue.videoURL, components: {}, snippetID: defaultValue.noSnippet ? false : snippet, $target: snippetEl.innerHTML };
        for (let component in snippetConfig.widgets) {
            // In function updateExtraOptsValue we are updating the object
            // But somehow it updating the object reference of the registry itself and all next snippets
            // are having last set dates.
            const value = Object.assign({}, snippetConfig.widgets[component]);
            switch (component) {
                case 'TpRecordSelector':
                    params['components']['TpRecordSelector'] = Object.assign({}, value, defaultValue, { componentData: this._getValueFromAttr(snippetEl, 'data-selection-info') });
                    this.usedAttrs.push('data-selection-info');
                    break;
                case 'TpUiComponent':
                    params['components']['TpUiComponent'] = { ...value, ...defaultValue, componentData: { ...this._getValueFromAttr(snippetEl, 'data-ui-config-info') }, $target: snippetEl };
                    this.usedAttrs.push('data-ui-config-info');
                    break;
                case 'TpExtraOpts':
                    params['components']['TpExtraOpts'] = { ...defaultValue, componentData: this._getValueFromAttr(snippetEl, 'data-extra-info') || value, $target: snippetEl };
                    this.usedAttrs.push('data-extra-info');
                    break;
            }
        }
        return params;
    }
    _getCurrentSnippetId(snippetEl) {
        let snippetID = snippetEl.dataset.tpSnippetId;
        return snippetID === 's_tp_categories_menu' ? 's_mega_menu_category_tabs_snippet' : snippetID;
    }
    _getValueFromAttr(snippetEl, attr) {
        let attrValue = snippetEl.getAttribute(attr);
        return attrValue ? JSON.parse(attrValue) : false;
    }
    applySnippetChanges(snippetEl, notNeeded, data) {
        if (!data || Object.keys(data).length === 0) {
            return;
        }
        let allComponents = data;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.$target;
        let currentSnippetID = this._getCurrentSnippetId(snippetEl);
        let isSameSnippet = data.templateID === currentSnippetID;
        let registryToUse = this.getRegistryToUse(snippetEl);
        if (data.$target && !isSameSnippet && data.templateID === 's_mega_menu_category_tabs_snippet' && registryToUse === 'theme_prime_snippet_registry') {
            data.$target = data.switchableRelatedViews[0].html;
        }
        if (data.$target && !isSameSnippet) {
            Object.values(snippetEl.attributes).forEach(({ name }) => snippetEl.removeAttribute(name));
            let vDom = new DOMParser().parseFromString(data.$target, 'text/html').documentElement;
            let block = vDom.querySelector("body section");
            Object.values(block.attributes).forEach(({ name }) => { snippetEl.setAttribute(name, block.getAttribute(name)); });
            snippetEl.innerHTML = '';
            let child = vDom.querySelector("body section > *");
            snippetEl.appendChild(child);
        }
        for (let component in allComponents) {
            let value = allComponents[component];
            switch (component) {
                case 'TpRecordSelector':
                    snippetEl.dataset.selectionInfo = JSON.stringify(value);
                    break;
                case 'TpUiComponent':
                    value = this._tpModifyValuesBeforeSave(value);
                    snippetEl.dataset.uiConfigInfo = JSON.stringify(value);
                    break;
                case 'TpExtraOpts':
                    snippetEl.dataset.extraInfo = JSON.stringify(value);
                    break;
            }
        }
        this.dispatchTo("content_manually_updated_handlers", snippetEl);
        this.dependencies.history.addStep();
    }
    _tpModifyValuesBeforeSave (value) {
        if (Object.keys(value).includes('categoryTabsConfig') && value.categoryTabsConfig.activeRecordID && value.categoryTabsConfig.records.length) {
            value.categoryTabsConfig.activeRecordID = value.categoryTabsConfig.records[0].id;
        }
        return value;
    }
    _onDiscardChanges(snippetEl) {
        var hasAttr = false;
        if (snippetEl.classList.contains('tp-mega-menu-snippet')) {
            return;
        }
        this.usedAttrs.forEach((attr) => {
            if (snippetEl.hasAttribute(attr)) {
                hasAttr = true;
            }
        });
        // Don't remove mega menu snippet
        if (!hasAttr) {
            // remove snippet on Discard
            snippetEl.remove();
        }
    }
}
export class TpSnippetBuilderAction extends BuilderAction {
    static id = "TpSnippetBuilderAction";
    static dependencies = ["TpDynamicSnippetOptionPlugin"];
    setup() {
        this.preview = false;
    }
    async load({ editingElement, value }) {
        return this.dependencies.TpDynamicSnippetOptionPlugin.openSnippetConfigurator(editingElement);
    }
    apply({ editingElement, params, loadResult }) {
        this.dependencies.TpDynamicSnippetOptionPlugin.applySnippetChanges(editingElement, params, loadResult);
    }
}

registry.category("website-plugins").add(TpDynamicSnippetOptionPlugin.id, TpDynamicSnippetOptionPlugin);

export class tpHotWrapperOptions extends BaseOptionComponent {
    static template = "theme_prime.ImageHotWrapperOption";
    setup() {
        super.setup();
        this.state = useDomState((editingElement) => ({
            canSetHotSpot: this.canSetHotSpot(editingElement),
            isHotSpotEnabled: editingElement.classList.contains('tp-image-hotspot-enabled'),
        }));
    }
    canSetHotSpot(editingElement) {
        return (
            this.isImageSupportedForStyle(editingElement) &&
            !this.searchSupportedParentLinkEl(editingElement).matches("a[data-oe-xpath]") &&
            !editingElement.classList.contains("media_iframe_video")
        );
    }
    // base
    isImageSupportedForStyle(img) {
        if (!img.parentElement) {
            return false;
        }
        const isTFieldImg = "oeType" in img.parentElement.dataset;
        const isEditableRootElement = "oeXpath" in img.dataset;
        return !isTFieldImg && !isEditableRootElement;
    }
    // base
    searchSupportedParentLinkEl(editingElement) {
        const parentEl = editingElement.parentElement;
        return parentEl.matches("figure") ? parentEl.parentElement : parentEl;
    }
}

export class tpHotSpotOptions extends BaseOptionComponent {
    static template = "theme_prime.ImageHotspotOption";
    static props = { services: Object };
    static components = {
        BorderConfigurator,
        BuilderColorPicker,
    };
    setup() {
        super.setup();
        this.state = useDomState((editingElement) => ({
            hotSpotType: editingElement.dataset.hotspotType || 'static',
            isIcon: editingElement.querySelector('.tp-hotspot-media')?.tagName === 'SPAN',
            hasText: !!editingElement.dataset.hotspotText,
            onClickAction: editingElement.dataset.onClickAction || '',
        }));
    }
    get productDomain() {
        return getWebsiteCompatibleDomain(this.props.services, [['website_published', '=', true], ['sale_ok', '=', true]]);
    }
}
export class TpImageHotSpotPlugin extends Plugin {
    static id = "TpImageHotSpotPlugin";
    static dependencies = ["builderActions"]
    resources = {
        builder_options: [{
            OptionComponent: tpHotSpotOptions,
            selector: ".tp_img_hotspot",
            name: "tpHotSpotOptions",
            title: "Hotspot",
            props: { services: this.services }
        }],
        builder_actions: { tpHotSpotPositionAction, tpHotspotInputAction, tpHotspotTextAction, tpPreviewHotspotPopover, tpRemoveHotSpotIcon },
    }
}
export class tpHotspotInputAction extends BuilderAction {
    static id = "tpHotspotInputAction";
    getValue({ editingElement, params: { mainParam: actionType } = {} }) {
        return editingElement.dataset[actionType];
    }
    async apply({ editingElement, params: { mainParam: actionType }, value }) {
        editingElement.dataset[actionType] = value;
    }
}
export class tpHotSpotPositionAction extends BuilderAction {
    static id = "tpHotSpotPositionAction";
    getValue({ editingElement, params: { mainParam: positionParam } = {} }) {
        return editingElement.style[positionParam] || '50%';
    }
    async apply({ editingElement, params: { mainParam: positionParam }, value }) {
        editingElement.style.setProperty(positionParam, value, 'important');
    }
}
registry.category("website-plugins").add(TpImageHotSpotPlugin.id, TpImageHotSpotPlugin);

export class TpImageWrapperPlugin extends Plugin {
    static id = "TpImageWrapperPlugin";
    static dependencies = ["builderActions"];
    static shared = ["_isHotSpotEnabled", "_getHotSpotWrapper", "_setNodeAttributeValue", "_getRelatedMediaEl"];
    resources = {
        builder_options: [
            withSequence(ALIGNMENT_STYLE_PADDING, {
                OptionComponent: tpHotWrapperOptions,
                selector: "img:not(.tp-hotspot-media)",
                exclude: REPLACE_MEDIA_EXCLUDE + ', .o_grid_mode img, .o_not_editable img',
                name: "primeHotWrapperOption",
            })
        ],
        on_replaced_media_handlers: ({ newMediaEl }) => {
            if (this._isHotSpotEnabled(newMediaEl)) {
                this.dependencies.builderActions.getAction('tpHotspotTogglerOption')._unwrapHotSpotWrapper(newMediaEl);
            }
        },
        builder_actions: { tpHotspotTogglerOption, tpAddHotSpot, tpMediaReplaceAction },
    }
    _isHotSpotEnabled(editingElement) {
        return editingElement.classList.contains('tp-image-hotspot-enabled');
    }
    _getHotSpotWrapper(editingElement) {
        return editingElement.closest('.tp-img-hotspot-wrapper');
    }
    _getRelatedMediaEl(mediaParams) {
        let hotSpotNode;
        if (mediaParams.type === 'image') {
            hotSpotNode = document.createElement('img');
            hotSpotNode.className = 'img img-fluid tp-hotspot-media';
            hotSpotNode.src = mediaParams.url;
        } else if (mediaParams.type === 'icon') {
            hotSpotNode = document.createElement('span');
            hotSpotNode.className = mediaParams.class + ' tp-hotspot-media';
        }
        return hotSpotNode;
    }
    _setNodeAttributeValue(el, values) {
        Object.keys(values).forEach(key => {
            el.dataset[key] = values[key];
        });
    }
}

export class tpRemoveHotSpotIcon extends BuilderAction {
    static id = "tpRemoveHotSpotIcon";
    static dependencies = ['TpImageWrapperPlugin', 'builderOptions'];
    async apply({ editingElement }) {
        let hotspotMedia = editingElement.querySelector('.tp-hotspot-media');
        if (hotspotMedia) {
            hotspotMedia.remove();
        }
    }
}
export class tpHotspotTextAction extends BuilderAction {
    static id = "tpHotspotTextAction";
    _adjustEditingElement(editingElement, hasText) {
        editingElement.classList.toggle('tp-no-padding', hasText);
        editingElement.querySelector('.tp-hotspot-media')?.classList.toggle('ms-2', hasText);
    }
    getValue({ editingElement }) {
        let hotspotText = editingElement.dataset['hotspotText'];
        this._adjustEditingElement(editingElement, !!hotspotText);
        return hotspotText || '';
    }
    async apply({ editingElement, params: { mainParam: positionParam }, value }) {
        editingElement.dataset['hotspotText'] = value;
        this._adjustEditingElement(editingElement, !!value);
        editingElement.querySelector('.tp-hotspot-text').textContent = value;
    }
}
export class tpPreviewHotspotPopover extends BuilderAction {
    static id = "tpPreviewHotspotPopover";
    async apply({ editingElement }) {
        editingElement.dispatchEvent(new CustomEvent('force-toggle-popover', { bubbles: true }));
    }
}

export class tpMediaReplaceAction extends BuilderAction {
    static id = "tpMediaReplaceAction";
    static dependencies = ['TpImageWrapperPlugin', 'builderOptions', 'media'];
    async load({ editingElement, params: { mainParam: action }}) {
        let selectedMediaInfo;
        await new Promise((resolve) => {
            const onClose = this.dependencies.media.openMediaDialog({
                visibleTabs: action === 'hotSpotNode' ? ["IMAGES", "ICONS"] : ["IMAGES"],
                save: (media) => {
                    if (media.tagName === 'IMG') {
                        selectedMediaInfo = { type: 'image', url: media.src };
                    } else if (media.tagName === 'SPAN') {
                        selectedMediaInfo = { type: 'icon', class: media.className };
                    }
                    resolve();
                },
            });
            onClose.then(resolve);
        });
        return selectedMediaInfo;
    }
    apply({ editingElement, params: {mainParam: action}, loadResult: customClass }) {
        if (!customClass) {
            return;
        }
        if (action === 'hotSpotNode') {
            let hotspotEl = this.dependencies.TpImageWrapperPlugin._getRelatedMediaEl(customClass);
            editingElement.querySelector('.tp-hotspot-media')?.remove();
            editingElement.insertBefore(hotspotEl, editingElement.querySelector('.tp-hotspot-text'));
        }
        if (action === 'popoverNode') {
            editingElement.dataset.imageSrc = customClass.url;
        }
    }
}

export class tpAddHotSpot extends BuilderAction {
    static id = "tpAddHotSpot";
    static dependencies = ['TpImageWrapperPlugin', 'builderOptions'];
    apply({ editingElement }) {
        this.addHotSpot(editingElement, {
            type: 'image',
            url: '/theme_prime/static/src/img/hotspot/cart_hotspot.svg',
        });
    }
    addHotSpot(editingElement, mediaParams={}) {
        mediaParams.type = mediaParams.type || 'image';
        mediaParams.url = mediaParams.url || '/theme_prime/static/src/img/hotspot/cart_hotspot.svg';
        const hotspotID = uniqueId('tphotspot');
        let data = { hotspotID: hotspotID, ...mediaParams };
        let wrapper = this.dependencies.TpImageWrapperPlugin._getHotSpotWrapper(editingElement).querySelector('.tp-hotspot-container');
        const selector = `#${hotspotID}`;
        let hotSpotNode = this.dependencies.TpImageWrapperPlugin._getRelatedMediaEl(mediaParams);
        let hotspot = renderToElement('theme_prime.ImageHotSpotNode', data);
        hotspot.querySelector('.tp-hotspot-text').parentElement.insertBefore(hotSpotNode, hotspot.querySelector('.tp-hotspot-text'));
        wrapper.appendChild(hotspot);
        let snippet = wrapper.querySelector(selector);
        let values = { hotspotType: 'static', name: 'Image Hotspot', titleText: "Your title", subtitleText: "Theme prime is best theme", buttonLink: '/', buttonText: 'SHOP NOW', imageSrc: '/theme_prime/static/src/img/s_config_data.png' };
        this.dependencies.TpImageWrapperPlugin._setNodeAttributeValue(snippet, values);
        this.dependencies.builderOptions.setNextTarget(snippet);
    }
}
export class tpHotspotTogglerOption extends BuilderAction {
    static id = "tpHotspotTogglerOption";
    static dependencies = ['TpImageWrapperPlugin'];
    isApplied({ editingElement }) {
        return this.dependencies.TpImageWrapperPlugin._isHotSpotEnabled(editingElement);
    }
    _createHotSpotWrapper(editingElement) {
        const wrapper = document.createElement('div');
        wrapper.className = 'd-flex tp-img-hotspot-wrapper';
        const container = document.createElement('div');
        container.className = 'position-relative tp-hotspot-container d-inline-block';
        // center image must remain in center
        if (editingElement.classList.contains('mx-auto')) {
            container.classList.add('mx-auto');
        }
        editingElement.parentNode.insertBefore(wrapper, editingElement);
        wrapper.appendChild(container);
        editingElement.classList.add('tp-image-hotspot-enabled');
        container.appendChild(editingElement);
    }
    _unwrapHotSpotWrapper(editingElement) {
        editingElement.classList.remove('tp-image-hotspot-enabled');
        const wrapper = editingElement.closest('.tp-img-hotspot-wrapper');
        wrapper.parentElement.insertBefore(editingElement, wrapper);
        wrapper.remove();
    }
    updateWrapper(editingElement) {
        if (this.dependencies.TpImageWrapperPlugin._isHotSpotEnabled(editingElement)) {
            this._unwrapHotSpotWrapper(editingElement);
        } else {
            this._createHotSpotWrapper(editingElement);
        }
    }
    apply({ editingElement }) {
        this.updateWrapper(editingElement);
    }
    clean({ editingElement }) {
        this.updateWrapper(editingElement);
    }
}
registry.category("website-plugins").add(TpImageWrapperPlugin.id, TpImageWrapperPlugin);