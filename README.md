# Emerald Visions Backend

Backend server for the Emerald Visions photography website.

## Environment Variables

Create a `.env` file with your Cloudinary credentials:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=3001
```

## Development

```bash
npm install
npm run dev
```

## Deployment

This server is designed to be deployed to Vercel, Railway, or Render.

## API Endpoints

- `GET /health` - Health check
- `GET /api/images?folder={folder}&max={max}` - Get images from Cloudinary folder
- `GET /api/test?folder={folder}` - Test endpoint for debugging
