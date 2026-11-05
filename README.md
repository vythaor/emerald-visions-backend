# Emerald Visions backend

Image API for the Emerald Visions photography site, running as a Cloudflare Worker.

## Endpoints

- `GET /api/images?folder=wedding&max=12&cursor=...` lists the images in Cloudinary folder `2am/<folder>`
  (`url`, `public_id`, `format`, `width`, `height`, plus `hasMore` / `nextCursor`). Listings are cached
  at the Cloudflare edge for 10 minutes, so new uploads can take up to 10 minutes to appear.
- `GET /api/health`

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars   # fill in your Cloudinary API key and secret
npm run dev                      # http://localhost:8787
```

## Deploy

```bash
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
npm run deploy
```
