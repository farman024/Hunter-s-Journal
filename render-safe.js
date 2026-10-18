/* Render-only encoding. Never rewrite stored journals to make markup safe. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HJRender = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function text(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, character => entities[character]);
  }
  function arg(value) {
    // JSON gives the JavaScript literal boundary; HTML encoding separately protects
    // the containing double-quoted event-handler attribute. Do not add extra quotes.
    const literal = JSON.stringify(value);
    if (literal === undefined) return 'null';
    return text(literal.replace(/[\u2028\u2029]/g, c => c === '\u2028' ? '\\u2028' : '\\u2029'));
  }
  function image(value) {
    if (typeof value !== 'string' || value.length > 5 * 1024 * 1024) return '';
    // Locally uploaded raster-only data URLs. No network URLs, SVG, HTML,
    // whitespace, attribute breakers, javascript: or embedded subresource loads.
    // Content sniffing remains the browser's raster decoder's responsibility;
    // the explicit raster MIME and image context cannot execute HTML/SVG script.
    return /^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value) ? value : '';
  }
  return Object.freeze({ text, attr: text, arg, image });
});
