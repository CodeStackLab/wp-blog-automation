# WordPress Automation - Runware.ai Exclusive Update

## Summary of Changes

This update removes all fallback image generation mechanisms and configures the system to use **exclusively Runware.ai** for all image generation with the **openai:4@1 (Nano Banana)** model for high-quality, realistic images.

---

## 🎯 Key Changes

### 1. **Removed Fallback Features**
   - ❌ Removed DALL-E fallback
   - ❌ Removed stock image fallbacks (Unsplash, Pexels, Pixabay)
   - ✅ System now uses **ONLY Runware.ai** for image generation
   - ✅ If Runware.ai fails, no image is generated (no fallback)

### 2. **Updated Default Model**
   - **Previous**: `google:4@2` (Nano Banana Pro)
   - **New**: `openai:4@1` (Nano Banana High Quality Realistic Model)
   - This model generates photorealistic, high-quality images

### 3. **Dynamic Image Sizing**
   - ✅ Runware.ai now generates images in **any size** you configure
   - ✅ Automatically rounds dimensions to multiples of 64 (Runware requirement)
   - ✅ Default size: `1216x640` (optimized for blog featured images)
   - ✅ Supports custom sizes via configuration

### 4. **Enhanced Image Quality**
   - Improved prompts for photorealistic output
   - Added negative prompts: "NO cartoon, NO illustration, NO text, NO watermark"
   - 8K quality, cinematic lighting, professional photography style

### 5. **WordPress Image Resizer Plugin**
   - ✅ Created lightweight, fast WordPress plugin
   - ✅ Automatically resizes images on upload
   - ✅ Supports JPEG, PNG, GIF, WebP formats
   - ✅ Configurable max dimensions and quality
   - ✅ Preserves aspect ratio and PNG transparency

---

## 📝 Configuration Changes

### Default Configuration (server.js)

```javascript
openai: {
    apiKey: '',
    contentModel: 'gpt-4o',
    imageModel: 'openai:4@1' // Nano Banana High Quality Realistic Model
},
imageGeneration: {
    featuredEnabled: true,
    inlineEnabled: false,
    inlineFrequency: 0,
    size: '1216x640', // Runware Safe Size (Multiple of 64)
    quality: 'hd',
    style: 'vivid',
    provider: 'runware', // ONLY Runware.ai - No Fallbacks
}
```

---

## 🖼️ Image Generation Flow

### Featured Images
1. Article content is generated
2. Featured image prompt is created
3. **Runware.ai** generates image using `openai:4@1` model
4. Image is generated at configured size (default: 1216x640)
5. Image is uploaded to WordPress
6. WordPress Image Resizer optimizes it (if plugin is installed)

### Inline Images
1. AI generates content with `[IMAGE_PLACEHOLDER: description]` tags
2. For each placeholder:
   - **Runware.ai** generates image using `openai:4@1` model
   - Image is generated at configured size
   - Image is uploaded to WordPress
   - Placeholder is replaced with actual image

---

## 🔧 How to Configure Image Size

You can configure the image size in the settings at `https://wp.vjgp.online/settings`:

1. Go to **Image Generation** tab
2. Set **Image Size** to your desired dimensions (e.g., `1920x1080`, `1280x720`, `1024x1024`)
3. The system will automatically round to multiples of 64 for Runware compatibility

### Recommended Sizes

| Use Case | Size | Aspect Ratio |
|----------|------|--------------|
| Blog Featured Image | 1216x640 | ~16:9 |
| Social Media | 1280x640 | 2:1 |
| Square | 1024x1024 | 1:1 |
| Portrait | 640x1216 | 9:16 |
| HD Landscape | 1920x1080 | 16:9 |

---

## 📦 WordPress Image Resizer Plugin

### Installation

1. **Upload the plugin**:
   ```
   Copy wordpress-plugin/auto-image-resizer.php to:
   /wp-content/plugins/auto-image-resizer/auto-image-resizer.php
   ```

2. **Activate**:
   - Go to WordPress Admin → Plugins
   - Find "Auto Image Resizer for WordPress"
   - Click "Activate"

3. **Configure**:
   - Go to Settings → Image Resizer
   - Set max dimensions (default: 1920x1080)
   - Set JPEG quality (default: 85)

### Features
- ✅ Automatic resizing on upload
- ✅ Supports JPEG, PNG, GIF, WebP
- ✅ Maintains aspect ratio
- ✅ Preserves PNG transparency
- ✅ Configurable dimensions and quality
- ✅ Lightweight and fast (no external dependencies)

---

## 🚀 Testing the Changes

### Test Image Generation

1. Go to `https://wp.vjgp.online/settings`
2. Navigate to **Image Generation** tab
3. Scroll to **Test Image Generation**
4. Enter a prompt (e.g., "modern kitchen with island")
5. Select **Provider**: Runware
6. Select **Model**: openai:4@1
7. Click **Generate Test Image**
8. Verify the image is generated with high quality and realism

### Test Article Generation

1. Go to `https://wp.vjgp.online/`
2. Click **Generate Article with AI**
3. Enter a topic
4. The system will:
   - Generate article content
   - Generate featured image via Runware.ai (openai:4@1)
   - Upload to WordPress
   - Resize via WordPress plugin (if installed)

---

## 🔑 Required Configuration

Make sure you have configured:

1. **Runware API Key**:
   - Go to Settings → AI Settings
   - Enter your Runware API key

2. **WordPress Credentials**:
   - Go to Settings → WordPress Connection
   - Enter site URL, username, and app password

3. **OpenAI API Key** (for content generation):
   - Go to Settings → AI Settings
   - Enter your OpenAI API key

---

## 📊 System Logs

All image generation activities are logged in the System Logs:

- Go to Settings → System Logs
- View detailed logs of:
  - Image generation requests
  - Runware.ai API calls
  - Success/failure status
  - Image URLs and sizes

---

## ⚠️ Important Notes

1. **No Fallbacks**: If Runware.ai fails, no image will be generated. Ensure your Runware API key is valid and has sufficient credits.

2. **Size Constraints**: Runware requires dimensions to be multiples of 64. The system automatically rounds your configured size to meet this requirement.

3. **Model Format**: The model ID `openai:4@1` is a Runware model identifier. Do not change it unless you want to use a different Runware model.

4. **WordPress Plugin**: The image resizer plugin is optional but recommended for optimal performance.

---

## 🎨 Image Quality Settings

The system now uses enhanced prompts for maximum quality:

```
{user_prompt}, photorealistic, 8k, highly detailed, cinematic lighting, 
natural colors, professional photography. NO cartoon, NO illustration, 
NO text, NO watermark.
```

This ensures all generated images are:
- Photorealistic
- High resolution (8K quality)
- Professional-looking
- Free of text and watermarks

---

## 📞 Support

If you encounter any issues:

1. Check System Logs for error messages
2. Verify Runware API key is configured
3. Ensure Runware account has sufficient credits
4. Check that configured image size is valid

---

## 🔄 Rollback

If you need to restore fallback functionality, you can revert the changes in `server.js` by restoring the previous version from git history.

---

**Last Updated**: 2026-01-23
**Version**: 2.0.0 - Runware.ai Exclusive
