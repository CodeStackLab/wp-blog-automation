// Settings functionality

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// WordPress settings form
document.getElementById('wpSettingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        wpSiteUrl: formData.get('wpSiteUrl'),
        wpUsername: formData.get('wpUsername'),
        wpAppPassword: formData.get('wpAppPassword')
    };

    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('WordPress settings saved successfully!', 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showNotification('Error saving settings: ' + error.message, 'error');
    }
});

// OpenAI settings form
document.getElementById('openaiSettingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        openaiApiKey: formData.get('openaiApiKey')
    };

    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('OpenAI settings saved successfully!', 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showNotification('Error saving settings: ' + error.message, 'error');
    }
});


// Content settings form
// Keywords settings form
document.getElementById('keywordsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = { defaultKeywords: formData.get('defaultKeywords') };
    await saveSettings(data, 'Keywords');
});

// Prompts settings form
document.getElementById('promptsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        customPrompt: formData.get('customPrompt'),
        articleInstructions: formData.get('articleInstructions'),
        imageCustomPrompt: formData.get('imageCustomPrompt'),
        articleLength: formData.get('articleLength'),
        includeCallToAction: document.getElementById('includeCallToAction').checked,
        callToActionText: formData.get('callToActionText'),
        callToActionUrl: formData.get('callToActionUrl')
    };
    await saveSettings(data, 'Prompts');
});

// SEO settings form
document.getElementById('seoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        imagesPerPost: formData.get('imagesPerPost'),
        includeInternalLinks: document.getElementById('includeInternalLinks').checked,
        internalLinksCount: formData.get('internalLinksCount'),
        includeReadAlso: document.getElementById('includeReadAlso').checked,
        readAlsoCount: formData.get('readAlsoCount'),
        includeOutboundLinks: document.getElementById('includeOutboundLinks').checked,
        outboundLinksCount: formData.get('outboundLinksCount')
    };
    await saveSettings(data, 'SEO');
});

// Helper function to save settings to avoid repetition
async function saveSettings(data, type) {
    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            showNotification(`${type} settings saved successfully!`, 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showNotification(`Error saving ${type} settings: ` + error.message, 'error');
    }
}

// API Keys settings form
document.getElementById('apiKeysForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        tinymceApiKey: formData.get('tinymceApiKey'),
        youtubeApiKey: formData.get('youtubeApiKey'),
        unsplashApiKey: formData.get('unsplashApiKey'),
        pexelsApiKey: formData.get('pexelsApiKey'),
        pixabayApiKey: formData.get('pixabayApiKey'),
        googleApiKey: formData.get('googleApiKey'),
        googleSearchEngineId: formData.get('googleSearchEngineId')
    };
    await saveSettings(data, 'API Keys');
});

// Automation settings form
document.getElementById('automationSettingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        schedule: formData.get('schedule'),
        minutesInterval: formData.get('minutesInterval'),
        cronExpression: formData.get('cronExpression'),
        dailyArticleLimit: formData.get('dailyArticleLimit'),
        autoCreateCategories: document.getElementById('autoCreateCategories').checked,
        autoCreateTags: document.getElementById('autoCreateTags').checked
    };

    try {
        const response = await fetch('/api/automation/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Automation settings saved successfully!', 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showNotification('Error saving settings: ' + error.message, 'error');
    }
});

