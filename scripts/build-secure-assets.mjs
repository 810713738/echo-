#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JavaScriptObfuscator from "javascript-obfuscator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const staticDir = path.join(root, "index/static");
const sourcePath = path.join(__dirname, "site.payload.json");
const buildMetaPath = path.join(staticDir, ".build-meta.json");
const mk = process.env.HP_MK || "echo-haoping-guard-v2026";

function xorEncode(text, key) {
  const tb = Buffer.from(text, "utf8");
  const kb = Buffer.from(key, "utf8");
  const out = Buffer.alloc(tb.length);
  for (let i = 0; i < tb.length; i += 1) {
    out[i] = tb[i] ^ kb[i % kb.length];
  }
  return out.toString("base64");
}

function buildGuardJs() {
  return `(function(){
var _k=${JSON.stringify(mk)};
function _x(s,k){
  var b=atob(s),o="",i,c;
  for(i=0;i<b.length;i++){
    c=b.charCodeAt(i)^k.charCodeAt(i%k.length);
    o+=String.fromCharCode(c);
  }
  return o;
}
function _p(e,k){
  try{return JSON.parse(_x(e,k))}catch(_){return null}
}
window.__hpBoot=function(blob){
  var cfg=_p(blob,_k);
  if(!cfg||typeof cfg!=="object")return null;
  Object.freeze(cfg.fp||{});
  return Object.freeze(cfg);
};
})();`;
}

function buildConfigJs(payloadB64) {
  return `window.__hpCfgBlob=${JSON.stringify(payloadB64)};window.SITE_CONFIG=window.__hpBoot(window.__hpCfgBlob)||Object.freeze({});`;
}

function obfuscate(code) {
  return JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjection: false,
    identifierNamesGenerator: "hexadecimal",
    renameGlobals: false,
    selfDefending: true,
    stringArray: true,
    stringArrayEncoding: ["base64"],
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false,
  }).getObfuscatedCode();
}

function bumpPatch(version) {
  const parts = String(version || "1.0.0").split(".").map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join(".");
}

function updateHtmlVersions(meta) {
  const htmlPath = path.join(root, "index/index.html");
  let html = fs.readFileSync(htmlPath, "utf8");
  html = html.replace(/static\/guard\.js\?v=[^"']+/g, `static/guard.js?v=${meta.guard}`);
  html = html.replace(/static\/config\.js\?v=[^"']+/g, `static/config.js?v=${meta.config}`);
  html = html.replace(/static\/app\.js\?v=[^"']+/g, `static/app.js?v=${meta.app}`);
  fs.writeFileSync(htmlPath, html, "utf8");
}

function main() {
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const payloadB64 = xorEncode(JSON.stringify(source), mk);

  let meta = { guard: "1.0.0", config: "1.0.0", app: "1.0.0" };
  if (fs.existsSync(buildMetaPath)) {
    meta = { ...meta, ...JSON.parse(fs.readFileSync(buildMetaPath, "utf8")) };
  }
  meta.guard = bumpPatch(meta.guard);
  meta.config = bumpPatch(meta.config);
  meta.app = bumpPatch(meta.app);

  const appSourcePath = path.join(staticDir, "app.source.js");
  const appRaw = fs.readFileSync(appSourcePath, "utf8");

  fs.writeFileSync(path.join(staticDir, "guard.js"), obfuscate(buildGuardJs()), "utf8");
  fs.writeFileSync(path.join(staticDir, "config.js"), obfuscate(buildConfigJs(payloadB64)), "utf8");
  fs.writeFileSync(path.join(staticDir, "app.js"), obfuscate(appRaw), "utf8");

  fs.writeFileSync(buildMetaPath, JSON.stringify(meta, null, 2), "utf8");
  updateHtmlVersions(meta);
}

main();
