// Mobile navigation toggle - REMOVED OLD SYSTEM

// Brands mega-menu (mobile expand)
document.querySelectorAll('.has-mega').forEach((item)=>{
    const toggle = item.querySelector('.mega-toggle');
    if(!toggle) return;
    toggle.addEventListener('click', (e)=>{
        // On desktop hover handles it; on mobile we toggle class
        if(window.matchMedia('(max-width: 900px)').matches){
            e.preventDefault();
            const isOpen = item.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        }
    });
});

    // Search functionality
    document.addEventListener('DOMContentLoaded', function() {
        // Search button functionality
        const searchButton = document.querySelector('.action[aria-label="Search"]');
        if (searchButton) {
            searchButton.addEventListener('click', function() {
                openSearchModal();
            });
        }
        
        // Brand navigation functionality (simplified for separate pages)
        console.log('Brand navigation set up for separate pages');
    });

    // Search modal functionality
    function openSearchModal() {
        // Create search modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: flex-start;
            justify-content: center;
            z-index: 10000;
            padding-top: 100px;
            animation: fadeIn 0.3s ease-in-out;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px;">
                    <h2 style="margin: 0; color: #0f172a; font-size: 1.8rem;">🔍 Search Products</h2>
                    <button class="close-search-modal-btn" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #64748b; padding: 5px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">&times;</button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <input type="text" id="searchInput" placeholder="Search for products, brands, or categories..." 
                           style="width: 100%; padding: 15px 20px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1.1rem; outline: none; transition: border-color 0.3s;"
                           onkeyup="handleSearchInput(event)">
                    <div id="searchSuggestions" style="margin-top: 10px; max-height: 200px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; background: white; display: none;"></div>
                </div>
                
                <div id="searchResults" style="max-height: 400px; overflow-y: auto;">
                    <div style="text-align: center; padding: 40px; color: #64748b;">
                        <div style="font-size: 3rem; margin-bottom: 15px;">🔍</div>
                        <h3 style="margin-bottom: 10px;">Start typing to search</h3>
                        <p>Search for products by name, brand, or category</p>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; margin-top: 25px;">
                    <button onclick="window.open('all-products.html', '_blank')" style="background: linear-gradient(135deg, #DEA193, #BA867B); color: white; border: none; padding: 12px 25px; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 1rem; box-shadow: 0 4px 15px rgba(222, 161, 147, 0.3); flex: 1; transition: all 0.3s ease;">
                        📋 View All Products
                    </button>
                    <button class="close-search-modal-btn" style="background: #64748b; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus on search input
        setTimeout(() => {
            document.getElementById('searchInput').focus();
        }, 100);
        
        // Add event listeners
        const closeButtons = modal.querySelectorAll('.close-search-modal-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });
        
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

    // Handle search input
    function handleSearchInput(event) {
        const searchTerm = event.target.value.trim();
        const searchResults = document.getElementById('searchResults');
        const searchSuggestions = document.getElementById('searchSuggestions');
        
        if (searchTerm.length < 2) {
            searchResults.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🔍</div>
                    <h3 style="margin-bottom: 10px;">Start typing to search</h3>
                    <p>Search for products by name, brand, or category</p>
                </div>
            `;
            searchSuggestions.style.display = 'none';
            return;
        }
        
        // Show loading
        searchResults.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #64748b;">
                <div style="font-size: 2rem; margin-bottom: 15px;">⏳</div>
                <h3 style="margin-bottom: 10px;">Searching...</h3>
                <p>Looking for products matching "${searchTerm}"</p>
            </div>
        `;
        
        // Perform search
        performSearch(searchTerm);
    }

    // Perform search function
    async function performSearch(searchTerm) {
        try {
            let products = [];
            
            // Try to get products from API first
            if (window.apiClient) {
                try {
                    const response = await window.apiClient.getProducts({ search: searchTerm });
                    products = response.products || [];
                } catch (apiError) {
                    console.log('API search failed, trying localStorage:', apiError);
                }
            }
            
            // Fallback to localStorage
            if (products.length === 0) {
                const adminData = JSON.parse(localStorage.getItem('adminPanelData') || '{}');
                const allProducts = adminData.products || [];
                products = allProducts.filter(product => 
                    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (product.model && product.model.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            }
            
            displaySearchResults(products, searchTerm);
            
        } catch (error) {
            console.error('Search error:', error);
            displaySearchError(searchTerm);
        }
    }

    // Display search results
    function displaySearchResults(products, searchTerm) {
        const searchResults = document.getElementById('searchResults');
        
        if (products.length === 0) {
            searchResults.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">😔</div>
                    <h3 style="margin-bottom: 10px;">No products found</h3>
                    <p>No products match "${searchTerm}". Try a different search term.</p>
                    <button onclick="window.open('all-products.html', '_blank')" style="background: linear-gradient(135deg, #DEA193, #BA867B); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 15px; box-shadow: 0 4px 15px rgba(222, 161, 147, 0.3); transition: all 0.3s ease;">
                        Browse All Products
                    </button>
                </div>
            `;
            return;
        }
        
        const resultsHTML = products.map(product => `
            <div style="display: flex; gap: 15px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 10px; background: #f8fafc;">
                <div style="width: 80px; height: 80px; background: #f1f5f9; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                    🕶️
                </div>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #0f172a; font-size: 1.1rem;">${product.name}</h4>
                    <p style="margin: 0 0 5px 0; color: #64748b; font-size: 0.9rem;">${product.brand} • ${product.category}</p>
                    <p style="margin: 0 0 10px 0; color: #059669; font-weight: bold; font-size: 1rem;">₹ ${product.price.toLocaleString()}</p>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button onclick="viewProductFromSearch('${product.id}')" style="background: linear-gradient(135deg, #DEA193, #BA867B); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; flex: 1; box-shadow: 0 2px 8px rgba(222, 161, 147, 0.3); transition: all 0.3s ease;">
                            View Details
                        </button>
                        <button onclick="openAddToCartFromSearch('${product.name}', '${product.brand}', ${product.price}, '${product.category}', '${product.model || ''}', '${product.id}')" style="background: linear-gradient(135deg, #DEA193, #BA867B); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; flex: 1; box-shadow: 0 2px 8px rgba(222, 161, 147, 0.3); transition: all 0.3s ease;">
                            🛒 Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        searchResults.innerHTML = `
            <div style="margin-bottom: 15px; padding: 10px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #0ea5e9;">
                <strong style="color: #0c4a6e;">Found ${products.length} product${products.length === 1 ? '' : 's'} matching "${searchTerm}"</strong>
            </div>
            ${resultsHTML}
        `;
    }

    // Display search error
    function displaySearchError(searchTerm) {
        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #dc2626;">
                <div style="font-size: 3rem; margin-bottom: 15px;">⚠️</div>
                <h3 style="margin-bottom: 10px;">Search Error</h3>
                <p>Unable to search for "${searchTerm}". Please try again.</p>
                <button onclick="window.open('all-products.html', '_blank')" style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 15px;">
                    Browse All Products
                </button>
            </div>
        `;
    }

    // View product from search
    function viewProductFromSearch(productId) {
        // Close search modal first
        const modal = document.querySelector('[style*="position: fixed"]');
        if (modal) modal.remove();
        
        // Navigate to all products page with the specific product
        window.open(`all-products.html#product-${productId}`, '_blank');
    }

    // Enhanced WhatsApp Order functionality
    function openWhatsAppOrder(productName, productBrand, productPrice, productCategory = '', productModel = '') {
        const phoneNumber = '917000532010';
        
        // Create a comprehensive order message
        const orderMessage = `🛒 *NEW ORDER REQUEST - MONICA OPTO HUB*

👤 *Customer Details:*
Please provide your details for order processing.

🛍️ *Product Details:*
• Product: ${productName}
• Brand: ${productBrand}
• Price: ₹${productPrice.toLocaleString()}
${productCategory ? `• Category: ${productCategory}` : ''}
${productModel ? `• Model: ${productModel}` : ''}

📋 *Order Information:*
• Quantity: 1 (please specify if different)
• Size/Fit: Please specify your requirements
• Lens Type: (if applicable)
• Frame Color: (if applicable)

📞 *Contact Information:*
• Name: [Please provide]
• Phone: [Please provide]
• Email: [Please provide]
• Address: [Please provide for delivery]

💳 *Payment & Delivery:*
• Payment Method: [Please specify]
• Delivery Address: [Please provide]
• Preferred Delivery Date: [Please specify]

❓ *Additional Requirements:*
[Please mention any special requirements]

Please confirm this order and provide the above details. Thank you! 🙏`;

        const encodedMessage = encodeURIComponent(orderMessage);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        console.log('Opening WhatsApp order for:', productName);
        console.log('WhatsApp URL:', whatsappUrl);
        
        // Try to open WhatsApp
        try {
            const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            
            if (!newWindow) {
                // If popup blocked, try direct navigation
                console.log('Popup blocked, trying direct navigation...');
                window.location.href = whatsappUrl;
            } else {
                console.log('✅ WhatsApp order window opened successfully');
            }
            
            // Show confirmation
            setTimeout(() => {
                alert(`🛒 Order request sent to WhatsApp!\n\nProduct: ${productName}\nBrand: ${productBrand}\nPrice: ₹${productPrice.toLocaleString()}\n\nPlease check your WhatsApp to complete the order.`);
            }, 1000);
            
        } catch (error) {
            console.error('Error opening WhatsApp order:', error);
            alert(`Unable to open WhatsApp. Please contact us directly:\n\nPhone: +91-7000532010\n\nProduct: ${productName}\nPrice: ₹${productPrice.toLocaleString()}`);
        }
    }

    // Make WhatsApp order function globally available
    window.openWhatsAppOrder = openWhatsAppOrder;

    // Open WhatsApp order from search
    function openWhatsAppOrderFromSearch(productName, productBrand, productPrice, productCategory, productModel) {
        if (window.openWhatsAppOrder) {
            window.openWhatsAppOrder(productName, productBrand, productPrice, productCategory, productModel);
        } else {
            // Fallback to simple WhatsApp message
            const message = `Hi! I am interested in ${productName} from ${productBrand}. Can you provide more information?`;
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/917000532010?text=${encodedMessage}`;
            window.open(whatsappUrl, '_blank');
        }
    }

    // Make search WhatsApp order function globally available
    window.openWhatsAppOrderFromSearch = openWhatsAppOrderFromSearch;

    // Open Add to Cart from search
    function openAddToCartFromSearch(productName, productBrand, productPrice, productCategory, productModel, productId) {
        if (window.openAddToCartModal) {
            window.openAddToCartModal(productName, productBrand, productPrice, productCategory, productModel, productId);
        } else {
            console.error('Add to Cart modal function not available');
            alert('Add to Cart functionality is not available. Please try the Quick Order option.');
        }
    }

    // Make search Add to Cart function globally available
    window.openAddToCartFromSearch = openAddToCartFromSearch;

    // Add to Cart Form Modal functionality
    function openAddToCartModal(productName, productBrand, productPrice, productCategory, productModel, productId) {
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
            padding: 20px;
            animation: fadeIn 0.3s ease-in-out;
        `;

        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #ffffff, #FCF8F7); padding: 30px; border-radius: 16px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(222, 161, 147, 0.3); border: 1px solid rgba(222, 161, 147, 0.2);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid rgba(222, 161, 147, 0.3); padding-bottom: 15px;">
                    <h2 style="margin: 0; color: #7a534a; font-size: 1.8rem; font-weight: 700;">🛒 Add to Cart</h2>
                    <button class="close-cart-modal-btn" style="background: rgba(222, 161, 147, 0.1); border: 1px solid rgba(222, 161, 147, 0.3); font-size: 28px; cursor: pointer; color: #7a534a; padding: 5px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">&times;</button>
                </div>
                
                <!-- Product Summary -->
                <div style="background: linear-gradient(135deg, #F3DDD8, #F0D4CE); padding: 20px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #DEA193;">
                    <h3 style="margin: 0 0 10px 0; color: #1f2937; font-weight: 600;">${productName}</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem; color: #7a534a;">
                        <div><strong>Brand:</strong> ${productBrand}</div>
                        <div><strong>Category:</strong> ${productCategory}</div>
                        <div><strong>Model:</strong> ${productModel || 'N/A'}</div>
                        <div><strong>Price:</strong> <span style="color: #7a534a; font-weight: bold;">₹${productPrice.toLocaleString()}</span></div>
                    </div>
                </div>
                
                <!-- Customer Details Form -->
                <form id="addToCartForm" style="display: flex; flex-direction: column; gap: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #7a534a;">Full Name *</label>
                            <input type="text" id="customerName" name="customerName" required 
                                   style="width: 100%; padding: 12px 16px; border: 2px solid rgba(222, 161, 147, 0.3); border-radius: 8px; font-size: 1rem; outline: none; transition: border-color 0.3s; background: rgba(255, 255, 255, 0.8);"
                                   placeholder="Enter your full name"
                                   onfocus="this.style.borderColor='#DEA193'; this.style.boxShadow='0 0 0 3px rgba(222, 161, 147, 0.1)'"
                                   onblur="this.style.borderColor='rgba(222, 161, 147, 0.3)'; this.style.boxShadow='none'">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #7a534a;">Phone Number *</label>
                            <input type="tel" id="customerPhone" name="customerPhone" required 
                                   style="width: 100%; padding: 12px 16px; border: 2px solid rgba(222, 161, 147, 0.3); border-radius: 8px; font-size: 1rem; outline: none; transition: border-color 0.3s; background: rgba(255, 255, 255, 0.8);"
                                   placeholder="Enter your phone number"
                                   onfocus="this.style.borderColor='#DEA193'; this.style.boxShadow='0 0 0 3px rgba(222, 161, 147, 0.1)'"
                                   onblur="this.style.borderColor='rgba(222, 161, 147, 0.3)'; this.style.boxShadow='none'">
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #7a534a;">Email Address *</label>
                        <input type="email" id="customerEmail" name="customerEmail" required 
                               style="width: 100%; padding: 12px 16px; border: 2px solid rgba(222, 161, 147, 0.3); border-radius: 8px; font-size: 1rem; outline: none; transition: border-color 0.3s; background: rgba(255, 255, 255, 0.8);"
                               placeholder="Enter your email address"
                               onfocus="this.style.borderColor='#DEA193'; this.style.boxShadow='0 0 0 3px rgba(222, 161, 147, 0.1)'"
                               onblur="this.style.borderColor='rgba(222, 161, 147, 0.3)'; this.style.boxShadow='none'">
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #7a534a;">Quantity *</label>
                            <select id="quantity" name="quantity" required 
                                    style="width: 100%; padding: 12px 16px; border: 2px solid rgba(222, 161, 147, 0.3); border-radius: 8px; font-size: 1rem; outline: none; transition: border-color 0.3s; background: rgba(255, 255, 255, 0.8);"
                                    onfocus="this.style.borderColor='#DEA193'; this.style.boxShadow='0 0 0 3px rgba(222, 161, 147, 0.1)'"
                                    onblur="this.style.borderColor='rgba(222, 161, 147, 0.3)'; this.style.boxShadow='none'">
                                <option value="">Select Quantity</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #7a534a;">Size/Fit</label>
                            <select id="sizeFit" name="sizeFit" 
                                    style="width: 100%; padding: 12px 16px; border: 2px solid rgba(222, 161, 147, 0.3); border-radius: 8px; font-size: 1rem; outline: none; transition: border-color 0.3s; background: rgba(255, 255, 255, 0.8);"
                                    onfocus="this.style.borderColor='#DEA193'; this.style.boxShadow='0 0 0 3px rgba(222, 161, 147, 0.1)'"
                                    onblur="this.style.borderColor='rgba(222, 161, 147, 0.3)'; this.style.boxShadow='none'">
                                <option value="">Select Size/Fit</option>
                                <option value="Small">Small</option>
                                <option value="Medium">Medium</option>
                                <option value="Large">Large</option>
                                <option value="Extra Large">Extra Large</option>
                                <option value="Custom">Custom</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #7a534a;">Lens Type</label>
                            <select id="lensType" name="lensType" 
                                    style="width: 100%; padding: 12px 16px; border: 2px solid rgba(222, 161, 147, 0.3); border-radius: 8px; font-size: 1rem; outline: none; transition: border-color 0.3s; background: rgba(255, 255, 255, 0.8);"
                                    onfocus="this.style.borderColor='#DEA193'; this.style.boxShadow='0 0 0 3px rgba(222, 161, 147, 0.1)'"
                                    onblur="this.style.borderColor='rgba(222, 161, 147, 0.3)'; this.style.boxShadow='none'">
                                <option value="">Select Lens Type</option>
                                <option value="Prescription">Prescription</option>
                                <option value="Non-Prescription">Non-Prescription</option>
                                <option value="Sunglasses">Sunglasses</option>
                                <option value="Blue Light">Blue Light</option>
                                <option value="Progressive">Progressive</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #7a534a;">Frame Color</label>
                            <select id="frameColor" name="frameColor" 
                                    style="width: 100%; padding: 12px 16px; border: 2px solid rgba(222, 161, 147, 0.3); border-radius: 8px; font-size: 1rem; outline: none; transition: border-color 0.3s; background: rgba(255, 255, 255, 0.8);"
                                    onfocus="this.style.borderColor='#DEA193'; this.style.boxShadow='0 0 0 3px rgba(222, 161, 147, 0.1)'"
                                    onblur="this.style.borderColor='rgba(222, 161, 147, 0.3)'; this.style.boxShadow='none'">
                                <option value="">Select Frame Color</option>
                                <option value="Black">Black</option>
                                <option value="Brown">Brown</option>
                                <option value="Gold">Gold</option>
                                <option value="Silver">Silver</option>
                                <option value="Tortoise">Tortoise</option>
                                <option value="Clear">Clear</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #7a534a;">Delivery Address *</label>
                        <textarea id="deliveryAddress" name="deliveryAddress" required rows="3"
                                  style="width: 100%; padding: 12px 16px; border: 2px solid rgba(222, 161, 147, 0.3); border-radius: 8px; font-size: 1rem; outline: none; transition: border-color 0.3s; resize: vertical; background: rgba(255, 255, 255, 0.8);"
                                  placeholder="Enter your complete delivery address"
                                  onfocus="this.style.borderColor='#DEA193'; this.style.boxShadow='0 0 0 3px rgba(222, 161, 147, 0.1)'"
                                  onblur="this.style.borderColor='rgba(222, 161, 147, 0.3)'; this.style.boxShadow='none'"></textarea>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #7a534a;">Payment Method *</label>
                            <select id="paymentMethod" name="paymentMethod" required 
                                    style="width: 100%; padding: 12px 16px; border: 2px solid rgba(222, 161, 147, 0.3); border-radius: 8px; font-size: 1rem; outline: none; transition: border-color 0.3s; background: rgba(255, 255, 255, 0.8);"
                                    onfocus="this.style.borderColor='#DEA193'; this.style.boxShadow='0 0 0 3px rgba(222, 161, 147, 0.1)'"
                                    onblur="this.style.borderColor='rgba(222, 161, 147, 0.3)'; this.style.boxShadow='none'">
                                <option value="">Select Payment Method</option>
                                <option value="Cash on Delivery">Cash on Delivery</option>
                                <option value="UPI">UPI</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Debit Card">Debit Card</option>
                                <option value="Net Banking">Net Banking</option>
                                <option value="Wallet">Wallet</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #7a534a;">Preferred Delivery Date</label>
                            <input type="date" id="preferredDeliveryDate" name="preferredDeliveryDate" 
                                   style="width: 100%; padding: 12px 16px; border: 2px solid rgba(222, 161, 147, 0.3); border-radius: 8px; font-size: 1rem; outline: none; transition: border-color 0.3s; background: rgba(255, 255, 255, 0.8);"
                                   onfocus="this.style.borderColor='#DEA193'; this.style.boxShadow='0 0 0 3px rgba(222, 161, 147, 0.1)'"
                                   onblur="this.style.borderColor='rgba(222, 161, 147, 0.3)'; this.style.boxShadow='none'">
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #7a534a;">Additional Requirements</label>
                        <textarea id="additionalRequirements" name="additionalRequirements" rows="3"
                                  style="width: 100%; padding: 12px 16px; border: 2px solid rgba(222, 161, 147, 0.3); border-radius: 8px; font-size: 1rem; outline: none; transition: border-color 0.3s; resize: vertical; background: rgba(255, 255, 255, 0.8);"
                                  placeholder="Any special requirements, prescription details, or additional notes..."
                                  onfocus="this.style.borderColor='#DEA193'; this.style.boxShadow='0 0 0 3px rgba(222, 161, 147, 0.1)'"
                                  onblur="this.style.borderColor='rgba(222, 161, 147, 0.3)'; this.style.boxShadow='none'"></textarea>
                    </div>
                    
                    <!-- Order Summary -->
                    <div style="background: linear-gradient(135deg, #F3DDD8, #F0D4CE); padding: 20px; border-radius: 12px; border-left: 4px solid #DEA193;">
                        <h4 style="margin: 0 0 15px 0; color: #7a534a; font-weight: 600;">Order Summary</h4>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #1f2937;">
                            <span>Product Price:</span>
                            <span>₹${productPrice.toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #1f2937;">
                            <span>Quantity:</span>
                            <span id="quantityDisplay">1</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #1f2937;">
                            <span>Delivery Charges:</span>
                            <span>₹200</span>
                        </div>
                        <div style="border-top: 1px solid rgba(222, 161, 147, 0.3); padding-top: 10px; display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem; color: #7a534a;">
                            <span>Total Amount:</span>
                            <span id="totalAmount">₹${(productPrice + 200).toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 15px; margin-top: 25px;">
                        <button type="submit" class="submit-cart-btn" style="background: linear-gradient(135deg, #DEA193, #BA867B); color: white; border: none; padding: 15px 30px; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 1rem; box-shadow: 0 4px 15px rgba(222, 161, 147, 0.3); flex: 1; transition: all 0.3s ease;">
                            🛒 Add to Cart & Order
                        </button>
                        <button type="button" class="close-cart-modal-btn" style="background: linear-gradient(135deg, #DEA193, #BA867B); color: white; border: none; padding: 15px 30px; border-radius: 12px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 15px rgba(222, 161, 147, 0.3); transition: all 0.3s ease;">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set minimum delivery date to tomorrow
        const deliveryDateInput = document.getElementById('preferredDeliveryDate');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        deliveryDateInput.min = tomorrow.toISOString().split('T')[0];
        
        // Update quantity and total when quantity changes
        const quantitySelect = document.getElementById('quantity');
        const quantityDisplay = document.getElementById('quantityDisplay');
        const totalAmount = document.getElementById('totalAmount');
        
        quantitySelect.addEventListener('change', function() {
            const quantity = parseInt(this.value) || 1;
            const deliveryCharges = 200;
            const total = (productPrice * quantity) + deliveryCharges;
            
            quantityDisplay.textContent = quantity;
            totalAmount.textContent = `₹${total.toLocaleString()}`;
        });
        
        // Add event listeners
        const closeButtons = modal.querySelectorAll('.close-cart-modal-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });
        
        // Handle form submission
        const form = document.getElementById('addToCartForm');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleAddToCartSubmission(productName, productBrand, productPrice, productCategory, productModel, productId);
            modal.remove();
        });
        
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
        
        // Focus on first input
        setTimeout(() => {
            document.getElementById('customerName').focus();
        }, 100);
    }

    // Handle Add to Cart form submission
    function handleAddToCartSubmission(productName, productBrand, productPrice, productCategory, productModel, productId) {
        const form = document.getElementById('addToCartForm');
        const formData = new FormData(form);
        
        const orderData = {
            productId: productId,
            productName: productName,
            productBrand: productBrand,
            productPrice: productPrice,
            productCategory: productCategory,
            productModel: productModel,
            customerName: formData.get('customerName'),
            customerPhone: formData.get('customerPhone'),
            customerEmail: formData.get('customerEmail'),
            quantity: parseInt(formData.get('quantity')),
            sizeFit: formData.get('sizeFit'),
            lensType: formData.get('lensType'),
            frameColor: formData.get('frameColor'),
            deliveryAddress: formData.get('deliveryAddress'),
            paymentMethod: formData.get('paymentMethod'),
            preferredDeliveryDate: formData.get('preferredDeliveryDate'),
            additionalRequirements: formData.get('additionalRequirements'),
            orderDate: new Date().toISOString(),
            orderId: 'ORD-' + Date.now(),
            status: 'pending'
        };
        
        // Calculate total
        const deliveryCharges = 200;
        const totalAmount = (productPrice * orderData.quantity) + deliveryCharges;
        orderData.totalAmount = totalAmount;
        
        // Store order in localStorage
        let orders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
        orders.push(orderData);
        localStorage.setItem('customerOrders', JSON.stringify(orders));
        
        // Also store in admin panel data
        let adminData = JSON.parse(localStorage.getItem('adminPanelData') || '{}');
        if (!adminData.orders) adminData.orders = [];
        adminData.orders.push(orderData);
        localStorage.setItem('adminPanelData', JSON.stringify(adminData));
        
        // Send to WhatsApp
        sendOrderToWhatsApp(orderData);
        
        // Show success message
        showOrderSuccessMessage(orderData);
    }

    // Send order to WhatsApp
    function sendOrderToWhatsApp(orderData) {
        const phoneNumber = '917000532010';
        
        const orderMessage = `🛒 *NEW ORDER - MONICA OPTO HUB*

📋 *Order ID:* ${orderData.orderId}
📅 *Order Date:* ${new Date(orderData.orderDate).toLocaleDateString()}

👤 *Customer Details:*
• Name: ${orderData.customerName}
• Phone: ${orderData.customerPhone}
• Email: ${orderData.customerEmail}

🛍️ *Product Details:*
• Product: ${orderData.productName}
• Brand: ${orderData.productBrand}
• Category: ${orderData.productCategory}
• Model: ${orderData.productModel || 'N/A'}
• Unit Price: ₹${orderData.productPrice.toLocaleString()}
• Quantity: ${orderData.quantity}
• Total Product Cost: ₹${(orderData.productPrice * orderData.quantity).toLocaleString()}

📐 *Specifications:*
• Size/Fit: ${orderData.sizeFit || 'Not specified'}
• Lens Type: ${orderData.lensType || 'Not specified'}
• Frame Color: ${orderData.frameColor || 'Not specified'}

🚚 *Delivery Details:*
• Address: ${orderData.deliveryAddress}
• Preferred Date: ${orderData.preferredDeliveryDate || 'Not specified'}
• Delivery Charges: ₹200

💳 *Payment:*
• Method: ${orderData.paymentMethod}
• Total Amount: ₹${orderData.totalAmount.toLocaleString()}

📝 *Additional Requirements:*
${orderData.additionalRequirements || 'None'}

Please confirm this order and provide delivery timeline. Thank you! 🙏`;

        const encodedMessage = encodeURIComponent(orderMessage);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        console.log('Sending order to WhatsApp:', orderData.orderId);
        
        try {
            const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            
            if (!newWindow) {
                window.location.href = whatsappUrl;
            }
            
        } catch (error) {
            console.error('Error opening WhatsApp:', error);
            alert(`Unable to open WhatsApp. Please contact us directly:\n\nPhone: +91-7000532010\n\nOrder ID: ${orderData.orderId}`);
        }
    }

    // Show order success message
    function showOrderSuccessMessage(orderData) {
        const successModal = document.createElement('div');
        successModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            padding: 20px;
        `;
        
        successModal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div style="font-size: 4rem; margin-bottom: 20px;">✅</div>
                <h2 style="margin: 0 0 15px 0; color: #059669;">Order Placed Successfully!</h2>
                <p style="margin: 0 0 20px 0; color: #64748b; font-size: 1.1rem;">
                    Your order has been added to cart and sent to our team via WhatsApp.
                </p>
                <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0ea5e9;">
                    <strong style="color: #0c4a6e;">Order ID:</strong> ${orderData.orderId}<br>
                    <strong style="color: #0c4a6e;">Total Amount:</strong> ₹${orderData.totalAmount.toLocaleString()}
                </div>
                <p style="margin: 0 0 20px 0; color: #64748b;">
                    We'll contact you shortly to confirm your order and provide delivery details.
                </p>
                <button onclick="this.closest('div').parentElement.remove()" style="background: linear-gradient(135deg, #DEA193, #BA867B); color: white; border: none; padding: 12px 25px; border-radius: 12px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 15px rgba(222, 161, 147, 0.3); transition: all 0.3s ease;">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(successModal);
        
        // Auto close after 5 seconds
        setTimeout(() => {
            if (successModal.parentElement) {
                successModal.remove();
            }
        }, 5000);
    }

    // Make Add to Cart function globally available
    window.openAddToCartModal = openAddToCartModal;

// Theme switcher (gold / pink)
function applyTheme(theme){
    const body = document.body;
    body.classList.remove('theme-gold','theme-pink');
    if(theme === 'gold') body.classList.add('theme-gold');
    if(theme === 'pink') body.classList.add('theme-pink');
    try{ localStorage.setItem('ui-theme', theme); }catch(_){/* ignore */}
}

function initTheme(){
    let theme = 'gold';
    try{ theme = localStorage.getItem('ui-theme') || 'gold'; }catch(_){/* ignore */}
    applyTheme(theme);
}

initTheme();

// Theme toggle button removed - no longer needed
// Hook up theme toggle button
// function setThemeToggleLabel(button){
//     if(!button) return;
//     const isPink = document.body.classList.contains('theme-pink');
//     button.textContent = isPink ? 'Gold' : 'Pink';
// }

// const themeToggleButton = document.querySelector('[data-theme-toggle]');
// if(themeToggleButton){
//     setThemeToggleLabel(themeToggleButton);
//     themeToggleButton.addEventListener('click', ()=>{
//         const isPink = document.body.classList.contains('theme-pink');
//         applyTheme(isPink ? 'gold' : 'pink');
//         setThemeToggleLabel(themeToggleButton);
//     });
// }

// Dynamic header offset for mobile (prevents content underlap)
function updateHeaderOffset(){
    const header = document.querySelector('.site-header');
    if(!header) return;
    const height = header.offsetHeight;
    document.documentElement.style.setProperty('--header-height', height + 'px');
}

window.addEventListener('load', updateHeaderOffset);
window.addEventListener('resize', () => { requestAnimationFrame(updateHeaderOffset); });
window.addEventListener('orientationchange', () => { setTimeout(updateHeaderOffset, 200); });

// Mobile menu system initialization - SIMPLIFIED AND FIXED

// Simple mobile menu toggle system
function toggleMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.getElementById('primary-nav');
    const overlay = document.querySelector('.nav-overlay');
    
    if (!menuToggle || !nav) {
        console.log('❌ Mobile menu elements not found');
        return;
    }
    
    const isOpen = nav.classList.contains('open');
    
    if (isOpen) {
        // Close menu
        menuToggle.classList.remove('open');
        nav.classList.remove('open');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.setAttribute('aria-hidden', 'true');
        }
        setScrollLock(false);
        console.log('✅ Mobile menu closed');
    } else {
        // Open menu
        menuToggle.classList.add('open');
        nav.classList.add('open');
        if (overlay) {
            overlay.style.display = 'block';
            overlay.setAttribute('aria-hidden', 'false');
        }
        setScrollLock(true);
        console.log('✅ Mobile menu opened');
    }
}

function closeMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.getElementById('primary-nav');
    const overlay = document.querySelector('.nav-overlay');
    
    if (menuToggle) menuToggle.classList.remove('open');
    if (nav) nav.classList.remove('open');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
    }
    setScrollLock(false);
}

// Initialize mobile menu system - SIMPLIFIED
function initializeMobileMenuSystem() {
    console.log('🚀 Initializing mobile menu system...');
    
    const menuToggle = document.querySelector('.menu-toggle');

    const mobileSideMenu = document.getElementById('mobileSideMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const closeButton = document.querySelector('.mobile-side-menu__close');
    
    if (!menuToggle || !mobileSideMenu || !mobileMenuOverlay) {
        console.log('❌ Mobile menu elements not found');
        return;
    }
    
    console.log('✅ Mobile menu elements found');
    
    // Set up menu toggle button
    menuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Menu toggle clicked');
        openMobileMenu();
    });
    
    // Set up close button
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            console.log('🖱️ Close button clicked');
            closeMobileMenu();
        });
    }
    
    // Set up overlay click to close menu
    mobileMenuOverlay.addEventListener('click', () => {
        console.log('🖱️ Overlay clicked');
        closeMobileMenu();
    });
    
    // Set up Escape key handler
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            console.log('⌨️ Escape key pressed');
            closeMobileMenu();
        }
    });
    
    // Set up navigation link click handlers for mobile
    const navLinks = mobileSideMenu.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            console.log('🖱️ Nav link clicked');
            closeMobileMenu();
        });
    });
    
    console.log('✅ Mobile menu system initialized');
}

function openMobileMenu() {
    const mobileSideMenu = document.getElementById('mobileSideMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    
    if (mobileSideMenu && mobileMenuOverlay) {
        mobileSideMenu.classList.add('open');
        mobileMenuOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeMobileMenu() {
    const mobileSideMenu = document.getElementById('mobileSideMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    
    if (mobileSideMenu && mobileMenuOverlay) {
        mobileSideMenu.classList.remove('open');
        mobileMenuOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Drawer accordions (for drawer-based pages)
document.querySelectorAll('[data-accordion]').forEach(btn => {
    btn.addEventListener('click', () => {
        const li = btn.closest('.drawer__item');
        if (!li) return;
        li.classList.toggle('open');
    });
});

// Very lightweight slider controls (horizontal scroll)
const slider = document.querySelector('[data-slider]');
const prev = document.querySelector('.slider-prev');
const next = document.querySelector('.slider-next');
const scrollAmount = 320;
if (slider && prev && next) {
    prev.addEventListener('click', () => slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
    next.addEventListener('click', () => slider.scrollBy({ left: scrollAmount, behavior: 'smooth' }));
}

// Newsletter (demo)
const newsletter = document.querySelector('.newsletter');
if (newsletter) {
    newsletter.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = newsletter.querySelector('input[type="email"]');
        if (input && input.value) {
            alert(`Subscribed: ${input.value}`);
            input.value = '';
        }
    });
}

// WhatsApp Contact Button - Enhanced and Reliable
function openWhatsApp(customMessage = null) {
    console.log('=== WHATSAPP FUNCTION CALLED ===');
    
    const phoneNumber = '917000532010';
    const defaultMessage = 'Hi! I am interested in your eyewear collection. Can you help me with more information?';
    const message = customMessage || defaultMessage;
    
    // Clean and format the message properly
    const cleanMessage = message.trim().replace(/\s+/g, ' ');
    
    console.log('Phone Number:', phoneNumber);
    console.log('Original Message:', message);
    console.log('Clean Message:', cleanMessage);
    
    // Try different WhatsApp URL formats
    const formats = [
        // Format 1: Standard wa.me with encoded text
        `https://wa.me/${phoneNumber}?text=${encodeURIComponent(cleanMessage)}`,
        // Format 2: api.whatsapp.com with encoded text
        `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(cleanMessage)}`,
        // Format 3: wa.me with unencoded text (for testing)
        `https://wa.me/${phoneNumber}?text=${cleanMessage}`,
        // Format 4: Direct WhatsApp app link
        `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(cleanMessage)}`
    ];
    
    console.log('Trying different URL formats:');
    formats.forEach((url, index) => {
        console.log(`Format ${index + 1}:`, url);
    });
    
    // Prefer app link on mobile, else standard web URL
    const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const whatsappUrl = isMobile ? formats[3] : formats[0];
    const encodedMessage = encodeURIComponent(cleanMessage);
    
    console.log('Using URL:', whatsappUrl);
    console.log('Encoded Message:', encodedMessage);
    
    // Create a temporary link element for better compatibility
    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Try to open WhatsApp
    try {
        // On mobile, direct navigation works better inside in-app browsers
        if (isMobile) {
            window.location.href = whatsappUrl;
            console.log('✅ WhatsApp opened via direct navigation (mobile)');
            return true;
        }
        // Desktop: try window.open
        const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        
        if (newWindow && !newWindow.closed) {
            console.log('✅ WhatsApp window opened successfully');
            return true;
        } else {
            console.log('❌ Popup blocked, trying alternative method...');
            // Second try: click the link element
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('✅ WhatsApp opened via link click');
            return true;
        }
    } catch (error) {
        console.error('❌ Error opening WhatsApp:', error);
        // Fallback: direct navigation
        try {
            window.location.href = whatsappUrl;
            console.log('✅ WhatsApp opened via direct navigation');
            return true;
        } catch (fallbackError) {
            console.error('❌ All methods failed:', fallbackError);
            alert('Unable to open WhatsApp. Please try again or contact us directly.');
            return false;
        }
    }
}

// Initialize WhatsApp button
function initWhatsAppButton() {
    console.log('=== INITIALIZING WHATSAPP BUTTON ===');
    
    let whatsappButton = document.getElementById('whatsappButton');
    console.log('Button element (before):', whatsappButton);
    
    // Auto-create floating WhatsApp button if missing
    if (!whatsappButton) {
        console.log('ℹ️ Creating WhatsApp button dynamically');
        const btn = document.createElement('div');
        btn.id = 'whatsappButton';
        btn.className = 'whatsapp-button';
        btn.innerHTML = `
            <div class="whatsapp-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" fill="currentColor"/>
                </svg>
            </div>
            <div class="whatsapp-tooltip"><span>Chat with us!</span></div>
        `;
        document.body.appendChild(btn);
        whatsappButton = btn;
    }
    
    if (whatsappButton) {
        console.log('✅ WhatsApp button found');
        
        // Remove existing onclick to avoid conflicts
        whatsappButton.removeAttribute('onclick');
        
        // Add event listener
        whatsappButton.addEventListener('click', function(e) {
            console.log('🖱️ WhatsApp button clicked!');
            e.preventDefault();
            e.stopPropagation();
            openWhatsApp();
            return false;
        });
        
        // Add mobile-friendly touchend for iOS/Android
        whatsappButton.addEventListener('touchend', function(e) {
            console.log('👆 WhatsApp button touchend');
            e.preventDefault();
            e.stopPropagation();
            openWhatsApp();
            return false;
        }, { passive: false });
        
        // Make it focusable and accessible
        whatsappButton.setAttribute('tabindex', '0');
        whatsappButton.setAttribute('role', 'button');
        whatsappButton.setAttribute('aria-label', 'Contact us on WhatsApp');
        
        // Add keyboard support
        whatsappButton.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openWhatsApp();
            }
        });
        
        console.log('✅ WhatsApp button initialized successfully');
    } else {
        console.error('❌ WhatsApp button not found and could not be created');
    }
}

// Make WhatsApp function globally available
window.openWhatsApp = openWhatsApp;

// Debug function to test WhatsApp button
window.debugWhatsAppButton = function() {
    console.log('=== DEBUGGING WHATSAPP BUTTON ===');
    
    const whatsappButton = document.getElementById('whatsappButton');
    console.log('WhatsApp button element:', whatsappButton);
    
    if (whatsappButton) {
        console.log('Button classes:', whatsappButton.classList.toString());
        console.log('Button onclick:', whatsappButton.getAttribute('onclick'));
        console.log('Button style:', whatsappButton.style.cssText);
        console.log('Button computed style:', window.getComputedStyle(whatsappButton));
        
        // Test click
        console.log('Testing button click...');
        whatsappButton.click();
        
        return 'WhatsApp button found and tested - check console for details';
    } else {
        console.error('WhatsApp button not found!');
        return 'WhatsApp button not found!';
    }
};

// Simple test function to open WhatsApp directly
window.testWhatsAppDirect = function() {
    console.log('=== TESTING WHATSAPP DIRECT ===');
    const phoneNumber = '917000532010';
    const message = 'Hi! I am interested in your eyewear collection. Can you help me with more information?';
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    console.log('Opening WhatsApp URL:', url);
    window.open(url, '_blank');
    
    return 'WhatsApp opened directly - check if it works';
};

// Test function for WhatsApp
window.testWhatsApp = function() {
    console.log('=== TESTING WHATSAPP FUNCTION ===');
    return openWhatsApp('Test message from website');
};

// Test function for message encoding
window.testWhatsAppMessage = function() {
    console.log('=== TESTING WHATSAPP MESSAGE ENCODING ===');
    const testMessage = 'Hi! I am interested in Ray-Ban Aviator from Ray-Ban. Can you provide more information?';
    const encoded = encodeURIComponent(testMessage);
    const url = `https://wa.me/917000532010?text=${encoded}`;
    
    console.log('Original message:', testMessage);
    console.log('Encoded message:', encoded);
    console.log('Full URL:', url);
    
    // Test the URL
    window.open(url, '_blank');
    
    return { message: testMessage, encoded, url };
};

// Test function for different WhatsApp URL formats
window.testWhatsAppFormats = function() {
    console.log('=== TESTING DIFFERENT WHATSAPP URL FORMATS ===');
    const phoneNumber = '917000532010';
    const testMessage = 'Hi! I am interested in Ray-Ban Aviator from Ray-Ban. Can you provide more information?';
    
    const formats = [
        {
            name: 'wa.me with encoded text',
            url: `https://wa.me/${phoneNumber}?text=${encodeURIComponent(testMessage)}`
        },
        {
            name: 'api.whatsapp.com with encoded text',
            url: `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(testMessage)}`
        },
        {
            name: 'wa.me with unencoded text',
            url: `https://wa.me/${phoneNumber}?text=${testMessage}`
        },
        {
            name: 'Direct WhatsApp app link',
            url: `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(testMessage)}`
        }
    ];
    
    console.log('Testing formats:');
    formats.forEach((format, index) => {
        console.log(`${index + 1}. ${format.name}:`, format.url);
    });
    
    // Test the first format
    console.log('Testing format 1...');
    window.open(formats[0].url, '_blank');
    
    return formats;
};

// Mobile UX enhancements
function initMobileUX() {
    console.log('=== INITIALIZING MOBILE UX ENHANCEMENTS ===');
    
    // Touch feedback removed to prevent console warnings
    // CSS handles touch interactions instead
    
    // Add scroll-based animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.product-card, .brand-card').forEach(card => {
        card.style.animationPlayState = 'paused';
        observer.observe(card);
    });
    
    // Add haptic feedback for supported devices
    function addHapticFeedback(element) {
        element.addEventListener('click', function() {
            if ('vibrate' in navigator) {
                navigator.vibrate(10); // Short vibration
            }
        });
    }
    
    // Apply haptic feedback to important buttons
    document.querySelectorAll('.btn--primary, .whatsapp-button').forEach(addHapticFeedback);
    
    // Improve form interactions
    const formInputs = document.querySelectorAll('input, textarea, select');
    formInputs.forEach(input => {
        // Add focus animation
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
            this.parentElement.style.transition = 'transform 0.3s ease';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = '';
        });
    });
    
    console.log('✅ Mobile UX enhancements initialized');
}

