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
  
  try {
    // Check if environment variables are available
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary environment variables not set');
    }
    
    // Get ALL images from Cloudinary (no prefix, no type filter)
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/resources/image?max_results=50`;
    
    console.log('Test Cloudinary URL:', cloudinaryUrl);
    
    const response = await fetch(cloudinaryUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.CLOUDINARY_API_KEY + ':' + process.env.CLOUDINARY_API_SECRET).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary API error response:', errorText);
      throw new Error(`Cloudinary API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('All Cloudinary images:', JSON.stringify(data, null, 2));
    
    // Extract just the public IDs to see the structure
    const publicIds = data.resources ? data.resources.map(r => r.public_id) : [];
    
    res.status(200).json({
      success: true,
      message: 'Found all images in Cloudinary account',
      totalImages: data.resources ? data.resources.length : 0,
      publicIds: publicIds,
      sampleImages: data.resources ? data.resources.slice(0, 5).map(r => ({
        public_id: r.public_id,
        format: r.format,
        type: r.type,
        folder: r.folder
      })) : [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching all images:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
