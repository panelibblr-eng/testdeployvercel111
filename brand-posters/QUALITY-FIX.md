# Image Quality Fix Instructions

## Problem
Images appear blurry/low quality in the hero slider.

## Solution Options

### Option 1: Use Higher Quality Images (Recommended)
Replace your current images with higher resolution versions:
- **Minimum Resolution**: 1920x1080 pixels (Full HD)
- **Recommended Resolution**: 2560x1440 pixels (2K)
- **Maximum File Size**: 1-2 MB per image

### Option 2: Use Current Images with Better CSS
The CSS has been optimized to display images without blur:
- Images now use `object-fit: contain` (no stretching)
- Height set to `auto` (maintains aspect ratio)
- Removed transform effects that cause blur
- Added proper image rendering settings

### Option 3: Compress and Optimize Current Images
If your source images are high quality:
1. Use an image optimizer tool (like TinyPNG, Squoosh, or GIMP)
2. Save as JPG with 85-90% quality
3. Target file size: 300-800 KB
4. Maintain resolution above 1920x1080px

## Quick Fix Applied
✅ Changed `object-fit` from `cover` to `contain` (prevents stretching)
✅ Set height to `auto` (maintains aspect ratio)
✅ Removed padding to maximize image area
✅ Optimized image rendering settings

## Testing
1. Hard refresh your browser (Ctrl+F5)
2. Images should display at native quality
3. If still blurry, the source images are low resolution - replace them with higher quality versions