// Create debug functions immediately - GLOBAL SCOPE
console.log('🔧 Creating global debug functions...');

window.checkPage = function() {
    console.log('📄 PAGE CHECK:');
    console.log('Current URL:', window.location.href);
    console.log('Current path:', window.location.pathname);
    console.log('Page title:', document.title);
    console.log('Drawer in DOM:', !!document.querySelector('[data-drawer]'));
    console.log('Menu toggle in DOM:', !!document.querySelector('.menu-toggle'));
    console.log('Document ready state:', document.readyState);
};

window.debugDrawer = function() {
    console.log('🔍 DRAWER DEBUG INFO:');
    console.log('Drawer element:', drawer);
    console.log('Drawer exists:', !!drawer);
    console.log('Drawer display:', drawer ? drawer.style.display : 'N/A');
    console.log('Drawer visibility:', drawer ? drawer.style.visibility : 'N/A');
    console.log('Drawer opacity:', drawer ? drawer.style.opacity : 'N/A');
    console.log('Drawer classes:', drawer ? drawer.className : 'N/A');
    console.log('Drawer computed style:', drawer ? window.getComputedStyle(drawer).display : 'N/A');
    console.log('isDrawerOpen:', isDrawerOpen);
    console.log('Menu toggle:', menuToggleButton);
    console.log('Screen width:', window.innerWidth);
    console.log('Is mobile:', window.matchMedia('(max-width: 900px)').matches);
    
    // Also check DOM directly
    const drawerFromDOM = document.querySelector('[data-drawer]');
    console.log('Drawer from DOM:', drawerFromDOM);
    console.log('All drawer elements:', document.querySelectorAll('[class*="drawer"]'));
};