// Test WordPress connection
async function testWordPressConnection() {
    const wpSiteUrl = document.getElementById('wpSiteUrl').value;
    const wpUsername = document.getElementById('wpUsername').value;
    const wpAppPassword = document.getElementById('wpAppPassword').value;

    if (!wpSiteUrl || !wpUsername || !wpAppPassword) {
        showNotification('Please fill in all WordPress credentials', 'error');
        return;
    }

    try {
        const response = await fetch('/api/test-wordpress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wpSiteUrl,
                wpUsername,
                wpAppPassword
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('WordPress connection successful!', 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showNotification('Connection failed: ' + error.message, 'error');
    }
}

// Automation toggle
document.getElementById('automationEnabled').addEventListener('change', async (e) => {
    try {
        const response = await fetch('/api/automation/toggle', {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            showNotification(
                `Automation ${result.enabled ? 'enabled' : 'disabled'}`,
                'success'
            );
        }
    } catch (error) {
        showNotification('Error toggling automation: ' + error.message, 'error');
        e.target.checked = !e.target.checked;
    }
});

// Trigger Automation Now
async function triggerAutomationNow() {
    if (!confirm('Are you sure you want to trigger a single article generation task immediately?')) {
        return;
    }

    try {
        showNotification('🚀 Starting automation task in background...', 'info');

        const response = await fetch('/api/automation/trigger-now', {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            showNotification(result.message, 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showNotification('Error triggering automation: ' + error.message, 'error');
    }
}

// AI Models form
document.getElementById('aiModelsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        contentModel: formData.get('contentModel'),
        imageModel: formData.get('imageModel')
    };

    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('AI Models saved successfully!', 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showNotification('Error saving AI models: ' + error.message, 'error');
    }
});

// Image Generation settings form
// Image Generation settings form
document.getElementById('imageSettingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        imageFeaturedEnabled: document.getElementById('imageFeaturedEnabled').checked,
        imageInlineEnabled: document.getElementById('imageInlineEnabled').checked,
        imageInlineFrequency: formData.get('imageInlineFrequency'),
        youtubeEnabled: document.getElementById('youtubeEnabled').checked,
        youtubeFrequency: formData.get('youtubeFrequency'),

        imageSize: formData.get('imageSize'),
        imageQuality: formData.get('imageQuality'),
        imageStyle: formData.get('imageStyle'),
        imageProvider: formData.get('imageProvider')
    };

    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Image settings saved successfully!', 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showNotification('Error saving image settings: ' + error.message, 'error');
    }
});

// Inline Images UI Logic
const imageInlineEnabled = document.getElementById('imageInlineEnabled');
const inlineFrequencyGroup = document.getElementById('inlineFrequencyGroup');

if (imageInlineEnabled && inlineFrequencyGroup) {
    imageInlineEnabled.addEventListener('change', () => {
        inlineFrequencyGroup.style.display = imageInlineEnabled.checked ? 'block' : 'none';
    });
}

// YouTube UI Logic
const youtubeEnabled = document.getElementById('youtubeEnabled');
const youtubeSettings = document.getElementById('youtubeSettings');

if (youtubeEnabled && youtubeSettings) {
    youtubeEnabled.addEventListener('change', () => {
        youtubeSettings.style.display = youtubeEnabled.checked ? 'block' : 'none';
    });
}

// Cron Schedule UI Logic
const scheduleSelect = document.getElementById('schedule');
const cronGroup = document.getElementById('cronGroup');

if (scheduleSelect && cronGroup) {
    scheduleSelect.addEventListener('change', () => {
        if (scheduleSelect.value === 'cron') {
            cronGroup.style.display = 'block';
        } else {
            cronGroup.style.display = 'none';
        }
    });
}

// Detect available models
async function detectModels() {
    try {
        showNotification('Detecting available models...', 'success');

        const response = await fetch('/api/detect-models');
        const result = await response.json();

        if (result.success) {
            // Update content model dropdown
            const contentModelSelect = document.getElementById('contentModel');
            contentModelSelect.innerHTML = '';
            result.contentModels.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                contentModelSelect.appendChild(option);
            });

            // Update image model dropdown
            const imageModelSelect = document.getElementById('imageModel');
            imageModelSelect.innerHTML = '';
            result.imageModels.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name + (model.description ? ' - ' + model.description : '');
                imageModelSelect.appendChild(option);
            });

            showNotification('Models detected successfully!', 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showNotification('Error detecting models: ' + error.message, 'error');
    }
}

// Tab functionality
document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and content
            tabBtns.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and target content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
});

// API Test Connection Functions
async function testOpenAI() {
    const apiKey = document.getElementById('openaiApiKey').value;
    if (!apiKey) {
        showNotification('Please enter an OpenAI API key first', 'error');
        return;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (response.ok) {
            showNotification('✓ OpenAI API connection successful!', 'success');
        } else {
            throw new Error('Invalid API key');
        }
    } catch (error) {
        showNotification('✗ OpenAI API connection failed: ' + error.message, 'error');
    }
}

async function testYouTube() {
    const apiKey = document.getElementById('youtubeApiKey').value;
    if (!apiKey) {
        showNotification('Please enter a YouTube API key first', 'error');
        return;
    }

    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&key=${apiKey}`);

        if (response.ok) {
            showNotification('✓ YouTube API connection successful!', 'success');
        } else {
            const error = await response.json();
            throw new Error(error.error?.message || 'Invalid API key');
        }
    } catch (error) {
        showNotification('✗ YouTube API connection failed: ' + error.message, 'error');
    }
}

async function testUnsplash() {
    const apiKey = document.getElementById('unsplashApiKey').value;
    if (!apiKey) {
        showNotification('Please enter an Unsplash Access Key first', 'error');
        return;
    }

    try {
        const response = await fetch(`https://api.unsplash.com/photos/random?query=test&count=1`, {
            headers: {
                'Authorization': `Client-ID ${apiKey}`
            }
        });

        if (response.ok) {
            showNotification('✓ Unsplash API connection successful!', 'success');
        } else {
            throw new Error('Invalid Access Key');
        }
    } catch (error) {
        showNotification('✗ Unsplash API connection failed: ' + error.message, 'error');
    }
}

async function testPexels() {
    const apiKey = document.getElementById('pexelsApiKey').value;
    if (!apiKey) {
        showNotification('Please enter a Pexels API key first', 'error');
        return;
    }

    try {
        const response = await fetch(`https://api.pexels.com/v1/search?query=test&per_page=1`, {
            headers: {
                'Authorization': apiKey
            }
        });

        if (response.ok) {
            showNotification('✓ Pexels API connection successful!', 'success');
        } else {
            throw new Error('Invalid API key');
        }
    } catch (error) {
        showNotification('✗ Pexels API connection failed: ' + error.message, 'error');
    }
}

