# Image Upload and Content Moderation Feature

## Overview
Implemented image upload functionality for both scenario creation and user interjections in conversations, allowing users to share images that avatars can analyze and respond to. Includes content moderation to filter inappropriate imagery.

## Implementation Date
December 2024

## Features Implemented

### 1. Image Upload in Scenario Creation
- Users can attach images when creating new scenarios
- Image preview before scenario submission
- Images are included in the scenario context from the start
- All avatars can analyze scenario images from the first message
- Same moderation and validation as user interjections

### 2. Image Upload in User Interjections
- Users can now attach images when interjecting in conversations
- Image preview before submission
- Support for common image formats (JPEG, PNG, GIF, etc.)
- Maximum file size: 10MB
- Images are converted to base64 data URLs for storage and transmission

### 2. Content Moderation
- **API Endpoint**: `/api/moderate-image`
- **Service**: Sightengine (configurable)
- **Moderation Checks**:
  - Nudity detection
  - Weapon detection
  - Offensive content detection
  - Violence detection
- **Thresholds** (configurable):
  - Nudity: 0.5
  - Weapons: 0.5
  - Offensive: 0.7
  - Violence: 0.5
- **Fallback Behavior**: If moderation service is unavailable or not configured, images default to "safe" with a warning logged

### 3. Image Display in Messages
- Images are displayed in message bubbles
- User messages show images with verification status
- Avatar messages can reference images shared by users
- Images are displayed with proper sizing and constraints (max-height: 256px)

### 4. LLM Integration
- Images are included in conversation context when generating avatar responses
- Avatars are prompted to analyze and respond to shared images
- Image information is passed through the message generation pipeline

## Technical Details

### Type Definitions
Updated `Message` and `Scenario` interfaces in `src/types/index.ts`:
```typescript
export interface MessageImage {
  url: string; // Base64 data URL or uploaded URL
  moderationStatus: ImageModerationStatus;
  moderationResult?: {
    safe: boolean;
    categories?: {
      nudity?: number;
      violence?: number;
      weapons?: number;
      offensive?: number;
      [key: string]: number | undefined;
    };
  };
}

export interface Message {
  // ... existing fields
  image?: MessageImage; // Optional image attached to the message
}

export interface Scenario {
  // ... existing fields
  image?: MessageImage; // Optional image attached to the scenario
}
```

### API Endpoints

#### `/api/moderate-image`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "image": "data:image/jpeg;base64,..."
  }
  ```
- **Response**:
  ```json
  {
    "safe": true,
    "categories": {
      "nudity": 0.1,
      "weapons": 0.0,
      "offensive": 0.2
    },
    "error": "optional error message"
  }
  ```

### Components Updated

1. **ScenarioBuilder.tsx**
   - Added file input for image selection
   - Image preview with moderation status
   - Moderation check before scenario creation
   - Error handling for invalid/inappropriate images
   - Scenario images are stored with the scenario

2. **UserInterjection.tsx**
   - Added file input for image selection
   - Image preview with moderation status
   - Moderation check before submission
   - Error handling for invalid/inappropriate images

2. **ConversationTimeline.tsx**
   - Image display in message bubbles
   - Verification status indicators
   - Proper image sizing and styling

3. **SimulationView.tsx**
   - Updated to handle images in user interjections
   - Displays scenario image in the header if present
   - Pass images through to message creation

4. **simulationEngine.ts**
   - Updated to include images in message history
   - Pass images to API endpoints

5. **generate-message.ts**
   - Updated to handle images in conversation context
   - Prompt avatars to analyze shared images
   - Include image information in LLM prompts

## Configuration

### Environment Variables
To enable full content moderation, add these to your Vercel environment variables:

```
SIGHTENGINE_USER=your_sightengine_user
SIGHTENGINE_SECRET=your_sightengine_secret
```

### Setting Up Sightengine
1. Sign up at https://sightengine.com
2. Create an account and get your API credentials
3. Add credentials to Vercel environment variables
4. The moderation API will automatically use these credentials

### Alternative Moderation Services
The moderation API can be easily adapted to use other services:
- AWS Rekognition
- Google Cloud Vision API
- Azure Content Moderator
- Custom moderation service

## User Experience

### Image Upload Flow

#### Scenario Creation
1. User clicks "Add Image to Scenario" button in scenario builder
2. File picker opens (accepts image/*)
3. Image is validated (type and size)
4. Image is converted to base64
5. Image is sent to moderation API
6. If safe: Image preview shows with "✓ Approved" badge
7. If unsafe: Error message displayed, image rejected
8. User can remove image before scenario creation
9. On scenario creation, image is included in the scenario

#### User Interjection
1. User clicks "Add Image" button in interjection form
2. File picker opens (accepts image/*)
3. Image is validated (type and size)
4. Image is converted to base64
5. Image is sent to moderation API
6. If safe: Image preview shows with "✓ Approved" badge
7. If unsafe: Error message displayed, image rejected
8. User can remove image before submission
9. On submit, image is included in the message

### Avatar Response to Images
- **Scenario Images**: Avatars are informed about scenario images from the first message
- **User Interjection Images**: Avatars are informed when a user shares an image during conversation
- They are prompted to analyze images from their personality's perspective
- Responses consider both the image content and the discussion topic
- Images are referenced in conversation context
- Avatars can respond to both scenario images and user-shared images in the same conversation

## Security Considerations

1. **Content Moderation**: All images are checked before being displayed
2. **File Size Limits**: 10MB maximum to prevent abuse
3. **File Type Validation**: Only image files accepted
4. **Base64 Encoding**: Images stored as data URLs (consider moving to cloud storage for production)
5. **Moderation Fallback**: If moderation fails, images default to safe (with logging)

## Future Enhancements

1. **Cloud Storage**: Move from base64 to cloud storage (S3, Cloudinary, etc.)
2. **Image Compression**: Compress images before upload to reduce payload size
3. **Multiple Images**: Support multiple images per message
4. **Image Annotations**: Allow users to annotate images before sharing
5. **Vision Model Integration**: Use actual vision-capable LLM models when available
6. **Advanced Moderation**: Add more sophisticated moderation categories
7. **Image Analysis**: Provide detailed image analysis for avatars to reference

## Testing

### Manual Testing Checklist
- [ ] Upload valid image (should show preview)
- [ ] Upload invalid file type (should show error)
- [ ] Upload oversized image (should show error)
- [ ] Upload inappropriate image (should be rejected if moderation configured)
- [ ] Submit message with image (should appear in conversation)
- [ ] Verify avatar responses reference the image
- [ ] Test without moderation service configured (should default to safe)

## Notes

- Images are currently stored as base64 data URLs in messages
- For production with many users, consider moving to cloud storage
- Moderation service is optional - app works without it but logs warnings
- DeepSeek API may not have vision support yet, so images are described in text prompts

