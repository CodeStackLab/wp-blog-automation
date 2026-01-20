let currentArticle = null;
let tinyEditor = null; // TinyMCE editor instance
let waitingInterval = null;
let instructionsEditor = null;

// Initialize TinyMCE on page load
document.addEventListener('DOMContentLoaded', function () {
    tinymce.init({
        selector: '#articleEditor',
        height: 600,
        menubar: true,
        plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | link image | removeformat | code',
        content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif; font-size: 16px; line-height: 1.6; }',
        setup: function (editor) {
            editor.on('init', function () {
                tinyEditor = editor;
                console.log('TinyMCE initialized successfully');
            });
        }
    });
});

// Progress Tracker Functions
function updateProgress(percentage) {
    document.getElementById('overallProgress').style.width = percentage + '%';
    document.getElementById('progressPercentage').textContent = percentage + '%';
}

function updateStep(stepId, status, message) {
    const step = document.getElementById(stepId);
    if (!step) return;

    // Remove all status classes
    step.classList.remove('active', 'completed');

    if (status === 'active') {
        step.classList.add('active');
        step.querySelector('.step-status').textContent = message || 'In progress...';
    } else if (status === 'completed') {
        step.classList.add('completed');
        step.querySelector('.step-status').textContent = message || 'Completed ✓';
    } else {
        step.querySelector('.step-status').textContent = message || 'Waiting...';
    }
}

function simulateProgress(data) {
    // Reset all steps
    updateProgress(0);
    updateStep('step-writing', 'waiting', 'Waiting...');
    updateStep('step-internal-links', 'waiting', 'Waiting...');
    updateStep('step-outbound-links', 'waiting', 'Waiting...');
    updateStep('step-images', 'waiting', 'Waiting...');
    updateStep('step-finalizing', 'waiting', 'Waiting...');

    // Step 1: Writing Article (0-40%)
    setTimeout(() => {
        updateStep('step-writing', 'active', 'Connecting to AI...');
        updateProgress(5);
    }, 100);

    setTimeout(() => {
        updateStep('step-writing', 'active', 'AI is writing content...');
        updateProgress(15);
    }, 1500);

    setTimeout(() => updateProgress(30), 2500);
    setTimeout(() => {
        updateProgress(40);
        updateStep('step-writing', 'completed', 'Content Written');
    }, 3500);

    // Step 2: Internal Links (40-55%)
    setTimeout(() => {
        if (data.includeInternalLinks) {
            updateStep('step-internal-links', 'active', 'AI connecting internal links...');
            updateProgress(45);
        } else {
            updateStep('step-internal-links', 'completed', 'Skipped');
            updateProgress(55);
        }
    }, 4000);

    setTimeout(() => {
        if (data.includeInternalLinks) {
            updateProgress(55);
            updateStep('step-internal-links', 'completed', 'Internal links added');
        }
    }, 5000);

    // Step 3: Outbound Links (55-70%)
    setTimeout(() => {
        if (data.includeOutboundLinks) {
            updateStep('step-outbound-links', 'active', 'Finding authoritative references...');
            updateProgress(60);
        } else {
            updateStep('step-outbound-links', 'completed', 'Skipped');
            updateProgress(70);
        }
    }, 5500);

    setTimeout(() => {
        if (data.includeOutboundLinks) {
            updateProgress(70);
            updateStep('step-outbound-links', 'completed', 'References added');
        }
    }, 6500);

    // Step 4: Images (70-90%)
    setTimeout(() => {
        const imageCount = (data.featuredImage ? 1 : 0) + (data.inlineImages ? 3 : 0);
        if (imageCount > 0) {
            const provider = data.imageProvider || 'dalle';
            const isAI = ['gpt-image-1.5', 'gpt-image-1', 'gpt-image-1-mini', 'chatgpt-image-latest', 'dall-e-3', 'dall-e-2', 'dalle'].includes(provider);
            const msg = isAI ? 'Generating AI Images...' : 'Fetching Stock Images...';
            updateStep('step-images', 'active', msg);
            updateProgress(75);
        } else {
            updateStep('step-images', 'completed', 'Skipped');
            updateProgress(90);
        }
    }, 7000);

    setTimeout(() => {
        const imageCount = (data.featuredImage ? 1 : 0) + (data.inlineImages ? 3 : 0);
        if (imageCount > 0) {
            updateProgress(85);
            updateStep('step-images', 'active', 'Optimizing and inserting images...');
        }
    }, 8500);

    setTimeout(() => {
        const imageCount = (data.featuredImage ? 1 : 0) + (data.inlineImages ? 3 : 0);
        if (imageCount > 0) {
            updateProgress(90);
            updateStep('step-images', 'completed', 'Images inserted');
        }
    }, 10000);

    // Step 5: Finalizing (90-100%)
    setTimeout(() => {
        updateStep('step-finalizing', 'active', 'Finalizing Article...');
        updateProgress(95);
    }, 10500);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchCategories(); // Load categories on page load
    initializeTabSwitching();
    initializeInstructionsEditor();
    initializeToggleHandlers();
});

