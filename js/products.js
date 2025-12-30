// Product Display System
class ProductDisplay {
    constructor() {
        this.products = [];
        this.useBackend = true; // Enable backend integration for products from server
        this.initialized = false;
        
        // Initialize with timeout to prevent hanging
        setTimeout(() => {
            this.init().catch(error => {
                console.error('Error initializing ProductDisplay:', error);
                // Don't initialize sample products - products must be added through admin panel
                this.products = [];
                this.initialized = true;
            });
        }, 100);
    }

    async init() {
        console.log('=== INITIALIZING PRODUCT DISPLAY ===');
        this.setupEventListeners();
        
        // Load products and wait for completion
        await this.loadProducts();
        
        console.log('Products loaded:', this.products.length);
        
        // Display products when page loads - try multiple times to ensure it works
        setTimeout(() => {
            this.displayProductsOnPageLoad();
        }, 100);
        
        setTimeout(() => {
            this.displayProductsOnPageLoad();
        }, 500);
        
        setTimeout(() => {
            this.displayProductsOnPageLoad();
        }, 1000);
        
        console.log('=== PRODUCT DISPLAY INITIALIZED ===');
    }

    setupEventListeners() {
        // Listen for admin panel updates (including deletions)
        window.addEventListener('adminDataUpdated', (event) => {
            console.log('Admin data updated event received (refreshing products):', event.detail);
            // Force reload from backend to get fresh data after deletion
            this.loadProducts().then(() => {
                this.displayProductsOnPageLoad();
                console.log('✅ Products refreshed after admin update');
            }).catch(err => {
                console.error('Error refreshing products:', err);
                this.displayProductsOnPageLoad();
            });
        });

        // Listen for storage changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'adminPanelData') {
                console.log('Storage change detected for adminPanelData');
                this.loadProducts();
                this.displayProductsOnPageLoad();
            }
        });

        // Event delegation for View Details buttons and card sliders
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-details-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const productId = e.target.getAttribute('data-product-id');
                console.log('View Details button clicked!');
                console.log('Button element:', e.target);
                console.log('Product ID:', productId);
                console.log('ProductDisplay instance:', this);
                
                if (productId) {
                    console.log('Calling viewProduct with ID:', productId);
                    this.viewProduct(productId);
                } else {
                    console.error('No product ID found on button');
                    console.log('Button attributes:', e.target.attributes);
                }
            }
            
            if (e.target.classList.contains('card-prev') || e.target.classList.contains('card-next')) {
                const media = e.target.closest('.card-slider');
                if (!media) return;
                const slides = Array.from(media.querySelectorAll('.card-slide'));
                if (slides.length < 2) return;
                let idx = parseInt(media.getAttribute('data-idx') || '0');
                idx += e.target.classList.contains('card-next') ? 1 : -1;
                if (idx < 0) idx = slides.length - 1;
                if (idx >= slides.length) idx = 0;
                media.setAttribute('data-idx', String(idx));
                slides.forEach((img, i) => img.style.display = i === idx ? 'block' : 'none');
            }

            // Allow clicking the image itself to advance to the next slide
            if (e.target.classList.contains('card-slide')) {
                const media = e.target.closest('.card-slider');
                if (!media) return;
                const slides = Array.from(media.querySelectorAll('.card-slide'));
                if (slides.length < 2) return;
                let idx = parseInt(media.getAttribute('data-idx') || '0');
                idx = (idx + 1) % slides.length;
                media.setAttribute('data-idx', String(idx));
                slides.forEach((img, i) => img.style.display = i === idx ? 'block' : 'none');
            }
        });

        // Event delegation for Add to Cart buttons
        document.addEventListener('click', (e) => {
            console.log('Click detected on:', e.target);
            console.log('Target classes:', e.target.classList.toString());
            console.log('Is Add to Cart button?', e.target.classList.contains('add-to-cart-btn'));
            
            if (e.target.classList.contains('add-to-cart-btn')) {
                console.log('✅ Add to Cart button clicked!');
                e.preventDefault();
                e.stopPropagation();
                
                // Get product info from data attributes
                const productName = e.target.getAttribute('data-product-name') || 'this product';
                const productBrand = e.target.getAttribute('data-product-brand') || 'Unknown Brand';
                const productPrice = parseFloat(e.target.getAttribute('data-product-price')) || 0;
                const productCategory = e.target.getAttribute('data-product-category') || '';
                const productModel = e.target.getAttribute('data-product-model') || '';
                const productId = e.target.getAttribute('data-product-id') || '';
                
                console.log('Product info:', { productName, productBrand, productPrice, productCategory, productModel, productId });
                
                // Use the global Add to Cart function
                if (typeof window.openAddToCartModal === 'function') {
                    console.log('Using global openAddToCartModal function');
                    window.openAddToCartModal(productName, productBrand, productPrice, productCategory, productModel, productId);
                } else {
                    console.error('openAddToCartModal function not available');
                    alert('Add to Cart functionality is not available. Please try refreshing the page.');
                }
            }
        });
    }

    // Enhanced product loading with retry and fallback
    async loadProducts() {
        try {
            if (this.useBackend && window.apiClient) {
                console.log('🔄 Loading products from backend...');
                
                // Always try to load from backend first (products are publicly accessible)
                // Don't require authentication for viewing products
                try {
                    const response = await window.apiClient.getProducts();
                    this.products = response.products || [];
                    console.log('✅ Backend products loaded:', this.products.length);
                
                // Debug: Log products and their images
                if (this.products.length > 0) {
                    console.log('First product sample:', this.products[0]);
                    console.log('First product images:', this.products[0].images);
                    
                    // Find products with multiple images
                    const productsWithImages = this.products.filter(p => p.images && p.images.length > 0);
                    console.log(`Products with images: ${productsWithImages.length} out of ${this.products.length}`);
                    
                    if (productsWithImages.length > 0) {
                        productsWithImages.forEach(p => {
                            console.log(`Product "${p.name}" (ID: ${p.id}) has ${p.images.length} images:`, p.images.map(img => img.image_url || img));
                        });
                    }
                }
                
                    // Clear cache to force fresh data
                    if (window.apiClient) {
                        window.apiClient.clearCache();
                    }
                    
                    // Save to localStorage for offline use
                    this.saveProducts();
                    
                    // Products loaded successfully from backend, return early
                    return;
                } catch (backendError) {
                    console.warn('⚠️ Backend request failed, trying localStorage fallback:', backendError.message);
                    // Fall through to localStorage fallback
                }
            }
            
            // Fallback to localStorage if backend is not available
            console.log('📦 Loading products from localStorage (backend unavailable)...');
            this.loadProductsFromLocalStorage();
            
            // If no products found, try to initialize with sample data
            if (this.products.length === 0) {
                console.log('No products found, initializing with sample data...');
                this.initializeSampleProducts();
            } else {
                // Products found, make sure they're properly formatted
                this.products = this.products.map(product => ({
                    ...product,
                    featured: Boolean(product.featured), // Ensure boolean
                    trending: Boolean(product.trending || product.trending === 1 || product.trending === '1'), // Ensure boolean, handle 0/1 from DB
                    price: Number(product.price) || 0, // Ensure number
                    createdAt: product.createdAt || new Date().toISOString(),
                    updatedAt: product.updatedAt || new Date().toISOString(),
                    // Explicitly preserve images array
                    images: product.images && Array.isArray(product.images) ? product.images : (product.image_url ? [{ image_url: product.image_url }] : [])
                }));
                
                console.log('Products processed:', this.products.length);
                console.log('Featured products after processing:', this.products.filter(p => p.featured).length);
                
                // Debug: Log products with multiple images
                const productsWithMultipleImages = this.products.filter(p => p.images && p.images.length > 1);
                if (productsWithMultipleImages.length > 0) {
                    console.log(`Found ${productsWithMultipleImages.length} products with multiple images:`, productsWithMultipleImages.map(p => ({ id: p.id, name: p.name, imageCount: p.images.length })));
                }
            }
        } catch (error) {
            console.log('ℹ️ Backend loading failed, using localStorage fallback:', error.message);
            
            // Fallback to localStorage
            try {
                const adminData = JSON.parse(localStorage.getItem('adminPanelData') || '{}');
                this.products = adminData.products || [];
            } catch (localError) {
                console.error('Error loading from localStorage:', localError);
                this.products = [];
            }
            
            // Initialize sample products even if there's an error
            if (this.products.length === 0) {
                this.initializeSampleProducts();
            }
        }
    }

    loadProductsFromLocalStorage() {
        try {
            const adminDataRaw = localStorage.getItem('adminPanelData');
            console.log('Raw adminPanelData from localStorage:', adminDataRaw);
            const adminData = JSON.parse(adminDataRaw || '{}');
            console.log('Parsed adminPanelData:', adminData);
            this.products = adminData.products || [];
            console.log('📦 LocalStorage products loaded:', this.products.length);
            console.log('Products array:', this.products);
        } catch (error) {
            console.error('Error loading products from localStorage:', error);
            this.products = [];
        }
    }

    // Initialize sample products if none exist
    initializeSampleProducts() {
        // Sample products removed - products should be added through admin panel only
        this.products = [];
        console.log('No sample products - products must be added through admin panel');
    }

    // Save products to localStorage (for admin panel integration)
    saveProducts() {
        try {
            let adminData = JSON.parse(localStorage.getItem('adminPanelData') || '{}');
            adminData.products = this.products;
            localStorage.setItem('adminPanelData', JSON.stringify(adminData));
            console.log('Products saved to admin panel data');
        } catch (error) {
            console.error('Error saving products:', error);
        }
    }

    // Get products by category
    getProductsByCategory(category) {
        if (category === 'all') {
            return this.products;
        }
        return this.products.filter(product => product.category === category);
    }

    // Get featured products
    getFeaturedProducts() {
        // Handle both boolean true and number 1 from database
        return this.products.filter(product => {
            return product.featured === true || product.featured === 1 || product.featured === '1' || product.featured === 'true';
        });
    }

    // Get products by gender (deprecated - kept for backward compatibility)
    getProductsByGender(gender) {
        return this.products; // Always return all products now
    }

    // Get placeholder image
    getPlaceholderImage() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgODBDMTEwLjQ2MSA4MCAxMjAgODkuNTM5IDEyMCAxMDBDMTIwIDExMC40NjEgMTEwLjQ2MSAxMjAgMTAwIDEyMEM4OS41MzkxIDEyMCA4MCAxMTAuNDYxIDgwIDEwMEM4MCA4OS41MzkgODkuNTM5MSA4MCAxMDAgODBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMDAgMTQwQzEwNS41MjMgMTQwIDExMCAxMzUuNTIzIDExMCAxMzBDMTEwIDEyNC40NzcgMTA1LjUyMyAxMjAgMTAwIDEyMEM5NC40NzcyIDEyMCA5MCAxMjQuNDc3IDkwIDEzMEM5MCAxMzUuNTIzIDk0LjQ3NzIgMTQwIDEwMCAxNDBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
    }

    // Render product card
    renderProductCard(product) {
        // Build images for inline slider - check multiple sources
        let sliderImages = [];
        
        // Priority 1: Use images array from product_images table
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            sliderImages = product.images.map(img => {
                // Handle both object format { image_url: "..." } and string format
                return typeof img === 'string' ? img : (img.image_url || img);
            }).filter(img => img && img.trim() !== ''); // Filter out any null/undefined/empty values
        }
        
        // Priority 2: If no images from array, check if image_url exists
        if (sliderImages.length === 0 && product.image_url && product.image_url.trim() !== '') {
            sliderImages = [product.image_url];
        }
        
        // Priority 3: Fallback to placeholder
        if (sliderImages.length === 0) {
            sliderImages = [this.getPlaceholderImage()];
        }
        
        // Debug log for products with multiple images
        if (sliderImages.length > 1) {
            console.log(`Product "${product.name}" has ${sliderImages.length} images:`, sliderImages);
        }
        
        return `
            <article class="product-card">
                <div class="product-card__media card-slider" data-idx="0" style="position: relative;">
                    <button class="card-prev" type="button" onclick="window.cardSlidePrev(this)" aria-label="Previous image" style="position:absolute;left:8px;top:8px;background:rgba(222, 161, 147, 0.8);color:#fff;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;z-index:3;transition: all 0.3s ease;">‹</button>
                    ${sliderImages.map((src, i) => `
                        <img class=\"card-slide\" src=\"${src}\" alt=\"${product.name}\" 
                             style=\"width:100%; height:200px; object-fit:cover; border-radius:12px; display:${i===0?'block':'none'}; position:relative; z-index:1;\" 
                             onclick=\"window.cardSlideNext(this)\"
                             onerror="this.src='${this.getPlaceholderImage()}'"/>
                    `).join('')}
                    <button class="card-next" type="button" onclick="window.cardSlideNext(this)" aria-label="Next image" style="position:absolute;right:8px;top:8px;background:rgba(222, 161, 147, 0.8);color:#fff;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;z-index:3;transition: all 0.3s ease;">›</button>
                </div>
                <h3 class="product-card__title">${product.name}</h3>
                <p class="product-card__price">₹ ${product.price.toLocaleString()}</p>
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

    // Display products in a container
    displayProducts(containerId, category = 'all', limit = null, gender = null) {
        const container = document.getElementById(containerId);
        if (!container) {
            // Only log error for containers that should exist on this page
            const expectedContainers = ['featuredProducts', 'trendingProducts'];
            if (expectedContainers.includes(containerId)) {
                console.warn(`Container ${containerId} not found on this page`);
            }
            return;
        }

        let productsToShow = this.getProductsByCategory(category);
        
        // Filter by gender if specified
        if (gender) {
            productsToShow = productsToShow.filter(product => 
                product.gender === gender || product.gender === 'unisex'
            );
        }
        
        if (limit) {
            productsToShow = productsToShow.slice(0, limit);
        }

        if (productsToShow.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b;">
                    <p>No products found in this category.</p>
                    <p>Products will appear here once added through the admin panel.</p>
                </div>
            `;
            return;
        }

        console.log(`Displaying ${productsToShow.length} products in ${containerId} (category: ${category}, gender: ${gender || 'all'})`);

        // Render products
        container.innerHTML = productsToShow.map(product => this.renderProductCard(product)).join('');

        // Auto-rotate card sliders so additional images appear without clicking
        const sliders = Array.from(container.querySelectorAll('.card-slider'));
        sliders.forEach(slider => {
            // Avoid attaching multiple intervals
            if (slider.dataset.rotationAttached === 'true') return;
            slider.dataset.rotationAttached = 'true';

            const slides = Array.from(slider.querySelectorAll('.card-slide'));
            if (slides.length < 2) return; // No need to rotate single-image cards

            // Ensure initial state
            slider.setAttribute('data-idx', slider.getAttribute('data-idx') || '0');

            const advance = () => {
                let idx = parseInt(slider.getAttribute('data-idx') || '0');
                idx = (idx + 1) % slides.length;
                slider.setAttribute('data-idx', String(idx));
                slides.forEach((img, i) => img.style.display = i === idx ? 'block' : 'none');
            };

            // Start rotation
            const intervalId = setInterval(advance, 2500);
            slider.dataset.rotationIntervalId = String(intervalId);

            // Pause on hover for better UX
            slider.addEventListener('mouseenter', () => {
                const id = parseInt(slider.dataset.rotationIntervalId || '0');
                if (id) clearInterval(id);
            });
            slider.addEventListener('mouseleave', () => {
                if (!slides || slides.length < 2) return;
                const id = setInterval(advance, 2500);
                slider.dataset.rotationIntervalId = String(id);
            });
        });
    }

    // Display featured products with slider functionality
    displayFeaturedProducts(containerId, limit = null) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('Featured products container not found:', containerId);
            return;
        }

        const allFeatured = this.getFeaturedProducts();
        console.log('Total featured products found:', allFeatured.length);
        console.log('Featured products:', allFeatured.map(p => ({ id: p.id, name: p.name, featured: p.featured })));
        
        const featuredProducts = limit 
            ? allFeatured.slice(0, limit)
            : allFeatured;
        
        console.log('Displaying featured products:', featuredProducts.length);
        
        if (featuredProducts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b;">
                    <p>No featured products available.</p>
                    <p>Mark products as "Featured" in the admin panel to display them here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = featuredProducts.map(product => this.renderProductCard(product)).join('');
        console.log('Featured products HTML rendered, count:', featuredProducts.length);
        
        // Ensure container has proper width to show all products
        const totalWidth = featuredProducts.length * (container.offsetWidth / 4); // 4 products visible at a time
        container.style.width = '100%';
        container.style.overflowX = 'auto';
        
        // Initialize slider navigation if controls exist
        setTimeout(() => {
            this.initFeaturedSlider();
        }, 100);
    }
    
    // Initialize featured products slider navigation
    initFeaturedSlider() {
        const container = document.getElementById('featuredProducts');
        const prevBtn = document.getElementById('featuredPrev');
        const nextBtn = document.getElementById('featuredNext');
        
        if (!container || !prevBtn || !nextBtn) return;
        
        const scrollAmount = 300; // Pixels to scroll per click
        
        prevBtn.addEventListener('click', () => {
            container.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });
        
        nextBtn.addEventListener('click', () => {
            container.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });
        
        // Show/hide buttons based on scroll position
        const updateButtonVisibility = () => {
            const isAtStart = container.scrollLeft <= 0;
            const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 10;
            
            prevBtn.style.opacity = isAtStart ? '0.5' : '1';
            prevBtn.style.pointerEvents = isAtStart ? 'none' : 'auto';
            
            nextBtn.style.opacity = isAtEnd ? '0.5' : '1';
            nextBtn.style.pointerEvents = isAtEnd ? 'none' : 'auto';
        };
        
        container.addEventListener('scroll', updateButtonVisibility);
        updateButtonVisibility(); // Initial check
    }

    // View product details
    viewProduct(productId) {
        console.log('=== VIEW PRODUCT CALLED ===');
        console.log('Product ID:', productId);
        console.log('Available products:', this.products.length);
        
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            console.error('Product not found with ID:', productId);
            alert('Product not found');
            return;
        }

        console.log('Found product:', product);
        console.log('Product images:', product.images);
        console.log('Product image_url:', product.image_url);

        // Remove any existing modals
        const existingModals = document.querySelectorAll('.product-modal');
        existingModals.forEach(modal => modal.remove());

        // Create a simple product detail modal
        const modal = document.createElement('div');
        modal.className = 'product-modal';
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

        // Add CSS animation
        if (!document.querySelector('#modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .product-modal-content {
                    animation: slideIn 0.3s ease-out;
                }
                @keyframes slideIn {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        // Build images array for gallery - check multiple sources
        let images = [];
        
        // Priority 1: Use images array from product_images table
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            images = product.images.map(img => {
                // Handle both object format { image_url: "..." } and string format
                return typeof img === 'string' ? img : (img.image_url || img);
            }).filter(img => img && img.trim() !== ''); // Filter out any null/undefined/empty values
            
            console.log(`Using ${images.length} images from product.images array`);
        }
        
        // Priority 2: If no images from array, check if image_url exists
        if (images.length === 0 && product.image_url && product.image_url.trim() !== '') {
            images = [product.image_url];
            console.log('Using single image_url:', product.image_url);
        }
        
        // Priority 3: Fallback to placeholder
        if (images.length === 0) {
            images = [this.getPlaceholderImage()];
            console.log('No images found, using placeholder');
        }
        
        console.log('Final gallery images array:', images);
        console.log('Final gallery images count:', images.length);
        
        let currentIndex = 0;

        modal.innerHTML = `
            <div class="product-modal-content" style="background: linear-gradient(135deg, #ffffff, #FCF8F7); padding: 30px; border-radius: 16px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(222, 161, 147, 0.3); border: 1px solid rgba(222, 161, 147, 0.2);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid rgba(222, 161, 147, 0.3); padding-bottom: 15px;">
                    <h2 style="margin: 0; color: #7a534a; font-size: 1.8rem; font-weight: 700;">${product.name}</h2>
                    <button class="close-modal-btn" style="background: rgba(222, 161, 147, 0.1); border: 1px solid rgba(222, 161, 147, 0.3); font-size: 28px; cursor: pointer; color: #7a534a; padding: 5px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">&times;</button>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <div style="position: relative;">
                            ${images.length > 1 ? `<button class="gallery-prev" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);background:rgba(222, 161, 147, 0.8);color:#fff;border:none;border-radius:8px;padding:8px 12px;cursor:pointer;transition: all 0.3s ease;z-index:10;">‹</button>` : ''}
                            <img class="gallery-main" src="${images[0]}" alt="${product.name}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 12px; border: 2px solid rgba(222, 161, 147, 0.3);">
                            ${images.length > 1 ? `<button class="gallery-next" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:rgba(222, 161, 147, 0.8);color:#fff;border:none;border-radius:8px;padding:8px 12px;cursor:pointer;transition: all 0.3s ease;z-index:10;">›</button>` : ''}
                        </div>
                        ${images.length > 1 ? `
                        <div class="gallery-thumbs" style="display:flex;gap:8px;margin-top:10px;overflow-x:auto;">
                            ${images.map((src, idx) => `
                                <img data-index="${idx}" src="${src}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:2px solid ${idx===0?'#DEA193':'rgba(222, 161, 147, 0.3)'};cursor:pointer;transition: all 0.3s ease;" />
                            `).join('')}
                        </div>
                        ` : ''}
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
        
        // Add event listeners for modal interactions
        const closeButtons = modal.querySelectorAll('.close-modal-btn');
        const whatsappButton = modal.querySelector('.whatsapp-modal-btn');
        const mainImg = modal.querySelector('.gallery-main');
        const prevBtn = images.length > 1 ? modal.querySelector('.gallery-prev') : null;
        const nextBtn = images.length > 1 ? modal.querySelector('.gallery-next') : null;
        const thumbs = images.length > 1 ? Array.from(modal.querySelectorAll('.gallery-thumbs img')) : [];
        
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('Close button clicked');
                modal.remove();
            });
        });
        
        function showImage(index) {
            if (images.length === 0) return;
            if (index < 0) index = images.length - 1;
            if (index >= images.length) index = 0; // Wrap around to first image
            currentIndex = index;
            if (mainImg) {
                mainImg.src = images[currentIndex];
            }
            if (thumbs && thumbs.length > 0) {
                thumbs.forEach((t, i) => t.style.borderColor = i === currentIndex ? '#DEA193' : 'rgba(222, 161, 147, 0.3)');
            }
        }
        if (prevBtn && images.length > 1) prevBtn.addEventListener('click', () => showImage(currentIndex - 1));
        if (nextBtn && images.length > 1) nextBtn.addEventListener('click', () => showImage(currentIndex + 1));
        if (thumbs && thumbs.length > 0) {
            thumbs.forEach(t => t.addEventListener('click', (e) => showImage(parseInt(e.currentTarget.getAttribute('data-index')))));
        }

        if (whatsappButton) {
            whatsappButton.addEventListener('click', () => {
                const message = `Hi! I am interested in ${product.name} from ${product.brand}. Can you provide more information?`;
                
                console.log('Modal WhatsApp message:', message);
                
                // Use the global WhatsApp function if available
                if (typeof window.openWhatsApp === 'function') {
                    window.openWhatsApp(message);
                } else {
                    // Fallback to direct WhatsApp URL
                    const cleanMessage = message.trim().replace(/\s+/g, ' ');
                    const encodedMessage = encodeURIComponent(cleanMessage);
                    const whatsappUrl = `https://wa.me/917000532010?text=${encodedMessage}`;
                    console.log('Modal fallback WhatsApp URL:', whatsappUrl);
                    window.open(whatsappUrl, '_blank');
                }
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
        
        console.log('✅ Product modal created and displayed');
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for storage changes to update products when admin panel adds new ones
        window.addEventListener('storage', (e) => {
            if (e.key === 'adminPanelData') {
                console.log('Storage event received, updating products smoothly...');
                this.loadProducts();
                this.refreshAllDisplays();
            }
        });

        // Custom event for same-page updates - use smooth update instead of full refresh
        window.addEventListener('adminDataUpdated', (e) => {
            console.log('Admin data updated event received, updating products smoothly...');
            if (e.detail && e.detail.products) {
                // Only update if products actually changed
                const newProducts = e.detail.products;
                if (JSON.stringify(this.products) !== JSON.stringify(newProducts)) {
                    console.log('Products changed, updating smoothly...');
                    this.products = newProducts;
                    this.saveProducts();
                    this.refreshAllDisplays();
                } else {
                    console.log('Products unchanged, skipping update');
                }
            } else {
                // Fallback to loading from localStorage
                this.loadProducts();
                this.refreshAllDisplays();
            }
        });
    }

    // Display products when page loads
    displayProductsOnPageLoad() {
        console.log('Displaying products on page load...');
        console.log('Available products:', this.products.length);
        
        // Force reload products from admin panel first
        this.loadProducts();
        
        // Display featured products
        this.displayFeaturedProducts('featuredProducts');
        
        // Display category-specific products only if containers exist
        if (document.getElementById('sunglassesGrid')) {
            this.displayProducts('sunglassesGrid', 'sunglasses');
        }
        if (document.getElementById('opticalFramesGrid')) {
            this.displayProducts('opticalFramesGrid', 'optical-frames');
        }
        
        // Display women's category-specific products
        if (document.getElementById('womenSunglassesGrid')) {
            this.displayProducts('womenSunglassesGrid', 'sunglasses', null, 'women');
        }
        if (document.getElementById('womenOpticalFramesGrid')) {
            this.displayProducts('womenOpticalFramesGrid', 'optical-frames', null, 'women');
        }
        
        // Display trending products (show products marked as trending, or fallback to latest 4)
        const trendingProducts = this.products.filter(p => {
            // Handle both boolean true and number 1 from database
            return p.trending === true || p.trending === 1 || p.trending === '1' || p.trending === 'true';
        });
        const productsToShow = trendingProducts.length > 0 
            ? trendingProducts.slice(0, 4) // Show up to 4 trending products
            : this.products.slice(-4).reverse(); // Fallback to latest 4 products
        
        console.log(`Found ${trendingProducts.length} trending products:`, trendingProducts.map(p => p.name));
        
        // ONLY display in trendingProducts container (not featuredProducts)
        const trendingProductsContainer = document.getElementById('trendingProducts');
        if (trendingProductsContainer) {
            trendingProductsContainer.innerHTML = productsToShow.map(product => this.renderProductCard(product)).join('');
            console.log(`Displayed ${productsToShow.length} trending products in trendingProducts container`);
        } else {
            console.warn('Trending products container not found');
        }
        
        if (trendingProducts.length > 0) {
            console.log(`Displaying ${productsToShow.length} trending products (out of ${trendingProducts.length} total trending)`);
        }
        
        console.log('Products displayed:', this.products.length);
        console.log('Featured products:', this.getFeaturedProducts().length);
        console.log('Sunglasses:', this.getProductsByCategory('sunglasses').length);
        console.log('Optical frames:', this.getProductsByCategory('optical-frames').length);
        
        // Debug: Check if featured products are actually showing
        const featuredContainer = document.getElementById('featuredProducts');
        if (featuredContainer) {
            console.log('Featured container HTML:', featuredContainer.innerHTML.substring(0, 200) + '...');
            console.log('Featured container has content:', featuredContainer.innerHTML.length > 0);
        }
    }

    // Refresh all product displays on the page
    refreshAllDisplays() {
        // Refresh featured products
        this.displayFeaturedProducts('featuredProducts');
        
        // Refresh category-specific displays only if containers exist
        if (document.getElementById('sunglassesGrid')) {
            this.displayProducts('sunglassesGrid', 'sunglasses');
        }
        if (document.getElementById('opticalFramesGrid')) {
            this.displayProducts('opticalFramesGrid', 'optical-frames');
        }
        
        // Refresh women's category-specific displays
        if (document.getElementById('womenSunglassesGrid')) {
            this.displayProducts('womenSunglassesGrid', 'sunglasses', null, 'women');
        }
        if (document.getElementById('womenOpticalFramesGrid')) {
            this.displayProducts('womenOpticalFramesGrid', 'optical-frames', null, 'women');
        }
        
        // Refresh trending products (show products marked as trending, or fallback to latest 4)
        const trendingProducts = this.products.filter(p => {
            // Handle both boolean true and number 1 from database
            return p.trending === true || p.trending === 1 || p.trending === '1' || p.trending === 'true';
        });
        const productsToShow = trendingProducts.length > 0 
            ? trendingProducts.slice(0, 4) // Show up to 4 trending products
            : this.products.slice(-4).reverse(); // Fallback to latest 4 products
        
        // ONLY display in trendingProducts container (not featuredProducts)
        const trendingProductsContainer = document.getElementById('trendingProducts');
        if (trendingProductsContainer) {
            trendingProductsContainer.innerHTML = productsToShow.map(product => this.renderProductCard(product)).join('');
            console.log(`Refreshed: Displayed ${productsToShow.length} trending products in trendingProducts container`);
        }
        
        if (trendingProducts.length > 0) {
            console.log(`Refreshed: Found ${trendingProducts.length} total trending products`);
        }
    }

    // Add a new product (called from admin panel)
    addProduct(productData) {
        const product = {
            id: Date.now().toString(),
            ...productData,
            createdAt: new Date().toISOString()
        };
        
        this.products.push(product);
        this.saveProducts();
        this.refreshAllDisplays();
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('adminDataUpdated'));
    }

    // Update a product (called from admin panel)
    updateProduct(productId, productData) {
        const index = this.products.findIndex(p => p.id === productId);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...productData };
            this.saveProducts();
            this.refreshAllDisplays();
            
            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('adminDataUpdated'));
        }
    }

    // Delete a product (called from admin panel)
    deleteProduct(productId) {
        console.log(`🗑️ Removing product ${productId} from frontend display...`);
        
        // Remove from products array
        const beforeCount = this.products.length;
        this.products = this.products.filter(p => p.id !== productId);
        const afterCount = this.products.length;
        
        if (beforeCount > afterCount) {
            console.log(`✅ Product ${productId} removed from products array (${beforeCount} → ${afterCount})`);
        }
        
        // Save updated products list to localStorage (remove deleted product)
        this.saveProducts();
        
        // Clear API cache to force fresh data
        if (window.apiClient) {
            window.apiClient.clearCache();
        }
        
        // Immediately refresh all displays to remove deleted product
        this.refreshAllDisplays();
        
        // Force reload from backend after a short delay to ensure deletion is complete
        setTimeout(() => {
            this.loadProducts().then(() => {
                this.displayProductsOnPageLoad();
                console.log('✅ Products reloaded from backend after deletion');
            }).catch(err => {
                console.error('Error reloading products:', err);
                // Even if reload fails, refresh display with current products
                this.displayProductsOnPageLoad();
            });
        }, 500);
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('adminDataUpdated', { 
            detail: { action: 'delete', productId: productId } 
        }));
    }
}

