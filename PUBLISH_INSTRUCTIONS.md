# How to Publish 'koda.nu lär' for Free

This project is configured to output a single-page static site.

## 1. Build the Static Files

Run the build command in your terminal:
```bash
npm run build
```
This will create a `dist/` folder containing `index.html` and bundled assets.

## 2. Publish to GitHub Pages

1. Create a new public repository on GitHub (e.g., `koda-nu-lar`).
2. Upload the **contents** of the `dist/` folder (not the folder itself) to the repository.
   - `index.html` should be at the root.
3. Go to Repository **Settings** -> **Pages**.
4. Select `main` branch as Source and click **Save**.
5. Your site will be live at `https://<your-username>.github.io/koda-nu-lar`.

## 3. Publish to Netlify (Alternative)

1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop the `dist` folder onto the page.
3. It will publish instantly. You can change the domain name in "Site Settings".

## GDPR Compliance
The built site contains no analytics, tracking scripts, or external cookies. It is strictly a static client-side application.