// Tab Switching Functionality
function initializeTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.borderBottomColor = 'transparent';
                btn.style.color = '#6b7280';
                btn.style.fontWeight = '500';
            });

            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                pane.style.display = 'none';
            });

            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            button.style.borderBottomColor = 'var(--primary)';
            button.style.color = 'var(--primary)';
            button.style.fontWeight = '600';

            const targetPane = document.querySelector(`[data-pane="${targetTab}"]`);
            if (targetPane) {
                targetPane.classList.add('active');
                targetPane.style.display = 'block';
            }
        });
    });
}

// Initialize Rich Text Editor for Article Instructions
function initializeInstructionsEditor() {
    const editorContainer = document.getElementById('articleInstructionsEditor');
    if (editorContainer && !instructionsEditor) {
        instructionsEditor = new Quill('#articleInstructionsEditor', {
            theme: 'snow',
            placeholder: 'Add detailed article instructions with formatting...',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['clean']
                ]
            }
        });

        // Sync with hidden input on change
        instructionsEditor.on('text-change', () => {
            const hiddenInput = document.getElementById('articleInstructions');
            if (hiddenInput) {
                hiddenInput.value = instructionsEditor.root.innerHTML;
            }
        });
    }
}

// Initialize Toggle Handlers
function initializeToggleHandlers() {
    // CTA Toggle
    const ctaCheckbox = document.getElementById('genCallToAction');
    const ctaFields = document.getElementById('ctaFields');
    if (ctaCheckbox && ctaFields) {
        ctaCheckbox.addEventListener('change', () => {
            ctaFields.style.display = ctaCheckbox.checked ? 'flex' : 'none';
        });
    }

    // YouTube Toggle
    const youtubeCheckbox = document.getElementById('genYoutubeEmbed');
    const youtubeGroup = document.getElementById('youtubeFrequencyGroup');
    if (youtubeCheckbox && youtubeGroup) {
        youtubeCheckbox.addEventListener('change', () => {
            youtubeGroup.style.display = youtubeCheckbox.checked ? 'block' : 'none';
        });
    }
}

function resetGenerateForm() {
    document.getElementById('generateForm').reset();
    document.getElementById('generateForm').style.display = 'block';
    document.getElementById('generatedArticle').style.display = 'none';
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('publishOptions').style.display = 'none';
    stopWaitingSimulation(); // Stop any pending simulation
    if (quillEditor) {
        quillEditor.setText('');
    }
    currentArticle = null;
    toggleNewCategoryInput();
    toggleInlineFrequency();
    toggleYoutubeFrequency();
    toggleInternalLinksCount();
    toggleReadAlsoCount();
    toggleCallToAction();
    toggleOutboundLinksCount();
}

// UI Toggles
function toggleNewCategoryInput() {
    const checkbox = document.getElementById('createNewCategory');
    const input = document.getElementById('newCategoryName');
    const select = document.getElementById('categorySelect');

    if (checkbox.checked) {
        input.style.display = 'block';
        input.required = true;
        select.disabled = true;
    } else {
        input.style.display = 'none';
        input.required = false;
        select.disabled = false;
    }
}

function toggleInlineFrequency() {
    const checkbox = document.getElementById('genInlineImages');
    const group = document.getElementById('genInlineFrequencyGroup');
    if (checkbox && group) {
        group.style.display = checkbox.checked ? 'block' : 'none';
    }
}

