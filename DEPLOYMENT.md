# Hostinger Deployment Guide

## Maintenance mode (deploy & test safely)

Visitors without a bypass cookie see a maintenance page. Your team sets the cookie once and can use the full site.

### 1. Use the same secret everywhere

Pick one long random string (or use the value already in `backend-php/.env` as `MAINTENANCE_COOKIE_SECRET`).

Set on **server backend** (`backend-php/.env` or Hostinger env):

```env
APP_MAINTENANCE=true
MAINTENANCE_COOKIE_NAME=site_access
MAINTENANCE_COOKIE_SECRET=your-long-secret-here
```

Set on **frontend before build** (project root `.env`):

```env
VITE_APP_MAINTENANCE=true
VITE_MAINTENANCE_COOKIE_NAME=site_access
VITE_MAINTENANCE_COOKIE_SECRET=your-long-secret-here
```

The secret must match on both sides.

### 2. Build and upload

```bash
npm run build
```

Upload `dist/*` and the PHP backend as usual.

### 3. Give yourself access (one time per browser)

Open this URL once (replace domain and secret):

```text
https://franchglobal.com/?site_access=your-long-secret-here
```

That sets a `site_access` cookie for 7 days. You can browse and test checkout normally.

Share the same link only with people who should test during maintenance.

### 4. Turn maintenance off when live is ready

```env
APP_MAINTENANCE=false
VITE_APP_MAINTENANCE=false
```

Rebuild frontend, redeploy, and restart PHP.

**Note:** Razorpay webhooks and the public reviews API still work while maintenance is on (payments are not blocked).

---

## Steps to Deploy to Hostinger:

1. **Build your project:**
   ```bash
   npm run build
   ```

2. **Upload to Hostinger:**
   - Go to your Hostinger File Manager or use FTP
   - Navigate to your domain's `public_html` folder (or `htdocs` for some plans)
   - Upload ALL contents from the `dist` folder (NOT the dist folder itself)
   - Make sure `.htaccess` file is uploaded (it starts with a dot, so it might be hidden)

3. **File Structure on Hostinger should be:**
   ```
   public_html/
   ├── .htaccess
   ├── index.html
   ├── assets/
   │   ├── index-xxxxx.js
   │   ├── index-xxxxx.css
   │   └── ...
   ├── images/
   ├── favicons/
   └── ...
   ```

4. **Important Notes:**
   - Upload the CONTENTS of the `dist` folder, not the folder itself
   - Make sure `.htaccess` file is uploaded (enable "Show hidden files" in File Manager)
   - If deploying to a subdirectory (e.g., `public_html/subfolder/`), you'll need to update the base path in `vite.config.js`

5. **Troubleshooting:**
   - If routes don't work: Check if `.htaccess` is uploaded and has correct permissions
   - If assets don't load: Check file paths in browser console
   - Clear browser cache after deployment
   - Check browser console for any 404 errors

## Common Issues:

### Routes not working (404 errors):
- Ensure `.htaccess` file is in the root directory (same level as `index.html`)
- Check that mod_rewrite is enabled on your Hostinger server (usually enabled by default)

### Assets not loading:
- Check browser console for 404 errors
- Verify all files from `dist` folder are uploaded
- Check file permissions (should be 644 for files, 755 for folders)

### Blank page:
- Check browser console for JavaScript errors
- Verify `index.html` is in the root directory
- Check that all asset files are uploaded correctly
