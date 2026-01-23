# Runware.ai Model Reference Guide

## 🎯 Current Configuration
**Active Model**: `civitai:4384@1` (Realistic Vision)  
**Status**: ✅ FIXED - Valid Runware Model

---

## ❌ Previous Issue

**Invalid Model**: `openai:4@1`  
**Error**: `Request failed with status code 400`  
**Reason**: This is not a valid Runware model ID format

---

## ✅ Valid Runware Models for Photorealistic Images

### Recommended Models (Highly Realistic)

| Model ID | Name | Description | Best For |
|----------|------|-------------|----------|
| `civitai:4384@1` | **Realistic Vision** ⭐ | Ultra photorealistic, natural lighting | General photography, real estate |
| `civitai:133005@1` | **RealVisXL** | Enhanced realism, high detail | Professional photos, marketing |
| `civitai:4201@1` | **Deliberate** | Versatile, balanced realism | Mixed content, versatile use |
| `runware:100@1` | **Runware Realism** | Runware's realistic model | General purpose |
| `civitai:25694@1` | **epiCRealism** | Cinematic realism | Dramatic scenes, storytelling |

### Popular Alternative Models

| Model ID | Name | Type | Use Case |
|----------|------|------|----------|
| `civitai:30163@1` | CyberRealistic | Realistic | Modern, tech-focused imagery |
| `civitai:6424@1` | Realistic Vision V5 | Realistic | Updated version with improvements |
| `civitai:7371@1` | Rev Animated | Semi-realistic | Artistic with realistic elements |

---

## 🎨 Model Selection Guide

### For Real Estate / Home Inspection (Current Use)
**Recommended**: `civitai:4384@1` (Realistic Vision) ⭐  
**Why**: Natural colors, realistic lighting, architectural accuracy

### For Product Photography
**Recommended**: `civitai:133005@1` (RealVisXL)  
**Why**: High detail, professional quality

### For Marketing/Commercial
**Recommended**: `civitai:25694@1` (epiCRealism)  
**Why**: Cinematic quality, eye-catching

### For General Blog Content
**Recommended**: `civitai:4384@1` (Realistic Vision)  
**Why**: Versatile, natural-looking, reliable

---

## 🔧 How to Change the Model

### Option 1: Via Settings (Recommended)
1. Go to https://wp.vjgp.online/settings
2. Navigate to **AI Settings** tab
3. Find **Image Model** field
4. Enter desired model ID (e.g., `civitai:4384@1`)
5. Click **Save Settings**

### Option 2: Direct Configuration
Edit `config.json`:
```json
{
  "openai": {
    "imageModel": "civitai:4384@1"
  }
}
```

---

## 📐 Model Format Explained

Runware models use this format:
```
provider:modelId@version
```

### Examples:
- `civitai:4384@1` 
  - **Provider**: CivitAI
  - **Model ID**: 4384
  - **Version**: 1

- `runware:100@1`
  - **Provider**: Runware
  - **Model ID**: 100
  - **Version**: 1

---

## 🧪 Testing Different Models

### Quick Test Method

1. Go to: https://wp.vjgp.online/settings
2. Navigate to **Image Generation** tab
3. Scroll to **Test Image Generation**
4. Enter test prompt: `"modern luxury kitchen with granite countertops"`
5. Select **Provider**: Runware
6. Select or enter **Model**: Try different models
7. Click **Generate Test Image**
8. Compare results

### Models to Test:
- ✅ `civitai:4384@1` - Realistic Vision (current default)
- ✅ `civitai:133005@1` - RealVisXL (enhanced detail)
- ✅ `civitai:25694@1` - epiCRealism (cinematic)
- ✅ `runware:100@1` - Runware Realism (safe choice)

---

## 📊 Model Comparison

### Realistic Vision (`civitai:4384@1`) - Current ⭐
**Strengths:**
- ✅ Highly photorealistic
- ✅ Natural colors and lighting
- ✅ Good for architecture and interiors
- ✅ Reliable and consistent
- ✅ Fast generation

**Best For:**
- Home inspection images
- Real estate photography
- Construction defects
- Interior/exterior shots

### RealVisXL (`civitai:133005@1`)
**Strengths:**
- ✅ Ultra-high detail
- ✅ Professional quality
- ✅ Enhanced textures
- ✅ Marketing-ready output

**Best For:**
- High-end marketing materials
- Product showcases
- Hero images

### epiCRealism (`civitai:25694@1`)
**Strengths:**
- ✅ Cinematic quality
- ✅ Dramatic lighting
- ✅ Eye-catching compositions
- ✅ Professional photography look

**Best For:**
- Featured images
- Social media
- Attention-grabbing content

---

## ⚙️ Advanced Configuration

### Using Custom CivitAI Models

1. Find a model on [CivitAI](https://civitai.com/)
2. Note the model ID from the URL (e.g., `civitai.com/models/4384`)
3. Use format: `civitai:MODEL_ID@VERSION`
4. Example: `civitai:4384@1`

### Version Numbers
- Most models use `@1` as the version
- Some models may have `@2`, `@3`, etc.
- Check the model page for available versions

---

## 🔍 Troubleshooting

### Error: "Request failed with status code 400"
**Cause**: Invalid model ID  
**Solution**: Use a valid model from the list above

### Error: "Runware API Key not configured"
**Cause**: Missing API key  
**Solution**: Add Runware API key in Settings → AI Settings

### Images Look Wrong/Unrealistic
**Solution**: Try different models:
- For more realism: `civitai:133005@1`
- For better lighting: `civitai:25694@1`
- For natural look: `civitai:4384@1`

### Generation Fails Intermittently
**Cause**: Model might be temporarily unavailable  
**Solution**: Try an alternative model like `runware:100@1`

---

## 📝 Current Status

✅ **Fixed**: Changed from invalid `openai:4@1` to valid `civitai:4384@1`  
✅ **Server**: Restarted and running  
✅ **Model**: Realistic Vision - Proven photorealistic model  
✅ **Ready**: System ready to generate images  

---

## 🚀 Next Generation

Your next article generation will use:
- **Model**: `civitai:4384@1` (Realistic Vision)
- **Quality**: Photorealistic, professional
- **Size**: 1216x640 (or your configured size)
- **Status**: ✅ Should work correctly now

---

## 📞 Support

If you encounter model-related issues:

1. **Check System Logs**: https://wp.vjgp.online/settings → System Logs
2. **Verify Model ID**: Must be in format `provider:id@version`
3. **Test Model**: Use test interface before running automation
4. **Try Alternative**: Switch to `runware:100@1` if issues persist

---

**Last Updated**: 2026-01-23  
**Current Model**: `civitai:4384@1` (Realistic Vision)  
**Status**: ✅ OPERATIONAL
