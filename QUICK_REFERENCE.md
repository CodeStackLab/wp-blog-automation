# Quick Reference - Runware.ai Image Generation

## 🎯 Current Configuration

**Image Provider**: Runware.ai ONLY (no fallbacks)  
**Model**: `openai:4@1` (Nano Banana High Quality Realistic)  
**Default Size**: `1216x640` (blog optimized, 16:9-ish)  
**Quality**: Photorealistic, 8K, cinematic  

---

## 🚀 Quick Start

### Access Settings
```
https://wp.vjgp.online/settings
```

### Test Image Generation
1. Go to Settings → Image Generation tab
2. Scroll to "Test Image Generation"
3. Enter prompt, select Provider: Runware, Model: openai:4@1
4. Click "Generate Test Image"

### Generate Article
1. Go to https://wp.vjgp.online
2. Click "Generate Article with AI"
3. System automatically uses Runware.ai for images

---

## 📐 Supported Image Sizes

All sizes automatically rounded to multiples of 64:

| Input Size | Actual Size | Use Case |
|------------|-------------|----------|
| 1216x640 | 1216x640 | Blog featured (default) |
| 1920x1080 | 1920x1088 | Full HD landscape |
| 1280x720 | 1280x704 | HD landscape |
| 1024x1024 | 1024x1024 | Square |
| 800x600 | 768x576 | Standard 4:3 |
| 640x1216 | 640x1216 | Portrait 9:16 |

---

## 🔑 Required API Keys

1. **Runware API Key** → Settings → AI Settings
2. **OpenAI API Key** → Settings → AI Settings (for content)
3. **WordPress Credentials** → Settings → WordPress Connection

---

## 🖼️ Image Quality Settings

Current prompts include:
- ✅ Photorealistic
- ✅ 8K quality
- ✅ Highly detailed
- ✅ Cinematic lighting
- ✅ Natural colors
- ✅ Professional photography
- ❌ NO cartoon/illustration
- ❌ NO text/watermarks

---

## 📊 System Status Check

```bash
# Check Docker container
docker ps | grep wp_automation

# View logs
docker logs --tail 50 wp_automation_app

# Restart if needed
cd /root/.gemini/antigravity/scratch/wp-automation
docker compose restart wp-automation-app
```

---

## 🔧 Common Configuration Changes

### Change Image Model
```
Settings → AI Settings → Image Model
Examples:
- openai:4@1 (current - high quality)
- google:4@2 (Nano Banana Pro)
- civitai:12345@1 (custom models)
```

### Change Image Size
```
Settings → Image Generation → Image Size
Format: WIDTHxHEIGHT
Example: 1920x1080
```

### Enable/Disable Features
```
Settings → Image Generation
- Featured Image: ON (default)
- Inline Images: Configure as needed
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `app/server.js` | Main application (modified) |
| `wordpress-plugin/auto-image-resizer.php` | WP plugin |
| `RUNWARE_UPDATE.md` | Detailed changes |
| `DEPLOYMENT_SUMMARY.md` | Deployment guide |
| `config.json` | Active configuration |

---

## ⚡ Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| No images generated | Check Runware API key in Settings |
| Wrong image size | Verify size in Settings → Image Generation |
| Low quality images | Wrong model? Should be openai:4@1 |
| API errors | Check System Logs for details |
| Container not running | Run: `docker compose restart wp-automation-app` |

---

## 📞 Support Commands

```bash
# View system logs (in browser)
https://wp.vjgp.online/settings → System Logs tab

# View Docker logs
docker logs wp_automation_app

# Check configuration
cat /root/.gemini/antigravity/scratch/wp-automation/app/config.json

# Restart server
cd /root/.gemini/antigravity/scratch/wp-automation
docker compose restart wp-automation-app
```

---

## ✅ Success Checklist

- [ ] Runware API key configured
- [ ] OpenAI API key configured  
- [ ] WordPress credentials configured
- [ ] Test image generation works
- [ ] Article generation produces quality images
- [ ] Images are photorealistic (openai:4@1)
- [ ] Images are correct size
- [ ] System Logs show no errors
- [ ] WordPress plugin installed (optional)

---

**Last Updated**: 2026-01-23  
**Version**: 2.0.0 - Runware.ai Exclusive
