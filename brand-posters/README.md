# Brand Posters for Hero Section

This folder contains the brand promotional posters that will be displayed in the hero section slider on the homepage.

## How It Works

The hero section slider will automatically display these brand posters in a sliding carousel format when no custom hero images are set in the admin panel.

## Adding Your Poster Images

To add brand posters to the slider, simply place your images in this folder with the following filenames:

1. `carrera.jpg` - Carrera Eyewear
2. `boss.jpg` - Boss Eyewear  
3. `michael-kors.jpg` - Michael Kors Eyewear
4. `versace.jpg` - Versace Eyewear
5. `montblanc.jpg` - Montblanc Eyewear
6. `philipp-plein.jpg` - Philipp Plein Eyewear
7. `marc-jacobs.jpg` - Marc Jacobs Eyewear
8. `tom-ford.jpg` - Tom Ford Eyewear
9. `burberry.jpg` - Burberry Eyewear
10. `dolce-gabbana.jpg` - Dolce & Gabbana Eyewear

## Image Specifications

- **Format**: JPG or PNG
- **Recommended Size**: 1200x800 pixels (3:2 aspect ratio)
- **Maximum File Size**: 500KB per image for optimal performance

## Behavior

- The slider automatically rotates through all available posters
- Each poster displays for 2 seconds before transitioning to the next
- The transition effect is smooth and elegant
- Users can pause the slider by hovering over it
- Click on the indicator dots to jump to a specific poster

## Overriding Default Posters

To upload your own brand posters instead:
1. Open the admin panel (`admin.html`)
2. Navigate to the "Hero Section" settings
3. Upload your custom images
4. These will override the default brand posters

## Need Help?

If you need to add or remove brands, you can modify the `loadDefaultBrandPosters()` method in `js/main.js` to include or exclude specific brands.