function toggleYoutubeFrequency() {
    const checkbox = document.getElementById('genYoutubeEmbed');
    const group = document.getElementById('genYoutubeFrequencyGroup');
    if (checkbox && group) {
        group.style.display = checkbox.checked ? 'block' : 'none';
    }
}

function toggleInternalLinksCount() {
    const checkbox = document.getElementById('genInternalLinks');
    const group = document.getElementById('genInternalLinksCountGroup');
    if (checkbox && group) {
        group.style.display = checkbox.checked ? 'block' : 'none';
    }
}

function toggleReadAlsoCount() {
    const checkbox = document.getElementById('genReadAlso');
    const group = document.getElementById('genReadAlsoCountGroup');
    if (checkbox && group) {
        group.style.display = checkbox.checked ? 'block' : 'none';
    }
}

function toggleCallToAction() {
    const checkbox = document.getElementById('genCallToAction');
    const group = document.getElementById('genCallToActionGroup');
    if (checkbox && group) {
        group.style.display = checkbox.checked ? 'block' : 'none';
    }
}

function toggleOutboundLinksCount() {
    const checkbox = document.getElementById('genOutboundLinks');
    const group = document.getElementById('genOutboundLinksCountGroup');
    if (checkbox && group) {
        group.style.display = checkbox.checked ? 'block' : 'none';
    }
}

