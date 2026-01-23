const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const crypto = require('crypto');
const sharp = require('sharp');
require('dotenv').config();

const app = express();

const BLOG_RULES = `
✅ BLOG LENGTH & PURPOSE
Minimum 900+ words per blog
Written to be educational, viral, and SEO-driven
Focused on inspection deficiencies, safety issues, or common inspection findings
Written for home buyers, homeowners, and agents
Promote Inspection Time naturally (not salesy)

✅ SEO TITLE (H1) RULES
Focus keyword must be the very first words in the H1
Must include one strong power word (Hidden, Dangerous, Costly, Serious, Critical, etc.)
Should include a number when appropriate
Target 67 characters or less
Negative/emotional language is intentional and preferred
Do not repeat the focus keyword excessively in the title

✅ FOCUS KEYWORD RULES (STRICT)
Focus keyword must appear:
At the start of the H1
In the first sentence of the blog
In at least one H2 or H3
Target keyword density: ~2.25% (acceptable ~2.2–2.3%)
Avoid keyword stuffing
Use semantic variations and synonyms throughout
Exact-match usage must be tightly controlled

✅ BLOG STRUCTURE
Clear H2 / H3 headings
Easy-to-understand explanations
Inspector-authority tone without alarmism
Include a “Relevant Standards” section when applicable
IRC / IMC / IFGC / NEC / manufacturer listings
Educational only, not enforcement language

✅ LOCAL SEO RULES (MANDATORY)
Each blog must naturally reference Texas service areas, rotated and non-spammy:
Central Texas
North Texas
Dallas
Houston
San Antonio
Corpus Christi
Surrounding areas

✅ IMAGES
Include a featured image
Include additional images where helpful
Each image must have:
Alt text
Image title
Caption
Image description

✅ REQUIRED DELIVERABLES (EVERY BLOG)
You require ALL of the following every time:
Blog title
Blog description (900+ characters)
Post title
Meta description
Focus keyword
Featured image
Featured image alt text
Featured image title
Featured image caption
Featured image description

✅ STYLE, TONE & LIABILITY
Professional and educational
Not alarmist
No DIY instructions
No code-enforcement language
Written to reduce legal exposure
Clear inspector expertise without guarantees

✅ FINAL ENFORCEMENT RULES
SEO tool warnings about negative sentiment = ignore
One blog at a time unless requested otherwise
Never forget:
Keyword placement rules
Relevant Standards section
Images + metadata
Texas service-area mentions
`;
const PORT = process.env.PORT || 3000;

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

// In-memory storage (replace with database in production)
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Default Configuration
const defaultConfig = {
    wordpress: {
        siteUrl: '',
        username: '',
        appPassword: ''
    },
    openai: {
        apiKey: '',
        contentModel: 'gpt-4o',
        imageModel: 'openai:4@1' // Runware Nano Banana High Quality Model
    },
    imageGeneration: {
        featuredEnabled: true,
        inlineEnabled: false,
        inlineFrequency: 0,
        size: '1216x640', // Runware Safe Size (Multiple of 64)
        quality: 'hd',
        style: 'vivid',
        provider: 'pixabay', // Default to Stock as per user request
    },
    youtube: {
        apiKey: '',
        enabled: false,
        frequency: 3
    },
    stockImages: {
        unsplashApiKey: '',
        pexelsApiKey: '',
        pixabayApiKey: '',
    },
    runware: {
        apiKey: ''
    },
    tinymce: {
        apiKey: 'zqwjq3mg6oca4mssnuouk3ecc2am2az9smwd8fhs97mkr80t'
    },
    automation: {
        enabled: false,
        schedule: 'daily',
        minutesInterval: 5,
        dailyArticleLimit: 5,
        keywords: [],
        autoCreateCategories: true,
        autoCreateTags: true,
        cronExpression: '0 9 * * *'
    },
    content: {
        defaultKeywords: '',
        customPrompt: '',
        imageCustomPrompt: '',
        articleLength: '1200-1500',
        imagesPerPost: 1,
        includeInternalLinks: true,
        internalLinksCount: 3,
        includeReadAlso: true,
        readAlsoCount: 3,
        includeCallToAction: true,
        callToActionText: 'Learn more',
        callToActionUrl: '',
        includeOutboundLinks: true,
        outboundLinksCount: 2,
        articleInstructions: ''
    },
    dashboardPreferences: {
        customPrompt: '',
        internalLinksCount: 3,
        outboundLinksCount: 2,
        imagesCount: 1,
        readAlsoCount: 3
    }
};

// Initialize config - Deep clone default
let config = JSON.parse(JSON.stringify(defaultConfig));

// Load saved config
if (fs.existsSync(CONFIG_FILE)) {
    try {
        console.log('Loading configuration from', CONFIG_FILE);
        const savedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

        // Robust merge
        ['wordpress', 'openai', 'imageGeneration', 'youtube', 'stockImages', 'automation', 'content', 'dashboardPreferences', 'runware'].forEach(key => {
            if (savedConfig[key]) {
                config[key] = { ...config[key], ...savedConfig[key] };
            }
        });

    } catch (error) {
        console.error('Error loading config file:', error);
    }
}

// --- System Logging Infrastructure ---
const SYSTEM_LOGS = [];
const MAX_LOGS = 500;

function addLog(level, message, meta = null) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level, // 'info', 'error', 'success', 'warning'
        message,
        meta: meta ? (typeof meta === 'object' ? JSON.stringify(meta) : String(meta)) : null
    };
    SYSTEM_LOGS.unshift(logEntry);
    if (SYSTEM_LOGS.length > MAX_LOGS) SYSTEM_LOGS.pop();

    // Output to console with color for dev visibility
    const color = level === 'error' ? '\x1b[31m' : (level === 'success' ? '\x1b[32m' : (level === 'warning' ? '\x1b[33m' : '\x1b[36m'));
    const metaStr = meta ? ` | ${typeof meta === 'object' ? JSON.stringify(meta) : meta}` : '';
    console.log(`${color}[${level.toUpperCase()}] ${message}\x1b[0m${metaStr}`);
}

// Override default console for better capturing (optional, but let's keep separate for safety)

// ...

function saveConfig() {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        addLog('info', 'Configuration saved to disk');
    } catch (error) {
        console.error('Error saving config:', error);
        addLog('error', 'Failed to save configuration', error.message);
    }
}

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
};

// API to fetch logs
app.get('/api/system-logs', requireAuth, (req, res) => {
    res.json(SYSTEM_LOGS);
});

// API to clear logs
app.post('/api/system-logs/clear', requireAuth, (req, res) => {
    SYSTEM_LOGS.length = 0; // Clear array in-place
    res.json({ success: true, message: 'Logs cleared successfully' });
});




let articles = [];
let schedulers = []; // Array to support multiple staggered schedules
let isAutomationRunning = false; // Lock to prevent overlapping tasks