// Initialize product display system
window.productDisplay = new ProductDisplay();

// Global Add to Cart button handler (backup solution)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart-btn')) {
        console.log('Global Add to Cart button handler triggered');
        e.preventDefault();
        e.stopPropagation();
        
        // Get product info from data attributes
        const productName = e.target.getAttribute('data-product-name') || 'this product';
        const productBrand = e.target.getAttribute('data-product-brand') || 'Unknown Brand';
        const productPrice = parseFloat(e.target.getAttribute('data-product-price')) || 0;
        const productCategory = e.target.getAttribute('data-product-category') || '';
        const productModel = e.target.getAttribute('data-product-model') || '';
        const productId = e.target.getAttribute('data-product-id') || '';
        
        console.log('Global handler - Product info:', { productName, productBrand, productPrice, productCategory, productModel, productId });
        
        // Use the global Add to Cart function
        if (typeof window.openAddToCartModal === 'function') {
            window.openAddToCartModal(productName, productBrand, productPrice, productCategory, productModel, productId);
        } else {
            console.error('openAddToCartModal function not available');
            alert('Add to Cart functionality is not available. Please try refreshing the page.');
        }
    }
});

// Global event listener for view buttons (backup solution)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('view-details-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const productId = e.target.getAttribute('data-product-id');
        console.log('Global View Details button clicked!');
        console.log('Button element:', e.target);
        console.log('Product ID:', productId);
        
        if (productId && window.productDisplay) {
            console.log('Calling viewProduct via global listener with ID:', productId);
            window.productDisplay.viewProduct(productId);
        } else if (!productId) {
            console.error('No product ID found on button');
            console.log('Button attributes:', e.target.attributes);
        } else {
            console.error('ProductDisplay not available');
        }
    }
});