// Fetch Categories from WordPress
async function fetchCategories() {
    const select = document.getElementById('categorySelect');
    try {
        const response = await fetch('/api/wordpress/categories');
        const result = await response.json();

        if (result.success) {
            select.innerHTML = '<option value="">Select Category...</option>';
            result.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to fetch categories', error);
    }
}

// Generate article form submission
document.getElementById('generateForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        topic: formData.get('topic'),
        keywords: formData.get('keywords'),
        tone: formData.get('tone'),
        articleLength: formData.get('articleLength'),
        customPrompt: formData.get('customPrompt'),
        articleInstructions: formData.get('articleInstructions'),

        // Keywords and Prompts
        keywordsList: formData.get('keywordsList'),
        contentPrompt: formData.get('contentPrompt'),
        imagePrompt: formData.get('imagePrompt'),

        // AI Settings
        aiModel: formData.get('aiModel'),
        imageModel: formData.get('imageModel'),

        // Image settings
        imageProvider: formData.get('imageProvider') || 'dalle',
        featuredImage: document.getElementById('genFeaturedImage')?.checked || false,
        inlineImages: document.getElementById('genInlineImages')?.checked || false,
        inlineImageFrequency: formData.get('inlineFrequency') || '2',
        imageSize: formData.get('imageSize'),
        imageQuality: formData.get('imageQuality'),

        // YouTube settings
        youtubeEmbed: document.getElementById('genYoutubeEmbed')?.checked || false,
        youtubeFrequency: formData.get('youtubeFrequency') || '3',

        // SEO settings
        includeInternalLinks: document.getElementById('genInternalLinks')?.checked || false,
        internalLinksCount: formData.get('internalLinksCount') || '3',
        includeReadAlso: document.getElementById('genReadAlso')?.checked || false,
        readAlsoCount: formData.get('readAlsoCount') || '3',
        includeCallToAction: document.getElementById('genCallToAction')?.checked || false,
        callToActionText: formData.get('ctaText'),
        callToActionUrl: formData.get('ctaUrl'),
        includeOutboundLinks: document.getElementById('genOutboundLinks')?.checked || false,
        outboundLinksCount: formData.get('outboundLinksCount') || '2',

        // Tags
        autoTags: document.getElementById('autoTags')?.checked || true,
        customTags: formData.get('customTags')
    };

    // Scroll to editor and prepare UI
    const editorSection = document.querySelector('.card-header');
    if (editorSection) editorSection.scrollIntoView({ behavior: 'smooth' });

    // Reset status and editor
    updateGenerationStatus('⏳ Connecting to AI...');
    if (tinyEditor) {
        tinyEditor.setContent('<p><em>Initializing AI writer...</em></p>');
    }

    // Show modal popup immediately with topic
    showLiveArticleModal(data.topic);

    // Hide buttons initially
    document.getElementById('publishBtn').style.display = 'none';

    try {
        // Use fetch with streaming for real-time writing
        const response = await fetch('/api/generate-article/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to start streaming');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedArticle = ''; // Buffer for the full article content

        const processStream = async () => {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6);
                        if (jsonStr === '[DONE]') break;

                        try {
                            const eventData = JSON.parse(jsonStr);

                            if (eventData.type === 'start') {
                                updateGenerationStatus(eventData.message);
                                accumulatedArticle = ''; // Reset buffer
                                if (tinyEditor) tinyEditor.setContent('');
                            } else if (eventData.type === 'chunk') {
                                // Append raw chunk to our buffer
                                accumulatedArticle += eventData.content;

                                // Update TinyMCE with the full accumlated HTML
                                if (tinyEditor) {
                                    tinyEditor.setContent(accumulatedArticle);

                                    // Auto-scroll to bottom
                                    const body = tinyEditor.getBody();
                                    const doc = tinyEditor.getDoc();
                                    if (body && doc) {
                                        doc.documentElement.scrollTop = body.scrollHeight;
                                    }
                                }
                                updateGenerationStatus('✍️ AI is writing...');
                            } else if (eventData.type === 'featured-image') {
                                // Specific handler for the main Article Featured Image
                                generatedFeaturedImage = eventData.url;
                                const imgHtml = `<figure style="text-align:center; margin: 20px 0;"><img src="${eventData.url}" alt="Featured Image: ${eventData.alt || ''}" style="max-width:100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><figcaption>Featured Image</figcaption></figure><p>&nbsp;</p>`;
                                accumulatedArticle += imgHtml;
                                if (tinyEditor) tinyEditor.setContent(accumulatedArticle);

                            } else if (eventData.type === 'image') {
                                // Inline images (Do NOT overwrite generatedFeaturedImage)
                                const imgHtml = `<figure style="text-align:center; margin: 20px 0;"><img src="${eventData.url}" alt="${eventData.alt || 'Generated Image'}" style="max-width:100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><figcaption>${eventData.alt || ''}</figcaption></figure><p>&nbsp;</p>`;
                                accumulatedArticle += imgHtml;

                                if (tinyEditor) {
                                    tinyEditor.setContent(accumulatedArticle);
                                }
                            } else if (eventData.type === 'youtube') {
                                // Inject YouTube Embed
                                if (eventData.url) {
                                    const ytHtml = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 20px 0; border-radius: 8px;"><iframe src="${eventData.url}" frameborder="0" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div><p>&nbsp;</p>`;
                                    accumulatedArticle += ytHtml;

                                    if (tinyEditor) {
                                        tinyEditor.setContent(accumulatedArticle);
                                    }
                                }
                            } else if (eventData.type === 'complete') {
                                // Instead of finishing immediately, start Post-Processing for images
                                updateGenerationStatus('🖼️ Processing Images...');
                                await processPendingImages(data.imageProvider || 'dalle');

                                updateGenerationStatus('✅ ' + eventData.message);

                                document.getElementById('publishBtn').style.display = 'inline-block';

                                if (tinyEditor) {
                                    tinyEditor.setMode('design'); // Enable editing
                                }
                            } else if (eventData.type === 'error') {
                                throw new Error(eventData.message);
                            }
                        } catch (parseError) {
                            console.error('Error parsing event:', parseError);
                        }
                    }
                }
            }
        };

        await processStream();

    } catch (error) {
        alert('Error generating article: ' + error.message);
        stopWaitingSimulation();
        resetGenerateForm();
    }
});

