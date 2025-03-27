export class ControlledFrameWrapper extends EventTarget {
  #beforeRequestHandlers = {};

  constructor(cf) {
    super();
    this.cf = cf;
  }

  addEventListener(type, listener, options) {
    if (type !== 'beforerequest') {
      super.addEventListener.apply(this, arguments);
      return;
    }

    const filter = {};
    const extraInfoSpec = [];

    if (typeof(options) === 'object') {
      if (!options.passive) {
        extraInfoSpec.push('blocking');
      }
      if (options.includeBody) {
        extraInfoSpec.push('requestBody');
      }
      // onBeforeRequest doesn't take header flags but other events will.
      /*
      switch (options.includeHeaders) {
        case 'same-origin':
          extraInfoSpec.push('requestHeaders');
          // fallthrough
        case 'cross-origin':
          extraInfoSpec.push('extraHeaders');
          break;
      }
      */
      // Should add more validation here.
      if (options.filter) {
        filter.urls = options.filter.urls;
        filter.types = options.filter.types;
      } else {
        // Is this the right default?
        filter.urls = ['<all_urls>'];
      }
    }

    const callback = this.#onEvent.bind(this, type, listener, options);
    this.#beforeRequestHandlers[listener] = callback;
    this.cf.request.onBeforeRequest.addListener(
        callback, filter, extraInfoSpec);
  }

  removeEventListener(type, listener, options) {
    if (type !== 'beforerequest') {
      super.removeEventListener.apply(this, arguments);
      return;
    }

    if (listener in this.#beforeRequestHandlers) {
      this.cf.request.onBeforeRequest.removeListener(
          this.#beforeRequestHandlers[listener]);
    }
  }

  #onEvent(type, listener, options, details) {
    // Switch on 'type' eventually.
    // Eventually this would be a filtered version of 'details'
    // with requestBody removed and enum values kebabified.
    const requestDetails = details;
    const requestBody = (options && options.includeBody)
        ? details.requestBody
        : undefined;
    const result = (options && !options.passive)
        ? {
          cancel: false,
          redirectUrl: undefined,
        }
        : undefined;
    const event = new BeforeRequestEvent(requestDetails, requestBody, result);
    listener(event);
    return result;
  }
}

class BeforeRequestEvent extends Event {
  #result;

  constructor(requestDetails, requestBody, result) {
    super('beforerequest');
    this.requestDetails = requestDetails;
    this.requestBody = requestBody;
    this.#result = result;
  }

  preventDefault() {
    this.#result.cancel = true;
    super.preventDefault();
  }

  redirect(url) {
    this.#result.redirectUrl = url;
  }
}
