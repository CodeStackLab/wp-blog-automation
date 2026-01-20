# Deploying WordPress Automation App

This guide explains how to deploy this application to any host (VPS, DigitalOcean, AWS, etc.) using Docker.

## Prerequisites
- A server with **Docker** and **Docker Compose** installed.
- A domain name pointing to your server's IP (if using Traefik/SSL).

## 1. Clone the Repository
Clone your GitHub repository to the server:
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

## 2. Create Configuration File
Since `config.json` contains sensitive keys (OpenAI, WordPress passwords), it is **not** included in the repository. You must create it manually.

1. Copy the example config (or create new):
   ```bash
   cp app/config.example.json app/config.json
   ```
   *(Note: If you don't have an example file, create `app/config.json` with the structure below)*

2. Edit `app/config.json`:
   ```bash
   nano app/config.json
   ```

3. Paste your configuration:
   ```json
   {
     "wordpress": {
       "siteUrl": "https://your-wordpress-site.com",
       "username": "your-username",
       "appPassword": "your-app-password"
     },
     "openai": {
       "apiKey": "sk-...",
       "contentModel": "gpt-4",
       "imageModel": "dall-e-3"
     },
     "imageGeneration": {
       "provider": "dalle",
       "featuredEnabled": true,
       "size": "1024x1024",
       "quality": "standard",
       "style": "vivid"
     },
     "stockImages": {
       "pexelsApiKey": "",
       "unsplashApiKey": "",
       "pixabayApiKey": "..."
     },
     "tinymce": {
       "apiKey": "your-tinymce-key"
     },
     "automation": {
       "enabled": false,
       "schedule": "09:00",
       "minutesInterval": 30,
       "cronExpression": "0 9 * * *",
       "autoCreateCategories": true,
       "autoCreateTags": true,
       "dailyArticleLimit": 5
     },
     "content": {
       "language": "english",
       "includeConclusion": true,
       "includeFaq": true,
       "includeKeyTakeaways": true,
       "imagesPerPost": 4,
       "youtubeVideosPerPost": 1
     },
     "dashboardPreferences": {
       "customPrompt": "",
       "internalLinksCount": 3,
       "outboundLinksCount": 2,
       "imagesCount": 4,
       "readAlsoCount": 3
     }
   }
   ```

## 3. Deploy with Docker
Run the following command to build and start the container:

```bash
docker-compose up -d --build
```

## 4. Verify
- Check logs: `docker logs -f wp_automation_app`
- Access the app at `http://your-server-ip:3000` (or your domain if using Traefik).