// Auto-refresh products every 30 seconds (reduced frequency to avoid disruption)
// Only run if ProductDisplay is properly initialized
setInterval(() => {
    if (window.productDisplay && window.productDisplay.products) {
        try {
            // Only refresh if admin panel is not currently active (to avoid disruption)
            const isAdminPanelActive = window.location.pathname.includes('admin.html');
            if (!isAdminPanelActive) {
                // Removed console.log to reduce noise - auto-refresh happens silently
                window.productDisplay.loadProducts();
            }
            // Removed else console.log - silent skip
        } catch (error) {
            // Only log actual errors, not routine operations
            console.error('Auto-refresh error:', error);
        }
    }
}, 30000); // Increased from 5 seconds to 30 seconds

// Manual refresh function for debugging
window.refreshProducts = function() {
    console.log('Manual refresh triggered...');
    window.productDisplay.loadProducts();
    window.productDisplay.displayProductsOnPageLoad();
};

// Global function to debug product sync
window.debugProducts = function() {
    console.log('=== PRODUCT DEBUG INFO ===');
    console.log('ProductDisplay exists:', !!window.productDisplay);
    console.log('Products in system:', window.productDisplay?.products?.length || 0);
    console.log('Featured products:', window.productDisplay?.getFeaturedProducts()?.length || 0);
    
    // Check admin data
    try {
        const adminData = JSON.parse(localStorage.getItem('adminPanelData') || '{}');
        console.log('Admin data products:', adminData.products?.length || 0);
        console.log('Admin featured products:', adminData.products?.filter(p => p.featured)?.length || 0);
        console.log('Admin products:', adminData.products);
    } catch (error) {
        console.error('Error reading admin data:', error);
    }
    
    // Check featured container
    const featuredContainer = document.getElementById('featuredProducts');
    console.log('Featured container exists:', !!featuredContainer);
    console.log('Featured container content length:', featuredContainer?.innerHTML?.length || 0);
    
    return 'Debug complete - check console for details';
};

