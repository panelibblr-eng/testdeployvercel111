// Brand Page JavaScript
class BrandPage {
    constructor() {
        this.brand = this.getBrandFromURL();
        this.products = [];
        this.init();
    }

    init() {
        console.log('Initializing brand page for:', this.brand);
        
        if (!this.brand) {
            this.showError('No brand specified');
            return;
        }

        this.updatePageContent();
        this.loadProducts();
        this.setupEventListeners();
    }

    getBrandFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('brand');
    }

    updatePageContent() {
        // Update page title
        document.getElementById('pageTitle').textContent = `${this.brand} Products - MONICA OPTO HUB`;
        
        // Update brand title
        document.getElementById('brandTitle').textContent = `${this.brand} Collection`;
        
        // Update current brand in breadcrumb
        document.getElementById('currentBrand').textContent = this.brand;
        
        // Update brand description
        const descriptions = {
            'Titan': 'Discover Titan\'s innovative eyewear collection featuring cutting-edge technology and contemporary designs.',
            'Ray-Ban': 'Explore Ray-Ban\'s iconic sunglasses collection, from classic aviators to modern styles.',
            'Tom Ford': 'Experience Tom Ford\'s luxury eyewear with sophisticated designs and premium materials.',
            'Versace': 'Indulge in Versace\'s glamorous eyewear collection featuring bold designs and Italian craftsmanship.',
            'Dolce & Gabbana': 'Discover Dolce & Gabbana\'s opulent eyewear with distinctive Italian style and luxury details.',
            'Burberry': 'Explore Burberry\'s refined eyewear collection with timeless British elegance.',
            'Michael Kors': 'Experience Michael Kors\' sophisticated eyewear with modern American luxury.',
            'Fastrack': 'Discover Fastrack\'s trendy eyewear collection with contemporary designs for the modern lifestyle.',
            'Calvin Klein': 'Explore Calvin Klein\'s minimalist eyewear with clean lines and modern sophistication.',
            'Tommy Hilfiger': 'Experience Tommy Hilfiger\'s classic American style in eyewear with preppy elegance.',
            'Boss': 'Discover Boss\'s professional eyewear collection with executive sophistication.',
            'Carrera': 'Explore Carrera\'s sporty eyewear with racing-inspired designs and performance features.'
        };
        
        const description = descriptions[this.brand] || `Discover our exclusive collection of luxury eyewear from ${this.brand}, featuring premium designs and exceptional craftsmanship.`;
        document.getElementById('brandDescription').textContent = description;
    }

    async loadProducts() {
        // Show loading indicator
        this.showLoading();
        
        try {
            console.log('Loading products for brand:', this.brand);
            
            // Try localStorage first for instant loading
            const adminData = JSON.parse(localStorage.getItem('adminPanelData') || '{}');
            const allProducts = adminData.products || [];
            const localProducts = allProducts.filter(product => product.brand === this.brand);
            
            if (localProducts.length > 0) {
                console.log('Products loaded from localStorage (instant):', localProducts.length);
                this.products = localProducts;
                this.displayProducts();
            }
            
            // Then try API in background to sync (with shorter timeout for faster loading)
            if (window.apiClient && localProducts.length === 0) {
                // Only wait for API if we don't have localStorage data
                try {
                    console.log('Fetching from API (no localStorage data)...');
                    // Use shorter timeout for brand page (3 seconds instead of 10)
                    const apiPromise = window.apiClient.getProducts({ brand: this.brand });
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('API timeout')), 3000)
                    );
                    
                    const response = await Promise.race([apiPromise, timeoutPromise]);
                    this.products = response.products || [];
                    console.log('Products loaded from API:', this.products.length);
                    this.displayProducts();
                } catch (apiError) {
                    console.warn('API request failed or timed out:', apiError.message);
                    // Show error if no products at all
                    if (this.products.length === 0) {
                        this.displayProducts(); // Will show "no products" message
                    }
                }
            } else if (window.apiClient && localProducts.length > 0) {
                // We have localStorage data, sync with API in background (non-blocking)
                window.apiClient.getProducts({ brand: this.brand })
                    .then(response => {
                        const apiProducts = response.products || [];
                        if (apiProducts.length !== localProducts.length) {
                            console.log('API returned different product count, updating...');
                            this.products = apiProducts;
                            this.displayProducts();
                        }
                    })
                    .catch(err => {
                        console.log('Background API sync failed (non-critical):', err.message);
                        // Keep using localStorage data
                    });
            } else {
                // No API client, use localStorage
                if (this.products.length === 0) {
                    this.products = localProducts;
                    this.displayProducts();
                }
            }
            
            // If still no products, show message
            if (this.products.length === 0) {
                this.displayProducts();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            // Try localStorage as final fallback
            const adminData = JSON.parse(localStorage.getItem('adminPanelData') || '{}');
            const allProducts = adminData.products || [];
            this.products = allProducts.filter(product => product.brand === this.brand);
            
            if (this.products.length > 0) {
                this.displayProducts();
            } else {
                this.showError('Failed to load products');
            }
        }
    }
    
    showLoading() {
        const container = document.getElementById('productsContainer');
        const noProductsMessage = document.getElementById('noProductsMessage');
        
        if (container) {
            container.style.display = 'grid';
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top-color: #DEA193; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                    <p style="margin-top: 20px; color: #64748b; font-size: 1rem;">Loading products...</p>
                </div>
            `;
        }
        
        if (noProductsMessage) {
            noProductsMessage.style.display = 'none';
        }
        
        // Add spin animation if not exists
        if (!document.getElementById('loading-spin-style')) {
            const style = document.createElement('style');
            style.id = 'loading-spin-style';
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    displayProducts() {
        const container = document.getElementById('productsContainer');
        const noProductsMessage = document.getElementById('noProductsMessage');
        
        if (this.products.length === 0) {
            container.style.display = 'none';
            noProductsMessage.style.display = 'block';
            return;
        }
        
        container.style.display = 'grid';
        noProductsMessage.style.display = 'none';
        
        container.innerHTML = this.products.map(product => this.renderProductCard(product)).join('');
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
                    <span class="product-gender">${product.gender}</span>
                </div>
                <button class="btn btn--ghost view-details-btn" data-product-id="${product.id}">View Details</button>
                <button class="btn btn--primary add-to-cart-btn" 
                        data-product-name="${product.name}" 
                        data-product-brand="${product.brand}"
                        data-product-price="${product.price}"
                        data-product-category="${product.category}"
                        data-product-model="${product.model || ''}"
                        data-product-id="${product.id}">🛒 Add to Cart</button>
            </article>
        `;
    }

    getPlaceholderImage() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgODBDMTEwLjQ2MSA4MCAxMjAgODkuNTM5IDEyMCAxMDBDMTIwIDExMC40NjEgMTEwLjQ2MSAxMjAgMTAwIDEyMEM4OS41MzkxIDEyMCA4MCAxMTAuNDYxIDgwIDEwMEM4MCA4OS41MzkgODkuNTM5MSA4MCAxMDAgODBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMDAgMTQwQzEwNS41MjMgMTQwIDExMCAxMzUuNTIzIDExMCAxMzBDMTEwIDEyNC40NzcgMTA1LjUyMyAxMjAgMTAwIDEyMEM5NC40NzcyIDEyMCA5MCAxMjQuNDc3IDkwIDEzMEM5MCAxMzUuNTIzIDk0LjQ3NzIgMTQwIDEwMCAxNDBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
    }

    setupEventListeners() {
        // Handle view details buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-details-btn')) {
                e.preventDefault();
                const productId = e.target.getAttribute('data-product-id');
                this.viewProduct(productId);
            }
        });

        // Handle Add to Cart buttons
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

    viewProduct(productId) {
        const product = this.products.find(p => p.id === productId);
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

        const images = (product.images && product.images.length > 0)
            ? product.images.map(img => img.image_url)
            : (product.image_url ? [product.image_url] : [this.getPlaceholderImage()]);
        let currentIndex = 0;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px;">
                    <h2 style="margin: 0; color: #0f172a; font-size: 1.8rem;">${product.name}</h2>
                    <button class="close-modal-btn" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #64748b; padding: 5px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">&times;</button>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <div style="position: relative;">
                            <button class="gallery-prev" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);background:#0008;color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer">‹</button>
                            <img class="gallery-main" src="${images[0]}" alt="${product.name}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px; border: 2px solid #f1f5f9;">
                            <button class="gallery-next" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:#0008;color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer">›</button>
                        </div>
                        <div class="gallery-thumbs" style="display:flex;gap:8px;margin-top:10px;overflow-x:auto;">
                            ${images.map((src, idx) => `
                                <img data-index="${idx}" src="${src}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:2px solid ${idx===0?'#DEA193':'#e5e7eb'};cursor:pointer;" />
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #475569;">Brand:</strong> 
                            <span style="color: #0f172a; font-weight: 500;">${product.brand}</span>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #475569;">Category:</strong> 
                            <span style="color: #0f172a; font-weight: 500;">${product.category}</span>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #475569;">Gender:</strong> 
                            <span style="color: #0f172a; font-weight: 500;">${product.gender}</span>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #475569;">Model:</strong> 
                            <span style="color: #0f172a; font-weight: 500;">${product.model || 'N/A'}</span>
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
                    <button class="add-to-cart-modal-btn" style="background: linear-gradient(135deg, #DEA193, #BA867B); color: white; border: none; padding: 15px 25px; border-radius: 12px; cursor: pointer; flex: 1; font-weight: bold; font-size: 1rem; box-shadow: 0 4px 15px rgba(222, 161, 147, 0.3); transition: all 0.3s ease;">
                        🛒 Add to Cart
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
        const addToCartButton = modal.querySelector('.add-to-cart-modal-btn');
        const mainImg = modal.querySelector('.gallery-main');
        const prevBtn = modal.querySelector('.gallery-prev');
        const nextBtn = modal.querySelector('.gallery-next');
        const thumbs = Array.from(modal.querySelectorAll('.gallery-thumbs img'));
        
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });
        
        if (addToCartButton) {
            addToCartButton.addEventListener('click', () => {
                this.openAddToCartModal(product.name, product.brand, product.price, product.category, product.model, product.id);
                modal.remove();
            });
        }

        function showImage(index) {
            if (index < 0) index = images.length - 1;
            if (index >= images.length) index = images.length - 1;
            currentIndex = index;
            mainImg.src = images[currentIndex];
            thumbs.forEach((t, i) => t.style.borderColor = i === currentIndex ? '#DEA193' : '#e5e7eb');
        }
        if (prevBtn) prevBtn.addEventListener('click', () => showImage(currentIndex - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => showImage(currentIndex + 1));
        thumbs.forEach(t => t.addEventListener('click', (e) => showImage(parseInt(e.currentTarget.getAttribute('data-index')))));
        
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

    showError(message) {
        const container = document.getElementById('productsContainer');
        const noProductsMessage = document.getElementById('noProductsMessage');
        
        container.style.display = 'none';
        noProductsMessage.style.display = 'block';
        noProductsMessage.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 20px;">⚠️</div>
            <h3 style="color: #dc2626; margin-bottom: 15px;">Error</h3>
            <p style="color: #64748b; margin-bottom: 30px;">${message}</p>
            <a href="index.html#brands" class="btn btn--primary">Back to Brands</a>
        `;
    }
}

// Initialize brand page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.brandPage = new BrandPage();
});

// Add CSS for product meta
const style = document.createElement('style');
style.textContent = `
    .product-card__meta {
        display: flex;
        gap: 10px;
        margin: 10px 0;
        font-size: 0.9rem;
    }
    
    .product-category, .product-gender {
        background: #f1f5f9;
        padding: 4px 8px;
        border-radius: 4px;
        color: #475569;
        font-size: 0.8rem;
    }
    
    .product-category {
        background: #dbeafe;
        color: #1e40af;
    }
    
    .product-gender {
        background: #f0fdf4;
        color: #166534;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(style);
