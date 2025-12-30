// Dynamic Brand Loader
class BrandLoader {
    constructor() {
        this.brands = [];
        this.init();
    }

    async init() {
        await this.loadBrands();
        this.updateBrandButtons();
    }

    async loadBrands() {
        try {
            // Define all available brands
            const allAvailableBrands = [
                'Titan', 'Fastrack', 'Irus', 'Idee', 'French Connection', 
                'Tommy Hilfiger', 'Calvin Klein', 'Ray-Ban', 'Carrera', 
                'Boss', 'Hugo', 'Marc Jacobs', 'Versace', 'Dolce & Gabbana', 
                'Burberry', 'Off-White', 'Tom Ford', 'Philipp Plein', 
                'Scott', 'Vogue', 'Michael Kors', 'David Walker', 
                'Mont Blanc', 'Police', 'Gucci', 'Armani Exchange'
            ];

            if (window.apiClient) {
                console.log('Loading brands from API...');
                const response = await window.apiClient.getBrands();
                const dbBrands = response.brands || [];
                console.log('Brands loaded from API:', dbBrands);
                
                // Use all available brands (not just those with products)
                this.brands = allAvailableBrands.sort();
                console.log('All available brands:', this.brands);
            } else {
                console.log('API client not available, using fallback...');
                // Fallback to localStorage
                const adminData = JSON.parse(localStorage.getItem('adminPanelData') || '{}');
                const allProducts = adminData.products || [];
                const dbBrands = [...new Set(allProducts.map(product => product.brand))];
                console.log('Brands loaded from localStorage:', dbBrands);
                
                // Use all available brands (not just those with products)
                this.brands = allAvailableBrands.sort();
                console.log('All available brands:', this.brands);
            }
        } catch (error) {
            console.error('Error loading brands:', error);
            // Fallback to all available brands even on error
            this.brands = [
                'Titan', 'Fastrack', 'Irus', 'Idee', 'French Connection', 
                'Tommy Hilfiger', 'Calvin Klein', 'Ray-Ban', 'Carrera', 
                'Boss', 'Hugo', 'Marc Jacobs', 'Versace', 'Dolce & Gabbana', 
                'Burberry', 'Off-White', 'Tom Ford', 'Philipp Plein', 
                'Scott', 'Vogue', 'Michael Kors', 'David Walker', 
                'Mont Blanc', 'Police', 'Gucci', 'Armani Exchange'
            ].sort();
        }
    }

    updateBrandButtons() {
        // Update brand grid on homepage
        this.updateBrandGrid();
        
        // Update navigation mega menu
        this.updateNavigationMenu();
        
        // Update brand page navigation
        this.updateBrandPageNavigation();
    }

    updateBrandGrid() {
        const brandGrid = document.querySelector('.brand-grid');
        if (!brandGrid) return;

        if (this.brands.length === 0) {
            brandGrid.innerHTML = '<p style="text-align: center; color: #64748b;">No brands available</p>';
            return;
        }

        brandGrid.innerHTML = this.brands.map(brand => 
            `<a class="brand-card" href="brand.html?brand=${encodeURIComponent(brand)}">${brand}</a>`
        ).join('');
    }

    updateNavigationMenu() {
        const megaMenu = document.querySelector('.mega');
        if (!megaMenu) return;

        if (this.brands.length === 0) {
            megaMenu.innerHTML = '<div class="mega__col"><h4>No Brands Available</h4></div>';
            return;
        }

        // Group brands alphabetically
        const groupedBrands = this.groupBrandsAlphabetically();
        
        megaMenu.innerHTML = Object.entries(groupedBrands).map(([group, brands]) => 
            `<div class="mega__col">
                <h4>${group}</h4>
                ${brands.map(brand => 
                    `<a href="brand.html?brand=${encodeURIComponent(brand)}">${brand}</a>`
                ).join('')}
            </div>`
        ).join('');
    }

    updateBrandPageNavigation() {
        // Only update if we're on the brand page
        if (!window.location.pathname.includes('brand.html')) return;

        const megaMenu = document.querySelector('.mega');
        if (!megaMenu) return;

        if (this.brands.length === 0) {
            megaMenu.innerHTML = '<div class="mega__col"><h4>No Brands Available</h4></div>';
            return;
        }

        // Group brands alphabetically
        const groupedBrands = this.groupBrandsAlphabetically();
        
        megaMenu.innerHTML = Object.entries(groupedBrands).map(([group, brands]) => 
            `<div class="mega__col">
                <h4>${group}</h4>
                ${brands.map(brand => 
                    `<a href="brand.html?brand=${encodeURIComponent(brand)}">${brand}</a>`
                ).join('')}
            </div>`
        ).join('');
    }

    groupBrandsAlphabetically() {
        const groups = {};
        
        this.brands.forEach(brand => {
            const firstLetter = brand.charAt(0).toUpperCase();
            if (!groups[firstLetter]) {
                groups[firstLetter] = [];
            }
            groups[firstLetter].push(brand);
        });

        // Sort groups and brands within each group
        Object.keys(groups).sort().forEach(key => {
            groups[key].sort();
        });

        return groups;
    }

    // Method to refresh brands (useful after adding new products)
    async refreshBrands() {
        await this.loadBrands();
        this.updateBrandButtons();
    }
}

// Initialize brand loader when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.brandLoader = new BrandLoader();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrandLoader;
}