// Helper to process placeholders
async function processPendingImages(provider) {
    if (!tinyEditor) return;

    // Get current content (which has placeholders)
    const doc = tinyEditor.getDoc();
    const placeholders = doc.querySelectorAll('.image-placeholder');

    // START BLOCKING OVERLAY
    if (placeholders.length > 0) {
        const overlay = document.getElementById('imageGenerationOverlay');
        const progressBar = document.getElementById('imageGenProgress');
        const statusText = document.getElementById('imageGenStatus');
        const publishBtn = document.getElementById('publishBtn');

        if (overlay) {
            overlay.style.display = 'flex';
            progressBar.style.width = '0%';
            statusText.textContent = `Found ${placeholders.length} images to generate...`;
            publishBtn.style.display = 'none'; // Ensure publish is hidden
        }

        const isAi = (provider === 'dalle' || provider === 'model' || provider === 'dall-e-3');
        const statusMsg = isAi ? '🎨 Generating AI Images...' : '📸 Fetching Stock Images...';
        updateGenerationStatus(statusMsg);

        for (let i = 0; i < placeholders.length; i++) {
            const el = placeholders[i];
            const keyword = el.getAttribute('data-keyword');

            // Update Overlay Status
            if (statusText) statusText.textContent = `Generating image ${i + 1}/${placeholders.length}: "${keyword}"...`;
            if (progressBar) progressBar.style.width = `${((i) / placeholders.length) * 100}%`;

            // Update specific placeholder text
            el.innerHTML = `<span class="spinner-border spinner-border-sm"></span> ${isAi ? 'Generating' : 'Fetching'}: ${keyword}...`;

            try {
                const res = await fetch('/api/fetch-media', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        keyword: keyword,
                        provider: isAi ? 'dall-e-3' : provider
                    })
                });
                const data = await res.json();

                if (data.success && data.url) {
                    // Replace placeholder with image
                    const figure = doc.createElement('figure');
                    figure.style.textAlign = 'center';
                    figure.style.margin = '20px 0';

                    figure.innerHTML = `<img src="${data.url}" alt="${keyword}" style="max-width:100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><figcaption>${keyword}</figcaption>`;

                    el.parentNode.replaceChild(figure, el);
                } else {
                    // Failed? Remove placeholder or show error
                    el.innerHTML = `⚠️ Image not found: ${keyword}`;
                }
            } catch (e) {
                console.error('Image fetch error:', e);
                el.innerHTML = `⚠️ Error fetching image`;
            }

            // Update Progress after completion
            if (progressBar) progressBar.style.width = `${((i + 1) / placeholders.length) * 100}%`;
        }

        // Hide Overlay after short delay
        if (statusText) statusText.textContent = 'All images generated! Finalizing...';
        setTimeout(() => {
            if (overlay) overlay.style.display = 'none';
            if (publishBtn) publishBtn.style.display = 'inline-block'; // Show publish button now
        }, 1000);
    }

    // Sync back to editor content just in case
    // tinyEditor.save(); 
}

async function pollJobStatus(jobId, formData) {
    let attempts = 0;
    const maxAttempts = 300; // 10 minutes (at 2s interval)

    const interval = setInterval(async () => {
        try {
            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(interval);
                throw new Error('Timeout waiting for article generation.');
            }

            const response = await fetch(`/api/generate-article/status/${jobId}`);
            if (response.status === 429) return; // Rate limited, skip this tick

            const result = await response.json();

            if (result.success && result.status === 'completed') {
                clearInterval(interval);
                // Success!
                currentArticle = result.article;
                document.getElementById('generatedTitle').textContent = result.article.title;

                // Stop thinking, start writing
                stopWaitingSimulation();
                startTypewriterEffect(result.article.content);

                // Store generation options for publishing
                currentArticle.generationOptions = {
                    categoryId: formData.get('categorySelect'),
                    newCategoryName: formData.get('newCategoryName'),
                    createNewCategory: document.getElementById('createNewCategory').checked
                };
            } else if (result.success && result.status === 'error') {
                clearInterval(interval);
                throw new Error(result.message);
            }
            // If 'processing', do nothing, wait for next tick

        } catch (error) {
            clearInterval(interval);
            console.error(error);
            alert('Error updating status: ' + error.message);
            stopWaitingSimulation();
            resetGenerateForm();
        }
    }, 2000);
}

