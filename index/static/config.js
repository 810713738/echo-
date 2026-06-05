(function () {
  var _k = "echo-haoping-guard-v2026";
  function _x(s, k) {
    var b = atob(s), o = "", i, c;
    for (i = 0; i < b.length; i++) {
      c = b.charCodeAt(i) ^ k.charCodeAt(i % k.length);
      o += String.fromCharCode(c);
    }
    return o;
  }
  function _p(e, k) {
    try {
      return JSON.parse(_x(e, k));
    } catch (_) {
      return null;
    }
  }
  var blob = "HmlITw8ECAEVPBwLD11VQxoQWQZBCh0ZCQoGQUgNTiFJBi8KHRRXTXhEDVReWVxTLAdKVQ1KIV1DXBwNXAEMQ15uDVYQXFtYADIaTRdIQxwECBoOTkhHUUBSHUACBB8HUVdfWxVGEQEXS0JtDUdXBwFGF1ZJOhIWRUNKH18HFQATBgJFF0dXAAcQQlQeOhIWRUNKB0IbFU1KSUwQWhBbBBEMQkcECVBDHE0LAEBKTWVQSU5HDxcUFRpGF1YQH1NGDEwOAF8FThwFCwMOWUV/QVIZAXwSEBBQFUFST1ZiQU9QSUwGSREQEwYNXhNAb1tSR1lITRpdWF5HUFtUFF9AVUNSHk8ECAMUSWlITw1IQx8ZEQsLcg4RQ0hEDzIEd39gVSkrWBo9IjsyUCUhaDVFQ15uDVYSEBBGBAQNMEQMQ1VQS1tUTAFHUkUCD1o4EBIWRUEJC0oaDhoANgcDD11VQ1BuDVZPHDgWRUEDTRdIQycAXB0sFAokUwQoFRhgBEVuUgkuXE48VxYyWA8jHQIvQ3gZJw==";
  var cfg = _p(blob, _k);
  if (cfg && typeof cfg === "object") {
    Object.freeze(cfg.fp || {});
    window.SITE_CONFIG = Object.freeze(cfg);
  } else {
    window.SITE_CONFIG = Object.freeze({});
  }
})();
