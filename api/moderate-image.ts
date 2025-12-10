import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel API endpoint for image content moderation
 * Uses Sightengine API to detect inappropriate content
 * 
 * Note: For production, you'll need to:
 * 1. Sign up for Sightengine at https://sightengine.com
 * 2. Add SIGHTENGINE_USER and SIGHTENGINE_SECRET to your Vercel environment variables
 * 3. Alternatively, you can use other services like AWS Rekognition, Google Cloud Vision API, etc.
 */

interface ModerateImageRequest {
  image: string; // Base64 encoded image data (data:image/... format)
}

interface ModerateImageResponse {
  safe: boolean;
  categories?: {
    nudity?: number;
    violence?: number;
    weapons?: number;
    offensive?: number;
    [key: string]: number | undefined;
  };
  error?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image }: ModerateImageRequest = req.body;

    // Validate required fields
    if (!image) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    // Get API credentials from environment variables
    const sightengineUser = process.env.SIGHTENGINE_USER;
    const sightengineSecret = process.env.SIGHTENGINE_SECRET;

    // If Sightengine is not configured, return safe with warning
    if (!sightengineUser || !sightengineSecret) {
      console.warn('Sightengine credentials not configured. Using basic validation only.');
      
      // Basic validation: check if image is valid base64
      try {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        Buffer.from(base64Data, 'base64');
        
        // If no moderation service, default to safe (but log warning)
        // In production, you should configure a moderation service
        return res.status(200).json({
          safe: true,
          categories: {},
        });
      } catch (error) {
        return res.status(400).json({ 
          error: 'Invalid image data',
          safe: false 
        });
      }
    }

    // Convert base64 data URL to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Use Sightengine API with URL-based approach (simpler for serverless)
    // First, we need to upload the image somewhere or use their direct API
    // For now, we'll use a workaround: convert to data URL and use their URL endpoint if available
    // Or use multipart form data with proper encoding
    
    // Alternative: Use a service that accepts base64 directly
    // For Sightengine, we need to use multipart/form-data
    
    // Use multipart/form-data for Sightengine API
    // Construct form data manually for Vercel serverless compatibility
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2, 15)}`;
    const formParts: Buffer[] = [];
    
    const addFormField = (name: string, value: string | Buffer, filename?: string) => {
      formParts.push(Buffer.from(`--${boundary}\r\n`));
      if (filename && Buffer.isBuffer(value)) {
        formParts.push(Buffer.from(`Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n`));
        formParts.push(Buffer.from(`Content-Type: image/jpeg\r\n\r\n`));
        formParts.push(value);
      } else {
        formParts.push(Buffer.from(`Content-Disposition: form-data; name="${name}"\r\n\r\n`));
        formParts.push(Buffer.from(String(value)));
      }
      formParts.push(Buffer.from(`\r\n`));
    };
    
    addFormField('media', imageBuffer, 'image.jpg');
    addFormField('models', 'nudity-2.0,wad,offensive');
    addFormField('api_user', sightengineUser);
    addFormField('api_secret', sightengineSecret);
    formParts.push(Buffer.from(`--${boundary}--\r\n`));
    
    const formBody = Buffer.concat(formParts);

    let sightengineResponse: Response;
    try {
      sightengineResponse = await fetch('https://api.sightengine.com/1.0/check.json', {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: formBody,
      });
    } catch (fetchError) {
      // If fetch fails, fall back to basic validation
      console.warn('Sightengine API request failed, using basic validation:', fetchError);
      return res.status(200).json({
        safe: true,
        categories: {},
        error: 'Moderation service unavailable, defaulting to safe',
      });
    }

    if (!sightengineResponse.ok) {
      const errorText = await sightengineResponse.text();
      console.error('Sightengine API error:', errorText);
      
      // On API error, default to safe but log the error
      return res.status(200).json({
        safe: true,
        categories: {},
        error: 'Moderation service unavailable, defaulting to safe',
      });
    }

    const moderationData = await sightengineResponse.json();

    // Extract moderation results
    const categories: ModerateImageResponse['categories'] = {};
    
    // Nudity detection
    if (moderationData.nudity) {
      const nudity = moderationData.nudity;
      categories.nudity = Math.max(
        nudity.raw || 0,
        nudity.partial || 0,
        nudity.safe !== undefined ? (1 - nudity.safe) : 0
      );
    }

    // Weapon detection
    if (moderationData.weapon !== undefined) {
      categories.weapons = moderationData.weapon;
    }

    // Offensive content
    if (moderationData.offensive) {
      categories.offensive = moderationData.offensive.prob || moderationData.offensive;
    }

    // Violence detection (if available)
    if (moderationData.violence !== undefined) {
      categories.violence = moderationData.violence;
    }

    // Determine if image is safe
    // Thresholds can be adjusted based on your requirements
    const nudityThreshold = 0.5;
    const weaponsThreshold = 0.5;
    const offensiveThreshold = 0.7;
    const violenceThreshold = 0.5;

    const isSafe = 
      (categories.nudity || 0) < nudityThreshold &&
      (categories.weapons || 0) < weaponsThreshold &&
      (categories.offensive || 0) < offensiveThreshold &&
      (categories.violence || 0) < violenceThreshold;

    const response: ModerateImageResponse = {
      safe: isSafe,
      categories,
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error moderating image:', error);
    
    // On error, default to safe but log it
    return res.status(200).json({
      safe: true,
      categories: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