window.emergencyTest = function() {
    console.log('🚨 EMERGENCY DRAWER TEST');
    const drawerEl = document.querySelector('[data-drawer]');
    if (!drawerEl) {
        console.log('❌ Drawer element not found in DOM!');
        return;
    }
    
    console.log('📱 Emergency opening...');
    drawerEl.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; z-index: 9999 !important;';
    drawerEl.classList.add('open');
    
    setTimeout(() => {
        console.log('📱 Emergency closing...');
        drawerEl.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
        drawerEl.classList.remove('open');
    }, 3000);
};

console.log('✅ Global debug functions created');

// Test if script is loading
console.log('📜 MAIN.JS SCRIPT LOADED SUCCESSFULLY');
console.log('📜 Current timestamp:', new Date().toISOString());


// Initialize all interactive elements
function initAllInteractiveElements() {
    console.log('=== INITIALIZING ALL INTERACTIVE ELEMENTS ===');
    
    // Initialize complete mobile menu system first
    initializeMobileMenuSystem();

	// Mobile nav toggle is now handled by initializeMobileMenuSystem()
    
    // Skip mobile UX for now to avoid touch event issues
    // initMobileUX();
    
    // Initialize WhatsApp button
	initWhatsAppButton();
    
    // Initialize all WhatsApp buttons on the page
    document.querySelectorAll('[onclick*="wa.me"], [href*="wa.me"]').forEach(button => {
        if (!button.onclick && !button.href.includes('wa.me')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                openWhatsApp();
            });
        }
    });
    
    // Initialize all buttons with onclick attributes
    document.querySelectorAll('button[onclick]').forEach(button => {
        const onclickAttr = button.getAttribute('onclick');
        if (onclickAttr && !button.hasAttribute('data-initialized')) {
            button.setAttribute('data-initialized', 'true');
            console.log('Initialized button with onclick:', onclickAttr);
        }
    });
    
    // Initialize all links with href attributes
    document.querySelectorAll('a[href]').forEach(link => {
        if (link.href && !link.hasAttribute('data-initialized')) {
            link.setAttribute('data-initialized', 'true');
            console.log('Initialized link with href:', link.href);
        }
    });
    
    // Initialize form submissions
    document.querySelectorAll('form').forEach(form => {
        if (!form.hasAttribute('data-initialized')) {
            form.setAttribute('data-initialized', 'true');
            form.addEventListener('submit', function(e) {
                console.log('Form submitted:', form);
            });
        }
    });
    
    // Initialize slider controls
    const slider = document.querySelector('[data-slider]');
    const prev = document.querySelector('.slider-prev');
    const next = document.querySelector('.slider-next');
    
    if (slider && prev && next) {
        const scrollAmount = 320;
        
        // Remove existing listeners to prevent duplicates
        prev.replaceWith(prev.cloneNode(true));
        next.replaceWith(next.cloneNode(true));
        
        // Re-query after replacement
        const newPrev = document.querySelector('.slider-prev');
        const newNext = document.querySelector('.slider-next');
        
        if (newPrev && newNext) {
            newPrev.addEventListener('click', () => {
                console.log('Slider prev clicked');
                slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
            
            newNext.addEventListener('click', () => {
                console.log('Slider next clicked');
                slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
            
            console.log('✅ Slider controls initialized');
        }
    }
    
    console.log('✅ All interactive elements initialized');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAllInteractiveElements);

// Also try immediately
if (document.readyState !== 'loading') {
    initAllInteractiveElements();
}

// Script initialization complete

// Re-initialize on any dynamic content changes
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            console.log('New content detected, re-initializing interactive elements...');
            setTimeout(initAllInteractiveElements, 100);
        }
    });
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Photo Slider Functionality
class PhotoSlider {
    constructor() {
        this.slider = document.getElementById('heroSlider');
        if (!this.slider) return;
        
        this.track = document.getElementById('sliderTrack');
        this.indicators = this.slider.querySelectorAll('.indicator');
        this.slides = this.slider.querySelectorAll('.slide');
        
        this.currentSlide = 0;
        this.totalSlides = this.slides.length;
        this.autoSlideInterval = null;
        this.slideDuration = 2000; // 2 seconds per slide
        this.eventListenersSetup = false; // Flag to prevent duplicate event listeners
        
        this.loadHeroImages();
        this.init();
    }
    