// Global function to force sync products
window.forceSyncProducts = function() {
    console.log('Force syncing products...');
    
    try {
        // Load from admin panel
        const adminData = JSON.parse(localStorage.getItem('adminPanelData') || '{}');
        const products = adminData.products || [];
        
        if (products.length === 0) {
            console.log('No products in admin panel!');
            return 'No products found in admin panel';
        }
        
        // Update productDisplay
        if (window.productDisplay) {
            window.productDisplay.products = products;
            window.productDisplay.saveProducts();
            window.productDisplay.displayProductsOnPageLoad();
            
            console.log('Products synced successfully!');
            return `Synced ${products.length} products (${products.filter(p => p.featured).length} featured)`;
        } else {
            console.log('ProductDisplay not available');
            return 'ProductDisplay system not loaded';
        }
    } catch (error) {
        console.error('Error syncing products:', error);
        return 'Error syncing products: ' + error.message;
    }
};

// Force initialize products (use this if products aren't showing)
window.forceInitProducts = function() {
    console.log('Force initializing products...');
    window.productDisplay.initializeSampleProducts();
    window.productDisplay.displayProductsOnPageLoad();
    console.log('Products force initialized:', window.productDisplay.products.length);
};

// Make functions available immediately
console.log('Product system loaded. Available functions:');
console.log('- window.refreshProducts()');
console.log('- window.forceInitProducts()');
console.log('- window.forceReloadProducts()');
console.log('- window.checkProductStatus()');
console.log('- window.testViewProduct(productId)');
console.log('- window.testViewFirstProduct()');
console.log('- window.testViewButton()');
console.log('- window.testWhatsAppButtons()');
console.log('- window.productDisplay.products');