async function publishArticle() {
    if (!currentArticle) return;

    let status = 'draft';
    const liveSelect = document.getElementById('livePublishStatus');

    // Check if liveSelect is visible (offsetParent is not null)
    if (liveSelect && liveSelect.offsetParent !== null) {
        status = liveSelect.value;
        console.log('Using Live Status:', status);
    } else {
        // Fallback to standard form status
        const standardSelect = document.getElementById('publishStatus');
        if (standardSelect) status = standardSelect.value;
        console.log('Using Standard Status:', status);
    }
    const genOptions = currentArticle.generationOptions || {};
    let categoryIds = [];
    let tagIds = [];

    document.getElementById('generatedArticle').style.opacity = '0.5';

    try {
        // 1. Handle Categories
        if (genOptions.createNewCategory && genOptions.newCategoryName) {
            const catRes = await fetch('/api/wordpress/category', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: genOptions.newCategoryName })
            });
            const catResult = await catRes.json();
            if (catResult.success) categoryIds.push(catResult.category.id);
        } else if (genOptions.categoryId) {
            categoryIds.push(parseInt(genOptions.categoryId));
        }

        // 2. Handle Tags
        // Process tags from generation (currentArticle.tags contains mix of auto and custom)
        if (currentArticle.tags && currentArticle.tags.length > 0) {
            for (const tagName of currentArticle.tags) {
                try {
                    const tagRes = await fetch('/api/wordpress/tag', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: tagName })
                    });
                    const tagResult = await tagRes.json();
                    if (tagResult.success) tagIds.push(tagResult.tag.id);
                } catch (e) {
                    console.error(`Failed to create tag: ${tagName}`, e);
                }
            }
        }

        // 3. Publish Post
        const response = await fetch('/api/publish-article', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: currentArticle.title,
                content: quillEditor ? quillEditor.root.innerHTML : '',
                status: status,
                categories: categoryIds,
                tags: tagIds
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Article published successfully!');
            alert('Article published successfully!');
            resetGenerateForm();
            location.reload();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert('Error publishing article: ' + error.message);
        document.getElementById('generatedArticle').style.opacity = '1';
    }
}

// Close modal on outside click


// Helper Functions
// Helper Functions
function initQuill() {
    if (!quillEditor) {
        quillEditor = new Quill('#articleEditor', {
            theme: 'snow',
            placeholder: 'Article content will appear here...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'script': 'sub' }, { 'script': 'super' }],
                    [{ 'indent': '-1' }, { 'indent': '+1' }],
                    [{ 'direction': 'rtl' }],
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'font': [] }],
                    [{ 'align': [] }],
                    ['clean'],
                    ['link', 'image', 'video']
                ]
            }
        });
    }
    return quillEditor;
}

function startTypewriterEffect(htmlContent) {
    if (!quillEditor) initQuill();

    // Reset editor
    quillEditor.setText('');
    quillEditor.enable(false); // Read-only while active

    // Create temp div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Flatten structure by top-level block elements
    const blocks = Array.from(tempDiv.children).map(node => node.outerHTML);
    // If no structure, wrap content
    if (blocks.length === 0 && htmlContent) blocks.push(`<p>${htmlContent}</p>`);

    let currentBlockIndex = 0;

    function processNextBlock() {
        // Stop if generation cancelled (modal closed)
        // Stop if cancelled
        if (!currentArticle && !quillEditor.getText()) return;


        if (currentBlockIndex >= blocks.length) {
            quillEditor.enable(true); // Enable editing
            document.getElementById('publishOptions').style.display = 'block';
            showToast('Article Writing Complete! Ready to Publish.', 'success');
            return;
        }

        const blockHTML = blocks[currentBlockIndex];

        // Check for images
        if (blockHTML.includes('<img')) {
            const isStock = blockHTML.includes('unsplash.com') || blockHTML.includes('pexels.com') || blockHTML.includes('pixabay.com');
            const msg = isStock ? 'Fetching Stock Image...' : 'Generating AI Image...';
            showToast(msg, 'info');

            setTimeout(() => {
                // Append HTML block safely
                const range = quillEditor.getLength();
                quillEditor.clipboard.dangerouslyPasteHTML(range, blockHTML, 'api');

                // Scroll to bottom
                const scrollingContainer = document.querySelector('.ql-editor');
                if (scrollingContainer) scrollingContainer.scrollTop = scrollingContainer.scrollHeight;

                showToast('Image Inserted Successfully!', 'success');
                currentBlockIndex++;
                setTimeout(processNextBlock, 1000);
            }, 2000);
        } else {
            // Text block
            const range = quillEditor.getLength();
            quillEditor.clipboard.dangerouslyPasteHTML(range, blockHTML, 'api');

            const scrollingContainer = document.querySelector('.ql-editor');
            if (scrollingContainer) scrollingContainer.scrollTop = scrollingContainer.scrollHeight;

            currentBlockIndex++;
            setTimeout(processNextBlock, Math.random() * 400 + 100);
        }
    }

    processNextBlock();
}

