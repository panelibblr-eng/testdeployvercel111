# How to Add Brand Poster Images to Hero Slider

## Step-by-Step Instructions

### 1. Save Each Image with These Exact Filenames

Please save your brand poster images to this folder:
```
website/uploads/brand-posters/
```

With these exact filenames (all lowercase, matching the code):

1. `carrera.jpg` - Your Carrera poster image
2. `boss.jpg` - Your Boss poster image  
3. `michael-kors.jpg` - Your Michael Kors poster image
4. `versace.jpg` - Your Versace poster image
5. `montblanc.jpg` - Your Montblanc poster image
6. `philipp-plein.jpg` - Your Philipp Plein poster image
7. `marc-jacobs.jpg` - Your Marc Jacobs poster image
8. `tom-ford.jpg` - Your Tom Ford poster image
9. `burberry.jpg` - Your Burberry poster image
10. `dolce-gabbana.jpg` - Your Dolce & Gabbana poster image

### 2. File Format and Size Recommendations

- **Format**: JPG, PNG, or WebP
- **Size**: 1200x800 pixels (3:2 aspect ratio) recommended
- **File Size**: Under 500KB each for fast loading

### 3. What Happens Next

Once you save the images with those exact filenames:

✅ The hero slider will automatically display them  
✅ Images will rotate every 2 seconds  
✅ Users can pause by hovering  
✅ Indicator dots allow jumping to specific images  
✅ Smooth fade transitions between images  

### 4. Quick Start

1. Download or export your 10 brand poster images
2. Rename each one to match the filenames above
3. Save them to: `uploads/brand-posters/` folder
4. Refresh the website - the slider will automatically show them!

### 5. Testing

After adding images:
- Visit `index.html` to see the hero slider
- The images should automatically appear in rotation
- Check console (F12) if images don't appear - may need to adjust file paths

### 6. Customizing

If you want to add or remove brands later, edit:
- `website/js/main.js` - Search for `loadDefaultBrandPosters()`
- `website/www/js/main.js` - Same function for mirrored version

---

**Tip**: If you want to use different brands or rename existing ones, just modify the filenames in the JavaScript code and match them with your actual image files.

