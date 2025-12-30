// Website Content Management System
class WebsiteContentManager {
    constructor() {
        this.adminData = null;
        this.init();
    }

    init() {
        this.loadAdminData();
        this.setupEventListeners();
        this.updateWebsiteContent();
        
        // Auto-refresh content every 30 seconds (reduced frequency to avoid disruption)
        setInterval(() => {
            // Only refresh if admin panel is not currently active (to avoid disruption)
            const isAdminPanelActive = window.location.pathname.includes('admin.html');
            if (!isAdminPanelActive) {
                console.log('Auto-refreshing website content (admin panel not active)...');
                this.loadAdminData();
                this.updateWebsiteContent();
            } else {
                console.log('Skipping auto-refresh (admin panel active)');
            }
        }, 30000); // Increased from 5 seconds to 30 seconds
    }

    loadAdminData() {
        try {
            const savedData = localStorage.getItem('adminPanelData');
            if (savedData) {
                this.adminData = JSON.parse(savedData);
                console.log('Website content data loaded:', this.adminData);
            } else {
                console.log('No admin data found in localStorage');
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    }

    setupEventListeners() {
        // Listen for storage changes from admin panel
        window.addEventListener('storage', (e) => {
            if (e.key === 'adminPanelData') {
                console.log('Storage change detected in website content manager');
                this.loadAdminData();
                this.updateWebsiteContent();
            }
        });

        // Listen for custom events from admin panel - only update if content actually changed
        window.addEventListener('adminDataUpdated', (event) => {
            console.log('Admin data updated event received in website content manager:', event.detail);
            
            // Check if content actually changed before updating
            const newData = event.detail;
            if (newData && this.adminData) {
                const contentChanged = JSON.stringify(newData.settings?.content) !== JSON.stringify(this.adminData.settings?.content);
                const websiteChanged = JSON.stringify(newData.settings?.website) !== JSON.stringify(this.adminData.settings?.website);
                
                if (contentChanged || websiteChanged) {
                    console.log('Content changed, updating website...');
                    this.loadAdminData();
                    this.updateWebsiteContent();
                } else {
                    console.log('Content unchanged, skipping website update');
                }
            } else {
                // Fallback to full update
                this.loadAdminData();
                this.updateWebsiteContent();
            }
        });
    }

    updateWebsiteContent() {
        if (!this.adminData) return;

        this.updateHeroSection();
        this.updateBrands();
        this.updateSocialMedia();
        this.updateSiteSettings();
        this.updateProducts();
    }

    updateProducts() {
        // DISABLED: This was causing conflicts with admin panel product management
        // The admin panel handles its own product management
        console.log('Product updates handled by admin panel - skipping website content manager interference');
    }

    updateHeroSection() {
        const content = this.adminData.settings?.content?.hero;
        console.log('updateHeroSection called with content:', content);
        if (!content) {
            console.log('No hero content found in admin data');
            return;
        }

        // Update hero eyebrow text
        const eyebrowElement = document.querySelector('.hero .eyebrow');
        if (eyebrowElement) {
            eyebrowElement.textContent = content.eyebrow || 'Now Trending';
        }

        // Update hero title
        const titleElement = document.querySelector('.hero h1');
        if (titleElement) {
            titleElement.innerHTML = content.title || 'Ray-Ban Meta Glasses';
        }

        // Update hero description
        const descElement = document.querySelector('.hero .lead');
        if (descElement) {
            descElement.textContent = content.description || 'Immersive, iconic, and innovative. Book your pair today.';
        }

        // Update hero images if provided
        console.log('Hero images to update:', content.images);
        if (content.images && content.images.length > 0) {
            console.log('Updating hero images with', content.images.length, 'images');
            // Trigger photo slider update if it exists
            if (window.photoSliderInstance) {
                console.log('Photo slider instance found, updating images');
                window.photoSliderInstance.updateSliderImages(content.images);
            } else {
                console.log('Photo slider instance not ready, retrying in 100ms');
                // If photo slider not ready, try again after a short delay
                setTimeout(() => {
                    if (window.photoSliderInstance) {
                        console.log('Photo slider instance found on retry, updating images');
                        window.photoSliderInstance.updateSliderImages(content.images);
                    } else {
                        console.log('Photo slider instance still not ready after retry');
                    }
                }, 100);
            }
        } else {
            console.log('No hero images to update');
        }
    }


    updateBrands() {
        let brands = this.adminData.settings?.content?.brands;
        // Initialize default brands if missing
        if (!brands || !Array.isArray(brands)) {
            brands = [
                'Ray-Ban', 'Tom Ford', 'Prada', 'Cartier', 'Versace',
                'Police', 'Gucci', 'Armani Exchange'
            ];
            // Persist defaults into admin data without overwriting other settings
            try {
                this.adminData = this.adminData || {};
                this.adminData.settings = this.adminData.settings || {};
                this.adminData.settings.content = this.adminData.settings.content || {};
                this.adminData.settings.content.brands = brands;
                localStorage.setItem('adminPanelData', JSON.stringify(this.adminData));
            } catch (e) {
                console.warn('Could not persist default brands:', e);
            }
        }

        // Update brand dropdown in product form
        const brandSelect = document.getElementById('productBrand');
        if (brandSelect) {
            // Clear existing options except the first one
            brandSelect.innerHTML = '<option value="">Select Brand</option>';
            
            // Add brands from admin data
            brands.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand;
                option.textContent = brand;
                brandSelect.appendChild(option);
            });
        }

        // Update brand grid on homepage
        this.updateBrandGrid(brands);
    }