    loadHeroImages() {
        // Try to load hero images from admin settings
        try {
            const adminData = localStorage.getItem('adminPanelData');
            if (adminData) {
                const data = JSON.parse(adminData);
                if (data.settings && data.settings.content && data.settings.content.hero && data.settings.content.hero.images && data.settings.content.hero.images.length > 0) {
                    console.log('Loading hero images from admin settings:', data.settings.content.hero.images.length, 'images');
                    this.updateSliderImages(data.settings.content.hero.images);
                    return;
                }
            }
        } catch (error) {
            console.log('Could not load admin settings, using default brand posters');
        }
        
        // Fallback to default brand posters if admin settings not available
        console.log('Using default brand posters');
        this.loadDefaultBrandPosters();
    }

    loadDefaultBrandPosters() {
        console.log('Loading 9 brand poster images...');
        
        const heroImages = [
            {
                url: 'uploads/brand-posters/boss.jpg',
                alt: 'BOSS Eyewear'
            },
            {
                url: 'uploads/brand-posters/montblanc.jpg',
                alt: 'Montblanc Eyewear'
            },
            {
                url: 'uploads/brand-posters/carrera.jpg',
                alt: 'Carrera Eyewear'
            },
            {
                url: 'uploads/brand-posters/philipp-plein.jpg',
                alt: 'Philipp Plein Eyewear'
            },
            {
                url: 'uploads/brand-posters/michael-kors.jpg',
                alt: 'Michael Kors Eyewear'
            },
            {
                url: 'uploads/brand-posters/marc-jacobs.jpg',
                alt: 'Marc Jacobs Eyewear'
            },
            {
                url: 'uploads/brand-posters/dolce-gabbana.jpg',
                alt: 'Dolce & Gabbana Eyewear'
            },
            {
                url: 'uploads/brand-posters/tom-ford.jpg',
                alt: 'Tom Ford Eyewear'
            },
            {
                url: 'uploads/brand-posters/burberry.jpg',
                alt: 'Burberry Eyewear'
            }
        ];
        
        this.updateSliderImages(heroImages);
    }

