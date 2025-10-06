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
  
  // Map folder names to actual Cloudinary folder paths
  const folderMapping = {
    'wedding': '2am/wedding',
    'outdoor': '2am/outdoor', 
    'sport': '2am/sport',
    'event': '2am/event',
    'indoor': '2am/indoor',
    'home': '2am/home'
  };
  
  const cloudinaryFolder = folderMapping[folder] || `2am/${folder}`;
  
  console.log('Images function called:', { method: req.method, folder, cloudinaryFolder, max, url: req.url });
  console.log('Environment variables:', {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
    apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
  });
  
  try {
    // Check if environment variables are available
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary environment variables not set');
    }
    
    // Since Cloudinary UI folders don't translate to API filtering,
    // we'll use a mapping approach based on the actual image IDs in each folder
    // This is a temporary solution until we can properly tag images in Cloudinary
    
    // Define specific image IDs for each folder based on your Cloudinary account
    const folderImageMapping = {
      '2am/wedding': [
        'DSCF0369_y5uz9e', 'DSCF0419-Edit_zvetit', 'DSCF0482_gcxzks', 'DSC07492_yai7jh',
        'DSC07463_tpr49h', 'DSC07489_cewerv', 'DSC07446_wfh4x5', 'DSC07447-Edit_ed86ms',
        'DSC07441-Edit_iv3nub', 'DSC07391_pealny', 'IMG_2769_wry0zl', 'DSCF6089_rwcoif',
        'DSCF6086_g5j4r4', 'DSCF6083_naxcoz', 'DSCF6050_kp4dvx', 'DSCF6014_msp2fj',
        'DSCF0091_1_inejz8', 'DSC09834_czx19d', 'DSC09850_a9jj12', 'DSC09888_wjubxr',
        'DSC09910_urkm3v', 'DSCF0114_ixdzqh', 'DSCF0101_j8rpj7', 'DSCF0100_zidqs2',
        'DSC03561_c8w7ho', 'DSC03538_b8ijvj', 'DSC03440_hemqqo', 'DSC03377_momcjc',
        'DSC03324_dzof6q'
      ],
      '2am/outdoor': [
        'DSCF0100_zidqs2', 'IMG_2769_wry0zl', 'DSCF6089_rwcoif', 'DSCF6086_g5j4r4',
        'DSCF6083_naxcoz', 'DSCF6050_kp4dvx', 'DSCF6014_msp2fj', 'DSCF0091_1_inejz8',
        'DSC09834_czx19d', 'DSC09850_a9jj12', 'DSC09888_wjubxr', 'DSC09910_urkm3v',
        'DSCF0114_ixdzqh', 'DSCF0101_j8rpj7', 'DSC03561_c8w7ho', 'DSC03538_b8ijvj',
        'DSC03440_hemqqo', 'DSC03377_momcjc', 'DSC03324_dzof6q'
      ],
      '2am/sport': [
        'DSC03440_hemqqo', 'DSC03561_c8w7ho', 'DSC03538_b8ijvj', 'DSC03377_momcjc',
        'DSC03324_dzof6q', 'DSC07492_yai7jh', 'DSC07463_tpr49h', 'DSC07489_cewerv',
        'DSC07446_wfh4x5', 'DSC07447-Edit_ed86ms', 'DSC07441-Edit_iv3nub', 'DSC07391_pealny'
      ],
      '2am/event': [
        'DSC08986_rjjyff', 'DSC09834_czx19d', 'DSC09850_a9jj12', 'DSC09888_wjubxr',
        'DSC09910_urkm3v', 'DSCF0114_ixdzqh', 'DSCF0101_j8rpj7', 'DSC03561_c8w7ho',
        'DSC03538_b8ijvj', 'DSC03440_hemqqo', 'DSC03377_momcjc', 'DSC03324_dzof6q'
      ],
      '2am/indoor': [
        'DSC03710_oah2bk', 'DSC07492_yai7jh', 'DSC07463_tpr49h', 'DSC07489_cewerv',
        'DSC07446_wfh4x5', 'DSC07447-Edit_ed86ms', 'DSC07441-Edit_iv3nub', 'DSC07391_pealny',
        'IMG_2769_wry0zl', 'DSCF6089_rwcoif', 'DSCF6086_g5j4r4', 'DSCF6083_naxcoz'
      ],
      '2am/home': [
        'camera_hxmygl', 'DSCF0369_y5uz9e', 'DSCF0419-Edit_zvetit', 'DSCF0482_gcxzks',
        'DSC07492_yai7jh', 'DSC07463_tpr49h', 'DSC07489_cewerv', 'DSC07446_wfh4x5'
      ]
    };
    
    // Get the specific image IDs for this folder
    const imageIds = folderImageMapping[cloudinaryFolder] || [];
    console.log(`Found ${imageIds.length} images for folder: ${cloudinaryFolder}`);
    
    // If we have specific images for this folder, use them
    if (imageIds.length > 0) {
      const images = imageIds.slice(0, max).map((id, index) => ({
        id: id,
        url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${id}.jpg`,
        alt: `Image ${index + 1}`,
        width: 4000, // Default dimensions
        height: 6000
      }));
      
      return res.status(200).json({
        success: true,
        message: 'Images fetched using folder mapping!',
        folder: folder,
        max: max,
        count: images.length,
        images: images,
        timestamp: new Date().toISOString()
      });
    }
    
    // Fallback: try to get all images and filter (this will return all images)
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/resources/image?type=upload&max_results=${max}`;
    
    console.log('Cloudinary URL:', cloudinaryUrl);
    console.log('Searching for folder:', cloudinaryFolder);
    
    // Also try without prefix to see if we can get any images
    const testUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/resources/image?type=upload&max_results=5`;
    console.log('Test URL (no prefix):', testUrl);
    console.log('Environment check:', {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
      apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
    });
    
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
    console.log('Cloudinary response:', JSON.stringify(data, null, 2));
    console.log('Cloudinary resources count:', data.resources ? data.resources.length : 'No resources array');
    console.log('Cloudinary resources:', data.resources ? data.resources.map(r => r.public_id) : 'No resources');
    
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