// Automation Task Runner
async function runSingleAutomationTask() {
    console.log('Running single article automation task...');

    if (isAutomationRunning) {
        console.log('⚠️ Skipping scheduled task: A previous automation task is still running.');
        return;
    }

    isAutomationRunning = true;

    try {
        // Pick a keyword/topic
        let topic = '';

        // Prioritize AUTOMATION keywords list (array)
        if (config.automation.keywords && config.automation.keywords.length > 0) {
            const keywords = config.automation.keywords;
            topic = keywords[Math.floor(Math.random() * keywords.length)];
        }
        // Fallback to defaultKeywords string (legacy)
        else if (config.content.defaultKeywords && config.content.defaultKeywords.length > 0) {
            const keywords = config.content.defaultKeywords.split(',').map(k => k.trim()).filter(k => k);
            if (keywords.length > 0) {
                topic = keywords[Math.floor(Math.random() * keywords.length)];
            }
        }

        if (!topic) {
            console.log('No keywords configured for automation.');
            addLog('warning', 'Automation ran but no keywords configured');
            return;
        }

        console.log(`Deep Analysis: Generating comprehensive article for topic: ${topic}`);
        addLog('info', `Long-Form Automation Started: ${topic} (Estimated duration: 5-8 minutes)`);



        // 3. Generate Content (Reuse logic from /api/generate-article but via internal call or refactoring)
        // For simplicity, we'll verify credentials first
        if (!config.openai.apiKey || !config.wordpress.siteUrl) {
            console.log('Missing API Key or WP URL');
            return;
        }

        // Log all configuration settings being used
        addLog('info', 'Deep Background Analysis Settings', {
            topic: topic,
            articleLength: config.content.articleLength,
            imageProvider: config.imageGeneration.provider,
            imageModel: config.openai.imageModel,
            imageSize: config.imageGeneration.size,
            imageQuality: config.imageGeneration.quality,
            imageStyle: config.imageGeneration.style,
            imagesPerPost: config.content.imagesPerPost,
            internalLinks: config.content.internalLinksCount,
            outboundLinks: config.content.outboundLinksCount,
            readAlsoCount: config.content.readAlsoCount,
            youtubeEnabled: config.youtube.enabled,
            customPrompt: config.content.customPrompt ? 'Yes' : 'No',
            imageCustomPrompt: config.content.imageCustomPrompt ? 'Yes' : 'No',
            articleInstructions: config.content.articleInstructions ? 'Yes' : 'No'
        });

        // Generate ArticleLogic - Using ALL configuration settings
        const articleData = await generateArticleLogic({
            // Topic & Keywords (from Keywords Configuration tab)
            topic: topic,
            keywords: topic,
            tone: 'professional',

            // Article Settings (from Instructions & Prompts tab)
            length: '1500-2000', // Enforce LONG form for scheduled articles
            customPrompt: config.content.customPrompt,
            articleInstructions: config.content.articleInstructions,

            // Image Generation Settings (from Image Generation tab)
            imageProvider: config.imageGeneration.provider,
            imageModel: config.openai.imageModel,
            imageCustomPrompt: config.content.imageCustomPrompt,
            featuredEnabled: true,
            inlineEnabled: false, // FORCE DISABLED for scheduled tasks
            inlineFrequency: 0,
            imageSize: config.imageGeneration.size,
            imageQuality: config.imageGeneration.quality,
            imageStyle: config.imageGeneration.style,
            imagesPerPost: 0,

            // YouTube Settings 
            youtubeEnabled: false, // FORCE DISABLED
            youtubeFrequency: 0,

            // SEO & Structure Settings (from SEO Configuration tab)
            includeInternalLinks: config.content.includeInternalLinks,
            internalLinksCount: config.content.internalLinksCount,
            includeOutboundLinks: config.content.includeOutboundLinks,
            outboundLinksCount: config.content.outboundLinksCount,
            includeReadAlso: config.content.includeReadAlso,
            readAlsoCount: config.content.readAlsoCount,

            // Call to Action Settings (from Article Settings)
            includeCallToAction: config.content.includeCallToAction,
            callToActionText: config.content.callToActionText,
            callToActionUrl: config.content.callToActionUrl,

            // Automation Settings
            autoTags: config.automation.autoCreateTags
        });

        // Publish to WordPress logic
        const auth = Buffer.from(`${config.wordpress.username}:${config.wordpress.appPassword}`).toString('base64');

        // Ensure Category exists to avoid "Uncategorized"
        let categoryId = 1; // Default
        if (config.automation.autoCreateCategories) {
            try {
                // Check if exists
                const catsRes = await axios.get(`${config.wordpress.siteUrl}/wp-json/wp/v2/categories?search=${encodeURIComponent(topic)}`, {
                    headers: { 'Authorization': `Basic ${auth}` }
                });

                if (catsRes.data && catsRes.data.length > 0) {
                    categoryId = catsRes.data[0].id; // Use best match
                } else {
                    // Create new
                    const createCatRes = await axios.post(`${config.wordpress.siteUrl}/wp-json/wp/v2/categories`, {
                        name: topic
                    }, {
                        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }
                    });
                    categoryId = createCatRes.data.id;
                    addLog('info', `Created new category: ${topic}`);
                }
            } catch (catErr) {
                console.error('Category error:', catErr.message);
                addLog('warning', 'Failed to handle category, using default.');
            }
        }

        const postData = {
            title: articleData.title,
            content: articleData.content,
            status: 'publish',
            categories: [categoryId], // Assign the category
            tags: [],
            featured_media: undefined // We need to handle this below
        };

        // Handle Featured Image Upload if URL exists
        if (articleData.featuredImageUrl) {
            try {
                let imgBuffer;

                // Check if it's a base64 data URL (from resizer) or regular URL
                if (articleData.featuredImageUrl.startsWith('data:image')) {
                    // Extract base64 data from data URL
                    const base64Data = articleData.featuredImageUrl.split(',')[1];
                    imgBuffer = Buffer.from(base64Data, 'base64');
                    addLog('info', 'Uploading resized image to WordPress...');
                } else {
                    // Download image from URL
                    const imgRes = await axios.get(articleData.featuredImageUrl, { responseType: 'arraybuffer' });
                    imgBuffer = Buffer.from(imgRes.data, 'binary');
                    addLog('info', 'Uploading original image to WordPress...');
                }

                // Upload image directly to WordPress
                const uploadRes = await axios.post(`${config.wordpress.siteUrl}/wp-json/wp/v2/media`, imgBuffer, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'image/jpeg',
                        'Content-Disposition': `attachment; filename="featured-${Date.now()}.jpg"`
                    }
                });

                const mediaId = uploadRes.data.id;
                postData.featured_media = mediaId;

                // 2. Update Media Details (Alt, Title, Caption, Description)
                if (articleData.featuredImageDetails) {
                    const { alt_text, title, caption, description } = articleData.featuredImageDetails;
                    await axios.post(`${config.wordpress.siteUrl}/wp-json/wp/v2/media/${mediaId}`, {
                        alt_text: alt_text || articleData.title,
                        title: title || articleData.title,
                        caption: caption || '',
                        description: description || ''
                    }, {
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'Content-Type': 'application/json'
                        }
                    });
                }

                addLog('success', 'Featured image uploaded to WordPress', { mediaId });

            } catch (err) {
                console.error('Failed to upload/update featured image:', err.message);
                addLog('error', 'Failed to upload featured image', err.message);
            }
        }

        // Set Excerpt/Meta Description
        if (articleData.meta_description) {
            postData.excerpt = articleData.meta_description;
        }




        const wpRes = await axios.post(`${config.wordpress.siteUrl}/wp-json/wp/v2/posts`, postData, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });

        // Log success
        articles.unshift({
            id: wpRes.data.id,
            title: wpRes.data.title.rendered,
            status: wpRes.data.status,
            link: wpRes.data.link,
            date: new Date()
        });

        console.log(`Successfully published article: ${articleData.title} (ID: ${wpRes.data.id})`);
        addLog('success', `Article published successfully to WordPress`, { postId: wpRes.data.id, link: wpRes.data.link });

    } catch (error) {
        console.error('Automation task failed:', error.message);
        addLog('error', 'Automation task completed with errors', error.message);
    } finally {
        isAutomationRunning = false;
        console.log('Automation task finished. Lock released.');
        addLog('info', 'Automation task sequence finished');
    }
}

// Scheduler management

function initializeScheduler() {
    // Stop existing schedulers
    if (schedulers.length > 0) {
        schedulers.forEach(s => s.stop());
        schedulers = [];
    }

    if (!config.automation.enabled) {
        console.log('Automation disabled');
        return;
    }

    if (config.automation.schedule === 'interval' || config.automation.schedule === 'minutes') {
        const interval = config.automation.minutesInterval || 5;
        // Construct cron for every X minutes
        // Note: standard cron for "every X minutes" is `* / X * * * *` (without spaces)
        // If interval is 1, it's `* * * * *`
        const cronExp = `*/${interval} * * * *`;

        console.log(`\n🕐 Setting up INTERVAL schedule: Every ${interval} minute(s) (cron: ${cronExp})`);

        const scheduler = cron.schedule(cronExp, () => {
            console.log(`\n⏰ Running scheduled article (Interval: ${interval}m)`);
            runSingleAutomationTask();
        });

        scheduler.start();
        schedulers.push(scheduler);

        console.log(`✅ Interval scheduling active.`);
        return;
    }

    const dailyLimit = config.automation.dailyArticleLimit || 1;

    // Calculate time slots for staggered publishing
    // Distribute articles evenly throughout the day (9 AM to 9 PM = 12 hours)
    const startHour = 9;  // 9 AM
    const endHour = 21;   // 9 PM
    const totalHours = endHour - startHour;

    // Calculate hour intervals
    // Calculate hour intervals with override support
    const requestedGap = config.automation.hoursGap;
    const hourGap = requestedGap ? parseFloat(requestedGap) : (dailyLimit > 1 ? totalHours / (dailyLimit - 1) : 0);

    console.log(`\n🕐 Setting up ${dailyLimit} staggered schedules throughout the day:`);

    for (let i = 0; i < dailyLimit; i++) {
        let hour;
        if (dailyLimit === 1) {
            hour = startHour; // Single article at 9 AM
        } else {
            hour = Math.floor(startHour + (i * hourGap));
        }

        // Create cron expression for this time slot (minute hour * * *)
        const cronExp = `0 ${hour} * * *`;

        const timeStr = `${hour}:00`;
        console.log(`  📅 Schedule ${i + 1}/${dailyLimit}: ${timeStr} (cron: ${cronExp})`);

        const scheduler = cron.schedule(cronExp, () => {
            console.log(`\n⏰ Running scheduled article generation (slot ${i + 1}/${dailyLimit} at ${timeStr})`);
            runSingleAutomationTask();
        });

        scheduler.start();
        schedulers.push(scheduler);
    }

    console.log(`\n✅ Staggered scheduling active: ${dailyLimit} articles will publish throughout the day\n`);
}

function manageScheduler() {
    initializeScheduler();
}

// Authentication middleware


