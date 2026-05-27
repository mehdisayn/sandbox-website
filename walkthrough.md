# Manual setup — Google Drive sync

You're about to wire SANDBOX to use your users' Google Drive as cloud storage. There's **no server, no database, no Supabase, no Firebase** — Google itself stores the data inside a hidden folder on each user's own Drive. You don't pay anything. They don't see the folder unless they go looking.

Before I write any code for this, you need to do a one-time setup inside Google's website. It takes about 10 minutes of clicking. Nothing here costs money. You don't need a credit card.

When you're done, you'll have **one string** to send me — an "OAuth Client ID" — that looks like `1234567890-abc…xyz.apps.googleusercontent.com`. That's the only thing the code needs from this whole process.

---

## What you need before starting

- A Google account. Any account — your personal Gmail works fine. (This is the account that **owns the app's registration with Google**, not the account that will store user data. Users sign in with their own Google accounts later.)
- A browser. That's it.

---

## Step 1 — Open Google Cloud Console

1. Go to **https://console.cloud.google.com**.
2. Sign in with your Google account if it asks.
3. The first time, Google may show a "Welcome" page asking you to agree to Terms of Service. Tick the box and continue.

You're now in Google's developer dashboard. It looks busy. Ignore most of it.

---

## Step 2 — Create a Project

A "Project" is just Google's way of grouping your app's settings. You'll have one project for SANDBOX.

1. At the very top of the page, next to the "Google Cloud" logo, you'll see a **dropdown** that probably says "Select a project" or shows an existing project name.
2. Click the dropdown.
3. A panel opens. Click **"NEW PROJECT"** in the top-right of that panel.
4. **Project name:** type `SANDBOX Web` (or anything you like — it's just for your reference).
5. **Location:** leave it alone — should say "No organization."
6. Click **CREATE**.
7. Wait about 10 seconds. A notification will appear top-right saying the project was created. Click **"SELECT PROJECT"** in that notification, or use the top dropdown to switch to your new project.

You can confirm you're in the right project by looking at the top of the page — the project name should now show next to the Google Cloud logo.

---

## Step 3 — Turn on the Google Drive API

You need to tell Google "yes, this project is allowed to use Drive."

1. In the **search bar at the top** of the page (it says "Search products, resources, docs..."), type `Google Drive API`.
2. In the dropdown of results, click **Google Drive API** (under the "Marketplace" or "Products" section).
3. You land on a page describing the Drive API. Click the big blue **ENABLE** button.
4. Wait about 5 seconds. The page changes to show that the API is now enabled.

That's it for this step. You won't come back here.

---

## Step 4 — Set up the "Consent Screen"

The Consent Screen is the popup your users will see when they click "Sign in with Google" in your app. Google requires you to write the title and description that will show on that popup before you can issue any credentials.

1. In the **left sidebar** (you may need to click the hamburger menu ☰ in the top-left to see it), find **APIs & Services** → click it → click **OAuth consent screen**.
   - Shortcut if you can't find it: paste `https://console.cloud.google.com/apis/credentials/consent` into your address bar.

2. Google will ask **"What type of user are you?"** (this question is sometimes phrased differently — "User Type" with two radio options).
   - Pick **External**. ("Internal" is only for Google Workspace company accounts.)
   - Click **CREATE**.

3. Now a form. Fill it like this:

   | Field | What to put |
   |---|---|
   | App name | `SANDBOX Web` |
   | User support email | your email (auto-filled, leave it) |
   | App logo | skip (optional) |
   | Application home page | skip for now — you can add your live URL later |
   | Application privacy policy link | skip for now |
   | Application terms of service link | skip for now |
   | **Authorized domains** | skip for now (only needed if you fill the URLs above) |
   | Developer contact email | your email again |

4. Click **SAVE AND CONTINUE**.

5. **Scopes** page. Click **ADD OR REMOVE SCOPES**.
   - A panel slides in with a long list. In its filter box at the top, paste: `drive.appdata`
   - Tick the checkbox for the row that says **".../auth/drive.appdata — See, create, and delete its own configuration data in your Google Drive"**.
   - Click **UPDATE** at the bottom of the panel.
   - Back on the main page, click **SAVE AND CONTINUE**.

6. **Test users** page. While your app is in "Testing" mode (the default), only people you list here can sign in.
   - Click **ADD USERS**.
   - Type **your own Gmail address** so you can test it. You can add more later.
   - Click **ADD**, then **SAVE AND CONTINUE**.

7. **Summary** page. Just scroll down and click **BACK TO DASHBOARD**.

> **About "Publishing"** — Don't worry about the "PUBLISH APP" button on the dashboard for now. Leave it in **Testing** mode. While in testing, you can have up to 100 test users (the ones you add by hand). For wider release, Google does a one-time verification of your app — we can deal with that later when you have a public URL.

---

## Step 5 — Create the OAuth Client ID

This is the actual string we need.

1. In the left sidebar, **APIs & Services** → **Credentials**.
   - Shortcut: `https://console.cloud.google.com/apis/credentials`

2. Click **+ CREATE CREDENTIALS** at the top of the page.

3. From the dropdown, pick **OAuth client ID**.

4. **Application type:** pick **Web application** from the dropdown.

5. **Name:** type `SANDBOX Web client` (just for your reference — users never see this).

6. **Authorized JavaScript origins** — this is the one that actually matters. Click **+ ADD URI** and paste each of these as a separate entry:

   ```
   http://localhost:5173
   ```

   That's the one you need for local development. **Don't** add a trailing slash. **Don't** add the runtime port (5174) — only the app origin needs it.

   When you eventually deploy to a real URL (like `https://sandbox.yourdomain.com`), you'll come back here and add that URL too. But not now.

7. **Authorized redirect URIs** — leave this completely empty. We use the "popup" sign-in flow, which doesn't redirect anywhere.

8. Click **CREATE**.

9. A popup appears with two boxes labelled **Your Client ID** and **Your Client Secret**.
   - **Copy the Client ID.** It ends in `.apps.googleusercontent.com`.
   - **Ignore the Client Secret.** SANDBOX doesn't use one — and storing a secret in a browser-side app would be unsafe anyway. Leave it inside Google's console; never paste it into the code or send it anywhere.
   - Click **OK** to close the popup.

You now have the only thing this whole setup was about.

---

## Step 6 — Send me the Client ID

Once you have the Client ID copied to your clipboard, **paste it into our chat** and I'll wire it into the code. It looks like:

```
1234567890-abcdefghijklmnop.apps.googleusercontent.com
```

This string is **not a secret**. It's safe to commit to git, safe to share, safe to put in a public README. The security comes from the **Authorized JavaScript origins** allowlist you set in step 5 — Google will only accept this Client ID from those exact URLs.

(The Client Secret from step 5 — *that* would be a secret, if we used one. We don't. Don't share it.)

---

## What happens next

Once you give me the Client ID, I'll:

1. Add it as an environment variable (`VITE_GOOGLE_CLIENT_ID`) so the app picks it up at build time.
2. Build the sign-in flow (Phase A → B → C from `plan/now-make-a-backend-distributed-karp.md`).
3. The Sync settings screen gets a "Sign in with Google" button.
4. Your test account from step 4 can sign in and try it end-to-end.

When you sign in for the first time, Google will show a consent screen with the title "SANDBOX Web wants to access your Google Drive" and a warning that the app is **unverified** (this is normal during testing — it goes away when you publish + Google verifies the app for production). For now, click **Advanced** → **Go to SANDBOX Web (unsafe)** to proceed. That warning will not appear to test users you've explicitly added; for production users you'll need to do the one-time verification process with Google.

---

## If something looks different

Google redesigns this console regularly. If a button is named differently or in a different place, the **concepts** are stable:

- "Project" → a container for your app's settings
- "Enable an API" → turn on Drive's API for this project
- "OAuth consent screen" → what your users see when signing in; you have to fill this out
- "Credentials" → where you create the Client ID
- "OAuth client ID" → the string the code needs
- "Authorized JavaScript origins" → the allowlist of URLs the Client ID will work from

Search the console for those phrases if a step doesn't match.

---

## Common questions

- **"Will users have to do any of this?"** No. They just click "Sign in with Google" in the app. The setup above is **for you, once**, so your app is registered with Google.
- **"Where exactly is the data stored?"** In each user's own Google Drive, in a hidden folder called `appDataFolder` that only this app can see. They can't browse it from drive.google.com. They can revoke access at any time from [myaccount.google.com](https://myaccount.google.com/permissions) → SANDBOX Web → Remove access.
- **"Will Google charge me?"** No. Drive API usage from each user counts against **that user's** Drive quota (everybody gets 15 GB free). Your project's cost is $0 forever, as long as you don't add other Google services.
- **"What if I lose the Client ID?"** Go back to step 5's page, find the entry, click the pencil icon. You can also delete and recreate it; just update the env var.
- **"Do I need to do this again for production?"** No — same Client ID. You just add the production URL to **Authorized JavaScript origins** when you have one, alongside the localhost entry. And you'll publish + verify the app in Google's eyes (a one-time form) when you're ready to let strangers use it.
