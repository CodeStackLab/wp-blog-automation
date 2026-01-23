# Google Search API Setup Guide

This guide explains how to obtain the necessary credentials to use Google Search for fetching images in your WordPress Automation tool.

## Prerequisites

- A Google Cloud Platform (GCP) Account.
- A project within GCP.

## Step 1: Enable the Custom Search API

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Select your project (or create a new one).
3.  Navigate to **APIs & Services** > **Library**.
4.  Search for **"Custom Search API"**.
5.  Click on it and click **Enable**.

## Step 2: Create an API Key

1.  Go to **APIs & Services** > **Credentials**.
2.  Click **Create Credentials** at the top.
3.  Select **API Key**.
4.  Copy the generated API Key.
5.  (Optional but Recommended) Click **Edit API Key** to restrict it to:
    *   **API restrictions**: Select "Custom Search API" only.

**Result:** This is your `Google Custom Search API Key`.

## Step 3: Create a Programmable Search Engine (CSE)

1.  Go to [Google Programmable Search Engine](https://programmablesearchengine.google.com/controlpanel/all).
2.  Click **Add**.
3.  **Name your search engine:** Enter any name (e.g., "Image Search").
4.  **What to search:** Select **"Search the entire web"**.
5.  **Image Search:** Toggle **"Image search"** to **ON**. This is CRITICAL.
6.  **SafeSearch:** You can leave this as "Filtered" (safe) or "Off" depending on your needs.
7.  Click **Create**.

## Step 4: Get your Search Engine ID (CX)

1.  After creating, you will be taken to the Overview page.
2.  Look for **"Search engine ID"** (it starts with `cx=...` or is a long string).
3.  Copy this ID.

## Step 5: Configure the Automation Tool

1.  Open your WordPress Automation Dashboard.
2.  Go to **Settings**.
3.  Navigate to the **API Keys** tab.
4.  Enter your **Google Custom Search API Key** in the corresponding field.
5.  Enter your **Google Search Engine ID (CX)** in the corresponding field.
6.  Click **Save API Keys**.
7.  Go to **Image Generation Settings** tab.
8.  Select **"Google Search"** as your **Image Provider**.
9.  Click **Save Image Settings**.

You are now ready to fetch images using Google Search!
