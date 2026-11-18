const V = "siteq-v13";
const CORE = ["./", "./index.html", "./manifest.webmanifest"];
const CDN = [
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
  "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
  "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js"
];
self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    // One missing file (e.g. manifest) must not abort the whole install
    await Promise.allSettled(CORE.map(u => c.add(u)));
    await Promise.allSettled(CDN.map(async u => {
      const req = new Request(u, { mode: "no-cors" });
      await c.put(req, await fetch(req));
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || !r.url.startsWith("http")) return;
  e.respondWith((async () => {
    const c = await caches.open(V);
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r).then(res => {
      if (res && (res.ok || res.type === "opaque")) c.put(r, res.clone()).catch(() => {});
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net)
      || (r.mode === "navigate" && await c.match("./index.html"))
      || new Response("Offline", { status: 503 });
  })());
});
