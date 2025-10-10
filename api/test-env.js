module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check environment variables
  const envStatus = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set', 
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set',
    NODE_ENV: process.env.NODE_ENV || 'Not set'
  };

  res.status(200).json({
    message: 'Environment variables check',
    env: envStatus,
    timestamp: new Date().toISOString()
  });
};
