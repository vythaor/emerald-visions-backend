const https = require('https');

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
  
  // Get query parameters
  const url = new URL(req.url, `https://${req.headers.host}`);
  const searchParams = url.searchParams;
  const folder = searchParams.get('folder') || '';
  const max = parseInt(searchParams.get('max')) || 30;
  
  console.log('Images function called:', { method: req.method, folder, max, url: req.url });
  
  try {
    // Fetch images from Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/ddwq9besf/resources/image?prefix=${folder}&max_results=${max}`;
    
    const response = await fetch(cloudinaryUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.CLOUDINARY_API_KEY + ':' + process.env.CLOUDINARY_API_SECRET).toString('base64')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Cloudinary API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform Cloudinary response to our format
    const images = data.resources.map((resource, index) => ({
      id: resource.public_id,
      url: `https://res.cloudinary.com/ddwq9besf/image/upload/f_auto,q_auto/${resource.public_id}.${resource.format}`,
      alt: `Image ${index + 1}`,
      width: resource.width,
      height: resource.height
    }));
    
    res.status(200).json({
      success: true,
      message: 'Images fetched from Cloudinary!',
      folder: folder,
      max: max,
      count: images.length,
      images: images,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching images:', error);
    
    // Fallback to mock data if Cloudinary fails
    const mockImages = [
      {
        id: '1',
        url: 'https://res.cloudinary.com/ddwq9besf/image/upload/f_auto,q_auto/sample1.jpg',
        alt: 'Sample image 1'
      },
      {
        id: '2', 
        url: 'https://res.cloudinary.com/ddwq9besf/image/upload/f_auto,q_auto/sample2.jpg',
        alt: 'Sample image 2'
      }
    ];
    
    res.status(200).json({
      success: true,
      message: 'Using fallback images due to Cloudinary error',
      folder: folder,
      max: max,
      count: mockImages.length,
      images: mockImages.slice(0, max),
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