async function testPixabay() {
    const apiKey = document.getElementById('pixabayApiKey').value;
    if (!apiKey) {
        showNotification('Please enter a Pixabay API key first', 'error');
        return;
    }

    try {
        const response = await fetch(`https://pixabay.com/api/?key=${apiKey}&q=test&image_type=photo&per_page=3`);

        if (response.ok) {
            const data = await response.json();
            if (data.hits) {
                showNotification('✓ Pixabay API connection successful!', 'success');
            } else {
                throw new Error('Invalid API key');
            }
        } else {
            throw new Error('Invalid API key');
        }
    } catch (error) {
        showNotification('✗ Pixabay API connection failed: ' + error.message, 'error');
    }
}



// Toggle schedule options
function toggleScheduleOptions() {
    const schedule = document.getElementById('schedule').value;
    const minutesGroup = document.getElementById('minutesGroup');
    const cronGroup = document.getElementById('cronGroup');

    if (minutesGroup) {
        minutesGroup.style.display = schedule === 'minutes' ? 'block' : 'none';
    }
    if (cronGroup) {
        cronGroup.style.display = schedule === 'cron' ? 'block' : 'none';
    }
}
// Test Image Generation Form
document.getElementById('testImageForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const resultDiv = document.getElementById('testImageResult');
    const loadingDiv = document.getElementById('testImageLoading');
    const previewImg = document.getElementById('testImagePreview');
    const errorDiv = document.getElementById('testImageError');
    const submitBtn = document.getElementById('testImageBtn');

    // Reset UI
    resultDiv.style.display = 'block';
    loadingDiv.style.display = 'block';
    previewImg.style.display = 'none';
    errorDiv.style.display = 'none';
    submitBtn.disabled = true;

    const formData = new FormData(e.target);
    const data = {
        provider: formData.get('provider'),
        model: formData.get('model'),
        prompt: formData.get('prompt')
    };

    try {
        const response = await fetch('/api/test/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            previewImg.src = result.imageUrl;
            previewImg.style.display = 'block';
            showNotification('Image generated successfully!', 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Test generation error:', error);
        errorDiv.textContent = 'Error: ' + error.message;
        errorDiv.style.display = 'block';
        showNotification('Failed to generate image', 'error');
    } finally {
        loadingDiv.style.display = 'none';
        submitBtn.disabled = false;
    }
});
// System Logs Logic
async function fetchSystemLogs() {
    const container = document.getElementById('logs-container');
    container.innerHTML = '<p>Loading logs...</p>';

    try {
        const response = await fetch('/api/system-logs');
        const logs = await response.json();

        if (logs.length === 0) {
            container.innerHTML = '<p>No logs available yet.</p>';
            return;
        }

        container.innerHTML = logs.map(log => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            // Colors based on level
            const colors = {
                'info': '#3b82f6',
                'success': '#10b981',
                'warning': '#f59e0b',
                'error': '#ef4444'
            };
            const color = colors[log.level] || '#d4d4d4';

            let metaHtml = '';
            if (log.meta) {
                try {
                    const metaObj = JSON.parse(log.meta);
                    metaHtml = `<pre style="margin: 5px 0 0 20px; font-size: 0.8rem; color: #888;">${JSON.stringify(metaObj, null, 2)}</pre>`;
                } catch (e) {
                    metaHtml = `<span style="color: #888;"> | ${log.meta}</span>`;
                }
            }

            return `
                <div style="margin-bottom: 0.5rem; border-bottom: 1px solid #333; padding-bottom: 0.5rem;">
                    <span style="color: #888;">[${time}]</span>
                    <strong style="color: ${color}; text-transform: uppercase;">[${log.level}]</strong>
                    <span style="color: #e5e5e5;">${log.message}</span>
                    ${metaHtml}
                </div>
            `;
        }).join('');

    } catch (error) {
        container.innerHTML = `<p style="color: #ef4444;">Failed to load logs: ${error.message}</p>`;
    }
}

async function clearSystemLogs() {
    if (!confirm('Are you sure you want to clear all system logs? This cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch('/api/system-logs/clear', {
            method: 'POST'
        });
        const result = await response.json();

        if (result.success) {
            showNotification('Logs cleared successfully', 'success');
            fetchSystemLogs(); // Refresh the view (will show "No logs available")
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showNotification('Failed to clear logs: ' + error.message, 'error');
    }
}

// Auto-load logs if on the logs tab (rudimentary check or init)
document.addEventListener('DOMContentLoaded', () => {
    // ... existing init ...

    // Hook into tab clicks to auto-refresh logs when clicking "System Logs"
    const logTabBtn = document.querySelector('button[data-tab="tab-logs"]');
    if (logTabBtn) {
        logTabBtn.addEventListener('click', fetchSystemLogs);
    }
});