// Global function to test viewProduct
window.testViewProduct = function(productId) {
    console.log('Testing viewProduct with ID:', productId);
    if (window.productDisplay) {
        window.productDisplay.viewProduct(productId);
    } else {
        console.error('ProductDisplay not available');
    }
};

// Global function to test with first available product
window.testViewFirstProduct = function() {
    if (window.productDisplay && window.productDisplay.products.length > 0) {
        const firstProduct = window.productDisplay.products[0];
        console.log('Testing with first product:', firstProduct);
        window.productDisplay.viewProduct(firstProduct.id);
    } else {
        console.error('No products available for testing');
    }
};

// Global function to force reload products
window.forceReloadProducts = async function() {
    console.log('Force reloading products...');
    if (window.productDisplay) {
        await window.productDisplay.loadProducts();
        window.productDisplay.displayProductsOnPageLoad();
        console.log('Products reloaded:', window.productDisplay.products.length);
        return `Products reloaded: ${window.productDisplay.products.length} products found`;
    } else {
        console.error('ProductDisplay not available');
        return 'ProductDisplay not available';
    }
};

// Global function to force load products from backend API
window.forceLoadFromBackend = async function() {
    console.log('Force loading products from backend API...');
    
    try {
        const apiUrl = (window.apiClient?.baseURL + '/products') || '/api/products';
        const response = await fetch(apiUrl);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend API response:', data);
            
            if (window.productDisplay) {
                window.productDisplay.products = data.products || [];
                window.productDisplay.saveProducts();
                window.productDisplay.displayProductsOnPageLoad();
                console.log('✅ Products loaded from backend API:', window.productDisplay.products.length);
                return `Successfully loaded ${window.productDisplay.products.length} products from backend`;
            } else {
                console.log('❌ ProductDisplay not available');
                return 'ProductDisplay not available';
            }
        } else {
            console.log('❌ Backend API error:', response.status, response.statusText);
            return `Backend API error: ${response.status} ${response.statusText}`;
        }
    } catch (error) {
        console.error('❌ Error loading from backend API:', error);
        return `Error: ${error.message}`;
    }
};