// Routes
app.get('/', requireAuth, (req, res) => {
    res.render('dashboard', {
        config,
        articles: articles.slice(0, 10),
        user: req.session.user
    });
});

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Default credentials (change these!)
    const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === defaultUsername && password === defaultPassword) {
        req.session.authenticated = true;
        req.session.user = username;

        // Explicitly save session before redirect
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.render('login', { error: 'Login failed. Please try again.' });
            }
            res.redirect('/');
        });
    } else {
        res.render('login', { error: 'Invalid credentials' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/settings', requireAuth, (req, res) => {
    res.render('settings', { config });
});

// API Routes
app.get('/api/config', requireAuth, (req, res) => {
    // Hide sensitive keys
    const safeConfig = JSON.parse(JSON.stringify(config));
    safeConfig.wordpress.appPassword = config.wordpress.appPassword ? '********' : '';
    safeConfig.openai.apiKey = config.openai.apiKey ? '********' : '';
    safeConfig.stockImages.unsplashApiKey = config.stockImages.unsplashApiKey ? '********' : '';
    safeConfig.stockImages.pexelsApiKey = config.stockImages.pexelsApiKey ? '********' : '';
    safeConfig.stockImages.pixabayApiKey = config.stockImages.pixabayApiKey ? '********' : '';
    safeConfig.youtube.apiKey = config.youtube.apiKey ? '********' : '';
    res.json(safeConfig);
});

// Health Check Endpoint
app.get('/health', (req, res) => {
    const health = {
        uptime: process.uptime(),
        timestamp: Date.now(),
        status: 'OK',
        memory: process.memoryUsage()
    };
    res.json(health);
});

app.post('/api/settings', requireAuth, async (req, res) => {
    try {
        const {
            wpSiteUrl, wpUsername, wpAppPassword,
            openaiApiKey, contentModel, imageModel,
            imageFeaturedEnabled, imageInlineEnabled, imageInlineFrequency, imageSize, imageQuality, imageStyle, imageProvider, // Updated image params
            youtubeApiKey, youtubeEnabled, youtubeFrequency, // New YouTube params
            unsplashApiKey, pexelsApiKey, pixabayApiKey, runwareApiKey, googleApiKey, googleSearchEngineId, // Added Google
            defaultKeywords, customPrompt, imageCustomPrompt, imagesPerPost, articleLength,
            includeInternalLinks, internalLinksCount, includeReadAlso, readAlsoCount,
            includeCallToAction, callToActionText, callToActionUrl,
            includeOutboundLinks, outboundLinksCount, articleInstructions,
            dailyArticleLimit,
            cronExpression,
            // New automation settings
            automationEnabled, automationSchedule, autoCreateCategories, autoCreateTags
        } = req.body;

        if (wpSiteUrl !== undefined) config.wordpress.siteUrl = wpSiteUrl;
        if (wpUsername !== undefined) config.wordpress.username = wpUsername;
        if (wpAppPassword && wpAppPassword !== '********') config.wordpress.appPassword = wpAppPassword;

        if (openaiApiKey && openaiApiKey !== '********') config.openai.apiKey = openaiApiKey;
        if (contentModel !== undefined) config.openai.contentModel = contentModel;
        if (imageModel !== undefined) config.openai.imageModel = imageModel;

        if (runwareApiKey && runwareApiKey !== '********') {
            if (!config.runware) config.runware = {};
            config.runware.apiKey = runwareApiKey;
        }

        if (googleApiKey && googleApiKey !== '********') config.stockImages.googleApiKey = googleApiKey;
        if (googleSearchEngineId !== undefined) config.stockImages.googleSearchEngineId = googleSearchEngineId;

        // Image Settings
        if (imageFeaturedEnabled !== undefined) config.imageGeneration.featuredEnabled = imageFeaturedEnabled;
        if (imageInlineEnabled !== undefined) config.imageGeneration.inlineEnabled = imageInlineEnabled;
        if (imageInlineFrequency !== undefined) config.imageGeneration.inlineFrequency = parseInt(imageInlineFrequency) || 2;
        if (imageSize !== undefined) config.imageGeneration.size = imageSize;
        if (imageQuality !== undefined) config.imageGeneration.quality = imageQuality;
        if (imageStyle !== undefined) config.imageGeneration.style = imageStyle;
        if (imageProvider !== undefined) config.imageGeneration.provider = imageProvider;

        // YouTube Settings
        if (youtubeApiKey && youtubeApiKey !== '********') config.youtube.apiKey = youtubeApiKey;
        if (youtubeEnabled !== undefined) config.youtube.enabled = youtubeEnabled;
        if (youtubeFrequency !== undefined) config.youtube.frequency = parseInt(youtubeFrequency) || 3;

        if (unsplashApiKey && unsplashApiKey !== '********') config.stockImages.unsplashApiKey = unsplashApiKey;
        if (pexelsApiKey && pexelsApiKey !== '********') config.stockImages.pexelsApiKey = pexelsApiKey;
        if (pixabayApiKey && pixabayApiKey !== '********') config.stockImages.pixabayApiKey = pixabayApiKey;


        if (defaultKeywords !== undefined) config.content.defaultKeywords = defaultKeywords;
        if (customPrompt !== undefined) config.content.customPrompt = customPrompt;
        if (imageCustomPrompt !== undefined) config.content.imageCustomPrompt = imageCustomPrompt;
        if (articleLength !== undefined) config.content.articleLength = articleLength;
        if (imagesPerPost !== undefined) config.content.imagesPerPost = parseInt(imagesPerPost) || 1;
        if (includeInternalLinks !== undefined) config.content.includeInternalLinks = includeInternalLinks;
        if (internalLinksCount !== undefined) config.content.internalLinksCount = parseInt(internalLinksCount) || 3;
        if (includeReadAlso !== undefined) config.content.includeReadAlso = includeReadAlso;
        if (readAlsoCount !== undefined) config.content.readAlsoCount = parseInt(readAlsoCount) || 3;
        if (includeCallToAction !== undefined) config.content.includeCallToAction = includeCallToAction;
        if (callToActionText !== undefined) config.content.callToActionText = callToActionText;
        if (callToActionUrl !== undefined) config.content.callToActionUrl = callToActionUrl;
        if (includeOutboundLinks !== undefined) config.content.includeOutboundLinks = includeOutboundLinks;
        if (outboundLinksCount !== undefined) config.content.outboundLinksCount = parseInt(outboundLinksCount) || 2;
        if (articleInstructions !== undefined) config.content.articleInstructions = articleInstructions;
        if (dailyArticleLimit !== undefined) config.automation.dailyArticleLimit = parseInt(dailyArticleLimit) || 5;

        // Automation Settings
        if (automationEnabled !== undefined) config.automation.enabled = automationEnabled;
        if (automationSchedule !== undefined) config.automation.schedule = automationSchedule;
        if (cronExpression !== undefined) config.automation.cronExpression = cronExpression;
        if (autoCreateCategories !== undefined) config.automation.autoCreateCategories = autoCreateCategories;
        if (autoCreateTags !== undefined) config.automation.autoCreateTags = autoCreateTags;

        saveConfig(); // Persist changes

        // Restart scheduler if automation settings changed
        if (automationEnabled !== undefined || automationSchedule !== undefined || cronExpression !== undefined) {
            manageScheduler();
        }

        res.json({ success: true, message: 'Settings saved successfully' });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ success: false, message: 'Failed to save settings' });
    }
});

// New Endpoint: Save Dashboard Preferences (Isolated from global settings)
app.post('/api/save-dashboard-preferences', requireAuth, async (req, res) => {
    try {
        const { customPrompt, internalLinksCount, outboundLinksCount, imagesCount, readAlsoCount } = req.body;

        // Update dashboard-specific config
        config.dashboardPreferences = {
            customPrompt: customPrompt !== undefined ? customPrompt : config.dashboardPreferences.customPrompt,
            internalLinksCount: parseInt(internalLinksCount) || 3,
            outboundLinksCount: parseInt(outboundLinksCount) || 2,
            imagesCount: parseInt(imagesCount) || 1,
            readAlsoCount: parseInt(readAlsoCount) || 3
        };

        saveConfig();
        res.json({ success: true, message: 'Dashboard preferences saved successfully' });
    } catch (error) {
        console.error('Error saving dashboard preferences:', error);
        res.status(500).json({ success: false, message: 'Failed to save preferences' });
    }
});

app.post('/api/test-wordpress', requireAuth, async (req, res) => {
    try {
        const { wpSiteUrl, wpUsername, wpAppPassword } = req.body;

        const auth = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString('base64');
        const response = await axios.get(`${wpSiteUrl}/wp-json/wp/v2/users/me`, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        res.json({ success: true, message: 'WordPress connection successful', data: response.data });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'WordPress connection failed: ' + error.message
        });
    }
});

// Fetch WordPress categories
app.get('/api/wordpress/categories', requireAuth, async (req, res) => {
    try {
        if (!config.wordpress.siteUrl || !config.wordpress.username || !config.wordpress.appPassword) {
            return res.status(400).json({
                success: false,
                message: 'WordPress credentials not configured'
            });
        }

        const auth = Buffer.from(`${config.wordpress.username}:${config.wordpress.appPassword}`).toString('base64');
        const response = await axios.get(`${config.wordpress.siteUrl}/wp-json/wp/v2/categories?per_page=100`, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        res.json({
            success: true,
            categories: response.data.map(cat => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                count: cat.count
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories: ' + error.message
        });
    }
});

// Fetch WordPress tags
app.get('/api/wordpress/tags', requireAuth, async (req, res) => {
    try {
        if (!config.wordpress.siteUrl || !config.wordpress.username || !config.wordpress.appPassword) {
            return res.status(400).json({
                success: false,
                message: 'WordPress credentials not configured'
            });
        }

        const auth = Buffer.from(`${config.wordpress.username}:${config.wordpress.appPassword}`).toString('base64');
        const response = await axios.get(`${config.wordpress.siteUrl}/wp-json/wp/v2/tags?per_page=100`, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        res.json({
            success: true,
            tags: response.data.map(tag => ({
                id: tag.id,
                name: tag.name,
                slug: tag.slug,
                count: tag.count
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tags: ' + error.message
        });
    }
});

// Create or get category
app.post('/api/wordpress/category', requireAuth, async (req, res) => {
    try {
        const { name } = req.body;

        if (!config.wordpress.siteUrl || !config.wordpress.username || !config.wordpress.appPassword) {
            return res.status(400).json({
                success: false,
                message: 'WordPress credentials not configured'
            });
        }

        const auth = Buffer.from(`${config.wordpress.username}:${config.wordpress.appPassword}`).toString('base64');

        // First, try to find existing category
        const searchResponse = await axios.get(
            `${config.wordpress.siteUrl}/wp-json/wp/v2/categories?search=${encodeURIComponent(name)}`,
            {
                headers: { 'Authorization': `Basic ${auth}` }
            }
        );

        // Check if exact match exists
        const existingCategory = searchResponse.data.find(cat =>
            cat.name.toLowerCase() === name.toLowerCase()
        );

        if (existingCategory) {
            return res.json({
                success: true,
                category: {
                    id: existingCategory.id,
                    name: existingCategory.name,
                    slug: existingCategory.slug
                },
                created: false
            });
        }

        // Create new category
        const createResponse = await axios.post(
            `${config.wordpress.siteUrl}/wp-json/wp/v2/categories`,
            { name: name },
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({
            success: true,
            category: {
                id: createResponse.data.id,
                name: createResponse.data.name,
                slug: createResponse.data.slug
            },
            created: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create/get category: ' + error.message
        });
    }
});

// Create or get tag
app.post('/api/wordpress/tag', requireAuth, async (req, res) => {
    try {
        const { name } = req.body;

        if (!config.wordpress.siteUrl || !config.wordpress.username || !config.wordpress.appPassword) {
            return res.status(400).json({
                success: false,
                message: 'WordPress credentials not configured'
            });
        }

        const auth = Buffer.from(`${config.wordpress.username}:${config.wordpress.appPassword}`).toString('base64');

        // First, try to find existing tag
        const searchResponse = await axios.get(
            `${config.wordpress.siteUrl}/wp-json/wp/v2/tags?search=${encodeURIComponent(name)}`,
            {
                headers: { 'Authorization': `Basic ${auth}` }
            }
        );

        // Check if exact match exists
        const existingTag = searchResponse.data.find(tag =>
            tag.name.toLowerCase() === name.toLowerCase()
        );

        if (existingTag) {
            return res.json({
                success: true,
                tag: {
                    id: existingTag.id,
                    name: existingTag.name,
                    slug: existingTag.slug
                },
                created: false
            });
        }

        // Create new tag
        const createResponse = await axios.post(
            `${config.wordpress.siteUrl}/wp-json/wp/v2/tags`,
            { name: name },
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({
            success: true,
            tag: {
                id: createResponse.data.id,
                name: createResponse.data.name,
                slug: createResponse.data.slug
            },
            created: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create/get tag: ' + error.message
        });
    }
});

// Helper: Search Stock Images
async function searchStockImages(provider, query, count = 1) {
    try {
        let images = [];

        if (provider === 'unsplash' && config.stockImages.unsplashApiKey) {
            const response = await axios.get(`https://api.unsplash.com/search/photos`, {
                params: { query, per_page: count, orientation: 'landscape' },
                headers: { 'Authorization': `Client-ID ${config.stockImages.unsplashApiKey}` }
            });
            images = response.data.results.map(img => ({
                url: img.urls.regular,
                credit: `Photo by ${img.user.name} on Unsplash`,
                source: 'Unsplash'
            }));
        } else if (provider === 'pexels' && config.stockImages.pexelsApiKey) {
            const response = await axios.get(`https://api.pexels.com/v1/search`, {
                params: { query, per_page: count, orientation: 'landscape' },
                headers: { 'Authorization': config.stockImages.pexelsApiKey }
            });
            images = response.data.photos.map(img => ({
                url: img.src.large,
                credit: `Photo by ${img.photographer} on Pexels`,
                source: 'Pexels'
            }));
        } else if (provider === 'pixabay' && config.stockImages.pixabayApiKey) {
            const response = await axios.get(`https://pixabay.com/api/`, {
                params: {
                    key: config.stockImages.pixabayApiKey,
                    q: query,
                    per_page: count,
                    orientation: 'horizontal',
                    image_type: 'photo'
                }
            });
            images = response.data.hits.map(img => ({
                url: img.largeImageURL,
                credit: `Image by ${img.user} from Pixabay`,
                source: 'Pixabay'
            }));
        } else if (provider === 'google' && config.stockImages.googleApiKey && config.stockImages.googleSearchEngineId) {
            images = await searchGoogleImages(query, count);
        }

        return images;
    } catch (error) {
        console.error(`Error fetching stock images from ${provider}:`, error.message);
        return [];
    }
}

// Helper: Get Single Stock Image (Wrapper)
async function getStockImage(query, provider) {
    const images = await searchStockImages(provider, query, 1);
    return images.length > 0 ? images[0].url : '';
}

// Helper: Search YouTube Videos
async function searchYoutubeVideos(query, count = 1) {
    try {
        if (!config.youtube.apiKey) return [];

        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query,
                key: config.youtube.apiKey,
                type: 'video',
                maxResults: count
            }
        });

        return response.data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.high.url
        }));
    } catch (error) {
        console.error('Error searching YouTube:', error.message);
        return [];
    }
}

// Helper: Search Google Images
async function searchGoogleImages(query, count = 1) {
    try {
        if (!config.stockImages.googleApiKey || !config.stockImages.googleSearchEngineId) {
            console.error('Missing Google Search API Key or CX ID');
            return [];
        }

        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
                q: query,
                cx: config.stockImages.googleSearchEngineId,
                key: config.stockImages.googleApiKey,
                searchType: 'image',
                num: Math.min(count, 10), // Max 10 per request
                safe: 'active',
                imgSize: 'large' // Prefer large images
            }
        });

        if (!response.data.items) return [];

        return response.data.items.map(item => ({
            url: item.link,
            credit: `Image from ${item.displayLink}`,
            source: 'Google',
            thumbnail: item.image.thumbnailLink
        }));
    } catch (error) {
        console.error('Error searching Google Images:', error.message);
        addLog('error', 'Google Image Search failed', error.message);
        return [];
    }
}

