// Emerald Visions image API — Cloudflare Worker
//
// GET /api/images?folder=wedding&max=12&cursor=...
//   Lists images in the Cloudinary folder "2am/<folder>" (subfolders too: folder=portraits/hong-kong).
//   Responses are cached at the Cloudflare edge so most requests never reach Cloudinary.
// GET /api/health

const EDGE_CACHE_SECONDS = 600; // how long the edge keeps a folder listing
const BROWSER_CACHE_SECONDS = 60; // how long a visitor's browser keeps it
const MAX_RESULTS_LIMIT = 100;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extraHeaders },
  });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }

    const url = new URL(request.url);
    switch (url.pathname) {
      case "/api/images":
        return handleImages(url, env, ctx);
      case "/api/health":
        return json({ ok: true });
      default:
        return json({ error: "Not found" }, 404);
    }
  },
};

async function handleImages(url, env, ctx) {
  const folder = url.searchParams.get("folder") || "";
  // One folder, or a subfolder path like "portraits/hong-kong"
  if (!/^[a-z0-9_-]+(\/[a-z0-9_-]+)*$/i.test(folder)) {
    return json({ error: "Invalid folder" }, 400);
  }
  const requestedMax = parseInt(url.searchParams.get("max") || "", 10);
  const max = Math.min(Math.max(Number.isFinite(requestedMax) ? requestedMax : 30, 1), MAX_RESULTS_LIMIT);
  const cursor = url.searchParams.get("cursor") || "";

  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    console.error("Cloudinary credentials are not configured");
    return json({ error: "Image service is not configured" }, 500);
  }

  // Normalised cache key, so stray query params don't create separate cache entries
  const cacheKeyUrl = new URL(`${url.origin}/api/images`);
  cacheKeyUrl.searchParams.set("folder", folder.toLowerCase());
  cacheKeyUrl.searchParams.set("max", String(max));
  if (cursor) cacheKeyUrl.searchParams.set("cursor", cursor);
  const cacheKey = new Request(cacheKeyUrl.toString(), { method: "GET" });
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) return withBrowserCaching(cached, "HIT");

  let result;
  try {
    result = await searchCloudinary(env, folder, max, cursor);
  } catch (error) {
    console.error("Cloudinary request failed", error);
    return json({ error: "Failed to fetch images" }, 502);
  }
  if (!result.ok) {
    console.error("Cloudinary API error", result.status, result.body);
    return json({ error: "Cloudinary API error" }, 502);
  }

  const resources = Array.isArray(result.body.resources) ? result.body.resources : [];
  const body = {
    images: resources.map((r) => ({
      url: r.secure_url,
      public_id: r.public_id,
      format: r.format,
      width: r.width,
      height: r.height,
    })),
    count: resources.length,
    folder,
    hasMore: Boolean(result.body.next_cursor),
    nextCursor: result.body.next_cursor || null,
  };

  const response = json(body, 200, { "Cache-Control": `public, s-maxage=${EDGE_CACHE_SECONDS}` });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return withBrowserCaching(response, "MISS");
}

async function searchCloudinary(env, folder, max, cursor) {
  const payload = {
    expression: `folder="2am/${folder}"`,
    max_results: max,
    fields: ["secure_url", "public_id", "format", "width", "height"],
  };
  if (cursor) payload.next_cursor = cursor;

  const res = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/resources/search`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

function withBrowserCaching(response, cacheStatus) {
  const out = new Response(response.body, response);
  out.headers.set("Cache-Control", `public, max-age=${BROWSER_CACHE_SECONDS}`);
  out.headers.set("X-Cache", cacheStatus);
  return out;
}