// Global function to check product status
window.checkProductStatus = function() {
    console.log('=== PRODUCT STATUS CHECK ===');
    console.log('ProductDisplay available:', !!window.productDisplay);
    console.log('API Client available:', !!window.apiClient);
    console.log('Products loaded:', window.productDisplay ? window.productDisplay.products.length : 'N/A');
    console.log('Products data:', window.productDisplay ? window.productDisplay.products : 'N/A');
    
    if (window.productDisplay && window.productDisplay.products.length > 0) {
        console.log('First product:', window.productDisplay.products[0]);
        return `✅ Products loaded: ${window.productDisplay.products.length} products available`;
    } else {
        console.log('❌ No products available');
        return '❌ No products available - try window.forceReloadProducts()';
    }
};

// Global function to test WhatsApp buttons
window.testWhatsAppButtons = function() {
    console.log('=== TESTING WHATSAPP BUTTONS ===');
    
    const whatsappButtons = document.querySelectorAll('.whatsapp-btn');
    console.log('WhatsApp buttons found:', whatsappButtons.length);
    
    whatsappButtons.forEach((button, index) => {
        console.log(`Button ${index + 1}:`, {
            element: button,
            classes: button.classList.toString(),
            'data-product-name': button.getAttribute('data-product-name'),
            'data-product-brand': button.getAttribute('data-product-brand'),
            onclick: button.getAttribute('onclick')
        });
    });
    
    if (whatsappButtons.length > 0) {
        console.log('Testing first WhatsApp button...');
        whatsappButtons[0].click();
        return `✅ Found ${whatsappButtons.length} WhatsApp buttons`;
    } else {
        console.log('❌ No WhatsApp buttons found');
        return '❌ No WhatsApp buttons found on page';
    }
};