// Helper: Check if provider is AI-based
function isAIProvider(provider) {
    const aiProviders = ['dalle', 'dall-e-2', 'dall-e-3', 'gpt-image-1.5', 'gpt-image-1', 'gpt-image-1-mini', 'chatgpt-image-latest', 'runware'];
    return aiProviders.includes(provider);
}

// Search Stock Images Endpoint
app.get('/api/stock-images/search', requireAuth, async (req, res) => {
    try {
        const { provider, query, count } = req.query;

        if (!provider || !query) {
            return res.status(400).json({ success: false, message: 'Provider and query are required' });
        }

        const images = await searchStockImages(provider, query, parseInt(count) || 10);
        res.json({ success: true, images });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to search images: ' + error.message });
    }
});

async function generateArticleLogic(params) {
    const { topic, keywords, tone, length, customPrompt, imageProvider,
        featuredEnabled, inlineEnabled, inlineFrequency,
        youtubeEnabled, youtubeFrequency,
        autoTags, customTags,
        // New overrides
        apiKey, contentModel, imageModel,
        includeInternalLinks, internalLinksCount,
        includeOutboundLinks, outboundLinksCount,
        includeCallToAction, callToActionText, callToActionUrl,
        includeReadAlso, readAlsoCount,
        imagesPerPost, // Added parameter
        // Image generation settings
        imageSize, imageQuality, imageStyle, imageCustomPrompt,
        // Article instructions
        articleInstructions
    } = params;

    // --- Configuration Overrides ---
    // Use params if provided, otherwise fall back to global config
    // SEO Overrides - FORCE ENABLE for Automation
    const effectiveInternalLinks = true; // FORCE TRUE
    const effectiveInternalCount = internalLinksCount || config.content.internalLinksCount || 5;
    const effectiveOutboundLinks = true; // FORCE TRUE

    const effectiveOutboundCount = outboundLinksCount || config.content.outboundLinksCount || 5;

    // Image Count Override - FORCE 4-5 Images
    // Image Count Override
    const effectiveImageCount = imagesPerPost !== undefined ? imagesPerPost : (config.content.imagesPerPost || 5);

    // --- Configuration Overrides ---
    // Use params if provided, otherwise fall back to global config
    const effectiveApiKey = apiKey || config.openai.apiKey;
    const effectiveContentModel = contentModel || config.openai.contentModel || 'gpt-4o';

    const effectiveFeatured = featuredEnabled !== undefined ? featuredEnabled : config.imageGeneration.featuredEnabled;
    const effectiveInline = inlineEnabled !== undefined ? inlineEnabled : config.imageGeneration.inlineEnabled;
    const effectiveInlineFreq = inlineFrequency !== undefined ? inlineFrequency : config.imageGeneration.inlineFrequency;
    const effectiveYoutube = youtubeEnabled !== undefined ? youtubeEnabled : config.youtube.enabled;
    const effectiveYoutubeFreq = youtubeFrequency !== undefined ? youtubeFrequency : config.youtube.frequency;
    const provider = imageProvider || config.imageGeneration.provider || 'dalle';

    const effectivePrompt = customPrompt || config.content.customPrompt || '';
    const effectiveLength = length || config.content.articleLength || '1500-2000';

    // --- System Prompt Construction ---
    let systemPrompt = `You are an expert professional content writer specializing in LONG-TAIL deep-dive articles. Your goal is to write a comprehensive, exhaustive guide of at least ${effectiveLength} words about "${topic}".
    
    CRITICAL INSTRUCTIONS FOR EXTREME LENGTH & QUALITY:
    1. LENGTH: The article MUST be between 1500 and 2000 words. DO NOT use placeholders like "..." or snippets. Every section must be fully written.
    2. STRUCTURE: Use at least 10-15 detailed H2 and H3 subsections. Each section must contain 4-6 long, informative paragraphs.
    3. NO FILLER: DO NOT include navigational fluff like "Discover more", "Read now", "Contact us", or repetitive site names. 
    4. TEXAS CITIES: Reference Texas service areas (Dallas, Houston, San Antonio, Austin, etc.) NATURALLY within sentences (e.g., "Homeowners in the Austin area often face..."). DO NOT create isolated lists or button-like text for cities.
    5. PARAGRAPH DEPTH: Each paragraph must be at least 5-7 sentences long. Provide technical details, historical context, and expert evidence.
    6. NO INTRODUCTION HEADING: Start directly with the text.
    `;

    if (effectivePrompt) {
        systemPrompt += `\nCustom Instructions: ${effectivePrompt}`;
    }

    if (articleInstructions) {
        systemPrompt += `\nAdditional Article Instructions: ${articleInstructions}`;
    }

    systemPrompt += `\nKeywords to include: ${keywords || 'N/A'}
    Tone: ${tone || 'professional'}
    
    ${BLOG_RULES}
    
    IMPORTANT: Format the response as a strict JSON object with the following keys:
    {
      "title": "string (H1 title)",
      "post_title": "string (Optimized post title)",
      "focus_keyword": "string",
      "blog_description": "string (Detailed summary, 900+ characters)",
      "content": "string (HTML format tags: <h2>, <h3>, <p>, <ul>, <li>, <strong>. DO NOT include <html>, <head>, <body> tags. DO NOT include social posts here.)",
      "meta_description": "string (Optimized for SEO)",
      "tags": ["array", "of", "strings"],
      "featured_image": {
         "prompt": "string (Detailed prompt for AI generator - detailed, photorealistic, no text)",
         "alt_text": "string",
         "title": "string",
         "caption": "string",
         "description": "string"
      },
      "social_posts": {
         "facebook": "string",
         "instagram": "string",
         "twitter": "string",
         "linkedin": "string"
      }
    }`;

    // Note: featured_image logic in prompt is now handled by the JSON structure request above


    // Inline Images Instruction
    if (effectiveInline) {
        systemPrompt += `
        
        INLINE IMAGE RULES (MANDATORY):
        - Insert exactly ${effectiveImageCount} [IMAGE_PLACEHOLDER: search_term] tags within the body content.
        - Place them evenly: one after the 1st H2, one after the 3rd H2, and so on.
        - The "search_term" must be a concrete, visual noun phrase (e.g. "modern kitchen island lighting").
        `;
    }

    if (effectiveYoutube) {
        systemPrompt += `\n\nVIDEO RULE: Insert exactly one [VIDEO_PLACEHOLDER: search_query] tag randomly inside the article body (e.g. after the 2nd or 3rd H2). DO NOT place it at the very end or beginning.`;
    }



    if (effectiveInternalLinks) {
        systemPrompt += `\n\nINTERNAL LINKS: Include 3-4 [INTERNAL_LINK: anchor text | search topic] tags naturally within paragraphs.`;
    }

    if (effectiveOutboundLinks) {
        systemPrompt += `\n\nOUTBOUND LINKS: Include 2-3 [OUTBOUND_LINK: anchor text | url] tags to authoritative sources.`;
    }

    // --- Content Generation ---
    addLog('info', `Starting article generation for topic: "${topic}"`, { model: effectiveContentModel });

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: effectiveContentModel,
        messages: [
            { role: 'system', content: 'You are a helpful assistant that outputs JSON.' },
            { role: 'user', content: systemPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4095, // Maximize output space for long articles
        stream: false
    }, {
        headers: {
            'Authorization': `Bearer ${effectiveApiKey}`,
            'Content-Type': 'application/json'
        },
        timeout: 600000 // 10 minutes timeout for background generation
    });

    // ... Parsing logic remains similar but uses effective params ...
    let contentObj;
    try {
        let rawContent = response.data.choices[0].message.content;
        rawContent = rawContent.trim();
        if (rawContent.startsWith('```')) {
            rawContent = rawContent.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
        }
        contentObj = JSON.parse(rawContent);
        addLog('success', 'Article content generated successfully', { title: contentObj.title, words: contentObj.content.length });
    } catch (e) {
        console.error("Failed to parse JSON response", e);
        addLog('error', 'Failed to parse JSON response from OpenAI', e.message);
        contentObj = {
            title: `Article about ${topic}`,
            content: `<p>${response.data.choices[0].message.content}</p>`,
            tags: []
        };
    }

    let processedContent = contentObj.content;
    let featuredImageUrl = '';

    // --- 1. Featured Image Generation ---
    if (effectiveFeatured) {
        let prompt = contentObj.featured_image?.prompt || contentObj.featured_image_prompt || `Featured image for article about ${topic}`;

        // Add custom image prompt instructions if provided
        if (imageCustomPrompt) {
            prompt = `${prompt}. Style: ${imageCustomPrompt}`;
        }

        try {
            const provider = config.imageGeneration.provider || 'pixabay';
            const aiProviders = ['runware', 'dalle', 'dall-e-3', 'openai', 'gpt-image-1.5', 'gpt-image-1', 'chatgpt-image-latest'];

            if (aiProviders.includes(provider) || (provider === 'openai' && config.openai.apiKey)) {
                addLog('info', `Generating Featured Image with ${provider}...`, { prompt });
                featuredImageUrl = await generateAiImage(topic, config, prompt);

                if (featuredImageUrl) {
                    addLog('success', 'Featured image generated successfully', { url: featuredImageUrl });
                } else {
                    addLog('error', 'Failed to generate featured image');
                }
            } else {
                // STOCK IMAGE LOGIC
                addLog('info', 'Searching for Featured Image from Stock...', { query: topic });

                // Try specific prompt first, else topic
                const searchQuery = contentObj.featured_image?.prompt ? contentObj.featured_image.prompt.replace(/ photorealistic.*$/, '') : topic;
                const images = await searchStockImages(provider, searchQuery, 1);

                if (images.length > 0) {
                    featuredImageUrl = images[0].url;
                    addLog('success', `Featured image fetched from ${provider}`, { url: featuredImageUrl });
                } else {
                    addLog('warning', 'No stock images found for specific prompt, trying topic', { topic });
                    const fallbackImages = await searchStockImages(provider, topic, 1);
                    if (fallbackImages.length > 0) {
                        featuredImageUrl = fallbackImages[0].url;
                        addLog('success', `Featured image fetched from ${provider} (fallback tag)`, { url: featuredImageUrl });
                    } else {
                        addLog('error', 'No stock images found for topic');
                    }
                }
            }
        } catch (err) {
            console.error('Featured image fetch failed:', err.message);
            addLog('error', 'Featured image fetch failed', err.message);
            featuredImageUrl = '';
        }
    }

    // Early return REMOVED to allow inline image and link processing


    // --- 2. Inline Image Processing (Placeholders) ---
    if (effectiveInline) {
        // Regex to catch [IMAGE_PLACEHOLDER: query] or even loose formats
        const placeholderRegex = /\[IMAGE_PLACEHOLDER:?\s*(.*?)\]/gi;
        let match;
        let replacements = [];

        // Collect all matches first
        while ((match = placeholderRegex.exec(processedContent)) !== null) {
            replacements.push({ fullMatch: match[0], query: match[1].trim() });
        }

        addLog('info', `Found ${replacements.length} inline image placeholders`);

        // --- Helper: Upload Image to WordPress to ensure correct size/handling ---
        const uploadImageToWordPress = async (imageUrl, altText) => {
            const wpUrl = config.wordpress.siteUrl.replace(/\/$/, '');
            const auth = Buffer.from(`${config.wordpress.username}:${config.wordpress.appPassword}`).toString('base64');
            try {
                addLog('info', 'Uploading image to WordPress...', { url: imageUrl });

                const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                const imgBuffer = Buffer.from(imgRes.data, 'binary');
                const filename = `inline-${crypto.randomUUID()}.png`; // Use PNG/JPG

                const uploadRes = await axios.post(`${wpUrl}/wp-json/wp/v2/media`, imgBuffer, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'image/png',
                        'Content-Disposition': `attachment; filename="${filename}"`
                    }
                });

                // Return the full source URL that WordPress provides (it might create sizes)
                // We prefer the 'large' or 'full' size
                if (uploadRes.data.media_details && uploadRes.data.media_details.sizes && uploadRes.data.media_details.sizes.large) {
                    return uploadRes.data.media_details.sizes.large.source_url;
                }
                return uploadRes.data.source_url;
            } catch (err) {
                console.error("Failed to upload inline image to WP:", err.message);
                addLog('error', 'Failed to upload inline image to WordPress', err.message);
                return imageUrl; // Fallback to external URL
            }
        };

        for (const item of replacements) {
            let imageUrl = '';
            try {
                // Determine Stock Provider
                let stockProvider = config.imageGeneration.provider || 'pixabay';
                if (stockProvider === 'runware') stockProvider = 'pixabay';

                const images = await searchStockImages(stockProvider, item.query, 1);

                if (images.length > 0) {
                    imageUrl = images[0].url;
                } else {
                    // Try simplified query?
                    throw new Error("No stock images found");
                }

                if (imageUrl) {
                    // UPLOAD TO WORDPRESS
                    const wpImageUrl = await uploadImageToWordPress(imageUrl, item.query);
                    processedContent = processedContent.replace(item.fullMatch,
                        `<figure><img src="${wpImageUrl}" alt="${item.query}" class="article-image"><figcaption>${item.query}</figcaption></figure>`);
                    addLog('success', `Inline image fetched from ${stockProvider}`, { query: item.query });
                }
            } catch (e) {
                console.error("Inline image processing error:", e.message);
                addLog('warning', 'Inline stock image fetch failed', e.message);
                // Remove placeholder if generation fails
                processedContent = processedContent.replace(item.fullMatch, '');
            }
        }
    }

    // --- 3. YouTube Embed Processing (Placeholder Based) ---
    if (effectiveYoutube && config.youtube.apiKey) {
        // Look for explicitly placed video tags first
        const videoRegex = /\[VIDEO_PLACEHOLDER:\s*(.*?)\]/gi;
        let vMatch;
        let vFound = false;

        let vMatches = [];
        while ((vMatch = videoRegex.exec(processedContent)) !== null) {
            vMatches.push({ full: vMatch[0], query: vMatch[1] });
        }

        for (const vm of vMatches) {
            vFound = true;
            try {
                const videos = await searchYoutubeVideos(`${vm.query} ${topic}`, 1);
                if (videos.length > 0) {
                    const embedHtml = `<div class="youtube-embed"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videos[0].id}" title="${videos[0].title}" frameborder="0" allowfullscreen></iframe></div>`;
                    processedContent = processedContent.replace(vm.full, embedHtml);
                    addLog('success', 'YouTube video embedded', { videoId: videos[0].id });
                } else {
                    processedContent = processedContent.replace(vm.full, '');
                    addLog('warning', 'No YouTube video found for query', vm.query);
                }
            } catch (e) {
                processedContent = processedContent.replace(vm.full, '');
                addLog('error', 'YouTube search failed', e.message);
            }
        }

        // Fallback: If no placeholder found but enabled, insert at end 
        if (!vFound) {
            try {
                const videos = await searchYoutubeVideos(topic, 1);
                if (videos.length > 0) {
                    const embedHtml = `<div class="youtube-embed"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videos[0].id}" title="${videos[0].title}" frameborder="0" allowfullscreen></iframe></div>`;
                    processedContent += embedHtml;
                    addLog('success', 'Fallback YouTube video embedded', { videoId: videos[0].id });
                }
            } catch (e) { }
        }
    }


    // --- 4. Internal Link Processing ---
    if (effectiveInternalLinks) {
        const internalLinkRegex = /\[INTERNAL_LINK:\s*(.*?)\s*\|\s*(.*?)\]/g;
        let matches = [];
        let match;
        while ((match = internalLinkRegex.exec(processedContent)) !== null) {
            matches.push({ full: match[0], text: match[1], topic: match[2] });
        }

        if (matches.length > 0) addLog('info', `Processing ${matches.length} internal link opportunities`);

        // Process sequentially to be safe with async
        for (const m of matches) {
            try {
                // Search WP for the topic
                const auth = Buffer.from(`${config.wordpress.username}:${config.wordpress.appPassword}`).toString('base64');
                const searchRes = await axios.get(`${config.wordpress.siteUrl}/wp-json/wp/v2/posts?search=${encodeURIComponent(m.topic)}&per_page=1`, {
                    headers: { 'Authorization': `Basic ${auth}` }
                });

                if (searchRes.data && searchRes.data.length > 0) {
                    const post = searchRes.data[0];
                    const linkHtml = `<a href="${post.link}" title="${post.title.rendered}" class="internal-link">${m.text}</a>`;
                    processedContent = processedContent.replace(m.full, linkHtml);
                    addLog('success', `Internal link created for "${m.topic}"`, { url: post.link });
                } else {
                    // Not found, keep text only
                    processedContent = processedContent.replace(m.full, m.text);
                    addLog('warning', `No internal post found for "${m.topic}"`);
                }
            } catch (e) {
                console.error(`Internal link processing failed for "${m.topic}":`, e.message);
                addLog('warning', `Internal link lookup failed for "${m.topic}"`, e.message);
                processedContent = processedContent.replace(m.full, m.text);
            }
        }
    }

    // --- 5. Outbound Link Processing ---
    if (effectiveOutboundLinks) {
        const outboundLinkRegex = /\[OUTBOUND_LINK:\s*(.*?)\s*\|\s*(.*?)\]/g;
        let matches = [];
        let match;
        while ((match = outboundLinkRegex.exec(processedContent)) !== null) {
            matches.push({ full: match[0], text: match[1], target: match[2] });
        }

        if (matches.length > 0) addLog('info', `Processing ${matches.length} outbound links`);

        for (const m of matches) {
            let url = m.target.trim();
            // Validate if it looks like a URL
            if (!url.startsWith('http')) {
                // If it doesn't look like a URL, it might be a description.
                // In that case, we might want to skip linking or search (google search is not available here).
                // We'll optimistically assume it's a domain like "wikipedia.org"
                url = 'https://' + url;
            }

            const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="outbound-link">${m.text}</a>`;
            processedContent = processedContent.replace(m.full, linkHtml);
            addLog('success', `Outbound link created for "${m.text}"`, { url: url });
        }
    }

    // Merge Auto Tags with Custom Tags
    let finalTags = [];
    if (autoTags) {
        finalTags = [...(contentObj.tags || [])];
    }
    if (customTags) {
        const customTagArray = customTags.split(',').map(t => t.trim());
        finalTags = [...new Set([...finalTags, ...customTagArray])];
    }

    return {
        title: contentObj.title,
        content: processedContent,
        tags: finalTags,
        featuredImageUrl: featuredImageUrl,
        featuredImageDetails: contentObj.featured_image, // Pass metadata
        meta_description: contentObj.meta_description,
        social_posts: contentObj.social_posts,
        raw_tags: contentObj.tags
    };
}

const jobs = {};

// Real-time streaming endpoint using Server-Sent Events
app.post('/api/generate-article/stream', async (req, res) => {
    try {
        if (!config.openai.apiKey) {
            return res.status(400).json({ success: false, message: 'OpenAI API key not configured' });
        }

        const { topic, keywords, tone, length, customPrompt } = req.body;

        console.log(`Starting article stream for: ${topic}`);

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Send confirmation that we are starting
        res.write(`data: ${JSON.stringify({ type: 'start', message: 'Connecting to AI...' })}\n\n`);
        console.log('Sent start event for topic:', topic);

        const effectivePrompt = customPrompt || config.content.customPrompt || '';
        const effectiveLength = length || config.content.articleLength || '1000-1500';

        // --- IMAGE GENERATION ---
        const shouldGenerateImage = config.imageGeneration && config.imageGeneration.featuredEnabled;
        if (shouldGenerateImage) {
            console.log('Starting background image generation...');
            // Check provider: if non-stock (AI), use strictly 1792x1024 or config size.
            // If stock, use landscape.
            generateImageForStream(topic, config).then(imageUrl => {
                if (imageUrl) {
                    res.write(`data: ${JSON.stringify({ type: 'featured-image', url: imageUrl, alt: topic })}\n\n`);
                }
            }).catch(err => console.error('Image gen failed:', err));
        }

        console.log('Making OpenAI API call for topic:', topic);
        const response = await axios({
            method: 'post',
            url: 'https://api.openai.com/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${config.openai.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                model: config.openai.contentModel || 'gpt-4o',
                messages: [
                    {
                        role: 'system', content: `You are an expert professional content writer specializing in LONG-TAIL deep-dive articles. Your goal is to write a comprehensive, exhaustive, and EXTREMELY detailed blog post about "${topic}".
                    ${BLOG_RULES}
                    
                    CRITICAL INSTRUCTIONS FOR EXTREME LENGTH & QUALITY:
                    1. LENGTH: Minimum 1500 words, targeting 2000. DO NOT use placeholders or snippets.
                    2. NO FILLER: DO NOT include navigational fluff like "Discover more", "Read now", or repetitive site names.
                    3. TEXAS CITIES: Reference Texas service areas NATURALLY within sentences. No isolated lists.
                    4. PARAGRAPH DEPTH: Every section must contain multiple long, informative paragraphs (5-7 sentences each).
                    5. FORMAT: HTML (<h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>). No <html> or <body> tags.
                    6. IMAGES/VIDEO:
                       - Insert Image [IMAGE: visual description] after 1st and 3rd H2.
                       - Insert Video [YOUTUBE: search_query] randomly after H2/H3.
                    7. LINKS: Include 4-5 descriptive outbound links.
                    8. NO INTRODUCTION HEADING: Start directly with the hook.
                    ` },
                    {
                        role: 'user', content: `Topic: ${topic}\nKeywords: ${keywords || 'None'}\nInstructions: ${effectivePrompt}\nOutput HTML with placeholders.`
                    }
                ],
                stream: true
            },
            responseType: 'stream'
        });

        console.log('OpenAI API responded, status:', response.status);
        console.log('Response headers:', response.headers);
        console.log('OpenAI stream established, waiting for data...');

        // Buffer for handling split SSE lines
        let sseBuffer = "";
        let streamBuffer = ""; // Buffer to handle split tags within content

        response.data.on('data', async chunk => {
            sseBuffer += chunk.toString();

            // Only process complete lines
            if (sseBuffer.includes('\n')) {
                const lines = sseBuffer.split('\n');
                sseBuffer = lines.pop(); // Keep the last partial line (if any) in the buffer

                for (const line of lines) {
                    if (line.trim() === '') continue;

                    if (line === 'data: [DONE]') {
                        console.log('Received [DONE] signal');
                        res.write(`data: ${JSON.stringify({ type: 'complete', message: 'Generation complete!' })}\n\n`);
                        res.end();
                        return;
                    }
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.replace('data: ', '');
                        try {
                            const parsed = JSON.parse(jsonStr);
                            const content = parsed.choices[0]?.delta?.content || '';

                            // Debug log for raw content to see tags
                            if (content.includes('[')) console.log('Raw content with bracket:', content);

                            if (content) {
                                streamBuffer += content;

                                // Process Buffer for Tags
                                // Regex to find complete tags [TAG: content], case insensitive
                                const imgRegex = /\[IMAGE:\s*(.*?)\]/gi;
                                const ytRegex = /\[YOUTUBE:\s*(.*?)\]/gi;

                                let match;
                                let newBuffer = streamBuffer;

                                // Find and Process Images
                                while ((match = imgRegex.exec(streamBuffer)) !== null) {
                                    const fullTag = match[0];
                                    const keyword = match[1];
                                    console.log('Found inline image tag (creating placeholder):', keyword);

                                    // Create a placeholder instead of fetching immediately
                                    const placeholderHtml = `<div class="image-placeholder" data-keyword="${keyword}" style="margin: 20px 0; padding: 40px; background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; text-align: center; color: #6b7280;">
                                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    <span class="ms-2">Pending Image: <strong>${keyword}</strong></span>
                                </div>`;

                                    // Inject placeholder into stream
                                    newBuffer = newBuffer.replace(fullTag, placeholderHtml);
                                }

                                // Find and Process YouTube
                                while ((match = ytRegex.exec(streamBuffer)) !== null) {
                                    const fullTag = match[0];
                                    const keyword = match[1];
                                    console.log('Found YouTube tag:', keyword);

                                    if (config.youtube?.apiKey) {
                                        fetchYouTubeVideo(keyword, config).then(embedUrl => {
                                            if (embedUrl) {
                                                res.write(`data: ${JSON.stringify({ type: 'youtube', url: embedUrl, title: keyword })}\n\n`);
                                            }
                                        });
                                    }
                                    newBuffer = newBuffer.replace(fullTag, '');
                                }

                                // Send processed content to client
                                // Only send if we are sure we aren't breaking a tag in progress
                                // Simple heuristic: if buffer ends with open bracket [, wait.
                                // But for now, let's just send everything that isn't part of a matched tag?
                                // Issue: complex logic. 
                                // Easier: Send the "newBuffer" BUT we must be careful about partial tags at the end.
                                // If newBuffer ends with "[", "[I", "[IMAGE", etc., we should keep that tail in the buffer and not send it.

                                // Better partial tag detection:
                                // Check if there is an opening '[' that doesn't have a closing ']' after it
                                const lastOpen = newBuffer.lastIndexOf('[');
                                const lastClose = newBuffer.lastIndexOf(']');

                                if (lastOpen !== -1 && lastOpen > lastClose) {
                                    // We have an open tag that isn't closed yet
                                    const safeContent = newBuffer.substring(0, lastOpen);
                                    const keptPart = newBuffer.substring(lastOpen);

                                    if (safeContent) {
                                        res.write(`data: ${JSON.stringify({ type: 'chunk', content: safeContent })}\n\n`);
                                    }
                                    streamBuffer = keptPart; // Keep the incomplete tag
                                } else {
                                    // No unbalanced brackets, safe to send all
                                    if (newBuffer) {
                                        res.write(`data: ${JSON.stringify({ type: 'chunk', content: newBuffer })}\n\n`);
                                    }
                                    streamBuffer = ""; // Clear buffer
                                }
                            }

                        } catch (e) {
                            // ignore parse errors
                        }
                    }
                }
            }
        });

        response.data.on('error', err => {
            console.error('Stream error:', err);
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream error: ' + err.message })}\n\n`);
            res.end();
        });

        response.data.on('end', () => {
            console.log('Stream ended for topic:', topic);
            res.write(`data: ${JSON.stringify({ type: 'complete', message: 'Article generation complete!' })}\n\n`);
            res.end();
        });

    } catch (error) {
        console.error('Generation failed:', error.message);
        console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });

        if (error.response?.status === 401) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Authentication Error: Invalid OpenAI API Key. Please check your settings in config.json.' })}\n\n`);
        } else if (error.response?.status === 429) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Rate Limit Error: Too many requests. Please try again later.' })}\n\n`);
        } else {
            const errorMsg = error.response?.data?.error?.message || error.message;
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Error: ' + errorMsg })}\n\n`);
        }
        res.end();
    }
});
app.post('/api/generate-article/start', requireAuth, async (req, res) => {
    try {
        if (!config.openai.apiKey) {
            return res.status(400).json({ success: false, message: 'OpenAI API key not configured' });
        }

        const jobId = Math.random().toString(36).substring(7);
        jobs[jobId] = { status: 'processing', startTime: Date.now() };

        // Start processing in background (DO NOT AWAIT)
        generateArticleLogic(req.body)
            .then(result => {
                jobs[jobId].status = 'completed';
                jobs[jobId].result = result;
            })
            .catch(error => {
                console.error("Async Job Error:", error);
                jobs[jobId].status = 'error';
                jobs[jobId].error = error.message;
            });

        res.json({ success: true, jobId: jobId });
    } catch (error) {
        console.error("Start Job Error:", error);
        res.status(500).json({ success: false, message: 'Failed to start job: ' + error.message });
    }
});