    updateSliderImages(images) {
        if (!images || images.length === 0) return;
        
        const track = this.track;
        
        // Set CSS variable for total slides
        track.style.setProperty('--total-slides', images.length);
        
        // Set track width to accommodate all slides
        // Each slide takes 100% of container width
        track.style.width = `${images.length * 100}%`;
        
        // Create slides - each slide is exactly 1/Nth of track width
        // Track is 1200% wide (12 slides), each slide should be 8.33% of track
        const slideWidthPercent = 100 / images.length;
        
        track.innerHTML = images.map((image, index) => `
            <div class="slide ${index === 0 ? 'active' : ''}" 
                 style="min-width: ${slideWidthPercent}%; width: ${slideWidthPercent}%; max-width: ${slideWidthPercent}%; flex: 0 0 ${slideWidthPercent}%; flex-shrink: 0;">
                <img src="${image.url}" alt="${image.alt}" 
                     style="width: 100%; height: 100%; object-fit: cover; display: block;"
                     onerror="this.src='assets/Logo monica.png'" />
            </div>
        `).join('');
        
        // Hide indicators and counter completely
        const indicatorsContainer = this.slider.querySelector('.slider-indicators');
        if (indicatorsContainer) {
            indicatorsContainer.style.display = 'none';
        }
        
        // Hide counter
        const counterElement = this.slider.querySelector('.slider-counter');
        if (counterElement) {
            counterElement.style.display = 'none';
        }
        
        // Update references
        this.slides = this.slider.querySelectorAll('.slide');
        this.totalSlides = this.slides.length;
        this.currentSlide = 0;
        
        // Start auto-rotation if multiple slides
        if (this.totalSlides > 1) {
            this.startAutoSlide();
            console.log('Auto-rotation enabled - changing slides every 2 seconds');
        }
        
        console.log('Hero slider updated with', this.totalSlides, 'images from admin settings');
    }

