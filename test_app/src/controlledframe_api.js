import { $, Log, textareaExpand, textareaOninputHandler, toggleHide } from './common.js';

const DEFAULT_ATTRIBUTES = {
  id: 'view',
  partition: 'persist:myapp',
  allowtransparency: false,
  autosize: true,
  name: 'controlled-frame-view',
  src: 'https://google.com',
};

function isValidUrl(str) {
  let url;
  try {
    url = new URL(str);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}

class ControlledFrameController {
  constructor() {
    this.#urlParams = new URLSearchParams(window.location.search);
    this.controlledFrame = $('#view');
    this.CreateControlledFrameTag();
  }

  // Creates a <controlledframe> tag and appends it to its container div. If a
  // <controlledframe> element already exists, it is destroyed and re-created.
  CreateControlledFrameTag() {
    // Re-create the <controlledframe> tag if it already exists.
    if (this.controlledFrame) {
      this.controlledFrame.remove();
      Log.info('Current <controlledframe> tag destroyed.');
    }
    if (typeof ControlledFrame === undefined) {
      Log.err('The Controlled Frame API is not available.');
    }
    this.controlledFrame = document.createElement('ControlledFrame');
    $('#controlledframe_container').appendChild(this.controlledFrame);
    this.#initControlledFrameAttributes();
    this.#initControlledFrameAPIControls();
  }

  SetAttribute(name, value) {
    this.controlledFrame[name] = value;
  }

  NavigateControlledFrame(url) {
    if (!isValidUrl(url)) {
      Log.err(`Invalid URL for src: ${url}`);
      return;
    }
    this.controlledFrame.src = url;
  }

  // Fetches the current state of the Controlled Frame API and displays the
  // values in their respective input fields.
  RefreshState() {
    this.#canGoBack();
    this.#canGoForward();
    this.#getUserAgent();
    this.#getAudioState();
    this.#getZoom();
    this.#isAudioMuted();

    // Set current time for ClearDataOptions
    let now = new Date();
    $('#clear_data_options_since_in').value = now.getTime();

    this.#refreshAddedContentScripts();
  }

  // Sets the attribute value if it was specified in the URL parameters or in
  // the attribute's input element. If it was not specified, sets the provided
  // default value.
  #getAttributeValue(name, inputEl, defaultValue) {
    let param = this.#urlParams.get(name);
    if (param && param.length !== 0) {
      inputEl.value = param;
      return;
    }
    if (inputEl.value.length !== 0) {
      return;
    }
    inputEl.value = defaultValue;
  }

  // Initializes the <controlledframe> tag attributes with default values.
  #initControlledFrameAttributes() {
    this.#getAttributeValue(
      'partition',
      $('#partition_in'),
      DEFAULT_ATTRIBUTES.partition
    );
    this.#getAttributeValue(
      'allowtransparency',
      $('#allowtransparency_chk'),
      DEFAULT_ATTRIBUTES.allowtransparency
    );
    this.#getAttributeValue(
      'autosize',
      $('#autosize_chk'),
      DEFAULT_ATTRIBUTES.autosize
    );
    this.#getAttributeValue('name', $('#name_in'), DEFAULT_ATTRIBUTES.name);
    this.#getAttributeValue('src', $('#src_in'), DEFAULT_ATTRIBUTES.src);

    this.#setPartition();
    this.#setAllowtransparency();
    this.#setAutosize();
    this.#setName();
    this.#setSrc();
  }

  // Initializes the various inputs and buttons that will be used to test the
  // Controlled Frame API.
  #initControlledFrameAPIControls() {
    this.#addControlledFrameAttributeHandlers();
    this.#addControlledFramePropertyHandlers();
    this.#addControlledFrameMethodHandlers();
    this.#addEventListeners();
    this.RefreshState();

    // Allow text areas to expand to fit text.
    let textareas = document.getElementsByTagName('textarea');
    for (let textarea of textareas) {
      textareaExpand(textarea);
      textarea.addEventListener('input', textareaOninputHandler);
    }
  }

  // Adds handler functions for changing the <controlledframe> tag attributes.
  #addControlledFrameAttributeHandlers() {
    $('#src_btn').addEventListener('click', this.#setSrc.bind(this));
    $('#partition_btn').addEventListener(
      'click',
      this.#setPartition.bind(this)
    );
    $('#allowtransparency_btn').addEventListener(
      'click',
      this.#setAllowtransparency.bind(this)
    );
    $('#autosize_btn').addEventListener('click', this.#setAutosize.bind(this));
    $('#name_btn').addEventListener('click', this.#setName.bind(this));
  }

  // Adds handler functions for interacting with various Controlled Frame API
  // properties.
  #addControlledFramePropertyHandlers() {
    // ContentWindow
    $('#content_window_post_message_btn').addEventListener(
      'click',
      this.#contentWindowPostMessage.bind(this)
    );

    // ContextMenus
    $('#context_menus_create_btn').addEventListener(
      'click',
      this.#contextMenusCreate.bind(this)
    );
    $('#context_menus_remove_btn').addEventListener(
      'click',
      this.#contextMenusRemove.bind(this)
    );
    $('#context_menus_remove_all_btn').addEventListener(
      'click',
      this.#contextMenusRemoveAll.bind(this)
    );
    $('#context_menus_update_btn').addEventListener(
      'click',
      this.#contextMenusUpdate.bind(this)
    );
  }

  // Adds handler functions for calling the various Controlled Frame API
  // methods.
  #addControlledFrameMethodHandlers() {
    $('#add_content_scripts_btn').addEventListener(
      'click',
      this.#addContentScripts.bind(this)
    );
    $('#back_btn').addEventListener('click', this.#back.bind(this));
    $('#capture_visible_region_btn').addEventListener(
      'click',
      this.#captureVisibleRegion.bind(this)
    );
    $('#clear_data_btn').addEventListener('click', this.#clearData.bind(this));
    $('#execute_script_btn').addEventListener(
      'click',
      this.#executeScript.bind(this)
    );
    $('#forward_btn').addEventListener('click', this.#forward.bind(this));
    $('#get_audio_state_btn').addEventListener(
      'click',
      this.#getAudioState.bind(this)
    );
    $('#get_zoom_btn').addEventListener('click', this.#getZoom.bind(this));
    $('#go_btn').addEventListener('click', this.#go.bind(this));
    $('#insertcss_btn').addEventListener('click', this.#insertCSS.bind(this));
    $('#is_audio_muted_btn').addEventListener(
      'click',
      this.#isAudioMuted.bind(this)
    );
    $('#print_btn').addEventListener('click', this.#print.bind(this));
    $('#reload_btn').addEventListener('click', this.#reload.bind(this));
    $('#remove_content_scripts_btn').addEventListener(
      'click',
      this.#removeContentScripts.bind(this)
    );
    $('#set_audio_muted_btn').addEventListener(
      'click',
      this.#setAudioMuted.bind(this)
    );
    $('#set_zoom_btn').addEventListener('click', this.#setZoom.bind(this));
    $('#set_zoom_mode_btn').addEventListener(
      'click',
      this.#setZoomMode.bind(this)
    );
    $('#stop_btn').addEventListener('click', this.#stop.bind(this));
    $('#user_agent_btn').addEventListener(
      'click',
      this.#setUserAgent.bind(this)
    );
  }

  // Add event listeners for context menu events.
  #addContextMenusEventListeners() {
    if (typeof this.controlledFrame.contextMenus !== 'object') {
      Log.warn('contextMenus: Property undefined');
      return;
    }

    this.controlledFrame.contextMenus.addEventListener(
      'show', this.#contextMenusOnShow.bind(this));
    this.controlledFrame.contextMenus.addEventListener(
      'click', this.#contextMenusOnClicked.bind(this));
  }

  // Add event listeners for the web request related Controlled Frame API.
  #addWebRequestHandlers() {
    if (typeof this.controlledFrame.request !== 'object') {
      Log.warn('request: Property undefined');
      return;
    }

    $('#request_on_auth_required_btn').addEventListener(
      'click',
      this.#addOnAuthRequired.bind(this)
    );
    $('#request_on_before_redirect_btn').addEventListener(
      'click',
      this.#addOnBeforeRedirect.bind(this)
    );
    $('#request_on_before_request_btn').addEventListener(
      'click',
      this.#addOnBeforeRequest.bind(this)
    );
    $('#request_on_before_send_headers_btn').addEventListener(
      'click',
      this.#addOnBeforeSendHeaders.bind(this)
    );
    $('#request_on_completed_btn').addEventListener(
      'click',
      this.#addOnCompleted.bind(this)
    );
    $('#request_on_error_occurred_btn').addEventListener(
      'click',
      this.#addOnErrorOccurred.bind(this)
    );
    $('#request_on_headers_received_btn').addEventListener(
      'click',
      this.#addOnHeadersReceived.bind(this)
    );
    $('#request_on_response_started_btn').addEventListener(
      'click',
      this.#addOnResponseStarted.bind(this)
    );
    $('#request_on_send_headers_btn').addEventListener(
      'click',
      this.#addOnSendHeaders.bind(this)
    );
  }

  // Add the general <controlledframe> event handlers.
  #addEventListeners() {
    this.controlledFrame.addEventListener('close', this.#onclose.bind(this));
    this.controlledFrame.addEventListener(
      'consolemessage',
      this.#onconsolemessage.bind(this)
    );
    this.controlledFrame.addEventListener(
      'contentload',
      this.#oncontentload.bind(this)
    );
    this.controlledFrame.addEventListener('dialog', this.#ondialog.bind(this));
    this.controlledFrame.addEventListener('exit', this.#onexit.bind(this));
    this.controlledFrame.addEventListener(
      'loadabort',
      this.#onloadabort.bind(this)
    );
    this.controlledFrame.addEventListener(
      'loadcommit',
      this.#onloadcommit.bind(this)
    );
    this.controlledFrame.addEventListener(
      'loadredirect',
      this.#onloadredirect.bind(this)
    );
    this.controlledFrame.addEventListener(
      'loadstart',
      this.#onloadstart.bind(this)
    );
    this.controlledFrame.addEventListener(
      'loadstop',
      this.#onloadstop.bind(this)
    );
    this.controlledFrame.addEventListener(
      'newwindow',
      this.#onnewwindow.bind(this)
    );
    this.controlledFrame.addEventListener(
      'permissionrequest',
      this.#onpermissionrequest.bind(this)
    );
    this.controlledFrame.addEventListener(
      'responsive',
      this.#onresponsive.bind(this)
    );
    this.controlledFrame.addEventListener(
      'sizechanged',
      this.#onsizechanged.bind(this)
    );
    this.controlledFrame.addEventListener(
      'unresponsive',
      this.#onunresponsive.bind(this)
    );
    this.controlledFrame.addEventListener(
      'zoomchange',
      this.#onzoomchange.bind(this)
    );

    this.#addContextMenusEventListeners();
    this.#addWebRequestHandlers();
  }

  // Attribute handlers
  #setSrc(e) {
    let url = $('#src_in').value;
    this.NavigateControlledFrame(url);
  }

  #setPartition(e) {
    this.controlledFrame.partition = $('#partition_in').value;
  }

  #setAllowtransparency(e) {
    this.controlledFrame.allowtransparency = $('#allowtransparency_chk').checked
      ? 'on'
      : '';
  }

  #setAutosize(e) {
    this.controlledFrame.autosize = $('#autosize_chk').checked ? 'on' : '';
  }

  #setName(e) {
    this.controlledFrame.name = $('#name_in').value;
  }

  // Property handlers
  #contentWindowPostMessage(e) {
    if (typeof this.controlledFrame.contentWindow !== 'object') {
      Log.warn('contentWindow: property undefined');
      return;
    }

    let message = $('#content_window_post_message_message_in').value;
    let targetOrigin = $('#content_window_post_message_target_origin_in').value;
    if (!isValidUrl(targetOrigin)) {
      Log.err(`${targetOrigin} is not a valid URL`);
      return;
    }
    this.controlledFrame.contentWindow.postMessage(message, targetOrigin);
    Log.info(
      `contentWindow.postMessage(${message}, ${targetOrigin}) completed`
    );
  }

  // Method handlers
  // Content script related functions
  #readContentScriptDetails() {
    let contentScriptDetails = {
      allFrames: $('#content_script_details_allFrames_chk').checked,
      matchAboutBlank: $('#content_script_details_matchAboutBlank_chk')
        .checked,
      css: {},
      js: {},
    };
    // Set the string values that are split by commas.
    for (const keyName of ['excludeURLPatterns', 'urlPatterns']) {
      const keyValue = $(`#content_script_details_${keyName}_in`).value;
      this.#setIfValid(contentScriptDetails, keyName, keyValue, ',');
    }
    // Set the normal string values.
    for (const keyName of ['name', 'runAt']) {
      const keyValue = $(`#content_script_details_${keyName}_in`).value;
      this.#setIfValid(contentScriptDetails, keyName, keyValue);
    }
    // Set the `css` and `js` properties.
    for (const keyName of ['code', 'files']) {
      const cssKeyValue =
        $(`#content_script_details_css_injection_items_${keyName}_in`).value;
      this.#setIfValid(contentScriptDetails.css, keyName, cssKeyValue,
        keyName === 'files' ? ',' : null);
      const jsKeyValue =
        $(`#content_script_details_js_injection_items_${keyName}_in`).value;
      this.#setIfValid(contentScriptDetails.js, keyName, jsKeyValue,
        keyName === 'files' ? ',' : null);
    }
    return contentScriptDetails;
  }

  #refreshAddedContentScripts() {
    let scriptNameList = '';
    for (const contentScript of this.#addedContentScripts)
      scriptNameList += contentScript.name + '\n';
    $('#add_content_scripts_result').innerText = scriptNameList;
  }

  #addContentScripts(e) {
    if (typeof this.controlledFrame.addContentScripts !== 'function') {
      Log.warn('addContentScripts: API undefined');
      return;
    }
    let contentScriptDetails = this.#readContentScriptDetails();
    this.controlledFrame.addContentScripts([contentScriptDetails]);
    this.#addedContentScripts.push(contentScriptDetails);
    Log.info('addContentScripts completed');
  }

  // Navigation related functions
  async #back(e) {
    if (typeof this.controlledFrame.back !== 'function') {
      Log.warn('back: API undefined');
      return;
    }
    const success = await this.controlledFrame.back();
    Log.info(`back = ${success ? 'successful' : 'unsuccessful'}`);
  }

  async #canGoBack(e) {
    if (typeof this.controlledFrame.canGoBack !== 'function') {
      Log.warn('canGoBack: API undefined');
      return;
    }
    let canGoBack = await this.controlledFrame.canGoBack();
    $('#can_go_back_chk').checked = canGoBack;
    Log.info(`canGoBack = ${canGoBack}`);
  }

  async #forward(e) {
    if (typeof this.controlledFrame.forward !== 'function') {
      Log.warn('forward: API undefined');
      return;
    }
    const success = await this.controlledFrame.forward();
    Log.info(`forward = ${success ? 'successful' : 'unsuccessful'}`);
  }

  async #canGoForward(e) {
    if (typeof this.controlledFrame.canGoForward !== 'function') {
      Log.warn('canGoForward: API undefined');
      return;
    }
    let canGoForward = await this.controlledFrame.canGoForward();
    $('#can_go_forward_chk').checked = canGoForward;
    Log.info(`canGoForward = ${canGoForward}`);
  }

  async #go(e) {
    if (typeof this.controlledFrame.go !== 'function') {
      Log.warn('go: API undefined');
      return;
    }
    let num = parseInt($('#go_in').value);
    const success = await this.controlledFrame.go(num);
    Log.info(`go = ${success}`);
  }

  // Other API functions
  #readImageDetails() {
    return {
      format: $('#image_details_fmt_in').value,
      quality: parseFloat($('#image_details_quality_in').value),
    };
  }

  async #captureVisibleRegion(e) {
    if (typeof this.controlledFrame.captureVisibleRegion !== 'function') {
      Log.warn('captureVisibleRegion: API undefined');
      return;
    }

    let imageDetails = this.#readImageDetails();

    const dataUrl = await this.controlledFrame.captureVisibleRegion(imageDetails);

    Log.info(`captureVisibleRegion completed`);
    let resultEl = $('#capture_visible_region_result');
    resultEl.src = dataUrl;
    resultEl.classList.remove('hide');
    $('#capture_visible_region_result_btn').onclick = e => {
      toggleHide(resultEl);
    };
  }

  async #clearData(e) {
    if (typeof this.controlledFrame.clearData !== 'function') {
      Log.warn('clearData: API undefined');
      return;
    }

    let options = { since: parseInt($('#clear_data_options_since_in').value) };
    let types = {};
    let typesForLogging = new Array();
    for (let option of $('#clear_data_type_set_in').options) {
      types[option.value] = option.selected;
      if (option.selected) typesForLogging.push(option.value);
    }

    await this.controlledFrame.clearData(options, types);
    Log.info(`clearData finished for ${typesForLogging.join(', ')}`);
  }

  #readInjectDetails() {
    if ($('#inject_details_code_in').value.length > 0) {
      return {
        code: $('#inject_details_code_in').value,
      }
    }
    return {
      file: $('#inject_details_file_in').value,
    };
  }

  #readInsertCSSInjectDetails() {
    if ($('#insertcss_inject_details_code_in').value.length > 0) {
      return {
        code: $('#insertcss_inject_details_code_in').value,
      }
    }
    return {
      file: $('#insertcss_inject_details_file_in').value,
    };
  }

  async #executeScript(e) {
    if (typeof this.controlledFrame.executeScript !== 'function') {
      Log.warn('executeScript: API undefined');
      return;
    }
    let details = this.#readInjectDetails();
    const result = await this.controlledFrame.executeScript(details);
    let resultStr = JSON.stringify(result);
    Log.info(`executeScript = ${resultStr}`);
    $('#execute_script_result').innerText = resultStr;
  }

  async #getAudioState(e) {
    if (typeof this.controlledFrame.getAudioState !== 'function') {
      Log.warn('getAudioState: API undefined');
      return;
    }
    const audible = await this.controlledFrame.getAudioState();
    Log.info(`getAudioState = ${audible}`);
    $('#get_audio_state_chk').checked = audible;
  }

  #getUserAgent(e) {
    if (typeof this.controlledFrame.getUserAgent !== 'function') {
      Log.warn('getUserAgent: API undefined');
      return;
    }
    let userAgent = this.controlledFrame.getUserAgent();
    $('#user_agent_in').value = userAgent;
    Log.info(`userAgent = ${userAgent}`);
  }

  async #getZoom(e) {
    if (typeof this.controlledFrame.getZoom !== 'function') {
      Log.warn('getZoom: API undefined');
      return;
    }
    const zoomFactor = await this.controlledFrame.getZoom();
    Log.info(`getZoom = ${zoomFactor}`);
    $('#get_zoom_result').innerText = zoomFactor;
  }

  async #insertCSS(e) {
    if (typeof this.controlledFrame.insertCSS !== 'function') {
      Log.warn('insertCSS: API undefined');
      return;
    }
    let details = this.#readInsertCSSInjectDetails();
    await this.controlledFrame.insertCSS(details);
    Log.info('insertCSS completed');
    $('#insertcss_result').innerText = 'Done';
  }

  async #isAudioMuted(e) {
    if (typeof this.controlledFrame.isAudioMuted !== 'function') {
      Log.warn('isAudioMuted: API undefined');
      return;
    }
    const muted = await this.controlledFrame.isAudioMuted();
    Log.info(`isAudioMuted = ${muted}`);
    $('#is_audio_muted_chk').checked = muted;
  }

  #print(e) {
    if (typeof this.controlledFrame.print !== 'function') {
      Log.warn('print: API undefined');
      return;
    }
    this.controlledFrame.print();
    Log.info('print completed');
  }

  #reload(e) {
    if (typeof this.controlledFrame.reload !== 'function') {
      Log.warn('reload: API undefined');
      return;
    }
    this.controlledFrame.reload();
    Log.info('reload completed');
  }

  #removeContentScripts(e) {
    if (typeof this.controlledFrame.removeContentScripts !== 'function') {
      Log.warn('removeContentScripts: API undefined');
      return;
    }
    let scriptNames = $('#remove_content_scripts_in').value;
    let scriptNameList = scriptNames.split(',');
    this.controlledFrame.removeContentScripts(scriptNameList);
    Log.info(`removeContentScripts([${scriptNames}])`);
    this.#addedContentScripts.forEach((script, i) => {
      let foundIndex = scriptNameList.findIndex(s => s === script.name);
      if (foundIndex === -1) {
        return;
      }
      this.#addedContentScripts.splice(foundIndex, 1);
    });
  }

  #setAudioMuted(e) {
    if (typeof this.controlledFrame.setAudioMuted !== 'function') {
      Log.warn('setAudioMuted: API undefined');
      return;
    }
    let muted = $('#set_audio_muted_chk').checked;
    this.controlledFrame.setAudioMuted(muted);
    Log.info(`setAudioMuted(${muted}) completed`);
    this.#isAudioMuted();
  }

  #setUserAgent(e) {
    if (typeof this.controlledFrame.setUserAgentOverride !== 'function') {
      Log.warn(`setUserAgentOverride: API undefined`);
      return;
    }

    let userAgentOverride = $('#user_agent_in').value;
    this.controlledFrame.setUserAgentOverride(userAgentOverride);
    Log.info(`userAgentOverride = ${userAgentOverride}`);
    this.RefreshState();
  }

  async #setZoom(e) {
    if (typeof this.controlledFrame.setZoom !== 'function') {
      Log.warn('setZoom: API undefined');
      return;
    }
    let zoomFactor = parseFloat($('#set_zoom_in').value);
    await this.controlledFrame.setZoom(zoomFactor);
    Log.info(`setZoom(${zoomFactor}) completed`);
    this.RefreshState();
  }

  async #setZoomMode(e) {
    if (typeof this.controlledFrame.setZoomMode !== 'function') {
      Log.warn('setZoomMode: API undefined');
      return;
    }
    let zoomMode = $('#set_zoom_mode_in').value;
    await this.controlledFrame.setZoomMode(zoomMode);
    Log.info(`setZoomMode(${zoomMode}) completed`);
    this.RefreshState();
  }

  #stop(e) {
    if (typeof this.controlledFrame.stop !== 'function') {
      Log.warn('stop: API undefined');
      return;
    }
    this.controlledFrame.stop();
    Log.info('stop completed');
  }

  /**
   * Event handlers
   */
  #onclose(e) {
    Log.evt('close fired');
    this.controlledFrame.src = 'https://google.com';
  }

  #onconsolemessage(e) {
    Log.evt('consolemessage fired');
    Log.info(
      `level = ${e.level}, message = ${e.message}, line = ${e.line}, sourceId = ${e.sourceId}`
    );
  }

  #oncontentload(e) {
    Log.evt('contentload fired');
  }

  #ondialog(e) {
    Log.evt('dialog fired');
    Log.info(`messageType = ${e.messageType}, messageText = ${e.messageText}`);
    e.dialog.ok();
  }

  #onexit(e) {
    Log.evt('exit fired');
    Log.info(`processID = ${e.processID}, reason = ${e.reason}`);
  }

  #onloadabort(e) {
    Log.evt('loadabort fired');
    Log.info(
      `url = ${e.url}, isTopLevel = ${e.isTopLevel}, code = ${e.code}, reason = ${e.reason}`
    );
  }

  #onloadcommit(e) {
    Log.evt('loadcommit fired');
    Log.info(`url = ${e.url}, isTopLevel = ${e.isTopLevel}`);
    this.RefreshState();
  }

  #onloadredirect(e) {
    Log.evt('loadredirect fired');
    Log.info(
      `oldUrl = ${e.oldUrl}, newUrl = ${e.newUrl}, isTopLevel = ${e.isTopLevel}`
    );
  }

  #onloadstart(e) {
    Log.evt('loadstart fired');
    Log.info(`url = ${e.url}, isTopLevel = ${e.isTopLevel}`);
  }

  #onloadstop(e) {
    Log.evt('loadstop fired');
  }

  #onnewwindow(e) {
    Log.evt('newwindow fired');
    Log.info(
      `targetUrl = ${e.targetUrl}, initialWidth = ${e.initialWidth}, initialHeight = ${e.initialHeight}, name = ${e.name}, windowOpenDisposition = ${e.windowOpenDisposition}`
    );
    e.window.discard();
  }

  #onpermissionrequest(e) {
    Log.evt('permissionrequest fired');
    Log.info(`permission = ${e.permission}`);
    e.request.allow();
  }

  #onresponsive(e) {
    Log.evt('responsive fired');
    Log.info(`processID = ${e.processID}`);
  }

  #onsizechanged(e) {
    Log.evt('sizechanged fired');
    Log.info(
      `oldWidth = ${e.oldWidth}, oldHeight = ${e.oldHeight}, newWidth = ${e.newWidth}, newHeight = ${e.newHeight}`
    );
  }

  #onunresponsive(e) {
    Log.evt('unresponsive fired');
    Log.info(`processID = ${e.processID}`);
  }

  #onzoomchange(e) {
    Log.evt('zoomchange fired');
    Log.info(
      `oldZoomFactor = ${e.oldZoomFactor}, newZoomFactor = ${e.newZoomFactor}`
    );
  }

  #contextMenusOnShow(e) {
    Log.evt('contextMenus.onShow fired');
    if ($('#context_menus_on_show_prevent_default_chk').checked)
      e.preventDefault();
  }

  #contextMenusOnClicked(e) {
    Log.evt('contextMenus.onClicked fired');
    Log.info(JSON.stringify(e));
  }

  #setIfValid(object, keyName, keyValue, splitDelimiter = null) {
    if (!keyValue || !keyValue.length > 0) {
      return;
    }
    if (splitDelimiter) {
      object[keyName] = keyValue.split(splitDelimiter);
      return;
    }
    object[keyName] = keyValue;
  }

  #readContextMenusCreateProperties() {
    let contexts = new Array();
    for (const option of $('#context_menus_create_properties_contexts_in')
      .options) {
      if (option.selected) contexts.push(option.value);
    }

    let createProperties = {
      checked: $('#context_menus_create_properties_checked_chk').checked,
      enabled: $('#context_menus_create_properties_enabled_chk').checked,
      onclick: info => {
        let infoJSON = JSON.stringify(info);
        Log.info(`context menu item clicked: ${infoJSON}`);
        $('#context_menus_on_click_result').innerText = infoJSON;
      },
    };

    for (const keyName of ['id', 'parentId', 'title', 'type']) {
      const keyValue =
        $(`#context_menus_create_properties_${keyName}_in`).value;
      this.#setIfValid(createProperties, keyName, keyValue);
    }

    let documentUrlPatternsValue = $(
      '#context_menus_create_properties_document_url_patterns_in'
    ).value;
    if (documentUrlPatternsValue.length !== 0) {
      let documentUrlPatterns = documentUrlPatternsValue.split(',');
      for (const pattern of documentUrlPatterns) {
        if (!isValidUrl(pattern)) {
          Log.err(`invalid URL for documentUrlPatterns: ${pattern}`);
          return;
        }
      }
      createProperties.documentURLPatterns = documentUrlPatterns;
    }

    let targetUrlPatternsValue = $(
      '#context_menus_create_properties_target_url_patterns_in'
    ).value;
    if (targetUrlPatternsValue.length !== 0) {
      let targetUrlPatterns = targetUrlPatternsValue.split(',');
      for (const pattern of targetUrlPatterns) {
        if (!isValidUrl(pattern)) {
          Log.err(`invalid URL for targetUrlPatterns: ${pattern}`);
          return;
        }
      }
      createProperties.targetURLPatterns = targetUrlPatterns;
    }

    return createProperties;
  }

  #contextMenusCreate(e) {
    if (
      typeof this.controlledFrame.contextMenus !== 'object' ||
      typeof this.controlledFrame.contextMenus.create !== 'function'
    ) {
      Log.warn('contextMenus.create: API undefined');
      return;
    }
    let createProperties = this.#readContextMenusCreateProperties();
    const p = this.controlledFrame.contextMenus.create(createProperties);
    Log.info(`contextMenus.create(${JSON.stringify(createProperties)})`);
    p.then(
      () => {
        Log.info(`contextMenus.create successful.`);$('#context_menus_create_result').innerText = `contextMenus.create success: id = ${createProperties.id}`;
      }
    ).catch(
      error => {
        Log.info(`contextMenus.create failed: ${error}`); $('#context_menus_create_result').innerText = `create() failed`;
      }
    );
  }

  #contextMenusRemove(e) {
    if (typeof this.controlledFrame.contextMenus.remove !== 'function') {
      Log.warn('contextMenus.remove: API undefined');
      return;
    }

    let menuItemId = $('#context_menus_remove_in').value;
    const p = this.controlledFrame.contextMenus.remove(menuItemId);
    Log.info(`contextMenus.remove(${menuItemId})`);
    p.then(
      () => {
        Log.info(`contextMenus.remove successful.`);
      }
    ).catch(
      error => {
        Log.info(`contextMenus.remove failed: ${error}`);
      }
    );
  }

  #contextMenusRemoveAll(e) {
    if (typeof this.controlledFrame.contextMenus.removeAll !== 'function') {
      Log.warn('contextMenus.removeAll: API undefined');
      return;
    }
    const p = this.controlledFrame.contextMenus.removeAll();
    Log.info(`contextMenus.removeAll()`);
    p.then(
      () => {
        Log.info(`contextMenus.removeAll successful.`);
      }
    ).catch(
      error => {
        Log.info(`contextMenus.removeAll failed: ${error}`);
      }
    );
  }

  #contextMenusUpdate(e) {
    if (typeof this.controlledFrame.contextMenus.update !== 'function') {
      Log.warn('contextMenus.update: API undefined');
      return;
    }
    let id = $('#context_menus_update_in').value;
    let updateProperties = this.#readContextMenusCreateProperties();

    const p = this.controlledFrame.contextMenus.update(id, updateProperties);
    Log.info(`contextMenus.update(${id}, ${JSON.stringify(updateProperties)})`);
    p.then(
      () => {
        Log.info(`contextMenus.update successful.`);
      }
    ).catch(
      error => {
        Log.info(`contextMenus.update failed: ${error}`);
      }
    );
  }

  #getInterceptor() {
    const options = {};
    const types = new Array();
    for (const option of $('#interceptor_types').options) {
      if (option.selected) types.push(option.value);
    }
    if (types.length !== 0) {
      options.resourceTypes = types;
    }
    const urls = $('#interceptor_urls').value;
    if (urls.length !== 0) {
      options.urlPatterns = urls.split(',');
    }
    options.blocking = !!$('#interceptor_blocking').checked;
    options.includeHeaders = $('#interceptor_headers').value;
    return this.controlledFrame.request.createWebRequestInterceptor(options);
  }

  #maybeCancelRequest(e) {
    if (!$('#interceptor_blocking').checked) {
      return;
    }
    if ($('#response_cancel').checked) {
      Log.info('Canceling request');
      e.preventDefault();
    }
  }

  #maybeRedirectRequest(e) {
    if (!$('#interceptor_blocking').checked) {
      return;
    }
    let redirectUrl = $('#response_redirect_url').value;
    if (redirectUrl !== 0 && isValidUrl(redirectUrl)) {
      Log.info(`Redirecting request to: ${redirectUrl}`);
      e.redirect(redirectUrl);
    }
  }

  #maybeSetAuthCredentials(e) {
    if (!$('#interceptor_blocking').checked) {
      return;
    }
    let password = $('#response_auth_credentials_password').value;
    let username = $('#response_auth_credentials_username').value;
    if (username.length > 0 || password.length > 0) {
      const credentials = { username, password };
      Log.info(`Setting credentials to: ${JSON.stringify(credentials)}`);
      e.setCredentials(Promise.resolve(credentials));
    }
  }

  #maybeOverrideRequestHeaders(e) {
    if (!$('#interceptor_blocking').checked) {
      return;
    }
    let requestHeaders = $('#response_request_headers').value;
    if (requestHeaders.length !== 0) {
      try {
        requestHeaders = JSON.parse(requestHeaders);
        if (requestHeaders && typeof requestHeaders === 'object') {
          Log.info(`Setting request headers to: ${JSON.stringify(requestHeaders)}`);
          e.setRequestHeaders(requestHeaders);
        }
      } catch (e) {}
    }
  }

  #maybeOverrideResponseHeaders(e) {
    if (!$('#interceptor_blocking').checked) {
      return;
    }
    let responseHeaders = $('#response_response_headers').value;
    if (responseHeaders.length !== 0) {
      try {
        responseHeaders = JSON.parse(responseHeaders);
        if (responseHeaders && typeof responseHeaders === 'object') {
          Log.info(`Setting response headers to: ${JSON.stringify(responseHeaders)}`);
          e.setResponseHeaders(responseHeaders);
        }
      } catch (e) {}
    }
  }

  #addOnAuthRequired() {
    let listener = (e) => {
      Log.evt('authrequired fired');
      Log.info(`event = ${JSON.stringify(e)}`);
      this.#maybeCancelRequest(e);
      this.#maybeSetAuthCredentials(e);
    };
    this.#getInterceptor().addEventListener('authrequired', listener);
    Log.info('Added authrequired event listener');
  }

  #addOnBeforeRedirect() {
    let listener = (e) => {
      Log.evt('beforeredirect fired');
      Log.info(`event = ${JSON.stringify(e)}`);
    };
    this.#getInterceptor().addEventListener('beforeredirect', listener);
    Log.info('Added beforeredirect event listener');
  }

  #addOnBeforeRequest() {
    let listener = (e) => {
      Log.evt('beforerequest fired');
      Log.info(`event = ${JSON.stringify(e)}`);
      this.#maybeCancelRequest(e);
      this.#maybeRedirectRequest(e);
    };
    this.#getInterceptor().addEventListener('beforerequest', listener);
    Log.info('Added beforerequest event listener');
  }

  #addOnBeforeSendHeaders() {
    let listener = (e) => {
      Log.evt('beforesendheaders fired');
      Log.info(`event = ${JSON.stringify(e)}`);
      this.#maybeCancelRequest(e);
      this.#maybeOverrideRequestHeaders(e);
    };
    this.#getInterceptor().addEventListener('beforesendheaders', listener);
    Log.info('Added beforesendheaders event listener');
  }

  #addOnCompleted() {
    let listener = (e) => {
      Log.evt('completed fired');
      Log.info(`event = ${JSON.stringify(e)}`);
    };
    this.#getInterceptor().addEventListener('completed', listener);
    Log.info('Added completed event listener');
  }

  #addOnErrorOccurred() {
    let listener = (e) => {
      Log.evt('erroroccurred fired');
      Log.info(`event = ${JSON.stringify(e)}`);
    };
    this.#getInterceptor().addEventListener('erroroccurred', listener);
    Log.info('Added erroroccurred event listener');
  }

  #addOnHeadersReceived() {
    let listener = (e) => {
      Log.evt('headersreceived fired');
      Log.info(`event = ${JSON.stringify(e)}`);
      this.#maybeCancelRequest(e);
      this.#maybeRedirectRequest(e);
      this.#maybeOverrideResponseHeaders(e);
    };
    this.#getInterceptor().addEventListener('headersreceived', listener);
    Log.info('Added headersreceived event listener');
  }

  #addOnResponseStarted() {
    let listener = (e) => {
      Log.evt('responsestarted fired');
      Log.info(`event = ${JSON.stringify(e)}`);
    };
    this.#getInterceptor().addEventListener('responsestarted', listener);
    Log.info('Added responsestarted event listener');
  }

  #addOnSendHeaders() {
    let listener = (e) => {
      Log.evt('sendheaders fired');
      Log.info(`event = ${JSON.stringify(e)}`);
    };
    this.#getInterceptor().addEventListener('sendheaders', listener);
    Log.info('Added sendheaders event listener');
  }

  static controlledFrame;
  #addedContentScripts = new Array();
  #urlParams;
}

export { ControlledFrameController };