app.get('/api/generate-article/status/:jobId', requireAuth, (req, res) => {
    const { jobId } = req.params;
    const job = jobs[jobId];

    if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (job.status === 'completed') {
        res.json({ success: true, status: 'completed', article: job.result });
        // Cleanup job after retrieval (optional, or rely on periodic cleanup)
        delete jobs[jobId];
    } else if (job.status === 'error') {
        res.json({ success: false, status: 'error', message: job.error });
        delete jobs[jobId];
    } else {
        res.json({ success: true, status: 'processing' });
    }
});

// Periodic cleanup of stale jobs (older than 1 hour)
setInterval(() => {
    const now = Date.now();
    for (const [id, job] of Object.entries(jobs)) {
        if (now - job.startTime > 3600000) {
            delete jobs[id];
        }
    }
}, 600000);

app.post('/api/publish-article', requireAuth, async (req, res) => {
    try {
        const { title, content, status, categories, tags } = req.body;

        console.log('📝 Publish Request Received:', {
            title,
            status,
            categoriesCount: categories?.length,
            tagsCount: tags?.length
        });

        if (!config.wordpress.siteUrl || !config.wordpress.username || !config.wordpress.appPassword) {
            return res.status(400).json({
                success: false,
                message: 'WordPress credentials not configured'
            });
        }

        const auth = Buffer.from(
            `${config.wordpress.username}:${config.wordpress.appPassword}`
        ).toString('base64');

        const postData = {
            title,
            content,
            status: status || 'draft',
            categories: categories || [],
            tags: tags || []
        };

        const response = await axios.post(
            `${config.wordpress.siteUrl}/wp-json/wp/v2/posts`,
            postData,
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Store article in memory
        articles.unshift({
            id: response.data.id,
            title: response.data.title.rendered,
            status: response.data.status,
            link: response.data.link,
            date: new Date()
        });

        res.json({
            success: true,
            message: 'Article published successfully',
            post: response.data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to publish article: ' + error.message
        });
    }
});

app.get('/api/articles', requireAuth, (req, res) => {
    res.json({ success: true, articles });
});

// Image Generation Endpoints
app.post('/api/generate-image', requireAuth, async (req, res) => {
    try {
        const { prompt, size, quality, style, model } = req.body;

        if (!config.openai.apiKey) {
            return res.status(400).json({
                success: false,
                message: 'OpenAI API key not configured'
            });
        }

        let imageModel = model || config.openai.imageModel || 'dall-e-3';

        // Map GPT Image models to actual DALL-E models
        if (imageModel.includes('gpt-image') || imageModel === 'chatgpt-image-latest') {
            imageModel = 'dall-e-3';
        }

        let requestedSize = size || config.imageGeneration.size || '1200x628';
        const imageQuality = quality || config.imageGeneration.quality || 'hd';
        const imageStyle = style || config.imageGeneration.style || 'vivid';

        // Map WordPress sizes to OpenAI supported sizes
        // OpenAI supports: 1024x1024, 1792x1024, 1024x1792
        const sizeMapping = {
            '1200x628': '1792x1024',  // WordPress featured -> closest OpenAI landscape
            '1200x900': '1792x1024',  // 4:3 ratio -> landscape
            '1024x1024': '1024x1024', // Square (direct match)
            '1792x1024': '1792x1024', // Landscape (direct match)
            '1024x1792': '1024x1792'  // Portrait (direct match)
        };

        const openaiSize = sizeMapping[requestedSize] || '1792x1024';

        const imageConfig = {
            model: imageModel,
            prompt: prompt,
            n: 1,
            size: openaiSize
        };

        // Only dall-e-3 supports quality and style
        if (imageModel === 'dall-e-3') {
            imageConfig.quality = imageQuality;
            imageConfig.style = imageStyle;
        }

        // Use the Images API endpoint
        const response = await axios.post('https://api.openai.com/v1/images/generations', imageConfig, {
            headers: {
                'Authorization': `Bearer ${config.openai.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const imageUrl = response.data.data[0].url;

        res.json({
            success: true,
            imageUrl: imageUrl,
            model: imageModel,
            prompt: prompt,
            requestedSize: requestedSize,
            generatedSize: openaiSize,
            note: requestedSize !== openaiSize ? `Generated at ${openaiSize}, can be resized to ${requestedSize} after download` : null
        });
    } catch (error) {
        console.error('Image Generation Error:', error.message);
        if (error.response) {
            console.error('API Error Response:', error.response.data);
        }
        res.status(500).json({
            success: false,
            message: 'Failed to generate image: ' + error.message
        });
    }
});

// Standalone Media Fetch Endpoint (for Post-Processing)
app.post('/api/fetch-media', requireAuth, async (req, res) => {
    try {
        const { keyword, provider } = req.body;
        // Use the same config as the active session/global usually, 
        // but here we just need keys. config is global in this file.

        // Call the internal helper
        const url = await fetchMediaForStream(provider, keyword, config);

        res.json({
            success: true,
            url: url
        });

    } catch (error) {
        console.error('Fetch Media API Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Test Image Generation Endpoint (Supports Runware, DALL-E, Stock)
app.post('/api/test/generate-image', requireAuth, async (req, res) => {
    try {
        const { provider, model, prompt } = req.body;

        console.log(`Testing image generation. Provider: ${provider}, Model: ${model}, Prompt: ${prompt}`);

        let imageUrl = null;

        if (provider === 'runware') {
            // --- RUNWARE IMPLEMENTATION ---
            const runwareKey = config.runware?.apiKey;
            if (!runwareKey) throw new Error("Runware API Key not configured");

            const runwareModel = model || 'runware:100@1';

            // Runware request structure
            const runwarePayload = [
                {
                    "taskType": "authentication",
                    "apiKey": runwareKey
                },
                {
                    "taskType": "imageInference",
                    "taskUUID": crypto.randomUUID(),
                    "positivePrompt": prompt,
                    "modelId": runwareModel,
                    "height": 1024,
                    "width": 1024,
                    "numberResults": 1
                }
            ];

            const rwRes = await axios.post('https://api.runware.ai/v1', runwarePayload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 300000
            });

            if (rwRes.data && rwRes.data.data) {
                const infResult = rwRes.data.data.find(t => t.taskType === 'imageInference');
                if (infResult && infResult.imageURL) {
                    imageUrl = infResult.imageURL;
                } else {
                    throw new Error("No image URL in Runware response");
                }
            } else {
                throw new Error("Invalid Runware response");
            }

        } else if (['dalle', 'openai', 'dall-e-3', 'dall-e-2'].includes(provider) || (!provider && config.openai.apiKey)) {
            // Respect model if passed, otherwise default via generateAiImage or custom logic
            if (model && model !== 'dall-e-3' && model !== 'dalle') {
                // Custom OpenAI call to support different models if needed
                const imageConfig = {
                    model: model,
                    prompt: prompt,
                    n: 1,
                    size: '1024x1024',
                    quality: "standard",
                    style: "vivid"
                };
                const response = await axios.post('https://api.openai.com/v1/images/generations', imageConfig, {
                    headers: {
                        'Authorization': `Bearer ${config.openai.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                imageUrl = response.data.data[0].url;
            } else {
                imageUrl = await generateAiImage(prompt, config);
            }
        } else {
            // Stock providers
            imageUrl = await fetchMediaForStream(provider, prompt, config);
        }

        if (imageUrl) {
            res.json({ success: true, imageUrl });
        } else {
            throw new Error("Failed to generate/fetch image");
        }

    } catch (error) {
        console.error('Test Image Generation Error:', error.message);
        if (error.response) {
            console.error('API Error Response:', error.response.data);
            if (error.response.data && error.response.data.errors) {
                return res.status(500).json({ success: false, message: JSON.stringify(error.response.data.errors) });
            }
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// Detect available OpenAI models
app.get('/api/detect-models', requireAuth, async (req, res) => {
    try {
        if (!config.openai.apiKey) {
            return res.status(400).json({
                success: false,
                message: 'OpenAI API key not configured'
            });
        }

        const response = await axios.get('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${config.openai.apiKey}`
            }
        });

        const allModels = response.data.data;

        // Filter content generation models
        const contentModels = allModels.filter(m =>
            m.id.includes('gpt') && !m.id.includes('image') && !m.id.includes('vision')
        ).map(m => ({
            id: m.id,
            name: m.id,
            type: 'content'
        }));

        // Define image generation models (based on OpenAI documentation)
        const imageModels = [
            { id: 'gpt-image-1.5', name: 'GPT-Image-1.5 (Latest & Best)', type: 'image', description: 'State-of-the-art image generation with best quality and performance' },
            { id: 'gpt-image-1', name: 'GPT-Image-1 (High Fidelity)', type: 'image', description: 'High-fidelity visuals with strong instruction-following' },
            { id: 'gpt-image-1-mini', name: 'GPT-Image-1-Mini (Cost-Efficient)', type: 'image', description: 'Faster and more cost-efficient for high-volume workflows' },
            { id: 'chatgpt-image-latest', name: 'ChatGPT Image Latest (Alias)', type: 'image', description: 'Points to current ChatGPT image model (gpt-image-1.5)' },
            { id: 'dall-e-3', name: 'DALL-E 3 (Deprecated)', type: 'image', description: 'Legacy model - migrate to GPT Image models' },
            { id: 'dall-e-2', name: 'DALL-E 2 (Deprecated)', type: 'image', description: 'Legacy model - migrate to GPT Image models' }
        ];

        res.json({
            success: true,
            contentModels: contentModels,
            imageModels: imageModels
        });
    } catch (error) {
        // Return default models if API call fails
        res.json({
            success: true,
            contentModels: [
                { id: 'gpt-4o', name: 'GPT-4o', type: 'content' },
                { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', type: 'content' },
                { id: 'gpt-4', name: 'GPT-4', type: 'content' },
                { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', type: 'content' }
            ],
            imageModels: [
                { id: 'gpt-image-1.5', name: 'GPT-Image-1.5 (Latest & Best)', type: 'image', description: 'State-of-the-art image generation' },
                { id: 'gpt-image-1', name: 'GPT-Image-1 (High Fidelity)', type: 'image', description: 'High-fidelity visuals' },
                { id: 'gpt-image-1-mini', name: 'GPT-Image-1-Mini (Cost-Efficient)', type: 'image', description: 'Cost-efficient option' },
                { id: 'chatgpt-image-latest', name: 'ChatGPT Image Latest', type: 'image', description: 'Latest ChatGPT image model' },
                { id: 'dall-e-3', name: 'DALL-E 3 (Deprecated)', type: 'image', description: 'Legacy model' },
                { id: 'dall-e-2', name: 'DALL-E 2 (Deprecated)', type: 'image', description: 'Legacy model' }
            ]
        });
    }
});

// Upload image to WordPress
app.post('/api/upload-image-to-wordpress', requireAuth, async (req, res) => {
    try {
        const { imageUrl, title } = req.body;

        if (!config.wordpress.siteUrl || !config.wordpress.username || !config.wordpress.appPassword) {
            return res.status(400).json({
                success: false,
                message: 'WordPress credentials not configured'
            });
        }

        // Download image from URL
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');

        const auth = Buffer.from(
            `${config.wordpress.username}:${config.wordpress.appPassword}`
        ).toString('base64');

        // Upload to WordPress media library
        const uploadResponse = await axios.post(
            `${config.wordpress.siteUrl}/wp-json/wp/v2/media`,
            imageBuffer,
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'image/png',
                    'Content-Disposition': `attachment; filename="${title || 'generated-image'}.png"`
                }
            }
        );

        res.json({
            success: true,
            mediaId: uploadResponse.data.id,
            mediaUrl: uploadResponse.data.source_url
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to upload image: ' + error.message
        });
    }
});

app.post('/api/automation/toggle', requireAuth, (req, res) => {
    config.automation.enabled = !config.automation.enabled;
    manageScheduler(); // Update scheduler status
    res.json({
        success: true,
        enabled: config.automation.enabled
    });
});

app.post('/api/automation/settings', requireAuth, (req, res) => {
    const { schedule, minutesInterval, cronExpression, autoCreateCategories, autoCreateTags, dailyArticleLimit } = req.body;

    if (schedule) config.automation.schedule = schedule;
    if (minutesInterval !== undefined) config.automation.minutesInterval = parseInt(minutesInterval) || 5;
    if (cronExpression) config.automation.cronExpression = cronExpression;
    if (autoCreateCategories !== undefined) config.automation.autoCreateCategories = autoCreateCategories;
    if (autoCreateTags !== undefined) config.automation.autoCreateTags = autoCreateTags;
    if (dailyArticleLimit !== undefined) config.automation.dailyArticleLimit = parseInt(dailyArticleLimit) || 5;

    saveConfig(); // Persist changes

    manageScheduler(); // reliable restart with new settings

    res.json({ success: true, message: 'Automation settings updated' });
});

// Initialize scheduler on startup
manageScheduler();

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`WordPress Automation Server running on port ${PORT}`);
});

// INCREASE TIMEOUT TO 20 MINUTES (1200000 ms)
server.setTimeout(1200000);

// Helper for streaming image generation
async function generateImageForStream(topic, config) {
    try {
        // Check if featured image is enabled
        if (!config.imageGeneration?.featuredEnabled) {
            console.log('Featured image generation is disabled in settings.');
            return null;
        }

        const provider = config.imageGeneration.provider || 'dall-e-3';
        console.log(`Generating featured image for: ${topic} using provider: ${provider}`);

        if (provider === 'pexels' || provider === 'unsplash' || provider === 'pixabay') {
            return await fetchMediaForStream(provider, topic, config);
        }

        // Default to OpenAI (DALL-E)
        if (!config.openai.apiKey) return null;

        const size = config.imageGeneration.size || "1024x1024";
        const quality = config.imageGeneration.quality || "standard";
        const style = config.imageGeneration.style || "vivid";

        // Map WordPress size to text for prompt if needed, but OpenAI takes specific sizes.
        // We'll use the mapping logic from the /api/generate-image endpoint if possible, 
        // or just stick to 1024x1024/landscape for safety unless specific DALL-E 3 support is added here.
        // To be safe and consistent with previous code:
        const prompt = `A professional blog featured image for an article about: ${topic}. Style: ${style}. High quality.`;

        const response = await axios.post('https://api.openai.com/v1/images/generations', {
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1792x1024",
            quality: quality,
            style: style
        }, {
            headers: {
                'Authorization': `Bearer ${config.openai.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data?.data?.length > 0) {
            return response.data.data[0].url;
        }

    } catch (error) {
    }
    return null;
}

// Unified Media Fetcher (Stock or AI)
// Unified Media Fetcher (Stock or AI)
async function fetchMediaForStream(provider, query, config) {
    console.log(`Fetching media via ${provider} for: ${query}`);

    // Normalize Provider Strings
    const isAI = ['dalle', 'dall-e-3', 'dall-e-2', 'openai', 'gpt-image-1.5', 'gpt-image-1', 'chatgpt-image-latest'].includes(provider?.toLowerCase());

    // 1. Try Configured Provider
    let imageUrl = null;

    try {
        if (isAI) {
            imageUrl = await generateAiImage(query, config);
        } else if (provider === 'pexels') {
            const apiKey = config.stockImages.pexelsApiKey;
            if (apiKey) {
                const res = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&size=large`, { headers: { 'Authorization': apiKey } });
                imageUrl = res.data?.photos?.[0]?.src?.large2x || res.data?.photos?.[0]?.src?.original;
            }
        } else if (provider === 'unsplash') {
            const apiKey = config.stockImages.unsplashApiKey;
            if (apiKey) {
                const res = await axios.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, { headers: { 'Authorization': `Client-ID ${apiKey}` } });
                imageUrl = res.data?.results?.[0]?.urls?.regular;
            }
        } else if (provider === 'pixabay') {
            const apiKey = config.stockImages.pixabayApiKey;
            if (apiKey) {
                const res = await axios.get(`https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=3`);
                imageUrl = res.data?.hits?.[0]?.largeImageURL;
            }
        }
    } catch (err) {
        console.error(`Provider ${provider} failed:`, err.message);
    }

    // 2. Fallback to OpenAI if Stock/Primary failed and OpenAI Key exists
    if (!imageUrl && config.openai.apiKey) {
        console.log(`Primary provider ${provider} failed or returned no image. Falling back to DALL-E 3.`);
        imageUrl = await generateAiImage(query, config);
    }

    return imageUrl;
}

// Separate AI Gen Helper to be called by fetchMediaForStream
async function generateAiImage(query, config, overridePrompt = null) {
    // Determine provider (check config or default)
    const provider = config.imageGeneration?.provider || 'dall-e-3';
    const prompt = overridePrompt || `A high-quality, natural style blog image about: ${query}. 1792x1024 landscape resolution style.`;

    // Runware Support
    if (provider === 'runware') {
        return await generateRunwareImage(query, config, prompt);
    }

    try {
        const response = await axios.post('https://api.openai.com/v1/images/generations', {
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1792x1024",
            quality: "standard",
            style: "natural"
        }, {
            headers: { 'Authorization': `Bearer ${config.openai.apiKey}` }
        });
        return response.data?.data?.[0]?.url;
    } catch (e) {
        console.error('AI Gen Error:', e.message);
        return null;
    }
}

// Helper: Runware Image Generation
async function generateRunwareImage(query, config, prompt) {
    try {
        const runwareKey = config.runware?.apiKey || process.env.RUNWARE_API_KEY;
        if (!runwareKey) {
            console.error("Runware API Key not configured");
            return null;
        }

        let modelId = config.imageGeneration?.model || config.runware?.model || 'runware:100@1'; // default model
        console.log(`Generating AI image via Runware (${modelId}) for: ${query}`);

        // Handle Dimensions (Strict DALL-E 3 Compliance if using OpenAI model via Runware)
        let width = 1792;
        let height = 1024;

        // If user requests specific size, try to respect it but ensure multiple of 64 or safe sizes
        if (config.imageGeneration?.size) {
            const parts = config.imageGeneration.size.split('x');
            if (parts.length === 2) {
                width = parseInt(parts[0]);
                height = parseInt(parts[1]);
            }
        }

        // Special handling for DALL-E 3 (openai:4@1) which requires specific sizes
        // or if using SDXL models, they prefer multiples of 64.
        // It's safer to snap to nearest valid DALL-E size if openai model is detected.
        if (modelId.includes('openai')) {
            // Map to closest DALL-E 3 landscape
            width = 1792;
            height = 1024;
            console.log(`Enforcing DALL-E 3 safe resolution: ${width}x${height} for model ${modelId}`);
        } else {
            // Ensure multiples of 64 for minimal safety with other models
            width = Math.floor(width / 64) * 64;
            height = Math.floor(height / 64) * 64;
        }

        const runwarePayload = [
            {
                "taskType": "authentication",
                "apiKey": runwareKey
            },
            {
                "taskType": "imageInference",
                "taskUUID": crypto.randomUUID(),
                "positivePrompt": prompt,
                "modelId": modelId,
                "height": height,
                "width": width,
                "numberResults": 1
            }
        ];

        const response = await axios.post('https://api.runware.ai/v1', runwarePayload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 300000
        });

        if (response.data && response.data.data) {
            const infResult = response.data.data.find(t => t.taskType === 'imageInference');
            if (infResult && infResult.imageURL) {
                return infResult.imageURL;
            } else if (infResult && infResult.error) {
                console.error('Runware Inference Error:', infResult.error);
            }
        }

        if (response.data && response.data.error) { // Check top-level error
            console.error('Runware API Error:', response.data);
        }

        console.error('Runware Response Error (No Image):', JSON.stringify(response.data));
        return null;
    } catch (e) {
        console.error('AI Gen Error (Runware):', e.message);
        if (e.response && e.response.data) {
            console.error('Runware 400 Detail:', JSON.stringify(e.response.data));
        }
        return null;
    }
}

