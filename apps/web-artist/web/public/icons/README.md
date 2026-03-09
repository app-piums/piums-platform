# PWA Icons

This directory contains the Progressive Web App icons for Piums.

## Current Status

The `icon.svg` file contains the source logo. PNG versions need to be generated.

## Generate Icons

You can generate all required PNG sizes using one of these methods:

### Option 1: Using pwa-asset-generator (Recommended)

```bash
npx pwa-asset-generator icons/icon.svg icons --favicon --type png --padding "10%"
```

### Option 2: Using realfavicongenerator.net

1. Visit https://realfavicongenerator.net/
2. Upload `icon.svg`
3. Download the generated package
4. Extract PNG files to this directory

### Option 3: Manual with ImageMagick

```bash
# Install ImageMagick first
brew install imagemagick

# Generate all sizes
convert icon.svg -resize 72x72 icon-72x72.png
convert icon.svg -resize 96x96 icon-96x96.png
convert icon.svg -resize 128x128 icon-128x128.png
convert icon.svg -resize 144x144 icon-144x144.png
convert icon.svg -resize 152x152 icon-152x152.png
convert icon.svg -resize 192x192 icon-192x192.png
convert icon.svg -resize 384x384 icon-384x384.png
convert icon.svg -resize 512x512 icon-512x512.png
```

## Required Sizes

- 72x72 (Android)
- 96x96 (Android)
- 128x128 (Android)
- 144x144 (Android)
- 152x152 (iOS)
- 192x192 (Android, Chrome)
- 384x384 (Android)
- 512x512 (Android, Splash screens)

## Apple Touch Icons

For iOS, also generate:
- apple-touch-icon-180x180.png (for iOS home screen)

## Testing

After generating icons, test with:
- Chrome DevTools → Application → Manifest
- Lighthouse PWA audit
- Real device: Add to Home Screen
