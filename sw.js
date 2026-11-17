const V = "siteq-v11";
const CORE = ["./", "./index.html", "./manifest.webmanifest"];
const CDN = [
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
  "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
  "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js"
];
self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await c.addAll(CORE);
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
  if (r.method !== "GET") return;
  e.respondWith((async () => {
    const c = await caches.open(V);
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r).then(res => {
      if (res && (res.ok || res.type === "opaque")) c.put(r, res.clone());
      return res;
    }).catch(() => null);
    return hit || (await net) || new Response("Offline", { status: 503 });
  })());
});