// Helper for YouTube
async function fetchYouTubeVideo(query, config) {
    try {
        const apiKey = config.youtube.apiKey;
        if (!apiKey) return null;

        const res = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${apiKey}&type=video&maxResults=1`);

        if (res.data.items && res.data.items.length > 0) {
            const videoId = res.data.items[0].id.videoId;
            return `https://www.youtube.com/embed/${videoId}`;
        }
    } catch (err) {
        console.error("YouTube search error:", err.message);
    }
    return null;
}

// Trigger Automation Task Instantly
app.post('/api/automation/trigger-now', requireAuth, async (req, res) => {
    try {
        console.log('Received instant automation trigger...');

        // Check if automation is running
        if (isAutomationRunning) {
            return res.status(409).json({ success: false, message: 'Automation is already running. Please wait.' });
        }

        // Run async (don't wait for completion)
        runSingleAutomationTask();

        res.json({ success: true, message: 'Automation task started in background!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Publish Article Endpoint
app.post('/api/publish-article', async (req, res) => {
    const { title, content, status, featuredImageUrl } = req.body;

    try {
        if (!config.wordpress.siteUrl || !config.wordpress.username || !config.wordpress.appPassword) {
            return res.status(400).json({ success: false, message: 'WordPress credentials not configured' });
        }

        const wpUrl = config.wordpress.siteUrl.replace(/\/$/, '');
        const auth = Buffer.from(`${config.wordpress.username}:${config.wordpress.appPassword}`).toString('base64');

        let featuredMediaId = null;

        // Upload Featured Image if provided
        if (featuredImageUrl) {
            try {
                console.log('Uploading featured image:', featuredImageUrl);
                const imageResponse = await axios.get(featuredImageUrl, { responseType: 'arraybuffer' });
                let imageBuffer = Buffer.from(imageResponse.data, 'binary');
                const filename = `featured-image-${Date.now()}.jpg`;

                // RESIZE LOGIC
                if (config.imageGeneration?.size) {
                    try {
                        const parts = config.imageGeneration.size.split('x');
                        if (parts.length === 2) {
                            const width = parseInt(parts[0]);
                            const height = parseInt(parts[1]);

                            console.log(`Resizing featured image to ${width}x${height} before upload...`);
                            imageBuffer = await sharp(imageBuffer)
                                .resize(width, height, {
                                    fit: 'cover',
                                    position: 'center'
                                })
                                .toBuffer();
                        }
                    } catch (resizeError) {
                        console.error('Failed to resize image:', resizeError.message);
                        // Continue with original buffer
                    }
                }

                const mediaResponse = await axios.post(`${wpUrl}/wp-json/wp/v2/media`, imageBuffer, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'image/jpeg',
                        'Content-Disposition': `attachment; filename="${filename}"`
                    }
                });
                featuredMediaId = mediaResponse.data.id;
                console.log('Featured image uploaded, ID:', featuredMediaId);
            } catch (imgError) {
                console.error('Failed to upload featured image:', imgError.message);
                // Continue without featured image
            }
        }

        const postData = {
            title: title || 'AI Generated Article',
            content: content,
            status: status || 'draft',
            featured_media: featuredMediaId
        };

        const response = await axios.post(`${wpUrl}/wp-json/wp/v2/posts`, postData, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ success: true, message: 'Published successfully', link: response.data.link });
    } catch (error) {
        console.error('Publish error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to publish: ' + error.message });
    }
});