    updateBrandGrid(brands) {
        const brandGrid = document.querySelector('.brand-grid');
        if (!brandGrid) return;

        // Brand grid is now handled by direct links to brand pages
        // No JavaScript filtering needed
        console.log('Brand grid updated with direct links to brand pages');
    }


    updateSocialMedia() {
        const social = this.adminData.settings?.content?.social;
        if (!social) return;

        // Update WhatsApp button
        if (social.whatsapp) {
            const whatsappButtons = document.querySelectorAll('[onclick*="wa.me"]');
            whatsappButtons.forEach(button => {
                const onclick = button.getAttribute('onclick');
                if (onclick) {
                    button.setAttribute('onclick', onclick.replace(/wa\.me\/\d+/, `wa.me/${social.whatsapp}`));
                }
            });
        }

        // Update contact phone in footer
        const phoneLink = document.querySelector('a[href^="tel:"]');
        if (phoneLink && social.whatsapp) {
            phoneLink.href = `tel:+${social.whatsapp}`;
            phoneLink.textContent = `+${social.whatsapp}`;
        }
    }

    updateSiteSettings() {
        const website = this.adminData.settings?.website;
        if (!website) return;

        // Update page title
        if (website.title) {
            document.title = website.title;
        }

        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && website.description) {
            metaDesc.content = website.description;
        }

        // Update logo - preserve image logo, only update alt text
        const logoImg = document.querySelector('.logo-img');
        if (logoImg && website.title) {
            logoImg.alt = website.title + ' logo';
        }
        
        // Don't override the logo image with text - preserve the Monica Opto Hub logo
        console.log('Logo preserved - not overriding Monica Opto Hub logo image');

        // Update contact email
        const emailLink = document.querySelector('a[href^="mailto:"]');
        if (emailLink && website.contactEmail) {
            emailLink.href = `mailto:${website.contactEmail}`;
            emailLink.textContent = website.contactEmail;
        }
    }

    // Method to get current content for admin panel
    getCurrentContent() {
        return {
            hero: {
                eyebrow: document.querySelector('.hero .eyebrow')?.textContent || '',
                title: document.querySelector('.hero h1')?.textContent || '',
                description: document.querySelector('.hero .lead')?.textContent || '',
                image: ''
            },
            brands: this.adminData?.settings?.content?.brands || [],
            social: {
                whatsapp: this.extractWhatsAppNumber(),
                instagram: 'https://www.instagram.com/monicaoptohub?igsh=d3ZsMTA1ZzE5Zm0z&utm_source=qr',
                facebook: ''
            }
        };
    }

    extractWhatsAppNumber() {
        const whatsappButton = document.querySelector('[onclick*="wa.me"]');
        if (whatsappButton) {
            const onclick = whatsappButton.getAttribute('onclick');
            const match = onclick.match(/wa\.me\/(\d+)/);
            return match ? match[1] : '917000532010';
        }
        return '917000532010';
    }

    // Method to refresh all content
    refreshContent() {
        this.loadAdminData();
        this.updateWebsiteContent();
        
        // DISABLED: Product refresh handled by admin panel to avoid conflicts
        console.log('Product refresh handled by admin panel - skipping website content manager interference');
    }
}

// Initialize website content manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.websiteContentManager = new WebsiteContentManager();
});

// Global function for manual refresh
window.refreshWebsiteContent = function() {
    console.log('Manually refreshing website content...');
    window.websiteContentManager.refreshContent();
};

console.log('Website content manager loaded. Use window.refreshWebsiteContent() to manually refresh.');
