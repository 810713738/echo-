#!/usr/bin/env python3
import base64
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
PAYLOAD = ROOT / "scripts" / "site.payload.json"
OUT = ROOT / "index" / "static" / "config.js"
MK = "echo-haoping-guard-v2026"


def encode(text: str, key: str) -> str:
    tb = text.encode("utf-8")
    kb = key.encode("utf-8")
    out = bytes([tb[i] ^ kb[i % len(kb)] for i in range(len(tb))])
    return base64.b64encode(out).decode("ascii")


def main() -> int:
    if not PAYLOAD.exists():
        print(f"missing {PAYLOAD}", file=sys.stderr)
        return 1
    blob = encode(PAYLOAD.read_text("utf-8"), MK)
    OUT.write_text(
        f"""(function () {{
  var _k = {json.dumps(MK)};
  function _x(s, k) {{
    var b = atob(s), o = "", i, c;
    for (i = 0; i < b.length; i++) {{
      c = b.charCodeAt(i) ^ k.charCodeAt(i % k.length);
      o += String.fromCharCode(c);
    }}
    return o;
  }}
  function _p(e, k) {{
    try {{
      return JSON.parse(_x(e, k));
    }} catch (_) {{
      return null;
    }}
  }}
  var blob = {json.dumps(blob)};
  var cfg = _p(blob, _k);
  if (cfg && typeof cfg === "object") {{
    Object.freeze(cfg.fp || {{}});
    window.SITE_CONFIG = Object.freeze(cfg);
  }} else {{
    window.SITE_CONFIG = Object.freeze({{}});
  }}
}})();
""",
        encoding="utf-8",
    )
    print(f"wrote {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
