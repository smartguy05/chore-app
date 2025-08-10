# PWA Icon Generation Guide

This directory contains the source SVG icon and needs PNG versions in multiple sizes for PWA compatibility.

## Required Icon Sizes

The following PNG icons need to be generated from `app-icon.svg`:

- icon-72x72.png (72×72)
- icon-96x96.png (96×96)  
- icon-128x128.png (128×128)
- icon-144x144.png (144×144)
- icon-152x152.png (152×152)
- icon-192x192.png (192×192)
- icon-384x384.png (384×384)
- icon-512x512.png (512×512)

## How to Generate Icons

### Option 1: Using ImageMagick (Command Line)
```bash
# Install ImageMagick if not already installed
# sudo apt-get install imagemagick (Ubuntu/Debian)
# brew install imagemagick (macOS)

# Generate all required sizes
convert app-icon.svg -resize 72x72 icon-72x72.png
convert app-icon.svg -resize 96x96 icon-96x96.png
convert app-icon.svg -resize 128x128 icon-128x128.png
convert app-icon.svg -resize 144x144 icon-144x144.png
convert app-icon.svg -resize 152x152 icon-152x152.png
convert app-icon.svg -resize 192x192 icon-192x192.png
convert app-icon.svg -resize 384x384 icon-384x384.png
convert app-icon.svg -resize 512x512 icon-512x512.png
```

### Option 2: Using Online Tools
1. Go to https://realfavicongenerator.net/ or https://www.favicon-generator.org/
2. Upload the `app-icon.svg` file
3. Generate all PWA icon sizes
4. Download and place in this directory

### Option 3: Using Design Software
- Open `app-icon.svg` in Figma, Adobe Illustrator, or Inkscape
- Export as PNG in each required size
- Save to this directory with the correct filenames

## Icon Design Notes

The current icon features:
- Blue circular background (#3b82f6)
- White checklist/task list in center
- Green checkmarks for completed tasks
- Yellow star (rewards system)
- Purple trophy (achievements)

Feel free to customize the colors and design to match your brand preferences.

## Testing PWA Icons

After generating the icons:
1. Build and serve the app
2. Open in Chrome/Edge on mobile
3. Look for "Add to Home Screen" prompt
4. Install and verify the icon appears correctly on home screen