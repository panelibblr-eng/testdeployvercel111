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

        document.getElementById('loadMoreBtn').addEventListener('click', () => {
            this.loadMoreProducts();
        });

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

            // ✅ Load from localStorage FIRST for instant display
            const adminData = JSON.parse(localStorage.getItem('adminPanelData') || '{}');
            this.products = adminData.products || [];

            if (this.products.length > 0) {
                console.log('Products loaded from localStorage:', this.products.length);
                this.applyFilters();
            }

            // ✅ Then try API with 5 second timeout
            if (window.apiClient) {
                try {
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('timeout')), 5000)
                    );
                    const response = await Promise.race([
                        window.apiClient.getProducts(),
                        timeoutPromise
                    ]);
                    const apiProducts = response.products || [];
                    if (apiProducts.length > 0) {
                        this.products = apiProducts;
                        console.log('Products updated from API:', this.products.length);
                        this.applyFilters();
                    }
                } catch (apiError) {
                    console.warn('API failed or timed out:', apiError.message);
                }
            }

            // ✅ If still empty show error
            if (this.products.length === 0) {
                this.showError('No products found. Please check back later.');
            }

        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products. Please refresh the page.');
        }
    }

    applyFilters() {
        console.log('Applying filters:', this.filters);
        this.filteredProducts = [...this.products];

        if (this.filters.category !== 'all') {
            this.filteredProducts = this.filteredProducts.filter(product =>
                product.category === this.filters.category
            );
        }

        if (this.filters.brand !== 'all') {
            this.filteredProducts = this.filteredProducts.filter(product =>
                product.brand === this.filters.brand
            );
        }

        this.sortProducts();
        this.currentPage = 1;
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

        loadingMessage.style.display = 'none';

        if (this.filteredProducts.length === 0) {
            container.style.display = 'none';
            noProductsMessage.style.display = 'block';
            loadMoreContainer.style.display = 'none';
            return;
        }

        container.style.display = 'grid';
        noProductsMessage.style.display = 'none';

        const endIndex = Math.min(this.currentPage * this.productsPerPage, this.filteredProducts.length);
        const productsToShow = this.filteredProducts.slice(0, endIndex);

        container.innerHTML = productsToShow.map(product => this.renderProductCard(product)).join('');

        if (endIndex < this.filteredProducts.length) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }

        this.updateResultsCount();
    }

    loadMoreProducts() {
        this.currentPage++;
        this.displayProducts();
    }

    updateResultsCount() {
        const resultsText = 'Showing ' + Math.min(this.currentPage * this.productsPerPage, this.filteredProducts.length) + ' of ' + this.filteredProducts.length + ' products';
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
        const productId = product._id || product.id;
        const placeholder = this.getPlaceholderImage();

        let sliderImages = [];
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            sliderImages = product.images.map(function(img) {
                return typeof img === 'string' ? img : (img.image_url || img);
            }).filter(function(img) { return img && img.trim() !== ''; });
        }
        if (sliderImages.length === 0 && product.image_url) {
            sliderImages = [product.image_url];
        }
        if (sliderImages.length === 0) {
            sliderImages = [placeholder];
        }

        const hasMultiple = sliderImages.length > 1;

        let imagesHtml = '';
        for (let i = 0; i < sliderImages.length; i++) {
            imagesHtml += '<img src="' + sliderImages[i] + '" alt="' + product.name + '" style="width:100%;height:200px;object-fit:cover;border-radius:8px;display:' + (i === 0 ? 'block' : 'none') + ';position:absolute;top:0;left:0;" onerror="this.src=\'' + placeholder + '\'" />';
        }

        return '<article class="product-card">' +
            '<div class="product-card__media card-slider" data-idx="0" style="position:relative;height:200px;overflow:hidden;border-radius:8px;">' +
            (hasMultiple ? '<button onclick="apSliderPrev(this)" style="position:absolute;left:6px;top:6px;background:rgba(222,161,147,0.85);color:#fff;border:none;border-radius:8px;padding:5px 10px;cursor:pointer;z-index:3;font-size:1rem;">&#8249;</button>' : '') +
            imagesHtml +
            (hasMultiple ? '<button onclick="apSliderNext(this)" style="position:absolute;right:6px;top:6px;background:rgba(222,161,147,0.85);color:#fff;border:none;border-radius:8px;padding:5px 10px;cursor:pointer;z-index:3;font-size:1rem;">&#8250;</button>' : '') +
            '</div>' +
            '<h3 class="product-card__title">' + product.name + '</h3>' +
            '<p class="product-card__price">&#8377; ' + product.price.toLocaleString() + '</p>' +
            '<div class="product-card__meta">' +
            '<span class="product-category">' + product.category + '</span>' +
            '<span class="product-brand">' + product.brand + '</span>' +
            '</div>' +
            '<button class="btn btn--ghost view-details-btn" data-product-id="' + productId + '">View Details</button>' +
            '<button class="btn btn--primary add-to-cart-btn" data-product-name="' + product.name + '" data-product-brand="' + product.brand + '" data-product-price="' + product.price + '" data-product-category="' + product.category + '" data-product-model="' + (product.model || '') + '" data-product-id="' + productId + '" style="width:100%;margin-top:10px;">&#x1F6D2; Add to Cart</button>' +
            '</article>';
    }

    getPlaceholderImage() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgODBDMTEwLjQ2MSA4MCAxMjAgODkuNTM5IDEyMCAxMDBDMTIwIDExMC40NjEgMTEwLjQ2MSAxMjAgMTAwIDEyMEM4OS41MzkxIDEyMCA4MCAxMTAuNDYxIDgwIDEwMEM4MCA4OS41MzkgODkuNTM5MSA4MCAxMDAgODBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMDAgMTQwQzEwNS41MjMgMTQwIDExMCAxMzUuNTIzIDExMCAxMzBDMTEwIDEyNC40NzcgMTA1LjUyMyAxMjAgMTAwIDEyMEM5NC40NzcyIDEyMCA5MCAxMjQuNDc3IDkwIDEzMEM5MCAxMzUuNTIzIDk0LjQ3NzIgMTQwIDEwMCAxNDBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
    }

    viewProduct(productId) {
        const product = this.filteredProducts.find(p => (p._id || p.id) == productId);
        if (!product) {
            alert('Product not found');
            return;
        }

        let images = [];
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            images = product.images.map(function(img) {
                return typeof img === 'string' ? img : (img.image_url || img);
            }).filter(function(img) { return img && img.trim() !== ''; });
        }
        if (images.length === 0 && product.image_url) images = [product.image_url];
        if (images.length === 0) images = [this.getPlaceholderImage()];

        let currentIndex = 0;
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';

        const thumbsHtml = images.length > 1 ? images.map(function(src, idx) {
            return '<img data-index="' + idx + '" src="' + src + '" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:2px solid ' + (idx === 0 ? '#DEA193' : 'rgba(222,161,147,0.3)') + ';cursor:pointer;" />';
        }).join('') : '';

        const navHtml = images.length > 1 ?
            '<button class="gallery-prev" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);background:rgba(222,161,147,0.8);color:#fff;border:none;border-radius:8px;padding:8px 12px;cursor:pointer;z-index:10;">&#8249;</button>' +
            '<button class="gallery-next" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:rgba(222,161,147,0.8);color:#fff;border:none;border-radius:8px;padding:8px 12px;cursor:pointer;z-index:10;">&#8250;</button>' : '';

        modal.innerHTML =
            '<div style="background:linear-gradient(135deg,#ffffff,#FCF8F7);padding:30px;border-radius:16px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(222,161,147,0.3);">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid rgba(222,161,147,0.3);padding-bottom:15px;">' +
            '<h2 style="margin:0;color:#7a534a;font-size:1.8rem;font-weight:700;">' + product.name + '</h2>' +
            '<button class="close-modal-btn" style="background:rgba(222,161,147,0.1);border:1px solid rgba(222,161,147,0.3);font-size:28px;cursor:pointer;color:#7a534a;border-radius:50%;width:40px;height:40px;">&times;</button>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">' +
            '<div>' +
            '<div style="position:relative;">' +
            navHtml +
            '<img class="gallery-main" src="' + images[0] + '" alt="' + product.name + '" style="width:100%;height:250px;object-fit:cover;border-radius:12px;border:2px solid rgba(222,161,147,0.3);">' +
            '</div>' +
            (images.length > 1 ? '<div style="display:flex;gap:8px;margin-top:10px;overflow-x:auto;">' + thumbsHtml + '</div>' : '') +
            '</div>' +
            '<div>' +
            '<div style="margin-bottom:15px;"><strong style="color:#7a534a;">Brand:</strong> ' + product.brand + '</div>' +
            '<div style="margin-bottom:15px;"><strong style="color:#7a534a;">Category:</strong> ' + product.category + '</div>' +
            '<div style="margin-bottom:15px;"><strong style="color:#7a534a;">Model:</strong> ' + (product.model || 'N/A') + '</div>' +
            '<div style="margin-bottom:20px;padding:15px;background:linear-gradient(135deg,#DEA193,#BA867B);border-radius:12px;text-align:center;">' +
            '<strong style="color:white;">Price</strong><br>' +
            '<span style="color:white;font-size:1.5em;font-weight:bold;">&#8377; ' + product.price.toLocaleString() + '</span>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div style="display:flex;gap:15px;margin-top:25px;">' +
            '<button class="whatsapp-modal-btn" style="background:linear-gradient(135deg,#25D366,#128C7E);color:white;border:none;padding:15px 25px;border-radius:12px;cursor:pointer;flex:1;font-weight:bold;">&#128241; Contact via WhatsApp</button>' +
            '<button class="close-modal-btn" style="background:linear-gradient(135deg,#DEA193,#BA867B);color:white;border:none;padding:15px 25px;border-radius:12px;cursor:pointer;font-weight:bold;">Close</button>' +
            '</div>' +
            '</div>';

        document.body.appendChild(modal);

        const mainImg = modal.querySelector('.gallery-main');
        const prevBtn = modal.querySelector('.gallery-prev');
        const nextBtn = modal.querySelector('.gallery-next');
        const thumbs = Array.from(modal.querySelectorAll('[data-index]'));

        function showImage(index) {
            if (index < 0) index = images.length - 1;
            if (index >= images.length) index = 0;
            currentIndex = index;
            mainImg.src = images[currentIndex];
            thumbs.forEach(function(t, i) {
                t.style.borderColor = i === currentIndex ? '#DEA193' : 'rgba(222,161,147,0.3)';
            });
        }

        if (prevBtn) prevBtn.addEventListener('click', function() { showImage(currentIndex - 1); });
        if (nextBtn) nextBtn.addEventListener('click', function() { showImage(currentIndex + 1); });
        thumbs.forEach(function(t) {
            t.addEventListener('click', function() { showImage(parseInt(t.getAttribute('data-index'))); });
        });

        modal.querySelectorAll('.close-modal-btn').forEach(function(btn) {
            btn.addEventListener('click', function() { modal.remove(); });
        });

        modal.querySelector('.whatsapp-modal-btn').addEventListener('click', function() {
            const message = 'Hi! I am interested in ' + product.name + ' from ' + product.brand + '. Can you provide more information?';
            if (typeof window.openWhatsApp === 'function') {
                window.openWhatsApp(message);
            } else {
                window.open('https://wa.me/917000532010?text=' + encodeURIComponent(message), '_blank');
            }
            modal.remove();
        });

        modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
        document.addEventListener('keydown', function handleEsc(e) {
            if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', handleEsc); }
        });
    }

    openAddToCartModal(productName, productBrand, productPrice, productCategory, productModel, productId) {
        if (window.openAddToCartModal) {
            window.openAddToCartModal(productName, productBrand, productPrice, productCategory, productModel, productId);
        } else {
            alert('Add to Cart functionality is not available. Please try the Quick Order option.');
        }
    }

    openWhatsApp(productName, productBrand) {
        const message = 'Hi! I am interested in ' + productName + ' from ' + productBrand + '. Can you provide more information?';
        if (typeof window.openWhatsApp === 'function') {
            window.openWhatsApp(message);
        } else {
            window.open('https://wa.me/917000532010?text=' + encodeURIComponent(message), '_blank');
        }
    }

    showError(message) {
        const container = document.getElementById('productsContainer');
        const loadingMessage = document.getElementById('loadingMessage');
        const noProductsMessage = document.getElementById('noProductsMessage');
        loadingMessage.style.display = 'none';
        container.style.display = 'none';
        noProductsMessage.style.display = 'block';
        noProductsMessage.innerHTML =
            '<div style="font-size:4rem;margin-bottom:20px;">⚠️</div>' +
            '<h3 style="color:#dc2626;margin-bottom:15px;">Error</h3>' +
            '<p style="color:#64748b;margin-bottom:30px;">' + message + '</p>' +
            '<button onclick="location.reload()" class="btn btn--primary">Retry</button>';
    }
}

