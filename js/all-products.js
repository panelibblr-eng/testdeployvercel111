// All Products Page JavaScript
class AllProductsPage {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.filters = {
            category: 'all',
            brand: 'all',
            sortBy: 'newest'
        };
        this.init();
    }

    init() {
        console.log('Initializing All Products page');
        this.setupEventListeners();
        this.parseUrlParameters();
        this.loadProducts();
    }

    parseUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        if (category) {
            this.filters.category = category;
            const categorySelect = document.getElementById('categoryFilter');
            if (categorySelect) {
                categorySelect.value = category;
            }
        }
        
        console.log('URL parameters parsed:', { category });
    }

    setupEventListeners() {
        // Filter controls
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.applyFilters();
        });

        document.getElementById('brandFilter').addEventListener('change', (e) => {
            this.filters.brand = e.target.value;
            this.applyFilters();
        });

        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.filters.sortBy = e.target.value;
            this.applyFilters();
        });

        // Load more button
        document.getElementById('loadMoreBtn').addEventListener('click', () => {
            this.loadMoreProducts();
        });

        // Product interaction handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-details-btn')) {
                e.preventDefault();
                const productId = e.target.getAttribute('data-product-id');
                this.viewProduct(productId);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) {
                e.preventDefault();
                const productName = e.target.getAttribute('data-product-name');
                const productBrand = e.target.getAttribute('data-product-brand');
                const productPrice = parseFloat(e.target.getAttribute('data-product-price'));
                const productCategory = e.target.getAttribute('data-product-category');
                const productModel = e.target.getAttribute('data-product-model');
                const productId = e.target.getAttribute('data-product-id');
                this.openAddToCartModal(productName, productBrand, productPrice, productCategory, productModel, productId);
            }
        });
    }

    async loadProducts() {
        try {
            console.log('Loading all products...');
            
            // Try API first
            if (window.apiClient) {
                try {
                    const response = await window.apiClient.getProducts();
                    this.products = response.products || [];
                    console.log('Products loaded from API:', this.products.length);
                    if (this.products.length > 0) {
                        this.applyFilters();
                        return;
                    }
                } catch (apiError) {
                    console.warn('API failed, trying localStorage:', apiError);
                }
            }
            
            // Fallback to localStorage
            const adminData = JSON.parse(localStorage.getItem('adminPanelData') || '{}');
            this.products = adminData.products || [];
            console.log('Products loaded from localStorage:', this.products.length);
            
            // If still no products, try direct fetch
            if (this.products.length === 0) {
                try {
                    const apiUrl = (window.apiClient?.baseURL + '/products') || '/api/products';
                    const response = await fetch(apiUrl);
                    if (response.ok) {
                        const data = await response.json();
                        this.products = data.products || [];
                        console.log('Products loaded from direct fetch:', this.products.length);
                    }
                } catch (fetchError) {
                    console.warn('Direct fetch failed:', fetchError);
                }
            }
            
            this.applyFilters();
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products. Please check if the server is running.');
        }
    }

    applyFilters() {
        console.log('Applying filters:', this.filters);
        
        // Start with all products
        this.filteredProducts = [...this.products];

        // Apply category filter
        if (this.filters.category !== 'all') {
            this.filteredProducts = this.filteredProducts.filter(product => 
                product.category === this.filters.category
            );
        }

        // Apply brand filter
        if (this.filters.brand !== 'all') {
            this.filteredProducts = this.filteredProducts.filter(product => 
                product.brand === this.filters.brand
            );
        }

        // Apply sorting
        this.sortProducts();

        // Reset pagination
        this.currentPage = 1;

        // Display products
        this.displayProducts();
    }

    sortProducts() {
        switch (this.filters.sortBy) {
            case 'newest':
                this.filteredProducts.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
                break;
            case 'oldest':
                this.filteredProducts.sort((a, b) => new Date(a.created_at || a.createdAt || 0) - new Date(b.created_at || b.createdAt || 0));
                break;
            case 'price-low':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }
    }

    displayProducts() {
        const container = document.getElementById('productsContainer');
        const loadingMessage = document.getElementById('loadingMessage');
        const noProductsMessage = document.getElementById('noProductsMessage');
        const loadMoreContainer = document.getElementById('loadMoreContainer');

        // Hide loading message
        loadingMessage.style.display = 'none';

        if (this.filteredProducts.length === 0) {
            container.style.display = 'none';
            noProductsMessage.style.display = 'block';
            loadMoreContainer.style.display = 'none';
            return;
        }

        container.style.display = 'grid';
        noProductsMessage.style.display = 'none';

        // Calculate products to show
        const startIndex = 0;
        const endIndex = Math.min(this.currentPage * this.productsPerPage, this.filteredProducts.length);
        const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

        // Render products
        container.innerHTML = productsToShow.map(product => this.renderProductCard(product)).join('');

        // Show/hide load more button
        if (endIndex < this.filteredProducts.length) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }

        // Update results count
        this.updateResultsCount();
    }

    loadMoreProducts() {
        this.currentPage++;
        this.displayProducts();
    }

    updateResultsCount() {
        const resultsText = `Showing ${Math.min(this.currentPage * this.productsPerPage, this.filteredProducts.length)} of ${this.filteredProducts.length} products`;
        
        // Update or create results count element
        let resultsElement = document.getElementById('resultsCount');
        if (!resultsElement) {
            resultsElement = document.createElement('div');
            resultsElement.id = 'resultsCount';
            resultsElement.style.cssText = 'text-align: center; margin-bottom: 20px; color: #64748b; font-weight: 500;';
            document.getElementById('productsContainer').parentElement.insertBefore(resultsElement, document.getElementById('productsContainer'));
        }
        resultsElement.textContent = resultsText;
    }

    renderProductCard(product) {
        // Get the primary image or first available image
        let imageUrl = this.getPlaceholderImage();
        
        if (product.images && product.images.length > 0) {
            // Use the primary image or first image
            const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
            imageUrl = primaryImage.image_url;
        } else if (product.image_url) {
            imageUrl = product.image_url;
        }
        
        return `
            <article class="product-card">
                <div class="product-card__media">
                    <img src="${imageUrl}" 
                         alt="${product.name}" 
                         style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;"
                         onerror="this.src='${this.getPlaceholderImage()}'">
                    ${product.images && product.images.length > 1 ? `<div class="image-count-badge">+${product.images.length - 1}</div>` : ''}
                </div>
                <h3 class="product-card__title">${product.name}</h3>
                <p class="product-card__price">₹ ${product.price.toLocaleString()}</p>
                <div class="product-card__meta">
                    <span class="product-category">${product.category}</span>
                    <span class="product-brand">${product.brand}</span>
                </div>
                <button class="btn btn--ghost view-details-btn" data-product-id="${product.id}">View Details</button>
                <button class="btn btn--primary add-to-cart-btn" 
                        data-product-name="${product.name}" 
                        data-product-brand="${product.brand}"
                        data-product-price="${product.price}"
                        data-product-category="${product.category}"
                        data-product-model="${product.model || ''}"
                        data-product-id="${product.id}" style="width: 100%; margin-top: 10px;">🛒 Add to Cart</button>
            </article>
        `;
    }

    getPlaceholderImage() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgODBDMTEwLjQ2MSA4MCAxMjAgODkuNTM5IDEyMCAxMDBDMTIwIDExMC40NjEgMTEwLjQ2MSAxMjAgMTAwIDEyMEM4OS41MzkxIDEyMCA4MCAxMTAuNDYxIDgwIDEwMEM4MCA4OS41MzkgODkuNTM5MSA4MCAxMDAgODBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMDAgMTQwQzEwNS41MjMgMTQwIDExMCAxMzUuNTIzIDExMCAxMzBDMTEwIDEyNC40NzcgMTA1LjUyMyAxMjAgMTAwIDEyMEM5NC40NzcyIDEyMCA5MCAxMjQuNDc3IDkwIDEzMEM5MCAxMzUuNTIzIDk0LjQ3NzIgMTQwIDEwMCAxNDBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
    }

    viewProduct(productId) {
        const product = this.filteredProducts.find(p => p.id == productId);
        if (!product) {
            alert('Product not found');
            return;
        }

        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease-in-out;
        `;

        const imageUrl = product.image_url || product.image || this.getPlaceholderImage();
        
        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #ffffff, #FCF8F7); padding: 30px; border-radius: 16px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(222, 161, 147, 0.3); border: 1px solid rgba(222, 161, 147, 0.2);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid rgba(222, 161, 147, 0.3); padding-bottom: 15px;">
                    <h2 style="margin: 0; color: #7a534a; font-size: 1.8rem; font-weight: 700;">${product.name}</h2>
                    <button class="close-modal-btn" style="background: rgba(222, 161, 147, 0.1); border: 1px solid rgba(222, 161, 147, 0.3); font-size: 28px; cursor: pointer; color: #7a534a; padding: 5px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">&times;</button>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <img src="${imageUrl}" alt="${product.name}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 12px; border: 2px solid rgba(222, 161, 147, 0.3);">
                    </div>
                    <div>
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #7a534a;">Brand:</strong> 
                            <span style="color: #1f2937; font-weight: 500;">${product.brand}</span>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #7a534a;">Category:</strong> 
                            <span style="color: #1f2937; font-weight: 500;">${product.category}</span>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #7a534a;">Model:</strong> 
                            <span style="color: #1f2937; font-weight: 500;">${product.model || 'N/A'}</span>
                        </div>
                        
                        <div style="margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, #DEA193, #BA867B); border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(222, 161, 147, 0.3);">
                            <strong style="color: white; font-size: 1.1rem;">Price</strong><br>
                            <span style="color: white; font-size: 1.5em; font-weight: bold;">₹ ${product.price.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                ${product.description ? `
                    <div style="margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, #F3DDD8, #F0D4CE); border-radius: 12px; border-left: 4px solid #DEA193;">
                        <strong style="color: #7a534a;">Description:</strong><br>
                        <span style="color: #1f2937; line-height: 1.6;">${product.description}</span>
                    </div>
                ` : ''}
                
                <div style="display: flex; gap: 15px; margin-top: 25px;">
                    <button class="whatsapp-modal-btn" style="background: linear-gradient(135deg, #25D366, #128C7E); color: white; border: none; padding: 15px 25px; border-radius: 12px; cursor: pointer; flex: 1; font-weight: bold; font-size: 1rem; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3); transition: all 0.3s ease;">
                        📱 Contact via WhatsApp
                    </button>
                    <button class="close-modal-btn" style="background: linear-gradient(135deg, #DEA193, #BA867B); color: white; border: none; padding: 15px 25px; border-radius: 12px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 15px rgba(222, 161, 147, 0.3); transition: all 0.3s ease;">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeButtons = modal.querySelectorAll('.close-modal-btn');
        const whatsappButton = modal.querySelector('.whatsapp-modal-btn');
        
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });
        
        if (whatsappButton) {
            whatsappButton.addEventListener('click', () => {
                this.openWhatsApp(product.name, product.brand);
                modal.remove();
            });
        }
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Close modal with Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    openAddToCartModal(productName, productBrand, productPrice, productCategory, productModel, productId) {
        if (window.openAddToCartModal) {
            window.openAddToCartModal(productName, productBrand, productPrice, productCategory, productModel, productId);
        } else {
            console.error('Add to Cart modal function not available');
            alert('Add to Cart functionality is not available. Please try the Quick Order option.');
        }
    }

    openWhatsApp(productName, productBrand) {
        const message = `Hi! I am interested in ${productName} from ${productBrand}. Can you provide more information?`;
        
        console.log('WhatsApp message:', message);
        
        // Use the global WhatsApp function if available
        if (typeof window.openWhatsApp === 'function') {
            window.openWhatsApp(message);
        } else {
            // Fallback to direct WhatsApp URL
            const cleanMessage = message.trim().replace(/\s+/g, ' ');
            const encodedMessage = encodeURIComponent(cleanMessage);
            const whatsappUrl = `https://wa.me/917000532010?text=${encodedMessage}`;
            console.log('Fallback WhatsApp URL:', whatsappUrl);
            window.open(whatsappUrl, '_blank');
        }
    }

    showError(message) {
        const container = document.getElementById('productsContainer');
        const loadingMessage = document.getElementById('loadingMessage');
        const noProductsMessage = document.getElementById('noProductsMessage');
        
        loadingMessage.style.display = 'none';
        container.style.display = 'none';
        noProductsMessage.style.display = 'block';
        noProductsMessage.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 20px;">⚠️</div>
            <h3 style="color: #dc2626; margin-bottom: 15px;">Error</h3>
            <p style="color: #64748b; margin-bottom: 30px;">${message}</p>
            <button onclick="location.reload()" class="btn btn--primary">Retry</button>
        `;
    }
}

// Clear filters function
function clearFilters() {
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('brandFilter').value = 'all';
    document.getElementById('sortBy').value = 'newest';
    
    if (window.allProductsPage) {
        window.allProductsPage.filters = {
            category: 'all',
            brand: 'all',
            sortBy: 'newest'
        };
        window.allProductsPage.applyFilters();
    }
}

// Initialize all products page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.allProductsPage = new AllProductsPage();
});

// Debug function to check products
window.debugAllProducts = function() {
    console.log('=== ALL PRODUCTS DEBUG ===');
    console.log('AllProductsPage instance:', window.allProductsPage);
    console.log('Products in AllProductsPage:', window.allProductsPage?.products?.length || 0);
    console.log('Filtered products:', window.allProductsPage?.filteredProducts?.length || 0);
    
    // Check API client
    console.log('API Client available:', !!window.apiClient);
    
    // Check localStorage
    const adminData = JSON.parse(localStorage.getItem('adminPanelData') || '{}');
    console.log('LocalStorage products:', adminData.products?.length || 0);
    
    // Test direct API call
    const apiUrl = (window.apiClient?.baseURL + '/products') || '/api/products';
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log('Direct API call result:', data.products?.length || 0);
            console.log('API products:', data.products);
        })
        .catch(error => {
            console.error('Direct API call failed:', error);
        });
    
    return 'Debug complete - check console for details';
};

// Add CSS for product meta
const style = document.createElement('style');
style.textContent = `
    .product-card__meta {
        display: flex;
        gap: 8px;
        margin: 10px 0;
        font-size: 0.8rem;
        flex-wrap: wrap;
    }
    
    .product-category, .product-gender, .product-brand {
        background: #f1f5f9;
        padding: 4px 8px;
        border-radius: 4px;
        color: #475569;
        font-size: 0.75rem;
    }
    
    .product-category {
        background: #dbeafe;
        color: #1e40af;
    }
    
    .product-gender {
        background: #f0fdf4;
        color: #166534;
    }
    
    .product-brand {
        background: #fef3c7;
        color: #92400e;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    #productsContainer {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        margin-bottom: 40px;
    }
    
    @media (max-width: 768px) {
        #productsContainer {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
    }
`;
document.head.appendChild(style);