    init() {
        console.log('PhotoSlider initialized with', this.totalSlides, 'slides');
        this.setupEventListeners();
        
        // Start auto-rotation if there are slides
        if (this.totalSlides > 1) {
            this.startAutoSlide();
            console.log('Auto-rotation enabled - rotating every 2 seconds');
        }
    }
    
    setupEventListeners() {
        // Only setup event listeners once to prevent duplicates
        if (this.eventListenersSetup) {
            console.log('Event listeners already setup, skipping...');
            return;
        }
        
        console.log('Setting up event listeners for hero slider');
        
        // Hide indicators container
        const indicatorsContainer = this.slider.querySelector('.slider-indicators');
        if (indicatorsContainer) {
            indicatorsContainer.style.display = 'none';
        }
        
        this.eventListenersSetup = true;
        console.log('Event listeners setup completed - pure automatic mode');
    }

    addTouchSupport() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        
        this.slider.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        this.slider.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Only trigger if horizontal swipe is more significant than vertical
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe left - next slide
                    this.nextSlide();
                } else {
                    // Swipe right - previous slide
                    this.prevSlide();
                }
                this.resetAutoSlide();
            }
        });
    }
    
    goToSlide(index) {
        if (index < 0 || index >= this.totalSlides) return;
        
        this.currentSlide = index;
        this.updateSlider();
    }
    
    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
        console.log('Auto-sliding to slide', this.currentSlide + 1, 'of', this.totalSlides);
        this.updateSlider();
    }
    
    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.updateSlider();
    }
    
    updateSlider() {
        if (this.totalSlides <= 1) return;
        
        console.log('Updating slider to slide', this.currentSlide + 1, 'of', this.totalSlides);
        
        // Track is 1200% wide with 12 slides
        // Each slide is 100% of the container width
        // To show slide n, translate by -(n * 100)%
        const translateX = -this.currentSlide * 100;
        
        // Apply transform relative to container width (100%)
        const container = this.track.parentElement;
        const containerWidth = container.offsetWidth;
        const pixelTranslate = -(this.currentSlide * containerWidth);
        
        this.track.style.transform = `translateX(${pixelTranslate}px)`;
        
        console.log('Transform applied: translateX(' + pixelTranslate + 'px) for slide', this.currentSlide + 1);
        
        // Update active indicator
        const indicators = this.slider.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentSlide);
        });
    }
    
    startAutoSlide() {
        this.stopAutoSlide(); // Clear any existing interval
        this.autoSlideInterval = setInterval(() => {
            this.nextSlide();
        }, this.slideDuration);
    }
    
    stopAutoSlide() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
            this.autoSlideInterval = null;
        }
    }
    
    resetAutoSlide() {
        this.stopAutoSlide();
        this.startAutoSlide();
    }
}

// Initialize photo slider when DOM is loaded
let photoSliderInstance = null;

document.addEventListener('DOMContentLoaded', function() {
    photoSliderInstance = new PhotoSlider();
    window.photoSliderInstance = photoSliderInstance; // Make globally accessible
    
    // Listen for admin settings updates
    window.addEventListener('storage', function(e) {
        if (e.key === 'adminPanelData' && photoSliderInstance) {
            console.log('Admin panel data updated, refreshing hero slider');
            photoSliderInstance.loadHeroImages();
            photoSliderInstance.setupEventListeners();
        }
    });
});

// Function to refresh hero slider (can be called from admin panel)
window.refreshHeroSlider = function() {
    if (photoSliderInstance) {
        photoSliderInstance.loadHeroImages();
        photoSliderInstance.setupEventListeners();
    }
};