function clearFilters() {
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('brandFilter').value = 'all';
    document.getElementById('sortBy').value = 'newest';
    if (window.allProductsPage) {
        window.allProductsPage.filters = { category: 'all', brand: 'all', sortBy: 'newest' };
        window.allProductsPage.applyFilters();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.allProductsPage = new AllProductsPage();
});

window.debugAllProducts = function() {
    console.log('=== ALL PRODUCTS DEBUG ===');
    console.log('Products:', window.allProductsPage?.products?.length || 0);
    console.log('Filtered:', window.allProductsPage?.filteredProducts?.length || 0);
    return 'Debug complete - check console';
};

window.apSliderNext = function(btn) {
    const slider = btn.closest('.card-slider');
    if (!slider) return;
    const slides = Array.from(slider.querySelectorAll('img'));
    if (slides.length < 2) return;
    let idx = parseInt(slider.getAttribute('data-idx') || '0');
    idx = (idx + 1) % slides.length;
    slider.setAttribute('data-idx', String(idx));
    slides.forEach(function(img, i) { img.style.display = i === idx ? 'block' : 'none'; });
};

window.apSliderPrev = function(btn) {
    const slider = btn.closest('.card-slider');
    if (!slider) return;
    const slides = Array.from(slider.querySelectorAll('img'));
    if (slides.length < 2) return;
    let idx = parseInt(slider.getAttribute('data-idx') || '0');
    idx = idx - 1;
    if (idx < 0) idx = slides.length - 1;
    slider.setAttribute('data-idx', String(idx));
    slides.forEach(function(img, i) { img.style.display = i === idx ? 'block' : 'none'; });
};

const style = document.createElement('style');
style.textContent = '.product-card__meta{display:flex;gap:8px;margin:10px 0;font-size:0.8rem;flex-wrap:wrap;}.product-category{background:#dbeafe;color:#1e40af;padding:4px 8px;border-radius:4px;font-size:0.75rem;}.product-brand{background:#fef3c7;color:#92400e;padding:4px 8px;border-radius:4px;font-size:0.75rem;}@keyframes fadeIn{from{opacity:0}to{opacity:1}}#productsContainer{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-bottom:40px;}@media(max-width:768px){#productsContainer{grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;}}';
document.head.appendChild(style);