function startWaitingSimulation(topic) {
    if (!quillEditor) initQuill();

    quillEditor.setText('');
    quillEditor.enable(false);

    const steps = [
        `Initializing AI Agent...`,
        `Analyzing topic: "${topic}"...`,
        `Searching for optimal keywords...`,
        `Structuring article outline...`,
        `Drafting introduction...`,
        `Generating comprehensive content...`,
        `Identifying image opportunities...`,
        `Optimizing for SEO...`,
        `Refining tone and style...`
    ];

    let stepIndex = 0;

    // Initial message
    quillEditor.clipboard.dangerouslyPasteHTML(0, `<pre>> system_init: Starting generation process for "${topic}"...</pre>`, 'api');

    waitingInterval = setInterval(() => {
        // Stop if not in generation mode (simplified check)
        if (!quillEditor) return;


        if (stepIndex >= steps.length) {
            // Just add dots if we run out of steps
            const range = quillEditor.getLength();
            quillEditor.insertText(range, `> ...\n`);
        } else {
            // Append log line
            const range = quillEditor.getLength();
            // Use pre/code styling via HTML for consistent look
            quillEditor.clipboard.dangerouslyPasteHTML(range, `<pre>> ${steps[stepIndex]}...</pre>`, 'api');
            stepIndex++;
        }

        // Scroll to bottom
        const scrollingContainer = document.querySelector('.ql-editor');
        if (scrollingContainer) scrollingContainer.scrollTop = scrollingContainer.scrollHeight;

    }, 1500);
}

function stopWaitingSimulation() {
    if (waitingInterval) {
        clearInterval(waitingInterval);
        waitingInterval = null;
    }
}