// Global function to test view button functionality
window.testViewButton = function() {
    console.log('=== TESTING VIEW BUTTON FUNCTIONALITY ===');
    
    // Check if ProductDisplay is available
    if (!window.productDisplay) {
        console.error('❌ ProductDisplay not available');
        return '❌ ProductDisplay not available';
    }
    
    // Check if products are loaded
    if (window.productDisplay.products.length === 0) {
        console.error('❌ No products loaded');
        return '❌ No products loaded - try window.forceReloadProducts()';
    }
    
    // Check if view buttons exist on the page
    const viewButtons = document.querySelectorAll('.view-details-btn');
    console.log('View buttons found on page:', viewButtons.length);
    
    if (viewButtons.length === 0) {
        console.error('❌ No view buttons found on page');
        return '❌ No view buttons found on page - products may not be displayed';
    }
    
    // Test clicking the first button
    const firstButton = viewButtons[0];
    const productId = firstButton.getAttribute('data-product-id');
    console.log('First button product ID:', productId);
    
    if (productId) {
        console.log('✅ Testing view button click...');
        firstButton.click();
        return `✅ View button test completed - check console for results`;
    } else {
        console.error('❌ First button has no product ID');
        return '❌ First button has no product ID';
    }
};

// Global card slider navigation functions
window.cardSlideNext = function(element) {
    const media = element.closest('.card-slider');
    if (!media) return;
    
    const slides = Array.from(media.querySelectorAll('.card-slide'));
    if (slides.length < 2) return;
    
    let idx = parseInt(media.getAttribute('data-idx') || '0');
    idx = (idx + 1) % slides.length;
    media.setAttribute('data-idx', String(idx));
    slides.forEach((img, i) => img.style.display = i === idx ? 'block' : 'none');
};

window.cardSlidePrev = function(element) {
    const media = element.closest('.card-slider');
    if (!media) return;
    
    const slides = Array.from(media.querySelectorAll('.card-slide'));
    if (slides.length < 2) return;
    
    let idx = parseInt(media.getAttribute('data-idx') || '0');
    idx = idx - 1;
    if (idx < 0) idx = slides.length - 1;
    media.setAttribute('data-idx', String(idx));
    slides.forEach((img, i) => img.style.display = i === idx ? 'block' : 'none');
};