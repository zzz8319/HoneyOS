(function () {
  'use strict';

  const EXPR_RE = /\{\{\s*([\s\S]+?)\s*\}\}/g;

  function evaluate(expr, scope) {
    try {
      const keys = Object.keys(scope);
      const fn = new Function(...keys, '"use strict"; return (' + expr + ');');
      return fn(...keys.map(k => scope[k]));
    } catch (e) {
      return '';
    }
  }

  function interpolateStr(str, scope) {
    EXPR_RE.lastIndex = 0;
    return str.replace(/\{\{\s*([\s\S]+?)\s*\}\}/g, (_, expr) => {
      const v = evaluate(expr.trim(), scope);
      return (v == null || v === false) ? '' : String(v);
    });
  }

  function singleExpr(str) {
    const m = str.match(/^\s*\{\{\s*([\s\S]+?)\s*\}\}\s*$/);
    return m ? m[1].trim() : null;
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SVG_TAGS = new Set(['svg','path','circle','rect','line','polyline','polygon','ellipse','g','defs','linearGradient','radialGradient','stop','pattern','use','symbol','text','tspan','clipPath','mask']);

  function createElement(tag, parentNS) {
    if (parentNS === SVG_NS || SVG_TAGS.has(tag)) {
      return document.createElementNS(SVG_NS, tag);
    }
    return document.createElement(tag);
  }

  function renderNode(node, scope, parent, parentNS) {
    if (node.nodeType === 3) {
      const t = node.textContent;
      parent.appendChild(document.createTextNode(
        t.includes('{{') ? interpolateStr(t, scope) : t
      ));
      return;
    }

    if (node.nodeType !== 1) {
      parent.appendChild(node.cloneNode(true));
      return;
    }

    const tag = node.tagName.toLowerCase();

    if (tag === 'script' || tag === 'helmet') return;

    if (tag === 'sc-if') {
      const valAttr = node.getAttribute('value') || '';
      const expr = singleExpr(valAttr);
      if (expr && evaluate(expr, scope)) {
        const ns = node.namespaceURI || parentNS;
        for (const child of node.childNodes) renderNode(child, scope, parent, ns);
      }
      return;
    }

    if (tag === 'sc-for') {
      const listAttr = node.getAttribute('list') || '';
      const as = node.getAttribute('as') || 'item';
      const expr = singleExpr(listAttr);
      const list = expr ? evaluate(expr, scope) : null;
      if (Array.isArray(list)) {
        const ns = node.namespaceURI || parentNS;
        for (const item of list) {
          const childScope = Object.assign(Object.create(null), scope, { [as]: item });
          for (const child of node.childNodes) renderNode(child, childScope, parent, ns);
        }
      }
      return;
    }

    const currentNS = (parentNS === SVG_NS || SVG_TAGS.has(tag)) ? SVG_NS : null;
    const el = createElement(tag, parentNS);
    let focusStyle = null;
    let activeStyle = null;
    let pendingValue = undefined;

    for (const attr of node.attributes) {
      const name = attr.name;
      const val = attr.value;

      if (name === 'style-focus') {
        focusStyle = val.includes('{{') ? interpolateStr(val, scope) : val;
        continue;
      }
      if (name === 'style-active') {
        activeStyle = val.includes('{{') ? interpolateStr(val, scope) : val;
        continue;
      }
      if (name.startsWith('hint-')) continue;

      const expr = singleExpr(val);

      if (name.startsWith('on') && expr) {
        const fn = evaluate(expr, scope);
        if (typeof fn === 'function') {
          el.addEventListener(name.slice(2).toLowerCase(), fn);
        }
        continue;
      }

      if (name === 'value' && (tag === 'input' || tag === 'textarea' || tag === 'select')) {
        pendingValue = expr ? evaluate(expr, scope) : (val.includes('{{') ? interpolateStr(val, scope) : val);
        continue;
      }

      if (val.includes('{{')) {
        const result = expr
          ? (() => { const v = evaluate(expr, scope); return v == null ? '' : String(v); })()
          : interpolateStr(val, scope);
        if (result !== '') el.setAttribute(name, result);
      } else {
        el.setAttribute(name, val);
      }
    }

    for (const child of node.childNodes) renderNode(child, scope, el, currentNS);

    if (pendingValue !== undefined) {
      el.value = pendingValue;
    }

    if (focusStyle) {
      const bs = el.getAttribute('style') || '';
      el.addEventListener('focus', () => el.setAttribute('style', bs + ';' + focusStyle));
      el.addEventListener('blur', () => el.setAttribute('style', bs));
    }
    if (activeStyle) {
      const bs = el.getAttribute('style') || '';
      el.addEventListener('mousedown', () => el.setAttribute('style', bs + ';' + activeStyle));
      el.addEventListener('mouseup', () => el.setAttribute('style', bs));
      el.addEventListener('mouseleave', () => el.setAttribute('style', bs));
    }

    parent.appendChild(el);
  }

  // DCLogic base class
  window.DCLogic = class DCLogic {
    constructor() { this._dcRender = null; }

    setState(updater) {
      if (typeof updater === 'function') {
        const next = updater(Object.assign({}, this.state));
        this.state = Object.assign({}, this.state, next);
      } else {
        this.state = Object.assign({}, this.state, updater);
      }
      if (this._dcRender) this._dcRender();
    }
  };

  class DCComponent {
    constructor(xdcEl) {
      // Move helmet contents to <head>
      const helmetEl = xdcEl.querySelector('helmet');
      if (helmetEl) {
        while (helmetEl.firstChild) document.head.appendChild(helmetEl.firstChild);
        helmetEl.remove();
      }

      // Extract component script (may be inside or outside x-dc)
      const scriptEl = xdcEl.querySelector('script[data-dc-script]') ||
                       xdcEl.querySelector('script[type="text/x-dc"]') ||
                       xdcEl.querySelector('script:not([src])') ||
                       document.querySelector('script[data-dc-script]') ||
                       document.querySelector('script[type="text/x-dc"]');
      const scriptCode = scriptEl ? scriptEl.textContent : '';
      if (scriptEl) scriptEl.remove();

      // Snapshot template
      this._templateNodes = Array.from(xdcEl.childNodes).map(n => n.cloneNode(true));
      this._container = xdcEl;
      this._pending = false;

      // Execute component script via Blob URL for reliable class declaration scoping
      const uid = '_dc_' + Math.random().toString(36).slice(2);
      const blob = new Blob(
        ['console.log("[DC] blob DCLogic:", typeof DCLogic, typeof window.DCLogic);\n' +
         scriptCode + '\ntry{window["' + uid + '"]=Component;console.log("[DC] assigned",typeof window["' + uid + '"]);}catch(e){console.error("[DC] blob err:",e.message);}'],
        { type: 'text/javascript' }
      );
      const blobURL = URL.createObjectURL(blob);
      const execScript = document.createElement('script');
      execScript.src = blobURL;
      // Blob URL scripts execute asynchronously — we need to wait
      this._blobURL = blobURL;
      this._uid = uid;
      this._scriptEl = execScript;
      execScript.onload = () => {
        URL.revokeObjectURL(blobURL);
        const ComponentClass = window[uid];
        delete window[uid];
        if (!ComponentClass) { console.error('[DC] ComponentClass not found'); return; }
        try { this._logic = new ComponentClass(); } catch(e) { console.error('[DC] instantiation failed:', e); return; }
        this._logic._dcRender = () => this._scheduleRender();
        this._scheduleRender();
      };
      execScript.onerror = (e) => { console.error('[DC] script load error:', e); };
      document.head.appendChild(execScript);
    }

    _scheduleRender() {
      if (this._pending) return;
      this._pending = true;
      requestAnimationFrame(() => {
        this._pending = false;
        this._doRender();
      });
    }

    _doRender() {
      let vals;
      try {
        vals = this._logic.renderVals();
      } catch(e) {
        console.error('[DC] renderVals failed:', e);
        return;
      }
      const frag = document.createDocumentFragment();
      for (const node of this._templateNodes) renderNode(node, vals, frag, null);
      while (this._container.firstChild) this._container.removeChild(this._container.firstChild);
      this._container.appendChild(frag);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('x-dc').forEach(el => new DCComponent(el));
  });
})();
