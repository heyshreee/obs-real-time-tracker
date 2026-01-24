---
description: How to set up Google OAuth and get Client ID
---

# Setting up Google OAuth

Follow these steps to get your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## 1. Create a Google Cloud Project
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click the project dropdown at the top left and select **"New Project"**.
3.  Enter a name (e.g., "OBS Tracker") and click **"Create"**.

## 2. Configure OAuth Consent Screen
1.  In the left sidebar, go to **APIs & Services** > **OAuth consent screen**.
2.  Select **External** (unless you are a Google Workspace user testing internally) and click **Create**.
3.  Fill in the required details:
    -   **App Name**: OBS Tracker
    -   **User Support Email**: Your email
    -   **Developer Contact Information**: Your email
4.  Click **Save and Continue**.
5.  Skip "Scopes" for now (default scopes are usually enough for login).
6.  Add **Test Users**: Add your email address (`srishree0607@gmail.com`) so you can test the login.

## 3. Create Credentials
1.  Go to **APIs & Services** > **Credentials**.
2.  Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
3.  **Application type**: Select **Web application**.
4.  **Name**: "OBS Tracker Frontend".
5.  **Authorized JavaScript origins**:
    -   Add `http://localhost:5173` (or your frontend URL).
6.  **Authorized redirect URIs**:
    -   Add `http://localhost:5173`
    -   Add `http://localhost:5173/auth/google/callback`
7.  Click **Create**.

## 4. Get Your Keys
1.  You will see a popup with your **Client ID** and **Client Secret**.
2.  Copy these keys.

## 5. Configure Your App
Add these to your environment variables.

**Frontend (`frontend/.env`):**
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

**Backend (`backend/.env`):**
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```