function showToast(message, type = 'info') {
    // Create toast container if not exists
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        padding: 12px 24px;
        background: ${type === 'success' ? '#10B981' : (type === 'error' ? '#EF4444' : '#3B82F6')};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
    `;
    toast.textContent = message;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    // Remove after 3s
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Load Configuration Settings
async function loadConfigSettings() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();

        if (config) {
            // Only load settings for fields that still exist
            // Custom prompt is the only field we kept from advanced settings
            // The count fields (internal links, outbound links, images, read also) are just number inputs with defaults
            console.log('Configuration loaded successfully');
        }
    } catch (error) {
        console.error('Failed to load configuration:', error);
    }
}

// Test WordPress Connection
async function testWordPressConnection() {
    const wpSiteUrl = document.getElementById('wpSiteUrl').value;
    const wpUsername = document.getElementById('wpUsername').value;
    const wpAppPassword = document.getElementById('wpAppPassword').value;

    if (!wpSiteUrl || !wpUsername || !wpAppPassword) {
        showToast('Please fill in all WordPress credentials', 'error');
        return;
    }

    try {
        showToast('Testing connection...', 'info');

        const response = await fetch('/api/test-wordpress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wpSiteUrl,
                wpUsername,
                wpAppPassword
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast('✅ WordPress connection successful!', 'success');
        } else {
            showToast('❌ Connection failed: ' + result.message, 'error');
        }
    } catch (error) {
        showToast('❌ Connection error: ' + error.message, 'error');
    }
}

// Handle Automation Schedule Change
function handleAutomationScheduleChange() {
    const schedule = document.getElementById('automationSchedule').value;
    const cronGroup = document.getElementById('cronExpressionGroup');

    if (schedule === 'custom') {
        cronGroup.style.display = 'block';
    } else {
        cronGroup.style.display = 'none';
    }
}

// Save Settings from Advanced Tabs
async function saveAdvancedSettings() {
    const settingsData = {
        // API Keys
        openaiApiKey: document.getElementById('openaiApiKey').value,
        youtubeApiKey: document.getElementById('youtubeApiKey').value,
        unsplashApiKey: document.getElementById('unsplashApiKey').value,
        pexelsApiKey: document.getElementById('pexelsApiKey').value,
        pixabayApiKey: document.getElementById('pixabayApiKey').value,

        // WordPress Config
        wpSiteUrl: document.getElementById('wpSiteUrl').value,
        wpUsername: document.getElementById('wpUsername').value,
        wpAppPassword: document.getElementById('wpAppPassword').value,

        // Automation
        automationEnabled: document.getElementById('automationEnabled').checked,
        automationSchedule: document.getElementById('automationSchedule').value,
        dailyArticleLimit: document.getElementById('dailyArticleLimit').value,
        cronExpression: document.getElementById('cronExpression').value,
        autoCreateCategories: document.getElementById('autoCreateCategories').checked,
        autoCreateTags: document.getElementById('autoCreateTags').checked,

        // Keywords
        defaultKeywords: document.getElementById('keywordsList').value,

        // Custom Prompts
        customPrompt: document.getElementById('contentPrompt').value,
        imageCustomPrompt: document.getElementById('imagePrompt').value,

        // AI Settings
        contentModel: document.getElementById('aiModel').value,
        imageModel: document.getElementById('imageModel').value,

        // Images
        imageProvider: document.getElementById('imageProvider').value,
        imageSize: document.getElementById('imageSize').value,
        imageQuality: document.getElementById('imageQuality').value,
        imageInlineFrequency: document.getElementById('inlineFrequency').value
    };

    try {
        showToast('Saving settings...', 'info');

        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsData)
        });

        const result = await response.json();

        if (result.success) {
            showToast('✅ Settings saved successfully!', 'success');
        } else {
            showToast('❌ Failed to save: ' + result.message, 'error');
        }
    } catch (error) {
        showToast('❌ Error saving settings: ' + error.message, 'error');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize Quill if the editor element exists
    const editorElement = document.getElementById('quillEditor');
    if (editorElement) {
        initQuill();
    }
});

// Editor Actions

// Live Article Modal Functions
let generatedFeaturedImage = null; // Track the generated image

function showLiveArticleModal(topic) {
    const modal = document.getElementById('liveArticleModal');
    generatedFeaturedImage = null; // Reset image tracking

    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');

        // Reset Status
        updateGenerationStatus(`⏳ Connecting to AI for: ${topic}...`);

        // Clear Editor
        if (tinyEditor) {
            tinyEditor.setContent('<p><em>Initializing AI writer...</em></p>');
        }
    }
}

function closeLiveArticleModal() {
    const modal = document.getElementById('liveArticleModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function clearEditor() {
    if (confirm('Are you sure you want to clear the editor?')) {
        if (tinyEditor) tinyEditor.setContent('');
        updateGenerationStatus('Ready');
        document.getElementById('publishBtn').style.display = 'none';
    }
}

function updateGenerationStatus(message) {
    const statusEl = document.getElementById('generationStatus');
    const editorStatusEl = document.getElementById('editorStatus');

    if (statusEl) statusEl.innerHTML = message;
    if (editorStatusEl) editorStatusEl.textContent = message.replace('⏳ ', '').replace('✅ ', '');
}

async function publishArticle() {
    if (!tinyEditor) return;

    let content = tinyEditor.getContent();

    // Extract Title from H1
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const h1 = doc.querySelector('h1');
    let title = 'AI Generated Article';

    if (h1) {
        title = h1.textContent;
        // Optional: Remove H1 from content since it's now the post title
        // content = content.replace(h1.outerHTML, '');
        // User requested removing "AI Generated Article" title, implying they want the H1 as the title.
        // We will keep H1 in content if they want, but usually WP handles title separately.
        // Let's remove it to avoid duplicate titles in WP.
        h1.remove();
        content = doc.body.innerHTML;
    }

    if (!content) {
        alert('Editor is empty!');
        return;
    }

    const statusSelect = document.getElementById('publishStatus');
    const status = statusSelect ? statusSelect.value : 'publish';

    const btn = document.getElementById('publishBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Publishing...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/publish-article', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                content: content,
                status: status,
                featuredImageUrl: generatedFeaturedImage
            })
        });

        const result = await response.json();

        if (result.success) {
            alert(`✅ Article ${status === 'publish' ? 'published' : 'saved'} successfully!`);
            window.open(result.postUrl || result.link, '_blank');
            // Refresh page to front dashboard as requested
            window.location.href = '/';
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert('❌ Error publishing: ' + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function saveDraft() {
    if (!tinyEditor) return;
    const content = tinyEditor.getContent();
    localStorage.setItem('article_draft', content);
    alert('Draft saved to browser storage!');
}
