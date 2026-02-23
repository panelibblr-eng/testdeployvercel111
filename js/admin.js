// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.products = [];
        this.appointments = [];
        this.contentFormsPopulated = false; // Flag to prevent duplicate form setup
        this.heroImageManagementSetup = false; // Flag to prevent duplicate hero image management setup
        this.analytics = {
            visitors: [],
            pageViews: [],
            sessions: []
        };
        this.settings = {
            content: {
                hero: {
                    eyebrow: 'Now Trending',
                    title: 'David Walker<br>EyeWear',
                    description: 'Immersive, iconic, and innovative. Book your pair today.',
                    images: []
                },
                social: {
                    whatsapp: '917000532010',
                    instagram: '@monicaoptohub',
                    facebook: ''
                },
                brands: ['Ray-Ban', 'Gucci', 'Tom Ford', 'Prada', 'Cartier', 'Johnson & Johnson']
            }
        };
        this.useBackend = true; // Enable backend integration for products and data
        
        this.init();
    }

    init() {
        console.log('=== ADMIN PANEL INITIALIZATION ===');
        console.log('Initial settings before load:', this.settings);
        
        this.setupEventListeners();
        this.checkAuth();
        this.trackVisitor();
        this.initializeImagePreview();
        
        // Load data from backend if available
        // Initialize connection status monitoring
        this.setupConnectionMonitoring();
        
        console.log('useBackend flag:', this.useBackend);
        
        // Always try to load products from backend first, regardless of API client status
        console.log('🔄 Force loading products from backend on initialization...');
        this.forceLoadProductsOnInit();
        
        if (this.useBackend && window.apiClient) {
            console.log('Using backend data loading for other data');
            this.loadBackendData();
        } else {
            console.log('Using localStorage data loading');
            this.loadData();
        }
        
        console.log('Settings after load:', this.settings);
        console.log('Hero content after load:', this.settings.content?.hero);
        
        // Initialize content management AFTER loading data to preserve saved settings
        // Always initialize content management to ensure proper structure
        console.log('Initializing content management...');
            this.updateContentManagement();
        
        // Setup hero image management AFTER content management
        console.log('Setting up hero image management...');
        this.setupHeroImageManagement();
        
        console.log('Final settings after init:', this.settings);
        console.log('Final hero content after init:', this.settings.content?.hero);
        console.log('Final hero images count:', this.settings.content?.hero?.images?.length || 0);
    }

    // Get default settings structure
    getDefaultSettings() {
        return {
            content: {
                hero: {
                    eyebrow: 'Now Trending',
                    title: 'David Walker<br>EyeWear',
                    description: 'Immersive, iconic, and innovative. Book your pair today.',
                    images: []
                },
                social: {
                    whatsapp: '917000532010',
                    instagram: '@monicaoptohub',
                    facebook: ''
                },
                brands: ['Ray-Ban', 'Gucci', 'Tom Ford', 'Prada', 'Cartier', 'Johnson & Johnson']
            },
            announcement: {
                text: 'Buy 1 get 1 on David Walker Eyewear.',
                visible: true
            },
            admin: {
                username: 'admin',
                password: 'admin123'
            },
            website: {
                title: 'Monica Opto Hub',
                description: 'Premium eyewear and optical solutions',
                contactPhone: '+91 70005 32010',
                contactEmail: 'info@monicaoptohub.com'
            }
        };
    }

    // Authentication
    async checkAuth() {
        console.log('Checking authentication...');
        
        try {
        const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        const loginScreen = document.getElementById('loginScreen');
        const adminDashboard = document.getElementById('adminDashboard');

            if (!loginScreen || !adminDashboard) {
                console.warn('⚠️ Login screen or admin dashboard elements not found');
                return;
            }

        if (isLoggedIn) {
            // Verify token is still valid
            if (this.useBackend && window.apiClient) {
                try {
                    await window.apiClient.getProfile();
                    // Token is valid, show dashboard
                    loginScreen.style.display = 'none';
                    adminDashboard.style.display = 'block';
                    this.updateDashboard();
                        console.log('✅ User authenticated, showing dashboard');
                } catch (error) {
                    console.error('Token validation failed:', error);
                    // Token is invalid, clear auth and show login
                    this.clearAuth();
                    loginScreen.style.display = 'block';
                    adminDashboard.style.display = 'none';
                        console.log('⚠️ Token invalid, showing login screen');
                }
            } else {
                // Local mode, just check localStorage
                loginScreen.style.display = 'none';
                adminDashboard.style.display = 'block';
                this.updateDashboard();
                    console.log('✅ User authenticated (local mode), showing dashboard');
            }
        } else {
            loginScreen.style.display = 'block';
            adminDashboard.style.display = 'none';
                console.log('⚠️ User not authenticated, showing login screen');
            }
        } catch (error) {
            console.error('❌ Error in checkAuth:', error);
        }
    }

    // Clear authentication data
    clearAuth() {
        localStorage.removeItem('adminLoggedIn');
        if (window.apiClient) {
            window.apiClient.setToken(null);
        }
        this.currentUser = null;
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Safe event listener setup function
        const safeAddEventListener = (elementId, event, handler) => {
            const element = document.getElementById(elementId);
            if (element && element.addEventListener) {
                element.addEventListener(event, handler);
                console.log(`✅ Added event listener to ${elementId}`);
            } else {
                console.warn(`⚠️ Element ${elementId} not found, skipping event listener`);
            }
        };

        try {
        // Login form
            safeAddEventListener('loginForm', 'submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Bulk import button
            safeAddEventListener('bulkImportBtn', 'click', () => {
            this.showBulkImportModal();
        });

        // Inventory import button
            safeAddEventListener('inventoryImportBtn', 'click', () => {
                console.log('Inventory import button clicked');
                this.showInventoryImportModal();
            });

        // Mobile menu toggle
            safeAddEventListener('mobileMenuToggle', 'click', () => {
                this.toggleMobileMenu();
            });
        
            safeAddEventListener('mobileNavOverlay', 'click', () => {
                this.closeMobileMenu();
            });

        // Logout button
            safeAddEventListener('logoutBtn', 'click', () => {
            this.handleLogout();
        });

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
                if (link && link.addEventListener) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
                this.closeMobileMenu(); // Close mobile menu when navigating
            });
                }
        });

        // Product form
            safeAddEventListener('addProductBtn', 'click', () => {
            this.showProductForm();
        });

            // Product form submission
            safeAddEventListener('productFormElement', 'submit', (e) => {
            e.preventDefault();
            this.handleProductSubmit();
        });

        // Search and filter
            safeAddEventListener('searchProducts', 'input', (e) => {
                this.updateClearButton();
                // Auto-filter as user types
            this.filterProducts();
        });

            safeAddEventListener('searchProducts', 'keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
        });

            safeAddEventListener('filterCategory', 'change', (e) => {
            this.filterProducts();
        });

            safeAddEventListener('filterUpdated', 'change', (e) => {
            this.filterProducts();
        });

        // Category tabs
        document.querySelectorAll('.category-tab').forEach(tab => {
                if (tab && tab.addEventListener) {
            tab.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.filterByCategory(category);
            });
                }
        });

        // Analytics period
            safeAddEventListener('analyticsPeriod', 'change', (e) => {
            this.updateAnalytics();
        });

        // Settings forms
            safeAddEventListener('adminSettingsForm', 'submit', (e) => {
            e.preventDefault();
            this.handleAdminSettings();
        });

            safeAddEventListener('websiteSettingsForm', 'submit', (e) => {
            e.preventDefault();
            this.handleWebsiteSettings();
        });

        // Appointments
            safeAddEventListener('appointmentStatus', 'change', (e) => {
            this.filterAppointments();
        });

            safeAddEventListener('appointmentType', 'change', (e) => {
            this.filterAppointments();
        });

            safeAddEventListener('searchAppointments', 'input', (e) => {
            this.filterAppointments();
        });

            console.log('✅ Event listeners setup completed successfully');
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }

        // Content management forms - will be set up when content section is shown
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        try {
            if (this.useBackend && window.apiClient) {
                // Use backend authentication
                const response = await window.apiClient.login(username, password);
                this.currentUser = response.user;
                localStorage.setItem('adminLoggedIn', 'true');
                this.checkAuth();
                errorDiv.style.display = 'none';
                this.showMessage('Login successful!', 'success');
            } else {
                // Fallback to local authentication
                if (username === 'admin' && password === 'admin123') {
                    localStorage.setItem('adminLoggedIn', 'true');
                    this.checkAuth();
                    errorDiv.style.display = 'none';
                } else {
                    errorDiv.textContent = 'Invalid username or password';
                    errorDiv.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = error.message || 'Login failed';
            errorDiv.style.display = 'block';
        }
    }

    async handleLogout() {
        try {
            if (this.useBackend && window.apiClient) {
                await window.apiClient.logout();
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuth();
            this.checkAuth();
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionName).classList.add('active');
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content based on section
        switch(sectionName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'products':
                this.updateProductsList();
                break;
            case 'appointments':
                this.updateAppointmentsList();
                break;
            case 'analytics':
                this.updateAnalytics();
                break;
            case 'content':
                console.log('Switching to content section');
                
                // Comprehensive content management initialization
                setTimeout(() => {
                    this.initializeContentManagement();
                }, 50);
                
                console.log('✅ Content section initialization completed');
                break;
            case 'settings':
                this.updateSettings();
                break;
        }
    }

    // Enhanced backend data loading with retry and fallback
    async loadBackendData() {
        try {
            console.log('🔄 Loading data from backend...');
            
            // FIRST: Load from localStorage for immediate display
            console.log('📦 Loading from localStorage first for immediate display...');
            this.loadData();
            
            // Check if user is authenticated
            const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
            const hasToken = !!localStorage.getItem('adminToken');
            
            console.log('🔐 Authentication status:', { isLoggedIn, hasToken });
            
            // Always try to load products from backend (products endpoint is public)
            console.log('🔄 Attempting to load products from backend...');
            const productsResult = await this.loadProductsFromBackend();
            
            if (productsResult.success && productsResult.data.length > 0) {
                console.log('✅ Products loaded from backend:', productsResult.data.length);
                this.products = productsResult.data;
                this.saveData(); // Save backend products to localStorage
                this.updateProductsList(); // Update UI immediately
                
                // Force sync with frontend components
                this.forceSyncWithFrontend();
            } else {
                console.log('⚠️ No products from backend, using localStorage/default data');
            }
            
            // Only load other data if authenticated
            if (!isLoggedIn || !hasToken) {
                console.log('🔐 User not authenticated, skipping other backend sync');
                console.log('💡 Tip: Log in to enable full backend synchronization');
                console.log('✅ Using localStorage data for other features');
                return;
            }
            
            // THEN: Check connection status and sync with backend for other data
            if (!window.apiClient.isConnected()) {
                console.log('ℹ️ Backend not connected, using localStorage data');
                const reconnected = await window.apiClient.reconnect();
                if (!reconnected) {
                    console.log('🔄 Backend unavailable, using localStorage data only');
                    return;
                }
            }
            
            // Load other data in parallel with individual error handling
            const [appointmentsResult, settingsResult, analyticsResult] = await Promise.allSettled([
                this.loadAppointmentsFromBackend(),
                this.loadSettingsFromBackend(),
                this.loadAnalyticsFromBackend()
            ]);
            
            // Handle results (this will update data if backend has newer info)
            this.handleBackendDataResults({ success: true, data: this.products }, appointmentsResult, settingsResult, analyticsResult);
            
            // Save the final data to localStorage for offline use
            this.saveData();
            
            // Update the UI with the loaded data
            this.updateProductsList();
            this.updateAppointmentsList();
            this.updateContentManagement();
            
            // Force sync with frontend components
            this.forceSyncWithFrontend();
            
            console.log('✅ Backend data loading completed');
            console.log('Products:', this.products.length);
            console.log('Appointments:', this.appointments.length);
            console.log('Hero images:', this.settings?.content?.hero?.images?.length || 0);
            
        } catch (error) {
            console.error('❌ Error loading backend data:', error);
            console.log('🔄 Using localStorage data only...');
            // localStorage data was already loaded above, so we're good
            
            // Ensure UI is updated even if backend fails
            this.updateProductsList();
            this.updateAppointmentsList();
            this.updateContentManagement();
            
            // Force sync with frontend components
            this.forceSyncWithFrontend();
        }
    }

    async loadProductsFromBackend() {
        try {
            console.log('🔄 Loading products from backend via API client...');
            const response = await window.apiClient.getProducts();
            console.log('📊 API Client Response:', response);
            
            if (response && response.products && Array.isArray(response.products)) {
                console.log('✅ Products loaded via API client:', response.products.length);
                // Normalize product IDs (_id to id) for compatibility
                const normalizedProducts = response.products.map(p => {
                    if (p._id && !p.id) {
                        p.id = p._id;
                    }
                    return p;
                });
                return { success: true, data: normalizedProducts };
            } else {
                console.warn('⚠️ API client response format issue, trying direct fetch...');
                return await this.loadProductsFromBackendDirect();
            }
        } catch (error) {
            console.warn('⚠️ API client failed, trying direct fetch:', error.message);
            return await this.loadProductsFromBackendDirect();
        }
    }

    // Direct fetch method as fallback
    async loadProductsFromBackendDirect() {
        try {
            console.log('🔄 Loading products from backend via direct fetch...');
            const apiUrl = this.useBackend ? (window.apiClient?.baseURL + '/products') || '/api/products' : '/api/products';
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📊 Direct Fetch Response:', data);
            
            if (data && data.success && data.products && Array.isArray(data.products)) {
                console.log('✅ Products loaded via direct fetch:', data.products.length);
                // Normalize product IDs (_id to id) for compatibility
                const normalizedProducts = data.products.map(p => {
                    if (p._id && !p.id) {
                        p.id = p._id;
                    }
                    return p;
                });
                return { success: true, data: normalizedProducts };
            } else {
                console.error('❌ Invalid response format from backend');
                return { success: false, error: 'Invalid response format' };
            }
        } catch (error) {
            console.error('❌ Direct fetch failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Force synchronization with frontend components
    forceSyncWithFrontend() {
        console.log('🔄 Force syncing with frontend components...');
        
        try {
            // Dispatch custom event to notify frontend components
            const syncEvent = new CustomEvent('adminDataUpdated', {
                detail: {
                    products: this.products,
                    appointments: this.appointments,
                    settings: this.settings,
                    analytics: this.analytics,
                    timestamp: new Date().toISOString()
                }
            });
            window.dispatchEvent(syncEvent);
            
            // Direct sync with ProductDisplay if available
            if (window.productDisplay) {
                console.log('🔄 Syncing with ProductDisplay...');
                window.productDisplay.products = this.products;
                if (typeof window.productDisplay.refreshAllDisplays === 'function') {
                    window.productDisplay.refreshAllDisplays();
                }
            }
            
            // Direct sync with WebsiteContentManager if available
            if (window.websiteContentManager) {
                console.log('🔄 Syncing with WebsiteContentManager...');
                window.websiteContentManager.adminData = {
                    products: this.products,
                    settings: this.settings
                };
                if (typeof window.websiteContentManager.updateWebsiteContent === 'function') {
                    window.websiteContentManager.updateWebsiteContent();
                }
            }
            
            // Update localStorage with latest data (without triggering sync to avoid recursion)
            const data = {
                products: this.products,
                appointments: this.appointments,
                analytics: this.analytics,
                settings: this.settings
            };
            localStorage.setItem('adminPanelData', JSON.stringify(data));
            
            console.log('✅ Frontend sync completed');
            
        } catch (error) {
            console.error('❌ Error during frontend sync:', error);
        }
    }

    async loadAppointmentsFromBackend() {
        try {
            const response = await window.apiClient.getAppointments();
            return { success: true, data: response.appointments || [] };
        } catch (error) {
            console.warn('⚠️ Failed to load appointments from backend:', error.message);
            console.log('Error details:', error);
            return { success: false, error: error.message };
        }
    }

    async loadSettingsFromBackend() {
        try {
            const settings = await window.apiClient.getSettings();
            return { success: true, data: settings };
        } catch (error) {
            console.warn('⚠️ Failed to load settings from backend:', error.message);
            console.log('Error details:', error);
            return { success: false, error: error.message };
        }
    }

    async loadAnalyticsFromBackend() {
        try {
            const analytics = await window.apiClient.getAnalyticsStats();
            return { success: true, data: analytics };
        } catch (error) {
            console.warn('⚠️ Failed to load analytics from backend:', error.message);
            console.log('Error details:', error);
            return { success: false, error: error.message };
        }
    }

    handleBackendDataResults(productsResult, appointmentsResult, settingsResult, analyticsResult) {
        // Handle products - PRESERVE EXISTING PRODUCTS
        if (productsResult.success) {
            this.products = productsResult.data;
            console.log('✅ Products loaded from backend:', this.products.length);
        } else {
            console.log('ℹ️ Using localStorage products (backend unavailable or not authenticated)');
            // PRESERVE existing products - don't reload if we already have products
            if (!this.products || this.products.length === 0) {
                console.log('No products in memory, loading from localStorage...');
            this.loadData();
            } else {
                console.log('Preserving existing products:', this.products.length);
            }
        }

        // Handle appointments
        if (appointmentsResult.success) {
            this.appointments = appointmentsResult.data;
            console.log('✅ Appointments loaded from backend:', this.appointments.length);
        } else {
            console.log('ℹ️ Using localStorage appointments (backend unavailable or not authenticated)');
            if (!this.appointments || this.appointments.length === 0) {
                this.appointments = [];
            }
        }

        // Handle settings - PRESERVE HERO IMAGES
        if (settingsResult.success) {
            const backendSettings = settingsResult.data;
            console.log('✅ Settings loaded from backend');
            
            // Preserve existing hero images if backend doesn't have them or has fewer
            const currentHeroImages = this.settings?.content?.hero?.images || [];
            const backendHeroImages = backendSettings?.content?.hero?.images || [];
            
            console.log('Current hero images:', currentHeroImages.length);
            console.log('Backend hero images:', backendHeroImages.length);
            
            // Merge settings but preserve hero images if current has more
            this.settings = this.deepMerge(this.getDefaultSettings(), backendSettings);
            
            // If we have more hero images locally, keep them
            if (currentHeroImages.length > backendHeroImages.length) {
                console.log('🔄 Preserving local hero images (more than backend)');
                this.settings.content.hero.images = currentHeroImages;
            } else if (backendHeroImages.length > 0) {
                console.log('🔄 Using backend hero images');
                this.settings.content.hero.images = backendHeroImages;
            }
            
            console.log('Final hero images count:', this.settings.content.hero.images.length);
        } else {
            console.log('ℹ️ Using localStorage settings (backend unavailable or not authenticated)');
            if (!this.settings) {
                this.settings = this.getDefaultSettings();
            }
        }

        // Handle analytics
        if (analyticsResult.success) {
            this.analytics = analyticsResult.data;
            console.log('✅ Analytics loaded from backend');
        } else {
            console.log('ℹ️ Using localStorage analytics (backend unavailable or not authenticated)');
            if (!this.analytics) {
                this.analytics = { visitors: [], pageViews: [], sessions: [] };
            }
        }
    }

    // Connection monitoring setup
    setupConnectionMonitoring() {
        // Listen for connection status changes
        window.addEventListener('connectionStatusChanged', (event) => {
            const { status } = event.detail;
            this.updateConnectionStatus(status);
        });

        // Add connection status indicator to UI
        this.addConnectionStatusIndicator();
    }

    updateConnectionStatus(status) {
        const indicator = document.getElementById('connectionStatus');
        if (indicator) {
            indicator.className = `connection-status ${status}`;
            indicator.textContent = this.getConnectionStatusText(status);
        }

        // Show notification for status changes
        if (status === 'disconnected') {
            this.showNotification('Connection lost. Working in offline mode.', 'warning');
        } else if (status === 'connected') {
            this.showNotification('Connection restored.', 'success');
        }
    }

    getConnectionStatusText(status) {
        switch (status) {
            case 'connected': return '🟢 Connected';
            case 'disconnected': return '🔴 Offline';
            case 'error': return '🟡 Error';
            default: return '⚪ Unknown';
        }
    }

    addConnectionStatusIndicator() {
        // Add connection status to the header
        const header = document.querySelector('.admin-header');
        if (header && !document.getElementById('connectionStatus')) {
            const indicator = document.createElement('div');
            indicator.id = 'connectionStatus';
            indicator.className = 'connection-status unknown';
            indicator.textContent = '⚪ Checking...';
            indicator.style.cssText = `
                position: absolute;
                top: 10px;
                right: 20px;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 12px;
                font-weight: bold;
                background: rgba(255,255,255,0.9);
                border: 1px solid #ddd;
            `;
            header.style.position = 'relative';
            header.appendChild(indicator);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;

        // Set background color based on type
        switch (type) {
            case 'success': notification.style.background = '#10B981'; break;
            case 'warning': notification.style.background = '#F59E0B'; break;
            case 'error': notification.style.background = '#EF4444'; break;
            default: notification.style.background = '#3B82F6';
        }

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Dashboard
    updateDashboard() {
        console.log('Updating dashboard...');
        
        try {
        const totalVisitors = this.analytics.visitors.length;
        const totalProducts = this.products.length;
        const todayVisitors = this.getTodayVisitors();
        const featuredProducts = this.products.filter(p => p.featured).length;

            // Safe dashboard update
            const safeUpdateElement = (elementId, value) => {
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = value;
                    console.log(`✅ Updated ${elementId}: ${value}`);
                } else {
                    console.warn(`⚠️ Element ${elementId} not found, skipping update`);
                }
            };

            safeUpdateElement('totalVisitors', totalVisitors);
            safeUpdateElement('totalProducts', totalProducts);
            safeUpdateElement('todayVisitors', todayVisitors);
            safeUpdateElement('featuredProducts', featuredProducts);

        this.updateRecentActivity();
            console.log('✅ Dashboard updated successfully');
        } catch (error) {
            console.error('❌ Error updating dashboard:', error);
        }
    }

    updateRecentActivity() {
        try {
        const activityList = document.getElementById('recentActivity');
            if (!activityList) {
                console.warn('⚠️ recentActivity element not found, skipping update');
                return;
            }
            
        const activities = this.getRecentActivities();

        if (activities.length === 0) {
            activityList.innerHTML = '<p class="no-data">No recent activity</p>';
            return;
        }

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <p class="activity-text">${activity.text}</p>
                    <p class="activity-time">${activity.time}</p>
                </div>
            </div>
        `).join('');
            
            console.log('✅ Recent activity updated successfully');
        } catch (error) {
            console.error('❌ Error updating recent activity:', error);
        }
    }

    getRecentActivities() {
        const activities = [];
        const now = new Date();

        // Add recent product additions
        const recentProducts = this.products
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);

        recentProducts.forEach(product => {
            activities.push({
                icon: '📦',
                text: `Added product: ${product.name}`,
                time: this.formatTimeAgo(new Date(product.createdAt))
            });
        });

        // Add recent visitors
        const recentVisitors = this.analytics.visitors
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 2);

        recentVisitors.forEach(visitor => {
            activities.push({
                icon: '👤',
                text: `New visitor from ${visitor.location || 'Unknown'}`,
                time: this.formatTimeAgo(new Date(visitor.timestamp))
            });
        });

        return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
    }

    // Products
    showProductForm(product = null) {
        const form = document.getElementById('productForm');
        const formTitle = document.getElementById('formTitle');
        const formElement = document.getElementById('productFormElement');

        if (product) {
            formTitle.textContent = 'Edit Product';
            formElement.dataset.productId = product.id;
            this.populateProductForm(product);
        } else {
            formTitle.textContent = 'Add New Product';
            formElement.reset();
            delete formElement.dataset.productId; // Clear the product ID for new products
            this.clearImagePreview();
        }

        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth' });
    }

    hideProductForm() {
        document.getElementById('productForm').style.display = 'none';
    }

    populateProductForm(product) {
        document.getElementById('productName').value = product.name;
        document.getElementById('productBrand').value = product.brand;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category;
        // Gender field removed - using default value
        document.getElementById('productModel').value = product.model || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productImages').value = '';
        document.getElementById('productFeatured').checked = product.featured || false;
        document.getElementById('productTrending').checked = product.trending || false;
        
        // Clear and populate image preview
        this.clearImagePreview();
        if (product.images && product.images.length > 0) {
            product.images.forEach((image, index) => {
                this.addImageToPreview(image.image_url, index === 0);
            });
        }
    }

    async handleProductSubmit() {
        const formData = new FormData(document.getElementById('productFormElement'));
        
        // Handle multiple images FIRST, before getting other form data
        const imageFiles = document.getElementById('productImages').files;
        console.log('Image files selected:', imageFiles.length);
        if (imageFiles.length > 0) {
            // Clear any existing 'images' entries in FormData
            formData.delete('images');
            for (let i = 0; i < imageFiles.length; i++) {
                console.log(`Adding image ${i} to FormData:`, imageFiles[i].name, imageFiles[i].type, imageFiles[i].size);
                formData.append('images', imageFiles[i]);
            }
        } else {
            console.log('No images selected');
        }
        
        // Log all FormData entries for debugging
        console.log('FormData entries:');
        for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`${key}: File(${value.name}, ${value.type}, ${value.size} bytes)`);
            } else {
                console.log(`${key}: ${value}`);
            }
        }
        
        // Map form field names to backend expected keys
        // Backend expects: name, brand, price, category, gender, model, description, featured
        formData.set('name', formData.get('productName') || '');
        formData.set('brand', formData.get('productBrand') || '');
        formData.set('price', String(parseFloat(formData.get('productPrice') || '')));
        formData.set('category', formData.get('productCategory') || '');
        formData.set('gender', 'unisex'); // Default to unisex since gender field is removed
        formData.set('model', formData.get('productModel') || '');
        formData.set('description', formData.get('productDescription') || '');
        // Checkbox handling: use checked state to send 'true'/'false'
        const featuredChecked = document.getElementById('productFeatured').checked;
        formData.set('featured', featuredChecked ? 'true' : 'false');
        const trendingChecked = document.getElementById('productTrending').checked;
        formData.set('trending', trendingChecked ? 'true' : 'false');
        
        const product = {
            name: formData.get('productName'),
            brand: formData.get('productBrand'),
            price: parseFloat(formData.get('productPrice')),
            category: formData.get('productCategory'),
            gender: 'unisex', // Default to unisex since gender field is removed
            model: formData.get('productModel'),
            description: formData.get('productDescription'),
            featured: formData.get('productFeatured') === 'on'
        };

        try {
            // Check if editing existing product
            const existingProductId = document.getElementById('productFormElement').dataset.productId;
            console.log('Product form submission - existingProductId:', existingProductId);
            
            if (existingProductId) {
                console.log('Updating existing product with ID:', existingProductId);
                
                // Normalize product IDs first
                this.products = this.products.map(p => {
                    if (p._id && !p.id) {
                        p.id = p._id;
                    }
                    return p;
                });
                
                // Find product by id or _id
                const productIndex = this.products.findIndex(p => p.id === existingProductId || p._id === existingProductId);
                const actualId = productIndex !== -1 ? (this.products[productIndex].id || this.products[productIndex]._id) : existingProductId;
                
                console.log('Product index:', productIndex, 'Actual ID:', actualId);
                
                // Update existing product
                if (this.useBackend && window.apiClient) {
                    try {
                        console.log('Updating product in backend with ID:', actualId);
                        // Send FormData (with files) directly
                        const updatedProduct = await window.apiClient.updateProduct(actualId, formData);
                        console.log('✅ Product updated in backend:', updatedProduct);
                        
                        // Normalize the returned product ID
                        if (updatedProduct._id && !updatedProduct.id) {
                            updatedProduct.id = updatedProduct._id;
                        }
                        
                        // Update local products list
                        if (productIndex !== -1) {
                            this.products[productIndex] = {
                                ...this.products[productIndex],
                                ...updatedProduct,
                                id: updatedProduct.id || updatedProduct._id || actualId,
                                updatedAt: new Date().toISOString()
                            };
                        }
                    } catch (error) {
                        console.error('❌ Error updating product in backend:', error);
                        // Check if it's a database error
                        const errorMsg = error.message || String(error);
                        if (errorMsg.includes('503') || errorMsg.includes('Database not available')) {
                            this.showMessage('⚠️ Database not available. Changes saved to local storage only. They will sync when database is available.', 'warning');
                        } else if (errorMsg.includes('404')) {
                            this.showMessage('⚠️ Product not found in database. Changes saved to local storage only.', 'warning');
                        } else {
                            this.showMessage('⚠️ Error updating in backend: ' + errorMsg + '. Changes saved to local storage only.', 'warning');
                        }
                        // Still update local storage even if backend fails
                        if (productIndex !== -1) {
                            product.id = actualId;
                            product.createdAt = this.products[productIndex].createdAt;
                            product.updatedAt = new Date().toISOString();
                            this.products[productIndex] = product;
                            this.saveData();
                        }
                    }
                } else {
                    const index = this.products.findIndex(p => p.id === existingProductId);
                    if (index !== -1) {
                        product.id = existingProductId;
                        product.createdAt = this.products[index].createdAt;
                        product.updatedAt = new Date().toISOString(); // Set updated timestamp
                        this.products[index] = product;
                        this.saveData();
                    }
                }
            } else {
                console.log('Creating new product');
                // Create new product
                if (this.useBackend && window.apiClient) {
                    // Send FormData (with files) directly
                    const newProduct = await window.apiClient.createProduct(formData);
                    this.products.push(newProduct);
                } else {
                    product.id = Date.now().toString();
                    product.createdAt = new Date().toISOString();
                    product.updatedAt = new Date().toISOString();
                    this.products.push(product);
                    this.saveData();
                }
            }

            this.updateProductsList();
            this.hideProductForm();
            this.showMessage('Product saved successfully!', 'success');
            
            // Refresh brands on the main website
            if (window.brandLoader) {
                window.brandLoader.refreshBrands();
            }
            
            // Notify the main website about the update
            this.notifyWebsiteUpdate();
            
        } catch (error) {
            console.error('Error saving product:', error);
            let errorMessage = 'Error saving product: ' + error.message;
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error: Unable to connect to server. Please check if the backend server is running.';
            } else if (error.message.includes('Network error')) {
                errorMessage = error.message;
            }
            
            this.showMessage(errorMessage, 'error');
        }
    }

    // Image preview functionality
    clearImagePreview() {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = '';
    }

    addImageToPreview(imageUrl, isPrimary = false) {
        const preview = document.getElementById('imagePreview');
        if (!preview) {
            console.error('Image preview container not found');
            return;
        }
        
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Product image';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = () => {
            previewItem.remove();
        };
        
        previewItem.appendChild(img);
        previewItem.appendChild(removeBtn);
        
        if (isPrimary) {
            const primaryBadge = document.createElement('div');
            primaryBadge.className = 'primary-badge';
            primaryBadge.textContent = 'Primary';
            previewItem.appendChild(primaryBadge);
        }
        
        preview.appendChild(previewItem);
        console.log('Image added to preview:', imageUrl);
    }

    // Initialize image preview functionality
    initializeImagePreview() {
        const fileInput = document.getElementById('productImages');
        if (fileInput) {
            console.log('Image preview initialized');
            fileInput.addEventListener('change', (e) => {
                console.log('File input changed, files:', e.target.files.length);
                this.clearImagePreview();
                const files = Array.from(e.target.files);
                
                files.forEach((file, index) => {
                    console.log(`Processing file ${index}:`, file.name, file.type);
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            console.log(`Adding image ${index} to preview`);
                            this.addImageToPreview(e.target.result, index === 0);
                        };
                        reader.readAsDataURL(file);
                    } else {
                        console.warn('File is not an image:', file.name);
                    }
                });
            });
        } else {
            console.error('Product images file input not found');
        }
    }

    updateProductsList() {
        console.log('Updating products list...');
        
        try {
        const productsList = document.getElementById('productsList');
            if (!productsList) {
                console.warn('⚠️ productsList element not found, cannot display products');
                return;
            }
            
        const filteredProducts = this.getFilteredProducts();
            console.log(`Found ${filteredProducts.length} filtered products out of ${this.products.length} total`);

        // Update category stats
        const activeCategoryTab = document.querySelector('.category-tab.active');
        const activeCategory = activeCategoryTab ? activeCategoryTab.dataset.category : 'all';
        this.updateCategoryStats(activeCategory);

        if (filteredProducts.length === 0) {
            productsList.innerHTML = '<div class="no-data">No products found. Add your first product!</div>';
                console.log('No products to display');
            return;
        }

        productsList.innerHTML = `
            <div class="bulk-actions" style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 15px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="selectAllProducts" onchange="adminPanel.toggleSelectAll(this.checked)">
                    <strong>Select All (${filteredProducts.length} products)</strong>
                </label>
                <button class="btn btn--danger" onclick="adminPanel.deleteSelectedProducts()" id="bulkDeleteBtn" disabled style="margin-left: 20px;">
                    Delete Selected
                </button>
            </div>
            ${filteredProducts.map(product => {
                // Get product image URL
                let imageUrl = '';
                if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                    // Use first image from images array
                    imageUrl = product.images[0].image_url || product.images[0].url || '';
                } else if (product.image_url) {
                    imageUrl = product.image_url;
                } else if (product.image) {
                    imageUrl = product.image;
                }
                
                // Construct full URL if it's a relative path
                let fullImageUrl = '';
                if (imageUrl) {
                    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
                        fullImageUrl = imageUrl;
                    } else {
                        // Relative path - add backend URL if available, otherwise use as is
                        fullImageUrl = imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl;
                        // Use relative path for same-origin requests
                        if (this.useBackend) {
                            // Keep as relative path - will use same origin
                        }
                    }
                } else {
                    // Fallback placeholder
                    fullImageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjhGQUZDIi8+CjxwYXRoIGQ9Ik0yMCAyMEg0MFY0MEgyMFYyMFoiIGZpbGw9IiNFMkU4RjAiLz4KPC9zdmc+';
                }
                
                return `
                <div class="product-row" data-product-id="${product.id}">
                <div class="table-cell">
                        <input type="checkbox" class="product-checkbox" data-product-id="${product.id}" onchange="adminPanel.updateBulkDeleteButton()">
                    </div>
                    <div class="table-cell">
                        <img src="${fullImageUrl}" 
                         alt="${product.name}" 
                         class="product-image" 
                             style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjhGQUZDIi8+CjxwYXRoIGQ9Ik0yMCAyMEg0MFY0MEgyMFYyMFoiIGZpbGw9IiNFMkU4RjAiLz4KPC9zdmc+'">
                </div>
                <div class="table-cell">
                    <p class="product-name">${product.name}</p>
                    <p class="product-brand">${product.brand}</p>
                </div>
                <div class="table-cell">${product.brand}</div>
                <div class="table-cell">${product.category}</div>
                <div class="table-cell product-price">₹${product.price.toLocaleString()}</div>
                <div class="table-cell">
                    ${product.featured ? '<span class="featured-badge">Featured</span>' : '-'}
                </div>
                <div class="table-cell product-actions">
                    <button class="btn btn--small" onclick="adminPanel.editProduct('${product.id || product._id}')">Edit</button>
                    
                    <button class="btn btn--small btn--danger" onclick="adminPanel.deleteProduct('${product.id || product._id}')">Delete</button>
                </div>
            </div>
                `;
            }).join('')}
        `;
            
            console.log(`✅ Products list updated with ${filteredProducts.length} products`);
        } catch (error) {
            console.error('❌ Error updating products list:', error);
        }
    }

    getFilteredProducts() {
        try {
            // Safe DOM element access
            const searchElement = document.getElementById('searchProducts');
            const filterElement = document.getElementById('filterCategory');
            const filterUpdatedElement = document.getElementById('filterUpdated');
        const activeCategoryTab = document.querySelector('.category-tab.active');
            
            const searchTerm = searchElement ? searchElement.value.toLowerCase() : '';
            const categoryFilter = filterElement ? filterElement.value : '';
            const updatedFilter = filterUpdatedElement ? filterUpdatedElement.value : '';
        const activeCategory = activeCategoryTab ? activeCategoryTab.dataset.category : 'all';

            console.log(`Filtering products: search="${searchTerm}", category="${categoryFilter}", updated="${updatedFilter}", active="${activeCategory}"`);

        let filtered = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                                product.brand.toLowerCase().includes(searchTerm) ||
                                (product.model && product.model.toLowerCase().includes(searchTerm));
            const matchesCategory = !categoryFilter || product.category === categoryFilter;
            const matchesActiveCategory = this.matchesActiveCategory(product, activeCategory);
            return matchesSearch && matchesCategory && matchesActiveCategory;
        });

            // Apply updated filter
            if (updatedFilter) {
                filtered = filtered.filter(product => this.matchesUpdatedFilter(product, updatedFilter));
            }

            return filtered;
        } catch (error) {
            console.error('❌ Error filtering products:', error);
            return this.products; // Return all products if filtering fails
        }
    }

    matchesUpdatedFilter(product, filterType) {
        const now = new Date();
        let updatedAt;
        
        // Get updated date (use updatedAt if available, otherwise createdAt)
        if (product.updatedAt) {
            updatedAt = new Date(product.updatedAt);
        } else if (product.updated_at) {
            updatedAt = new Date(product.updated_at);
        } else if (product.createdAt) {
            updatedAt = new Date(product.createdAt);
        } else {
            updatedAt = new Date(product.created_at || Date.now());
        }

        const diffTime = now - updatedAt;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        switch (filterType) {
            case 'recent':
                // Products updated in the last 7 days
                return diffDays <= 7;
            case 'today':
                // Products updated today
                return diffDays < 1 && updatedAt.toDateString() === now.toDateString();
            case 'this-week':
                // Products updated this week
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
                return updatedAt >= weekStart;
            default:
                return true;
        }
    }

    performSearch() {
        const searchElement = document.getElementById('searchProducts');
        const searchTerm = searchElement ? searchElement.value.trim() : '';
        
        if (searchTerm) {
            console.log(`🔍 Searching for: "${searchTerm}"`);
            this.filterProducts();
            this.updateClearButton();
        } else {
            console.log('⚠️ No search term entered');
        }
    }

    clearSearch() {
        const searchElement = document.getElementById('searchProducts');
        if (searchElement) {
            searchElement.value = '';
            this.filterProducts();
            this.updateClearButton();
            console.log('✕ Search cleared');
        }
    }

    updateClearButton() {
        const searchElement = document.getElementById('searchProducts');
        const clearBtn = document.getElementById('clearSearchBtn');
        
        if (searchElement && clearBtn) {
            const hasSearch = searchElement.value.trim().length > 0;
            clearBtn.style.display = hasSearch ? 'block' : 'none';
        }
    }

    matchesActiveCategory(product, activeCategory) {
        if (activeCategory === 'all') return true;
        // Gender filtering removed - just check category
        return product.category === activeCategory;
    }

    filterByCategory(category) {
        // Update active tab
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // Update category stats
        this.updateCategoryStats(category);

        // Filter products
        this.updateProductsList();
    }

    updateCategoryStats(activeCategory) {
        const stats = this.getCategoryStats(activeCategory);
        document.getElementById('categoryStats').textContent = stats;
    }

    getCategoryStats(activeCategory) {
        const totalProducts = this.products.length;
        let categoryProducts = [];

        if (activeCategory === 'all') {
            categoryProducts = this.products;
        } else if (activeCategory === 'men') {
            categoryProducts = this.products.filter(p => p.gender === 'men' || p.gender === 'unisex');
        } else if (activeCategory === 'women') {
            categoryProducts = this.products.filter(p => p.gender === 'women' || p.gender === 'unisex');
        } else {
            categoryProducts = this.products.filter(p => p.category === activeCategory);
        }

        const categoryCount = categoryProducts.length;
        const featuredCount = categoryProducts.filter(p => p.featured).length;

        if (activeCategory === 'all') {
            return `${totalProducts} total products • ${featuredCount} featured`;
        } else {
            return `${categoryCount} products • ${featuredCount} featured`;
        }
    }

    filterProducts() {
        this.updateProductsList();
    }

    editProduct(productId) {
        console.log('Edit product called with ID:', productId);
        // Normalize product IDs first
        this.products = this.products.map(p => {
            if (p._id && !p.id) {
                p.id = p._id;
            }
            return p;
        });
        // Try both id and _id for compatibility
        const product = this.products.find(p => p.id === productId || p._id === productId);
        if (product) {
            // Normalize ID if needed
            if (product._id && !product.id) {
                product.id = product._id;
            }
            console.log('Found product to edit:', product);
            this.showProductForm(product);
        } else {
            console.error('Product not found with ID:', productId);
            console.log('Available products:', this.products.map(p => ({ id: p.id, _id: p._id, name: p.name })));
            this.showMessage('Product not found. Please refresh the page.', 'error');
        }
    }

    async deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            await this.deleteProductInternal(productId);
        }
    }

    async deleteProductInternal(productId) {
        try {
            console.log(`🗑️ Deleting product ${productId}...`);
            
            // Normalize product IDs in the array first
            this.products = this.products.map(p => {
                if (p._id && !p.id) {
                    p.id = p._id;
                }
                return p;
            });
            
            // Find product to get actual ID (could be id or _id)
            const productToDelete = this.products.find(p => p.id === productId || p._id === productId);
            const actualId = productToDelete ? (productToDelete.id || productToDelete._id) : productId;
            
            console.log('Product to delete found:', !!productToDelete, 'Actual ID:', actualId);
            
            // DELETE FROM BACKEND FIRST (permanent deletion from database)
            if (this.useBackend && window.apiClient) {
                try {
                    console.log('Deleting from backend with ID:', actualId);
                    const response = await window.apiClient.deleteProduct(actualId);
                    console.log('✅ Product permanently deleted from backend database:', response);
                } catch (error) {
                    // Check error type and show appropriate message
                    const errorMsg = error.message || String(error);
                    console.error('❌ Error deleting from backend:', error);
                    
                    if (errorMsg.includes('503') || errorMsg.includes('Database not available')) {
                        this.showMessage('⚠️ Database not available. Product removed from local storage only. It will be deleted from database when connection is restored.', 'warning');
                    } else if (errorMsg.includes('404')) {
                        // If backend returns 404, it means product doesn't exist in DB
                        console.log('ℹ️ Product not found in backend (already deleted or never existed)');
                    } else {
                        this.showMessage('⚠️ Error deleting from backend: ' + errorMsg + '. Product removed from local storage only.', 'warning');
                    }
                }
            }
            
            // Remove from local products array (check both id and _id)
            const existsLocally = this.products.some(p => p.id === productId || p._id === productId);
            if (existsLocally) {
                this.products = this.products.filter(p => p.id !== productId && p._id !== productId);
                this.saveData();
                console.log('✅ Product removed from local storage');
            } else {
                console.warn('⚠️ Product not found in local array:', productId);
            }
            
            // Also remove from frontend product display if it exists
            if (window.productDisplay) {
                window.productDisplay.deleteProduct(productId);
                console.log('✅ Product removed from frontend display');
            }
            
            // Clear API cache to force fresh data
            if (window.apiClient) {
                window.apiClient.clearCache();
                console.log('✅ API cache cleared');
            }
            
            // Update admin UI immediately
            this.updateProductsList();
            
            // Notify main website to refresh (forces reload from backend)
            this.notifyWebsiteUpdate();
            
            this.showMessage('Product permanently deleted from database and all locations', 'success');
            
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showMessage('Error deleting product: ' + error.message, 'error');
            throw error;
        }
    }

    // Bulk delete functionality
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.product-checkbox');
        checkboxes.forEach(cb => cb.checked = checked);
        this.updateBulkDeleteButton();
    }

    updateBulkDeleteButton() {
        const checkboxes = document.querySelectorAll('.product-checkbox:checked');
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.disabled = checkboxes.length === 0;
            bulkDeleteBtn.textContent = checkboxes.length > 0 ? `Delete Selected (${checkboxes.length})` : 'Delete Selected';
        }
    }

    async deleteSelectedProducts() {
        const checkboxes = document.querySelectorAll('.product-checkbox:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.productId);
        
        if (selectedIds.length === 0) {
            this.showMessage('No products selected', 'error');
            return;
        }

        if (confirm(`Are you sure you want to delete ${selectedIds.length} product(s)?`)) {
            try {
                this.showMessage(`Deleting ${selectedIds.length} product(s)...`, 'info');
                
                // Delete all selected products
                for (const productId of selectedIds) {
                    await this.deleteProductInternal(productId);
                }
                
                this.showMessage(`${selectedIds.length} product(s) deleted successfully!`, 'success');
                
                // Notify the main website about the update
                this.notifyWebsiteUpdate();
                
            } catch (error) {
                console.error('Error deleting products:', error);
                this.showMessage('Error deleting some products', 'error');
            }
        }
    }

    // Notify main website about data updates
    notifyWebsiteUpdate() {
        console.log('🔄 notifyWebsiteUpdate called - starting comprehensive sync');
        
        // Step 1: Save data first
        this.saveData();
        console.log('✅ Step 1: Data saved to admin panel');
        
        // Step 2: Force immediate localStorage update for homepage
        const data = {
            products: this.products,
            appointments: this.appointments,
            analytics: this.analytics,
            settings: this.settings
        };
        
        try {
            localStorage.setItem('adminPanelData', JSON.stringify(data));
            console.log('✅ Step 2: Data saved to localStorage for homepage compatibility');
            console.log('📊 Products count:', data.products?.length || 0);
            console.log('🖼️ Hero images count:', data.settings?.content?.hero?.images?.length || 0);
            
            // Verify the save
            const verifyData = localStorage.getItem('adminPanelData');
            if (verifyData) {
                const parsed = JSON.parse(verifyData);
                console.log('✅ Step 2 Verification - Products:', parsed.products?.length || 0);
                console.log('✅ Step 2 Verification - Hero images:', parsed.settings?.content?.hero?.images?.length || 0);
            }
        } catch (error) {
            console.error('❌ Failed to save to localStorage:', error);
        }
        
        // Step 3: Dispatch custom event for same-page updates
        console.log('✅ Step 3: Dispatching adminDataUpdated event');
        window.dispatchEvent(new CustomEvent('adminDataUpdated', {
            detail: { 
                products: this.products,
                appointments: this.appointments,
                analytics: this.analytics,
                settings: this.settings,
                heroImages: this.settings?.content?.hero?.images || []
            }
        }));
        
        // Step 4: Trigger storage event for cross-tab updates
        console.log('✅ Step 4: Dispatching storage event');
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'adminPanelData',
            newValue: JSON.stringify(data),
            oldValue: localStorage.getItem('adminPanelData')
        }));
        
        // Step 5: Update the main website immediately
        console.log('✅ Step 5: Updating main website');
        this.updateMainWebsite();
        
        // Step 6: Refresh hero slider if function exists
        if (typeof window.refreshHeroSlider === 'function') {
            console.log('✅ Step 6: Refreshing hero slider');
            window.refreshHeroSlider();
        }
        
        // Step 7: Force sync with frontend components
        console.log('✅ Step 7: Force syncing with frontend components');
        this.forceSyncWithFrontend();
        
        console.log('🎉 Comprehensive sync completed successfully');
    }

    // Get admin data for sharing with main website
    getAdminData() {
        return {
            products: this.products,
            appointments: this.appointments,
            analytics: this.analytics,
            settings: this.settings,
            lastUpdated: new Date().toISOString()
        };
    }

    // Update main website content
    updateMainWebsite() {
        console.log('🔄 Updating main website with new data...');
        console.log('📊 Current products count:', this.products.length);
        console.log('🖼️ Current hero images count:', this.settings?.content?.hero?.images?.length || 0);
        
        // Force refresh if main website is open - but only if products actually changed
        if (window.productDisplay) {
            console.log('✅ ProductDisplay found, checking if update needed...');
            
            // Check if products actually changed before forcing refresh
            const currentProducts = window.productDisplay.products || [];
            const newProducts = this.products || [];
            
            if (JSON.stringify(currentProducts) !== JSON.stringify(newProducts)) {
                console.log('📝 Products changed, updating smoothly...');
            window.productDisplay.loadProducts();
                window.productDisplay.refreshAllDisplays();
                console.log('✅ ProductDisplay updated successfully');
        } else {
                console.log('ℹ️ Products unchanged, skipping disruptive refresh');
            }
        } else {
            console.log('⚠️ ProductDisplay not found, trying to initialize...');
            // Try to initialize ProductDisplay if it doesn't exist
            if (typeof ProductDisplay !== 'undefined') {
                window.productDisplay = new ProductDisplay();
                console.log('✅ ProductDisplay initialized');
            }
        }
        
        // Also update website content manager
        if (window.websiteContentManager) {
            console.log('✅ Updating website content manager...');
            window.websiteContentManager.loadAdminData();
            window.websiteContentManager.updateWebsiteContent();
            console.log('✅ Website content manager updated');
        } else {
            console.log('⚠️ Website content manager not found');
        }
        
        // Force sync with localStorage for cross-tab communication
        console.log('🔄 Forcing localStorage sync...');
        const syncData = {
            products: this.products,
            appointments: this.appointments,
            analytics: this.analytics,
            settings: this.settings
        };
        
        try {
            localStorage.setItem('adminPanelData', JSON.stringify(syncData));
            console.log('✅ localStorage sync completed');
        } catch (error) {
            console.error('❌ localStorage sync failed:', error);
        }
        
        console.log('🎉 Main website update completed');
    }

    // Appointments
    getInitialAppointments() {
        return [
            {
                id: '1',
                type: 'appointment',
                name: 'Priya Sharma',
                email: 'priya.sharma@email.com',
                phone: '+91-9876543210',
                service: 'Eye Exam & Consultation',
                preferredDate: '2024-01-15',
                preferredTime: '10:00 AM',
                message: 'I need a comprehensive eye exam and would like to explore prescription glasses options.',
                status: 'pending',
                createdAt: new Date().toISOString(),
                source: 'Website Booking Form'
            },
            {
                id: '2',
                type: 'contact',
                name: 'Rajesh Kumar',
                email: 'rajesh.kumar@email.com',
                phone: '+91-8765432109',
                service: 'Product Inquiry',
                preferredDate: null,
                preferredTime: null,
                message: 'I am interested in the Gucci sunglasses collection. Can you provide more information about pricing and availability?',
                status: 'pending',
                createdAt: new Date().toISOString(),
                source: 'Contact Form'
            },
            {
                id: '3',
                type: 'appointment',
                name: 'Anita Mehta',
                email: 'anita.mehta@email.com',
                phone: '+91-7654321098',
                service: 'Contact Lens Fitting',
                preferredDate: '2024-01-18',
                preferredTime: '2:00 PM',
                message: 'I want to switch from glasses to contact lenses. Need professional fitting and consultation.',
                status: 'confirmed',
                createdAt: new Date().toISOString(),
                source: 'Website Booking Form'
            },
            {
                id: '4',
                type: 'contact',
                name: 'Vikram Singh',
                email: 'vikram.singh@email.com',
                phone: '+91-6543210987',
                service: 'General Inquiry',
                preferredDate: null,
                preferredTime: null,
                message: 'Do you offer home delivery for contact lenses? What are your delivery charges?',
                status: 'completed',
                createdAt: new Date().toISOString(),
                source: 'WhatsApp'
            },
            {
                id: '5',
                type: 'appointment',
                name: 'Sneha Patel',
                email: 'sneha.patel@email.com',
                phone: '+91-5432109876',
                service: 'Style Consultation',
                preferredDate: '2024-01-20',
                preferredTime: '11:00 AM',
                message: 'Looking for luxury eyewear for a special occasion. Need style consultation and recommendations.',
                status: 'pending',
                createdAt: new Date().toISOString(),
                source: 'Website Booking Form'
            }
        ];
    }

    updateAppointmentsList() {
        const appointmentsList = document.getElementById('appointmentsList');
        const filteredAppointments = this.getFilteredAppointments();

        // Update appointment stats
        this.updateAppointmentStats();

        if (filteredAppointments.length === 0) {
            appointmentsList.innerHTML = '<div class="no-data">No appointments found matching your criteria.</div>';
            return;
        }

        appointmentsList.innerHTML = filteredAppointments.map(appointment => `
            <div class="appointment-row">
                <div class="table-cell appointment-date">${this.formatDate(appointment.createdAt)}</div>
                <div class="table-cell">
                    <p class="appointment-name">${appointment.name}</p>
                </div>
                <div class="table-cell appointment-contact">
                    <div>${appointment.email}</div>
                    <div>${appointment.phone}</div>
                </div>
                <div class="table-cell appointment-type">${appointment.type}</div>
                <div class="table-cell appointment-service">${appointment.service}</div>
                <div class="table-cell">
                    <span class="status-badge status-${appointment.status}">${appointment.status}</span>
                </div>
                <div class="table-cell appointment-actions">
                    <button class="btn btn--small" onclick="adminPanel.viewAppointment('${appointment.id}')">View</button>
                    <button class="btn btn--small btn--ghost" onclick="adminPanel.updateAppointmentStatus('${appointment.id}')">Update</button>
                </div>
            </div>
        `).join('');
    }

    getFilteredAppointments() {
        const searchTerm = document.getElementById('searchAppointments').value.toLowerCase();
        const statusFilter = document.getElementById('appointmentStatus').value;
        const typeFilter = document.getElementById('appointmentType').value;

        return this.appointments.filter(appointment => {
            const matchesSearch = appointment.name.toLowerCase().includes(searchTerm) ||
                                appointment.email.toLowerCase().includes(searchTerm) ||
                                appointment.phone.includes(searchTerm) ||
                                appointment.message.toLowerCase().includes(searchTerm);
            const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
            const matchesType = typeFilter === 'all' || appointment.type === typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }

    filterAppointments() {
        this.updateAppointmentsList();
    }

    updateAppointmentStats() {
        const totalAppointments = this.appointments.filter(a => a.type === 'appointment').length;
        const pendingAppointments = this.appointments.filter(a => a.status === 'pending').length;
        const confirmedAppointments = this.appointments.filter(a => a.status === 'confirmed').length;
        const totalContacts = this.appointments.filter(a => a.type === 'contact').length;

        document.getElementById('totalAppointments').textContent = totalAppointments;
        document.getElementById('pendingAppointments').textContent = pendingAppointments;
        document.getElementById('confirmedAppointments').textContent = confirmedAppointments;
        document.getElementById('totalContacts').textContent = totalContacts;
    }

    viewAppointment(appointmentId) {
        const appointment = this.appointments.find(a => a.id === appointmentId);
        if (!appointment) return;

        const modal = document.getElementById('appointmentModal');
        const modalTitle = document.getElementById('modalTitle');
        const appointmentDetails = document.getElementById('appointmentDetails');

        modalTitle.textContent = `${appointment.type === 'appointment' ? 'Appointment' : 'Contact'} Details`;

        appointmentDetails.innerHTML = `
            <div class="appointment-details">
                <div class="detail-group">
                    <div class="detail-label">Name</div>
                    <div class="detail-value important">${appointment.name}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${appointment.email}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${appointment.phone}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Service Type</div>
                    <div class="detail-value important">${appointment.service}</div>
                </div>
                ${appointment.preferredDate ? `
                <div class="detail-group">
                    <div class="detail-label">Preferred Date</div>
                    <div class="detail-value">${this.formatDate(appointment.preferredDate)}</div>
                </div>
                ` : ''}
                ${appointment.preferredTime ? `
                <div class="detail-group">
                    <div class="detail-label">Preferred Time</div>
                    <div class="detail-value">${appointment.preferredTime}</div>
                </div>
                ` : ''}
                <div class="detail-group">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">
                        <span class="status-badge status-${appointment.status}">${appointment.status}</span>
                    </div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Source</div>
                    <div class="detail-value">${appointment.source}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Message</div>
                    <div class="detail-value">${appointment.message}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Submitted</div>
                    <div class="detail-value">${this.formatDateTime(appointment.createdAt)}</div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        modal.dataset.appointmentId = appointmentId;
    }

    closeAppointmentModal() {
        document.getElementById('appointmentModal').style.display = 'none';
    }

    updateAppointmentStatus(appointmentId) {
        const appointment = this.appointments.find(a => a.id === appointmentId);
        if (!appointment) return;

        const currentStatus = appointment.status;
        const statusOptions = ['pending', 'confirmed', 'completed', 'cancelled'];
        const currentIndex = statusOptions.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % statusOptions.length;
        const newStatus = statusOptions[nextIndex];

        appointment.status = newStatus;
        appointment.updatedAt = new Date().toISOString();

        this.saveData();
        this.updateAppointmentsList();
        this.showMessage(`Appointment status updated to ${newStatus}`, 'success');
    }

    exportAppointments() {
        const appointmentsData = this.appointments.map(appointment => ({
            ...appointment,
            formattedDate: this.formatDateTime(appointment.createdAt)
        }));

        const data = {
            appointments: appointmentsData,
            exportDate: new Date().toISOString(),
            totalCount: appointmentsData.length
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `appointments-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showMessage('Appointments exported successfully!', 'success');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Analytics
    trackVisitor() {
        const visitor = {
            id: this.generateVisitorId(),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            location: this.getVisitorLocation(),
            referrer: document.referrer,
            page: window.location.pathname
        };

        this.analytics.visitors.push(visitor);
        this.analytics.pageViews.push({
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            visitorId: visitor.id
        });

        this.saveData();
    }

    generateVisitorId() {
        return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getVisitorLocation() {
        // In a real application, you would use a geolocation service
        return 'Unknown';
    }

    updateAnalytics() {
        const period = parseInt(document.getElementById('analyticsPeriod').value);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - period);

        const recentVisitors = this.analytics.visitors.filter(v => new Date(v.timestamp) >= cutoffDate);
        const recentPageViews = this.analytics.pageViews.filter(p => new Date(p.timestamp) >= cutoffDate);

        // Update stats
        document.getElementById('analyticsTotalVisitors').textContent = recentVisitors.length;
        document.getElementById('analyticsUniqueVisitors').textContent = new Set(recentVisitors.map(v => v.id)).size;
        document.getElementById('analyticsPageViews').textContent = recentPageViews.length;
        document.getElementById('analyticsAvgSession').textContent = this.calculateAvgSession(recentVisitors);

        // Update popular pages
        this.updatePopularPages(recentPageViews);

        // Update visitor timeline
        this.updateVisitorTimeline(recentVisitors);

        // Update device stats
        this.updateDeviceStats(recentVisitors);
    }

    calculateAvgSession(visitors) {
        if (visitors.length === 0) return '0m';
        
        // Simple calculation - in reality you'd track actual session durations
        const avgMinutes = Math.round(visitors.length * 2.5); // Assume 2.5 minutes average
        return `${avgMinutes}m`;
    }

    updatePopularPages(pageViews) {
        const pageCounts = {};
        pageViews.forEach(pageView => {
            pageCounts[pageView.page] = (pageCounts[pageView.page] || 0) + 1;
        });

        const popularPages = Object.entries(pageCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        const container = document.getElementById('popularPages');
        if (popularPages.length === 0) {
            container.innerHTML = '<div class="no-data">No data available</div>';
            return;
        }

        container.innerHTML = popularPages.map(([page, views]) => `
            <div class="page-item">
                <span class="page-name">${page || '/'}</span>
                <span class="page-views">${views} views</span>
            </div>
        `).join('');
    }

    updateVisitorTimeline(visitors) {
        const timeline = {};
        visitors.forEach(visitor => {
            const date = new Date(visitor.timestamp).toDateString();
            timeline[date] = (timeline[date] || 0) + 1;
        });

        const timelineData = Object.entries(timeline)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .slice(-7); // Last 7 days

        const container = document.getElementById('visitorTimeline');
        if (timelineData.length === 0) {
            container.innerHTML = '<div class="no-data">No data available</div>';
            return;
        }

        container.innerHTML = timelineData.map(([date, count]) => `
            <div class="timeline-item">
                <span class="timeline-date">${new Date(date).toLocaleDateString()}</span>
                <span class="timeline-count">${count} visitors</span>
            </div>
        `).join('');
    }

    updateDeviceStats(visitors) {
        const devices = { mobile: 0, desktop: 0, tablet: 0 };
        
        visitors.forEach(visitor => {
            const userAgent = visitor.userAgent.toLowerCase();
            if (/mobile|android|iphone/.test(userAgent)) {
                devices.mobile++;
            } else if (/tablet|ipad/.test(userAgent)) {
                devices.tablet++;
            } else {
                devices.desktop++;
            }
        });

        const total = devices.mobile + devices.desktop + devices.tablet;
        const container = document.getElementById('deviceStats');
        
        if (total === 0) {
            container.innerHTML = '<div class="no-data">No data available</div>';
            return;
        }

        container.innerHTML = Object.entries(devices).map(([device, count]) => `
            <div class="device-item">
                <span class="device-name">${device.charAt(0).toUpperCase() + device.slice(1)}</span>
                <span class="device-percentage">${Math.round((count / total) * 100)}%</span>
            </div>
        `).join('');
    }

    getTodayVisitors() {
        const today = new Date().toDateString();
        return this.analytics.visitors.filter(v => new Date(v.timestamp).toDateString() === today).length;
    }

    // Display hero images in the container
    displayHeroImages() {
        console.log('displayHeroImages called');
        
        const container = document.getElementById('heroImagesContainer');
        if (!container) {
            console.error('Hero images container not found');
            return;
        }

        if (!this.settings.content.hero.images || this.settings.content.hero.images.length === 0) {
            container.innerHTML = '<p class="no-images">No images uploaded yet</p>';
            return;
        }

        console.log('Displaying', this.settings.content.hero.images.length, 'hero images');

        container.innerHTML = this.settings.content.hero.images.map((image, index) => `
            <div class="hero-image-item" data-image-id="${image.id}">
                <div class="image-preview">
                    <img src="${image.url}" alt="${image.alt}" loading="lazy">
                </div>
                <div class="image-info">
                    <p class="image-name">${image.filename}</p>
                    <p class="image-alt">${image.alt}</p>
                    <div class="image-actions">
                        <button class="btn btn--small btn--danger" onclick="adminPanel.removeHeroImage('${image.id}')">
                            Remove
                        </button>
                        <button class="btn btn--small btn--secondary" onclick="adminPanel.moveHeroImage('${image.id}', 'up')" ${index === 0 ? 'disabled' : ''}>
                            ↑
                        </button>
                        <button class="btn btn--small btn--secondary" onclick="adminPanel.moveHeroImage('${image.id}', 'down')" ${index === this.settings.content.hero.images.length - 1 ? 'disabled' : ''}>
                            ↓
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Show message to user
    showMessage(message, type = 'info') {
        console.log(`Message (${type}):`, message);
        
        try {
            // Create message element if it doesn't exist
            let messageElement = document.getElementById('adminMessage');
            if (!messageElement) {
                messageElement = document.createElement('div');
                messageElement.id = 'adminMessage';
                messageElement.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: 6px;
                    color: white;
                    font-weight: 500;
                    z-index: 10000;
                    max-width: 400px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transition: all 0.3s ease;
                `;
                
                // Safely append to body
                if (document.body) {
                    document.body.appendChild(messageElement);
                } else {
                    // Fallback: append to document element
                    document.documentElement.appendChild(messageElement);
                }
            }

            // Set message content and style based on type
            messageElement.textContent = message;
            
            switch(type) {
                case 'success':
                    messageElement.style.backgroundColor = '#10b981';
                    break;
                case 'error':
                    messageElement.style.backgroundColor = '#ef4444';
                    break;
                case 'warning':
                    messageElement.style.backgroundColor = '#f59e0b';
                    break;
                default:
                    messageElement.style.backgroundColor = '#3b82f6';
            }

            // Show message
            messageElement.style.display = 'block';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';

            // Auto-hide after 4 seconds
            setTimeout(() => {
                if (messageElement && messageElement.parentNode) {
                    messageElement.style.opacity = '0';
                    messageElement.style.transform = 'translateY(-20px)';
                    setTimeout(() => {
                        if (messageElement && messageElement.parentNode) {
                            messageElement.style.display = 'none';
                        }
                    }, 300);
                }
            }, 4000);
        } catch (error) {
            console.error('Error showing message:', error);
            // Fallback: just log to console
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Remove hero image
    removeHeroImage(imageId) {
        console.log('removeHeroImage called for ID:', imageId);
        
        if (!this.settings.content.hero.images) {
            console.error('Hero images array not found');
            return;
        }

        const initialLength = this.settings.content.hero.images.length;
        this.settings.content.hero.images = this.settings.content.hero.images.filter(img => img.id !== imageId);
        
        if (this.settings.content.hero.images.length < initialLength) {
            console.log('Image removed successfully');
            
            // Update display
            this.displayHeroImages();
            
            // Save to localStorage
            this.saveData();
            
            // Notify website update
            this.notifyWebsiteUpdate();
            
            this.showMessage('Image removed successfully!', 'success');
        } else {
            console.warn('Image not found for removal');
            this.showMessage('Image not found', 'error');
        }
    }

    // Move hero image up or down
    moveHeroImage(imageId, direction) {
        console.log('moveHeroImage called for ID:', imageId, 'direction:', direction);
        
        if (!this.settings.content.hero.images) {
            console.error('Hero images array not found');
            return;
        }

        const images = this.settings.content.hero.images;
        const currentIndex = images.findIndex(img => img.id === imageId);
        
        if (currentIndex === -1) {
            console.warn('Image not found for moving');
            this.showMessage('Image not found', 'error');
            return;
        }

        let newIndex;
        if (direction === 'up' && currentIndex > 0) {
            newIndex = currentIndex - 1;
        } else if (direction === 'down' && currentIndex < images.length - 1) {
            newIndex = currentIndex + 1;
        } else {
            console.log('Cannot move image in that direction');
            return;
        }

        // Swap images
        [images[currentIndex], images[newIndex]] = [images[newIndex], images[currentIndex]];
        
        console.log('Image moved successfully');
        
        // Update display
        this.displayHeroImages();
        
        // Save to localStorage
        this.saveData();
        
        // Notify website update
        this.notifyWebsiteUpdate();
        
        this.showMessage('Image order updated!', 'success');
    }

    // Content Management
    updateContentManagement() {
        console.log('updateContentManagement called');
        console.log('Current settings before update:', this.settings);
        console.log('Hero content before update:', this.settings.content?.hero);
        
        // Ensure settings structure exists
        if (!this.settings.content) {
            console.log('Creating content structure');
            this.settings.content = {};
        }
        if (!this.settings.content.hero) {
            console.log('Creating hero structure with empty images');
            this.settings.content.hero = {
                eyebrow: 'Now Trending',
                title: 'David Walker<br>EyeWear',
                description: 'Immersive, iconic, and innovative. Book your pair today.',
                images: []
            };
        } else {
            console.log('Hero structure exists, preserving images:', this.settings.content.hero.images?.length || 0);
            // Preserve existing images but ensure structure exists
            if (!this.settings.content.hero.images) {
                console.log('Images array missing, creating empty array');
                this.settings.content.hero.images = [];
            }
            // Only set defaults if fields are truly empty (not just whitespace)
            if (!this.settings.content.hero.eyebrow || this.settings.content.hero.eyebrow.trim() === '') {
                this.settings.content.hero.eyebrow = 'Now Trending';
            }
            if (!this.settings.content.hero.title || this.settings.content.hero.title.trim() === '') {
                this.settings.content.hero.title = 'David Walker<br>EyeWear';
            }
            if (!this.settings.content.hero.description || this.settings.content.hero.description.trim() === '') {
                this.settings.content.hero.description = 'Immersive, iconic, and innovative. Book your pair today.';
            }
        }
        
        console.log('Settings after updateContentManagement:', this.settings);
        console.log('Hero content after update:', this.settings.content?.hero);
        if (!this.settings.content.social) {
            this.settings.content.social = {
                whatsapp: '917000532010',
                instagram: '@monicaoptohub',
                facebook: ''
            };
        }
        if (!this.settings.content.brands) {
            this.settings.content.brands = ['Ray-Ban', 'Gucci', 'Tom Ford', 'Prada', 'Cartier', 'Johnson & Johnson'];
        }

        // Populate form fields when DOM is ready
        setTimeout(() => {
            this.populateContentForms();
        }, 100);
        
        // Display hero images when DOM is ready
        setTimeout(() => {
            this.displayHeroImages();
        }, 150);
    }

    populateContentForms() {
        console.log('Populating content forms...');
        const contentSection = document.getElementById('content');
        console.log('Content section visible:', contentSection ? contentSection.style.display !== 'none' : 'content section not found');
        
        // Ensure content structure exists
        if (!this.settings.content) {
            console.log('Content structure missing, initializing...');
            this.settings.content = {};
        }
        if (!this.settings.content.hero) {
            console.log('Hero structure missing, initializing...');
            this.settings.content.hero = {
                eyebrow: 'Now Trending',
                title: 'David Walker<br>EyeWear',
                description: 'Immersive, iconic, and innovative. Book your pair today.',
                images: []
            };
        } else {
            console.log('Hero structure exists, preserving content:', {
                eyebrow: this.settings.content.hero.eyebrow,
                title: this.settings.content.hero.title,
                description: this.settings.content.hero.description,
                images: this.settings.content.hero.images?.length || 0
            });
        }
        // Announcement section removed as requested
        if (!this.settings.content.social) {
            console.log('Social structure missing, initializing...');
            this.settings.content.social = {
                whatsapp: '917000532010',
                instagram: '@monica_opto_hub',
                facebook: 'monicaoptohub'
            };
        }
        if (!this.settings.content.brands) {
            console.log('Brands structure missing, initializing...');
            this.settings.content.brands = ['Ray-Ban', 'Gucci', 'Tom Ford', 'Prada', 'Cartier', 'Johnson & Johnson'];
        }
        
        // Populate hero content with error handling
        try {
        const heroEyebrow = document.getElementById('heroEyebrow');
        const heroTitle = document.getElementById('heroTitle');
        const heroDescription = document.getElementById('heroDescription');
        
        if (heroEyebrow) {
            heroEyebrow.value = this.settings.content.hero.eyebrow;
                console.log('✅ Populated heroEyebrow with:', this.settings.content.hero.eyebrow);
            } else {
                console.warn('⚠️ heroEyebrow element not found');
        }
        if (heroTitle) {
            heroTitle.value = this.settings.content.hero.title;
                console.log('✅ Populated heroTitle with:', this.settings.content.hero.title);
            } else {
                console.warn('⚠️ heroTitle element not found');
        }
        if (heroDescription) {
            heroDescription.value = this.settings.content.hero.description;
                console.log('✅ Populated heroDescription with:', this.settings.content.hero.description);
            } else {
                console.warn('⚠️ heroDescription element not found');
            }
        } catch (error) {
            console.error('❌ Error populating hero content:', error);
        }

        // Announcement form population removed as requested

        // Populate brands
        try {
        this.updateBrandList();
            console.log('✅ Brand list updated');
        } catch (error) {
            console.error('❌ Error updating brand list:', error);
        }

        // Populate social media with error handling
        try {
        const whatsappNumber = document.getElementById('whatsappNumber');
        const instagramHandle = document.getElementById('instagramHandle');
        const facebookPage = document.getElementById('facebookPage');
        
            if (whatsappNumber) {
                whatsappNumber.value = this.settings.content.social.whatsapp;
                console.log('✅ Populated WhatsApp number');
            } else {
                console.warn('⚠️ whatsappNumber element not found');
            }
            if (instagramHandle) {
                instagramHandle.value = this.settings.content.social.instagram;
                console.log('✅ Populated Instagram handle');
            } else {
                console.warn('⚠️ instagramHandle element not found');
            }
            if (facebookPage) {
                facebookPage.value = this.settings.content.social.facebook;
                console.log('✅ Populated Facebook page');
            } else {
                console.warn('⚠️ facebookPage element not found');
            }
        } catch (error) {
            console.error('❌ Error populating social media:', error);
        }

        // Setup form listeners when content section is accessed
        setTimeout(() => {
            this.setupContentFormListeners();
        }, 50);
        
        // Always setup hero image management when content section is accessed
        setTimeout(() => {
            this.setupHeroImageManagement();
        }, 100);
        
        // Always load hero images to refresh display
        this.loadHeroImages();
        
        console.log('Content forms populated successfully');
    }

    updateBrandList() {
        const brandList = document.getElementById('brandList');
        if (!brandList) return;

        brandList.innerHTML = this.settings.content.brands.map(brand => `
            <div class="brand-item">
                <span class="brand-name">${brand}</span>
                <button class="btn btn--small btn--danger" onclick="adminPanel.removeBrand('${brand}')">Remove</button>
            </div>
        `).join('');
    }

    setupHeroImageManagement() {
        console.log('setupHeroImageManagement called');
        
        // Prevent multiple initializations
        if (this.heroImageManagementSetup) {
            console.log('Hero image management already set up, skipping initialization');
            return;
        }
        // Check if elements exist before setting up event listeners
        const uploadBtn = document.getElementById('uploadHeroImagesBtn');
        const fileInput = document.getElementById('heroImageUpload');
        const addUrlBtn = document.getElementById('addImageUrlBtn');
        const cancelUrlBtn = document.getElementById('cancelUrlBtn');
        const addUrlSubmitBtn = document.getElementById('addUrlBtn');

        console.log('Elements found:', {
            uploadBtn: !!uploadBtn,
            fileInput: !!fileInput,
            addUrlBtn: !!addUrlBtn,
            cancelUrlBtn: !!cancelUrlBtn,
            addUrlSubmitBtn: !!addUrlSubmitBtn
        });

        // Test if button is clickable
        if (uploadBtn) {
            console.log('Upload button properties:', {
                disabled: uploadBtn.disabled,
                style: uploadBtn.style.cssText,
                display: window.getComputedStyle(uploadBtn).display,
                visibility: window.getComputedStyle(uploadBtn).visibility,
                pointerEvents: window.getComputedStyle(uploadBtn).pointerEvents
            });
        }

        if (!uploadBtn || !fileInput || !addUrlBtn || !cancelUrlBtn || !addUrlSubmitBtn) {
            console.log('Hero image management elements not found, retrying...');
            // Retry after a short delay
            setTimeout(() => this.setupHeroImageManagement(), 100);
            return;
        }

        // Ensure content structure exists
        if (!this.settings.content) {
            console.log('Content structure missing in setupHeroImageManagement, initializing...');
            this.settings.content = {};
        }
        if (!this.settings.content.hero) {
            console.log('Hero structure missing in setupHeroImageManagement, initializing...');
            this.settings.content.hero = {
                eyebrow: 'Now Trending',
                title: 'David Walker<br>EyeWear',
                description: 'Immersive, iconic, and innovative. Book your pair today.',
                images: []
            };
        }

        // Ensure hero images array exists and preserve existing images
        console.log('setupHeroImageManagement - Current images:', this.settings.content.hero.images);
        if (!this.settings.content.hero.images) {
            console.log('Images array missing, initializing empty array');
            this.settings.content.hero.images = [];
        }
        
        console.log('Final images count:', this.settings.content.hero.images.length, 'images');
        if (this.settings.content.hero.images.length > 0) {
            console.log('Preserving existing images:', this.settings.content.hero.images);
        } else {
            console.log('No images to preserve, array is empty');
        }

        // Setup event listeners
        uploadBtn.addEventListener('click', () => {
            console.log('Upload button clicked');
            fileInput.click();
        });

        // Also add a direct click handler for debugging
        uploadBtn.onclick = function() {
            console.log('Direct onclick handler triggered');
        };

        fileInput.addEventListener('change', (e) => {
            console.log('File input changed, files:', e.target.files.length);
            this.handleImageUpload(e.target.files);
        });

        addUrlBtn.addEventListener('click', () => {
            document.getElementById('imageUrlForm').style.display = 'block';
        });

        cancelUrlBtn.addEventListener('click', () => {
            document.getElementById('imageUrlForm').style.display = 'none';
            document.getElementById('newImageUrl').value = '';
            document.getElementById('newImageAlt').value = '';
        });

        addUrlSubmitBtn.addEventListener('click', () => {
            this.addImageFromUrl();
        });
        
        console.log('Hero image management setup completed');
        this.heroImageManagementSetup = true;
    }

    // Force load products on initialization
    async forceLoadProductsOnInit() {
        try {
            console.log('🔄 Force loading products on initialization...');
            
            // Use relative path
            const apiUrl = (window.apiClient?.baseURL + '/products') || '/api/products';
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.success && data.products && data.products.length > 0) {
                console.log('✅ Products loaded on initialization:', data.products.length);
                this.products = data.products;
                this.saveData();
                
                // Update UI immediately
                setTimeout(() => {
                    this.updateProductsList();
                    this.forceSyncWithFrontend();
                }, 100);
                
                console.log('🎉 Products initialization completed successfully!');
            } else {
                console.log('⚠️ No products loaded on initialization, using localStorage/default');
            }
        } catch (error) {
            console.error('❌ Error loading products on initialization:', error);
        }
    }

    setupContentFormListeners() {
        console.log('Setting up content form listeners...');
        
        try {
        // Hero content form
        const heroForm = document.getElementById('heroContentForm');
        console.log('Hero form element:', heroForm);
        if (heroForm) {
            // Remove existing listeners to avoid duplicates
            heroForm.removeEventListener('submit', this.handleHeroContentUpdate);
            heroForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Hero content form submitted');
                console.log('Form element:', e.target);
                console.log('Form data:', new FormData(e.target));
                this.handleHeroContentUpdate();
            });
                console.log('✅ Hero content form listener attached');
        } else {
                console.warn('⚠️ Hero content form not found');
        }

        // Add brand form
        const addBrandForm = document.getElementById('addBrandForm');
        if (addBrandForm) {
            addBrandForm.removeEventListener('submit', this.handleAddBrand);
            addBrandForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Add brand form submitted');
                this.handleAddBrand();
            });
                console.log('✅ Add brand form listener attached');
            } else {
                console.warn('⚠️ Add brand form not found');
        }

        // Social media form
        const socialForm = document.getElementById('socialMediaForm');
        if (socialForm) {
            socialForm.removeEventListener('submit', this.handleSocialMediaUpdate);
            socialForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Social media form submitted');
                this.handleSocialMediaUpdate();
            });
                console.log('✅ Social media form listener attached');
            } else {
                console.warn('⚠️ Social media form not found');
            }

        // Announcement form
        const announcementForm = document.getElementById('announcementForm');
        if (announcementForm) {
            announcementForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Announcement form submitted');
                this.updateAnnouncement();
            });
            console.log('✅ Announcement form listener attached');
        } else {
            console.warn('⚠️ Announcement form not found');
        }

            // Hero image upload button
            const uploadBtn = document.getElementById('uploadHeroImagesBtn');
            if (uploadBtn) {
                uploadBtn.addEventListener('click', () => {
                    document.getElementById('heroImageUpload').click();
                });
                console.log('✅ Hero image upload button listener attached');
            }

            // Add image URL button
            const addUrlBtn = document.getElementById('addImageUrlBtn');
            if (addUrlBtn) {
                addUrlBtn.addEventListener('click', () => {
                    const urlForm = document.getElementById('imageUrlForm');
                    if (urlForm) {
                        urlForm.style.display = urlForm.style.display === 'none' ? 'block' : 'none';
                    }
                });
                console.log('✅ Add image URL button listener attached');
            }

            // Add URL button
            const addUrlSubmitBtn = document.getElementById('addUrlBtn');
            if (addUrlSubmitBtn) {
                addUrlSubmitBtn.addEventListener('click', () => {
                    this.addImageFromUrl();
                });
                console.log('✅ Add URL submit button listener attached');
            }

            // Cancel URL button
            const cancelUrlBtn = document.getElementById('cancelUrlBtn');
            if (cancelUrlBtn) {
                cancelUrlBtn.addEventListener('click', () => {
                    const urlForm = document.getElementById('imageUrlForm');
                    if (urlForm) {
                        urlForm.style.display = 'none';
                    }
                });
                console.log('✅ Cancel URL button listener attached');
            }

            console.log('✅ Content form listeners setup completed successfully');
        } catch (error) {
            console.error('❌ Error setting up content form listeners:', error);
        }
    }

    // Comprehensive content management initialization
    initializeContentManagement() {
        console.log('🔄 Initializing content management section...');
        
        try {
            // Step 1: Ensure content structure exists
            if (!this.settings.content) {
                console.log('📝 Creating content structure...');
                this.settings.content = {
                    hero: {
                        eyebrow: 'Now Trending',
                        title: 'David Walker<br>EyeWear',
                        description: 'Immersive, iconic, and innovative. Book your pair today.',
                        images: []
                    },
                    brands: [],
                    social: {
                        whatsapp: '917000532010',
                        instagram: 'https://instagram.com/davidwalker',
                        facebook: 'https://facebook.com/davidwalker'
                    }
                };
            }

            // Step 2: Ensure hero structure exists
            if (!this.settings.content.hero) {
                console.log('📝 Creating hero structure...');
                this.settings.content.hero = {
                    eyebrow: 'Now Trending',
                    title: 'David Walker<br>EyeWear',
                    description: 'Immersive, iconic, and innovative. Book your pair today.',
                    images: []
                };
            }

            // Step 3: Ensure hero images array exists
            if (!this.settings.content.hero.images) {
                console.log('📝 Creating hero images array...');
                this.settings.content.hero.images = [];
            }

            // Step 4: Ensure brands array exists
            if (!this.settings.content.brands) {
                console.log('📝 Creating brands array...');
                this.settings.content.brands = [];
            }

            // Step 5: Ensure social structure exists
            if (!this.settings.content.social) {
                console.log('📝 Creating social structure...');
                this.settings.content.social = {
                    whatsapp: '917000532010',
                    instagram: 'https://instagram.com/davidwalker',
                    facebook: 'https://facebook.com/davidwalker'
                };
            }

            // Step 6: Populate forms
            console.log('📝 Populating content forms...');
            this.populateContentForms();

            // Step 7: Setup form listeners
            console.log('📝 Setting up form listeners...');
            this.setupContentFormListeners();

            // Step 8: Setup hero image management
            console.log('📝 Setting up hero image management...');
            this.setupHeroImageManagement();

            // Step 9: Update content management UI
            console.log('📝 Updating content management UI...');
            this.updateContentManagement();

            // Step 10: Save data
            console.log('📝 Saving initialized data...');
            this.saveData();

            console.log('✅ Content management initialization completed successfully!');
            console.log('📊 Hero images:', this.settings.content.hero.images.length);
            console.log('📊 Brands:', this.settings.content.brands.length);

        } catch (error) {
            console.error('❌ Error initializing content management:', error);
            this.showMessage('Error initializing content management. Please refresh the page.', 'error');
        }
    }

    loadHeroImages() {
        console.log('loadHeroImages called');
        const container = document.getElementById('heroImagesContainer');
        const images = this.settings.content.hero.images || [];
        
        console.log('Loading images in admin panel:', images.length, 'images');
        console.log('Images data:', images);

        if (!container) {
            return;
        }

        if (images.length === 0) {
            console.log('No images to display');
                container.innerHTML = '<div class="empty-hero-images">No images added yet. Upload or add image URLs to get started.</div>';
            return;
        }

        // Resolve any IDB-backed images to object URLs for preview
        const resolver = (img) => {
            if (!img) return Promise.resolve(null);
            if (img.url) return Promise.resolve({ url: img.url, alt: img.alt || 'Hero Image' });
            if (img.id && window.idbStore) {
                return window.idbStore.getObjectURL(img.id).then((url) => ({ url, alt: img.alt || 'Hero Image' }));
            }
            return Promise.resolve({ url: '', alt: img.alt || 'Hero Image' });
        };

        Promise.all(images.map(resolver)).then((resolved) => {
            container.innerHTML = resolved.map((resolvedImg, index) => {
                const displayUrl = (resolvedImg && resolvedImg.url) ? resolvedImg.url : 'assets/Logo monica.png';
                // Build a readable identifier
                let imageIdentifier = `Image ${index + 1}`;
                if (resolvedImg && resolvedImg.url) {
                    if (resolvedImg.url.startsWith('data:')) {
                        imageIdentifier = `Image ${index + 1} (Uploaded)`;
                    } else {
                        const last = resolvedImg.url.split('/').pop();
                        imageIdentifier = last || imageIdentifier;
                    }
                }
                const altText = resolvedImg ? resolvedImg.alt : 'Hero Image';
            return `
            <div class="hero-image-item" data-index="${index}">
                    <img src="${displayUrl}" alt="${altText}" class="hero-image-preview" onerror="this.src='assets/Logo monica.png'">
                <div class="hero-image-info">
                    <div class="hero-image-name">${imageIdentifier}</div>
                        <div class="hero-image-alt">${altText}</div>
                    <div class="hero-image-actions">
                        <button class="btn-move-up" onclick="adminPanel.moveImageUp(${index})" ${index === 0 ? 'disabled' : ''}>↑</button>
                        <button class="btn-move-down" onclick="adminPanel.moveImageDown(${index})" ${index === images.length - 1 ? 'disabled' : ''}>↓</button>
                        <button class="btn-remove-image" onclick="adminPanel.removeHeroImage(${index})">Remove</button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
        }).catch(() => {
            // Fallback: render with whatever is present
            container.innerHTML = images.map((image, index) => {
                const safeUrl = (image && image.url) ? image.url : 'assets/Logo monica.png';
                const altText = (image && image.alt) ? image.alt : 'Hero Image';
                return `
                <div class="hero-image-item" data-index="${index}">
                    <img src="${safeUrl}" alt="${altText}" class="hero-image-preview" onerror="this.src='assets/Logo monica.png'">
                    <div class="hero-image-info">
                        <div class="hero-image-name">Image ${index + 1}</div>
                        <div class="hero-image-alt">${altText}</div>
                        <div class="hero-image-actions">
                            <button class="btn-move-up" onclick="adminPanel.moveImageUp(${index})" ${index === 0 ? 'disabled' : ''}>↑</button>
                            <button class="btn-move-down" onclick="adminPanel.moveImageDown(${index})" ${index === images.length - 1 ? 'disabled' : ''}>↓</button>
                            <button class="btn-remove-image" onclick="adminPanel.removeHeroImage(${index})">Remove</button>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        });
    }

    handleImageUpload(files) {
        console.log('handleImageUpload called with', files.length, 'files');
        
        if (!files || files.length === 0) {
            console.log('No files selected');
            return;
        }

        Array.from(files).forEach((file, index) => {
            console.log(`Processing file ${index + 1}:`, file.name, file.type, file.size);
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    console.log('File read successfully:', file.name);
                    const dataUrl = e.target.result;
                    const altText = file.name.replace(/\.[^/.]+$/, '');
                    // If IndexedDB helper is available, store blob and keep reference
                    if (window.idbStore) {
                        fetch(dataUrl)
                            .then(res => res.blob())
                            .then(async (blob) => {
                                const id = await window.idbStore.putBlob(blob);
                                const imageData = { id, url: dataUrl, alt: altText };
                    this.settings.content.hero.images.push(imageData);
                                console.log('Stored image in IDB with id:', id);
                                this.displayHeroImages();
                    this.saveData();
                    console.log('Data saved after image upload');
                    this.showMessage(`Image "${file.name}" uploaded successfully!`, 'success');
                    this.notifyWebsiteUpdate();
                            })
                            .catch((err) => {
                                console.error('IDB store failed, falling back to data URL:', err);
                                const fallback = { url: dataUrl, alt: altText };
                                this.settings.content.hero.images.push(fallback);
                                this.displayHeroImages();
                                this.saveData();
                                this.showMessage(`Image "${file.name}" uploaded (fallback)`, 'success');
                                this.notifyWebsiteUpdate();
                            });
                    } else {
                        const imageData = { url: dataUrl, alt: altText };
                        this.settings.content.hero.images.push(imageData);
                        this.displayHeroImages();
                        this.saveData();
                        console.log('Data saved after image upload');
                        this.showMessage(`Image "${file.name}" uploaded successfully!`, 'success');
                        this.notifyWebsiteUpdate();
                    }
                };
                reader.onerror = (error) => {
                    console.error('Error reading file:', error);
                    this.showMessage(`Error reading file "${file.name}"`, 'error');
                };
                reader.readAsDataURL(file);
            } else {
                console.log('Skipping non-image file:', file.name);
                this.showMessage(`Skipped "${file.name}" - only image files are supported`, 'warning');
            }
        });
    }

    addImageFromUrl() {
        const url = document.getElementById('newImageUrl').value.trim();
        const alt = document.getElementById('newImageAlt').value.trim();

        if (!url) {
            this.showMessage('Please enter an image URL', 'warning');
            return;
        }

        // For external URLs keep url; for data URLs try to store in IDB
        const isDataUrl = url.startsWith('data:');
        if (isDataUrl && window.idbStore) {
            fetch(url)
                .then(res => res.blob())
                .then(async (blob) => {
                    const id = await window.idbStore.putBlob(blob);
                    this.settings.content.hero.images.push({ id, alt: alt || 'Hero Image' });
                    this.displayHeroImages();
        this.saveData();
        this.showMessage('Image added successfully!', 'success');
        this.notifyWebsiteUpdate();
                })
                .catch(() => {
                    this.settings.content.hero.images.push({ url, alt: alt || 'Hero Image' });
                    this.displayHeroImages();
                    this.saveData();
                    this.showMessage('Image added successfully!', 'success');
                    this.notifyWebsiteUpdate();
                });
        } else {
            this.settings.content.hero.images.push({ url, alt: alt || 'Hero Image' });
            this.displayHeroImages();
            this.saveData();
            this.showMessage('Image added successfully!', 'success');
            this.notifyWebsiteUpdate();
        }

        // Clear form and hide
        document.getElementById('newImageUrl').value = '';
        document.getElementById('newImageAlt').value = '';
        document.getElementById('imageUrlForm').style.display = 'none';
    }

    moveImageUp(index) {
        if (index > 0) {
            const images = this.settings.content.hero.images;
            [images[index], images[index - 1]] = [images[index - 1], images[index]];
            this.loadHeroImages();
            this.saveData();
            this.notifyWebsiteUpdate();
        }
    }

    moveImageDown(index) {
        const images = this.settings.content.hero.images;
        if (index < images.length - 1) {
            [images[index], images[index + 1]] = [images[index + 1], images[index]];
            this.loadHeroImages();
            this.saveData();
            this.notifyWebsiteUpdate();
        }
    }

    removeHeroImage(index) {
        if (confirm('Are you sure you want to remove this image?')) {
            this.settings.content.hero.images.splice(index, 1);
            this.loadHeroImages();
            this.saveData();
            this.notifyWebsiteUpdate();
            this.showMessage('Image removed successfully!', 'success');
        }
    }

    handleHeroContentUpdate() {
        console.log('handleHeroContentUpdate called');
        
        try {
        const eyebrowElement = document.getElementById('heroEyebrow');
        const titleElement = document.getElementById('heroTitle');
        const descriptionElement = document.getElementById('heroDescription');
        
        console.log('Form elements found:', {
            eyebrow: !!eyebrowElement,
            title: !!titleElement,
            description: !!descriptionElement
        });
        
        if (!eyebrowElement || !titleElement || !descriptionElement) {
                console.error('❌ Hero form elements not found');
                this.showMessage('Error: Form elements not found. Please refresh the page.', 'error');
            return;
        }
        
        console.log('Reading form values:');
        console.log('Eyebrow value:', eyebrowElement.value);
        console.log('Title value:', titleElement.value);
        console.log('Description value:', descriptionElement.value);
        
        this.settings.content.hero.eyebrow = eyebrowElement.value;
        this.settings.content.hero.title = titleElement.value;
        this.settings.content.hero.description = descriptionElement.value;
        
        console.log('Updated settings with form values:');
        console.log('Settings eyebrow:', this.settings.content.hero.eyebrow);
        console.log('Settings title:', this.settings.content.hero.title);
        console.log('Settings description:', this.settings.content.hero.description);

        console.log('Hero content updated:', {
            eyebrow: this.settings.content.hero.eyebrow,
            title: this.settings.content.hero.title,
            description: this.settings.content.hero.description
        });

        this.saveData();
        this.showMessage('Hero section updated successfully!', 'success');
        this.notifyWebsiteUpdate();
            console.log('✅ Hero content update completed successfully');
        } catch (error) {
            console.error('❌ Error updating hero content:', error);
            this.showMessage('Error updating hero content. Please try again.', 'error');
        }
    }


    handleAddBrand() {
        try {
            const newBrandElement = document.getElementById('newBrandName');
            if (!newBrandElement) {
                console.error('❌ newBrandName element not found');
                this.showMessage('Error: Brand input field not found.', 'error');
                return;
            }
            
            const newBrand = newBrandElement.value.trim();
            if (!newBrand) {
                this.showMessage('Please enter a brand name.', 'warning');
                return;
            }

        if (this.settings.content.brands.includes(newBrand)) {
            this.showMessage('Brand already exists!', 'error');
            return;
        }

        this.settings.content.brands.push(newBrand);
        this.saveData();
        this.updateBrandList();
            newBrandElement.value = '';
        this.showMessage('Brand added successfully!', 'success');
        this.notifyWebsiteUpdate();
            console.log('✅ Brand added successfully:', newBrand);
        } catch (error) {
            console.error('❌ Error adding brand:', error);
            this.showMessage('Error adding brand. Please try again.', 'error');
        }
    }

    removeBrand(brandName) {
        if (confirm(`Are you sure you want to remove ${brandName}?`)) {
            this.settings.content.brands = this.settings.content.brands.filter(brand => brand !== brandName);
            this.saveData();
            this.updateBrandList();
            this.showMessage('Brand removed successfully!', 'success');
            this.notifyWebsiteUpdate();
        }
    }

    handleSocialMediaUpdate() {
        try {
            const whatsappElement = document.getElementById('whatsappNumber');
            const instagramElement = document.getElementById('instagramHandle');
            const facebookElement = document.getElementById('facebookPage');
            
            if (!whatsappElement || !instagramElement || !facebookElement) {
                console.error('❌ Social media form elements not found');
                this.showMessage('Error: Social media form elements not found. Please refresh the page.', 'error');
                return;
            }
            
            this.settings.content.social.whatsapp = whatsappElement.value;
            this.settings.content.social.instagram = instagramElement.value;
            this.settings.content.social.facebook = facebookElement.value;

            console.log('Social media updated:', {
                whatsapp: this.settings.content.social.whatsapp,
                instagram: this.settings.content.social.instagram,
                facebook: this.settings.content.social.facebook
            });

        this.saveData();
        this.showMessage('Social media settings updated successfully!', 'success');
        this.notifyWebsiteUpdate();
            console.log('✅ Social media update completed successfully');
        } catch (error) {
            console.error('❌ Error updating social media:', error);
            this.showMessage('Error updating social media settings. Please try again.', 'error');
        }
    }

    updateAnnouncement() {
        console.log('updateAnnouncement called');
        
        try {
            const announcementTextElement = document.getElementById('announcementText');
            const announcementVisibleElement = document.getElementById('announcementVisible');
            
            if (!announcementTextElement || !announcementVisibleElement) {
                console.error('❌ Announcement form elements not found');
                this.showMessage('Error: Announcement form elements not found. Please refresh the page.', 'error');
                return;
            }
            
            const announcementText = announcementTextElement.value;
            const announcementVisible = announcementVisibleElement.checked;
            
            if (!this.settings.announcement) {
                this.settings.announcement = {};
            }
            
            // Convert single text to array for multiple announcements
            const announcements = announcementText.split('\n').filter(text => text.trim());
            
            this.settings.announcement = {
                text: announcements,
                visible: announcementVisible
            };
            
            console.log('Announcement updated:', {
                text: this.settings.announcement.text,
                visible: this.settings.announcement.visible
            });
            
            this.saveData();
            this.showMessage('Announcement settings updated successfully!', 'success');
            this.notifyWebsiteUpdate();
            
            // Update announcement on website if it's visible
            if (window.announcementManager) {
                window.announcementManager.updateAnnouncements(announcements);
                if (announcementVisible) {
                    window.announcementManager.showAnnouncement();
                } else {
                    window.announcementManager.hideAnnouncement();
                }
            }
            
            console.log('✅ Announcement update completed successfully');
        } catch (error) {
            console.error('❌ Error updating announcement:', error);
            this.showMessage('Error updating announcement settings. Please try again.', 'error');
        }
    }

    // Settings
    updateSettings() {
        // Populate admin settings
        document.getElementById('adminUsername').value = this.settings.admin.username;

        // Populate website settings
        document.getElementById('siteTitle').value = this.settings.website.title;
        document.getElementById('siteDescription').value = this.settings.website.description;
        document.getElementById('contactPhone').value = this.settings.website.contactPhone;
        document.getElementById('contactEmail').value = this.settings.website.contactEmail;
    }

    handleAdminSettings() {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;

        this.settings.admin.username = username;
        if (password) {
            this.settings.admin.password = password;
        }

        this.saveData();
        this.showMessage('Admin settings updated successfully!', 'success');
    }

    handleWebsiteSettings() {
        this.settings.website.title = document.getElementById('siteTitle').value;
        this.settings.website.description = document.getElementById('siteDescription').value;
        this.settings.website.contactPhone = document.getElementById('contactPhone').value;
        this.settings.website.contactEmail = document.getElementById('contactEmail').value;

        this.saveData();
        this.showMessage('Website settings updated successfully!', 'success');
    }

    // Data Management
    deepMerge(target, source) {
        console.log('deepMerge called with:', { target, source });
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                // Recursively merge nested objects
                console.log(`Deep merging nested object for key: ${key}`);
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                // For arrays and primitives, use source value
                console.log(`Using source value for key: ${key} =`, source[key]);
                result[key] = source[key];
            }
        }
        
        console.log('deepMerge result:', result);
        return result;
    }

    exportData() {
        const data = {
            products: this.products,
            analytics: this.analytics,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monica-opto-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showMessage('Data exported successfully!', 'success');
    }

    importData() {
        document.getElementById('importFile').click();
    }

    handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.products) this.products = data.products;
                if (data.analytics) this.analytics = data.analytics;
                if (data.settings) this.settings = data.settings;

                this.saveData();
                this.updateDashboard();
                this.updateProductsList();
                this.updateAnalytics();
                this.updateSettings();

                this.showMessage('Data imported successfully!', 'success');
            } catch (error) {
                this.showMessage('Error importing data: Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone!')) {
            this.products = [];
            this.analytics = { visitors: [], pageViews: [], sessions: [] };
            this.saveData();
            this.updateDashboard();
            this.updateProductsList();
            this.updateAnalytics();
            this.showMessage('All data cleared successfully!', 'success');
        }
    }

    // Bulk Import Functions
    showBulkImportModal() {
        document.getElementById('bulkImportModal').style.display = 'flex';
        this.setupBulkImportEventListeners();
    }

    hideBulkImportModal() {
        document.getElementById('bulkImportModal').style.display = 'none';
        this.resetBulkImportModal();
    }

    setupBulkImportEventListeners() {
        // Download template button
        document.getElementById('downloadTemplateBtn').onclick = () => this.downloadCSVTemplate();
        
        // Select CSV button
        document.getElementById('selectCSVBtn').onclick = () => {
            document.getElementById('csvFileInput').click();
        };
        
        // Confirm import button
        document.getElementById('confirmImportBtn').onclick = () => this.confirmBulkImport();
    }

    downloadCSVTemplate() {
        const csvContent = `name,brand,price,category,gender,model,description,featured,image_url,image_url_2,image_url_3
Ray-Ban Aviator Classic,Ray-Ban,10990,sunglasses,unisex,RB3025 001/58,Classic aviator sunglasses with crystal green lenses,true,https://example.com/rayban-aviator-1.jpg,https://example.com/rayban-aviator-2.jpg,https://example.com/rayban-aviator-3.jpg
Gucci Oversized Square,Gucci,20700,sunglasses,women,GG0061S 001,Oversized square sunglasses with crystal lenses,true,https://example.com/gucci-square-1.jpg,https://example.com/gucci-square-2.jpg,
Tom Ford Optical Frame,Tom Ford,24500,optical-frames,men,TF5156 001,Premium optical frame with titanium construction,false,https://example.com/tomford-optical-1.jpg,https://example.com/tomford-optical-2.jpg,
Prada Cat Eye Sunglasses,Prada,33700,sunglasses,women,PR 01VS 1AB-1F0,Elegant cat eye sunglasses with gradient lenses,true,https://example.com/prada-cateye-1.jpg,https://example.com/prada-cateye-2.jpg,https://example.com/prada-cateye-3.jpg
Cartier Skyline Optical,Cartier,96500,optical-frames,unisex,CT0046S 001,Luxury optical frame with 18k gold accents,true,https://example.com/cartier-skyline-1.jpg,https://example.com/cartier-skyline-2.jpg,
Acuvue Oasys Contact Lenses,Johnson & Johnson,2500,contact-lenses,unisex,ACUVUE OASYS,Monthly disposable contact lenses for all-day comfort,false,https://example.com/acuvue-oasys-1.jpg,,
Oakley Holbrook,Oakley,12990,sunglasses,men,OO9013-01,Iconic lifestyle sunglasses with Prizm lenses,true,https://example.com/oakley-holbrook-1.jpg,https://example.com/oakley-holbrook-2.jpg,
Versace Medusa Sunglasses,Versace,28900,sunglasses,women,VE4365 001,Signature Medusa logo on temple with crystal lenses,true,https://example.com/versace-medusa-1.jpg,https://example.com/versace-medusa-2.jpg,https://example.com/versace-medusa-3.jpg
Dolce & Gabbana Sicily,Dolce & Gabbana,45600,sunglasses,women,DG3018 001,Luxury cat-eye sunglasses with gold accents,true,https://example.com/dg-sicily-1.jpg,https://example.com/dg-sicily-2.jpg,
Boss Optical Frame,Boss,18900,optical-frames,men,BU1001S 001,Modern rectangular frame with titanium construction,false,https://example.com/boss-optical-1.jpg,https://example.com/boss-optical-2.jpg,`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'products_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    handleCSVFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvText = e.target.result;
                const products = this.parseCSV(csvText);
                this.showCSVPreview(products);
            } catch (error) {
                this.showMessage('Error reading CSV file: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const products = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= 5) { // At least name, brand, price, category, gender
                const product = {
                    name: values[0] || '',
                    brand: values[1] || '',
                    price: parseFloat(values[2]) || 0,
                    category: values[3] || '',
                    gender: values[4] || '',
                    model: values[5] || '',
                    description: values[6] || '',
                    featured: values[7] === 'true' || values[7] === '1',
                    image_url: values[8] || '',
                    image_url_2: values[9] || '',
                    image_url_3: values[10] || ''
                };
                products.push(product);
            }
        }

        return products;
    }

    showCSVPreview(products) {
        const previewDiv = document.getElementById('csvPreview');
        const previewTable = document.getElementById('previewTable');
        const importSummary = document.getElementById('importSummary');
        
        // Show preview
        previewDiv.style.display = 'block';
        
        // Create table
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Gender</th>
                    <th>Featured</th>
                    <th>Images</th>
                </tr>
            </thead>
            <tbody>
                ${products.slice(0, 10).map(product => {
                    const imageCount = [product.image_url, product.image_url_2, product.image_url_3].filter(url => url).length;
                    return `
                        <tr>
                            <td>${product.name}</td>
                            <td>${product.brand}</td>
                            <td>₹${product.price.toLocaleString()}</td>
                            <td>${product.category}</td>
                            <td>${product.gender}</td>
                            <td>${product.featured ? 'Yes' : 'No'}</td>
                            <td>${imageCount} image${imageCount !== 1 ? 's' : ''}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        `;
        
        previewTable.innerHTML = '';
        previewTable.appendChild(table);
        
        // Show summary
        importSummary.textContent = `Ready to import ${products.length} products. ${products.length > 10 ? `(Showing first 10 rows)` : ''}`;
        
        // Store products for import
        this.productsToImport = products;
    }

    async confirmBulkImport() {
        if (!this.productsToImport || this.productsToImport.length === 0) {
            this.showMessage('No products to import', 'error');
            return;
        }

        // Show progress
        document.getElementById('csvPreview').style.display = 'none';
        document.getElementById('importProgress').style.display = 'block';
        
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        try {
            if (this.useBackend && window.apiClient) {
                // Use backend API
                const result = await window.apiClient.bulkImportProducts(this.productsToImport);
                
                // Show results
                this.showImportResults(result);
            } else {
                // Fallback to local storage (for demo purposes)
                this.productsToImport.forEach(product => {
                    product.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                    product.createdAt = new Date().toISOString();
                    this.products.push(product);
                });
                
                this.saveData();
                this.updateProductsList();
                
                this.showImportResults({
                    message: `Successfully imported ${this.productsToImport.length} products`,
                    results: {
                        success: this.productsToImport.length,
                        failed: 0,
                        errors: []
                    }
                });
            }
        } catch (error) {
            console.error('Bulk import error:', error);
            this.showMessage('Error importing products: ' + error.message, 'error');
        }
    }

    showImportResults(result) {
        document.getElementById('importProgress').style.display = 'none';
        document.getElementById('importResults').style.display = 'block';
        
        const resultsContent = document.getElementById('resultsContent');
        resultsContent.innerHTML = `
            <div class="success">✅ ${result.message}</div>
            <div style="margin-top: 1rem;">
                <p><strong>Successfully imported:</strong> ${result.results.success} products</p>
                <p><strong>Failed:</strong> ${result.results.failed} products</p>
            </div>
            ${result.results.errors.length > 0 ? `
                <div style="margin-top: 1rem;">
                    <strong>Errors:</strong>
                    <ul style="margin-top: 0.5rem;">
                        ${result.results.errors.map(error => `<li class="error">${error}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
        
        // Refresh products list
        this.updateProductsList();
        
        // Auto-close modal after 5 seconds
        setTimeout(() => {
            this.hideBulkImportModal();
        }, 5000);
    }

    resetBulkImportModal() {
        document.getElementById('csvPreview').style.display = 'none';
        document.getElementById('importProgress').style.display = 'none';
        document.getElementById('importResults').style.display = 'none';
        document.getElementById('csvFileInput').value = '';
        this.productsToImport = null;
    }

    // Inventory Import Functions
    showInventoryImportModal() {
        console.log('Opening inventory import modal...');
        const modal = document.getElementById('inventoryImportModal');
        if (!modal) {
            console.error('Inventory import modal not found!');
            this.showMessage('Inventory import modal not found. Please refresh the page.', 'error');
            return;
        }
        modal.style.display = 'flex';
        this.setupInventoryImportEventListeners();
        console.log('Inventory import modal opened successfully');
    }

    hideInventoryImportModal() {
        document.getElementById('inventoryImportModal').style.display = 'none';
        this.resetInventoryImportModal();
    }

    setupInventoryImportEventListeners() {
        // Download inventory template button
        document.getElementById('downloadInventoryTemplateBtn').onclick = () => this.downloadInventoryTemplate();
        
        // Select inventory CSV button
        document.getElementById('selectInventoryBtn').onclick = () => {
            document.getElementById('inventoryFileInput').click();
        };
        
        // Confirm inventory import button
        document.getElementById('confirmInventoryImportBtn').onclick = () => this.confirmInventoryImport();
    }

    downloadInventoryTemplate() {
        const csvContent = `SI No,Product,Product Code,Description,Branch Name,Quantity,Pieces Per Box,Total Number Of Pieces,Average Unit Price,Average Tax %,Total Purchase (Rs)
1,Contact Lens,SL59,SOFLENS - BAUSCH & LOMB - -0.50,Monica opto hub 1,1,6,6,1599,0,1599
2,Lens,SYS9,Ecoo - Monica,Monica opto hub 1,1,,,550,0,550
3,Sunglasses,BOSS 1765,Boss sunglass - Boss,Monica opto hub 1,,,,750,0,750
4,Frame,BOSS 1769 J5G,Boss frame - Boss,Monica opto hub 1,,,,20800,0,20800
5,Sunglasses,BOSS 1770,Boss sunglass - Boss,Monica opto hub 1,,,,16600,0,16600
6,Frame,BOSS 1771,Boss frame - Boss,Monica opto hub 1,,,,19800,0,19800
7,Sunglasses,BOSS 1772,Boss sunglass - Boss,Monica opto hub 1,,,,15700,0,15700
8,Contact Lens,ACUVUE OASYS,Monthly disposable contact lenses,Monica opto hub 1,1,6,6,2500,0,2500
9,Sunglasses,RAY-BAN RB3025,Ray-Ban Aviator Classic,Monica opto hub 1,,,,10990,0,10990
10,Frame,GUCCI GG0061S,Gucci Oversized Square,Monica opto hub 1,,,,20700,0,20700`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'inventory_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    handleInventoryFile(event) {
        console.log('Inventory file selected:', event.target.files[0]);
        const file = event.target.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }

        console.log('Reading file:', file.name, file.type, file.size);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                console.log('File read successfully, parsing CSV...');
                const csvText = e.target.result;
                console.log('CSV text length:', csvText.length);
                const inventoryItems = this.parseInventoryCSV(csvText);
                console.log('Parsed inventory items:', inventoryItems.length);
                this.showInventoryPreview(inventoryItems);
            } catch (error) {
                console.error('Error processing inventory file:', error);
                this.showMessage('Error reading inventory CSV file: ' + error.message, 'error');
            }
        };
        reader.onerror = (error) => {
            console.error('File read error:', error);
            this.showMessage('Error reading file: ' + error.message, 'error');
        };
        reader.readAsText(file);
    }

    parseInventoryCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const inventoryItems = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= 5) { // At least SI No, Product, Product Code, Description, Branch Name
                const item = {
                    siNo: values[0] || '',
                    product: values[1] || '',
                    productCode: values[2] || '',
                    description: values[3] || '',
                    branchName: values[4] || '',
                    quantity: values[5] ? parseInt(values[5]) : null,
                    piecesPerBox: values[6] ? parseInt(values[6]) : null,
                    totalPieces: values[7] ? parseInt(values[7]) : null,
                    averageUnitPrice: values[8] ? parseFloat(values[8]) : 0,
                    averageTaxPercent: values[9] ? parseFloat(values[9]) : 0,
                    totalPurchase: values[10] ? parseFloat(values[10]) : 0
                };
                inventoryItems.push(item);
            }
        }

        return inventoryItems;
    }

    showInventoryPreview(inventoryItems) {
        const previewDiv = document.getElementById('inventoryPreview');
        const previewTable = document.getElementById('inventoryPreviewTable');
        const importSummary = document.getElementById('inventoryImportSummary');
        
        // Show preview
        previewDiv.style.display = 'block';
        
        // Create table
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>SI No</th>
                    <th>Product</th>
                    <th>Product Code</th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Category</th>
                </tr>
            </thead>
            <tbody>
                ${inventoryItems.slice(0, 10).map(item => {
                    const category = this.mapProductTypeToCategory(item.product);
                    return `
                        <tr>
                            <td>${item.siNo}</td>
                            <td>${item.product}</td>
                            <td>${item.productCode}</td>
                            <td>${item.description}</td>
                            <td>${item.quantity || '-'}</td>
                            <td>₹${item.averageUnitPrice.toLocaleString()}</td>
                            <td>${category}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        `;
        
        previewTable.innerHTML = '';
        previewTable.appendChild(table);
        
        // Show summary
        importSummary.textContent = `Ready to import ${inventoryItems.length} inventory items. ${inventoryItems.length > 10 ? `(Showing first 10 rows)` : ''}`;
        
        // Store items for import
        this.inventoryItemsToImport = inventoryItems;
    }

    mapProductTypeToCategory(productType) {
        const type = productType.toLowerCase();
        if (type.includes('sunglass')) return 'sunglasses';
        if (type.includes('frame')) return 'optical-frames';
        if (type.includes('contact') || type.includes('lens')) return 'contact-lenses';
        return 'sunglasses'; // default
    }

    async confirmInventoryImport() {
        if (!this.inventoryItemsToImport || this.inventoryItemsToImport.length === 0) {
            this.showMessage('No inventory items to import', 'error');
            return;
        }

        // Show progress
        document.getElementById('inventoryPreview').style.display = 'none';
        document.getElementById('inventoryImportProgress').style.display = 'block';
        
        const progressFill = document.getElementById('inventoryProgressFill');
        const progressText = document.getElementById('inventoryProgressText');
        
        try {
            if (this.useBackend && window.apiClient) {
                // Use backend API for inventory import
                const result = await window.apiClient.bulkImportInventory(this.inventoryItemsToImport);
                
                // Show results
                this.showInventoryImportResults(result);
            } else {
                // Fallback to local storage (for demo purposes)
                this.inventoryItemsToImport.forEach(item => {
                    const product = this.convertInventoryItemToProduct(item);
                    product.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                    product.createdAt = new Date().toISOString();
                    this.products.push(product);
                });
                
                this.saveData();
                this.updateProductsList();
                
                this.showInventoryImportResults({
                    message: `Successfully imported ${this.inventoryItemsToImport.length} inventory items`,
                    results: {
                        success: this.inventoryItemsToImport.length,
                        failed: 0,
                        errors: []
                    }
                });
            }
        } catch (error) {
            console.error('Inventory import error:', error);
            this.showMessage('Error importing inventory: ' + error.message, 'error');
        }
    }

    convertInventoryItemToProduct(item) {
        return {
            name: item.description || `${item.product} ${item.productCode}`,
            brand: this.extractBrandFromDescription(item.description) || 'Unknown',
            price: item.averageUnitPrice,
            category: this.mapProductTypeToCategory(item.product),
            gender: 'unisex', // Default gender
            model: item.productCode,
            description: item.description,
            featured: false,
            // Store inventory-specific data
            inventory: {
                siNo: item.siNo,
                quantity: item.quantity,
                piecesPerBox: item.piecesPerBox,
                totalPieces: item.totalPieces,
                averageTaxPercent: item.averageTaxPercent,
                totalPurchase: item.totalPurchase,
                branchName: item.branchName
            }
        };
    }

    extractBrandFromDescription(description) {
        // Try to extract brand from description
        const commonBrands = ['Boss', 'Ray-Ban', 'Gucci', 'Tom Ford', 'Prada', 'Cartier', 'Versace', 'Dolce & Gabbana', 'Oakley', 'Acuvue'];
        for (const brand of commonBrands) {
            if (description.toLowerCase().includes(brand.toLowerCase())) {
                return brand;
            }
        }
        return null;
    }

    showInventoryImportResults(result) {
        document.getElementById('inventoryImportProgress').style.display = 'none';
        document.getElementById('inventoryImportResults').style.display = 'block';
        
        const resultsContent = document.getElementById('inventoryResultsContent');
        resultsContent.innerHTML = `
            <div class="success">✅ ${result.message}</div>
            <div style="margin-top: 1rem;">
                <p><strong>Successfully imported:</strong> ${result.results.success} items</p>
                <p><strong>Failed:</strong> ${result.results.failed} items</p>
            </div>
            ${result.results.errors.length > 0 ? `
                <div style="margin-top: 1rem;">
                    <strong>Errors:</strong>
                    <ul style="margin-top: 0.5rem;">
                        ${result.results.errors.map(error => `<li class="error">${error}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            <div style="margin-top: 1rem; padding: 0.75rem; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #0ea5e9;">
                <strong>📝 Next Steps:</strong>
                <ul style="margin: 0.5rem 0 0 1rem;">
                    <li>Review imported products and update gender categories if needed</li>
                    <li>Add product images for better presentation</li>
                    <li>Set featured products for homepage display</li>
                    <li>Update product descriptions and pricing as needed</li>
                </ul>
            </div>
        `;
        
        // Refresh products list
        this.updateProductsList();
        
        // Auto-close modal after 8 seconds
        setTimeout(() => {
            this.hideInventoryImportModal();
        }, 8000);
    }

    resetInventoryImportModal() {
        document.getElementById('inventoryPreview').style.display = 'none';
        document.getElementById('inventoryImportProgress').style.display = 'none';
        document.getElementById('inventoryImportResults').style.display = 'none';
        document.getElementById('inventoryFileInput').value = '';
        this.inventoryItemsToImport = null;
    }

    // Mobile Menu Functions
    toggleMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mobileNavOverlay = document.getElementById('mobileNavOverlay');
        const adminNav = document.getElementById('adminNav');
        
        if (mobileMenuToggle && mobileNavOverlay && adminNav) {
            const isActive = adminNav.classList.contains('active');
            
            if (isActive) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }
    }

    openMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mobileNavOverlay = document.getElementById('mobileNavOverlay');
        const adminNav = document.getElementById('adminNav');
        
        if (mobileMenuToggle && mobileNavOverlay && adminNav) {
            mobileMenuToggle.classList.add('active');
            mobileNavOverlay.classList.add('active');
            adminNav.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    closeMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mobileNavOverlay = document.getElementById('mobileNavOverlay');
        const adminNav = document.getElementById('adminNav');
        
        if (mobileMenuToggle && mobileNavOverlay && adminNav) {
            mobileMenuToggle.classList.remove('active');
            mobileNavOverlay.classList.remove('active');
            adminNav.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    // Utility Functions
    formatTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }

    // Data Persistence
    saveData() {
        // Sanitize settings before saving to avoid localStorage quota issues
        let sanitizedSettings = this.settings;
        try {
            if (this.settings && this.settings.content && this.settings.content.hero && Array.isArray(this.settings.content.hero.images)) {
                const sanitizedImages = this.settings.content.hero.images.map((img) => {
                    if (!img) return null;
                    const result = { alt: img.alt || 'Hero Image' };
                    if (img.id) result.id = img.id;
                    // Keep URL (including data URLs for hero images)
                    if (img.url && typeof img.url === 'string') {
                        result.url = img.url;
                    }
                    return result;
                }).filter(Boolean);
                sanitizedSettings = JSON.parse(JSON.stringify(this.settings));
                sanitizedSettings.content.hero.images = sanitizedImages;
            }
        } catch (e) {
            console.warn('Failed to sanitize settings; saving raw settings as fallback');
            sanitizedSettings = this.settings;
        }

        const data = {
            products: this.products,
            appointments: this.appointments,
            analytics: this.analytics,
            settings: sanitizedSettings
        };
        try {
            const jsonData = JSON.stringify(data);
            console.log('Saving to localStorage:', jsonData);
            localStorage.setItem('adminPanelData', jsonData);
            console.log('Admin data saved successfully:', data);
            console.log('Hero content saved:', this.settings.content?.hero);
            
            // Verify the save by reading it back
            const verifyData = localStorage.getItem('adminPanelData');
            console.log('Verification - data read back:', verifyData);
        } catch (error) {
            console.error('Error saving admin data:', error);
            this.showMessage('Storage is full or unavailable. Images will be kept in browser storage, but large data may not sync.', 'error');
        }
    }

    getInitialProducts() {
        return [
            {
                id: '1',
                name: 'Ray-Ban Aviator Classic',
                brand: 'Ray-Ban',
                price: 10990,
                category: 'sunglasses',
                gender: 'unisex',
                model: 'RB3025 001/58',
                description: 'Classic aviator sunglasses with crystal green lenses',
                image: '', // Use placeholder instead of external URL
                featured: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '2',
                name: 'Gucci Oversized Square',
                brand: 'Gucci',
                price: 20700,
                category: 'sunglasses',
                gender: 'women',
                model: 'GG0061S 001',
                description: 'Oversized square sunglasses with crystal lenses',
                image: '', // Use placeholder instead of external URL
                featured: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '3',
                name: 'Tom Ford Optical Frame',
                brand: 'Tom Ford',
                price: 24500,
                category: 'optical-frames',
                gender: 'men',
                model: 'TF5156 001',
                description: 'Premium optical frame with titanium construction',
                image: '', // Use placeholder instead of external URL
                featured: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '4',
                name: 'Prada Cat Eye Sunglasses',
                brand: 'Prada',
                price: 33700,
                category: 'sunglasses',
                gender: 'women',
                model: 'PR 01VS 1AB-1F0',
                description: 'Elegant cat eye sunglasses with gradient lenses',
                image: '', // Use placeholder instead of external URL
                featured: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '5',
                name: 'Cartier Skyline Optical',
                brand: 'Cartier',
                price: 96500,
                category: 'optical-frames',
                gender: 'unisex',
                model: 'CT0046S 001',
                description: 'Luxury optical frame with 18k gold accents',
                image: '', // Use placeholder instead of external URL
                featured: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '6',
                name: 'Acuvue Oasys Contact Lenses',
                brand: 'Johnson & Johnson',
                price: 2500,
                category: 'contact-lenses',
                gender: 'unisex',
                model: 'ACUVUE OASYS',
                description: 'Monthly disposable contact lenses for all-day comfort',
                image: '', // Use placeholder instead of external URL
                featured: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
    }

    loadData() {
        const savedData = localStorage.getItem('adminPanelData');
        console.log('Raw localStorage data:', savedData);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                console.log('Parsed localStorage data:', data);
                
                // Always load products array (even if empty)
                if (data.products !== undefined) {
                    this.products = data.products;
                    console.log('Products loaded:', this.products.length);
                }
                
                // Always load appointments array (even if empty)
                if (data.appointments !== undefined) {
                    this.appointments = data.appointments;
                    console.log('Appointments loaded:', this.appointments.length);
                }
                
                // Load analytics if available
                if (data.analytics) {
                    this.analytics = data.analytics;
                    console.log('Analytics loaded');
                }
                
                // Load settings with deep merge
                if (data.settings) {
                    console.log('Loading settings from localStorage:', data.settings);
                    console.log('Current settings before merge:', this.settings);
                    // Deep merge settings to preserve nested objects
                    this.settings = this.deepMerge(this.getDefaultSettings(), data.settings);
                    console.log('Settings after deep merge:', this.settings);
                    
                    // Ensure hero images array exists and is properly initialized
                    if (this.settings.content && this.settings.content.hero) {
                        if (!Array.isArray(this.settings.content.hero.images)) {
                            console.log('Initializing hero images array');
                            this.settings.content.hero.images = [];
                        }
                        
                        console.log('Hero images loaded from localStorage:', this.settings.content.hero.images.length, 'images');
                        console.log('Hero images data:', this.settings.content.hero.images);
                        // Migrate any data URLs into IndexedDB to avoid localStorage bloat
                        if (window.idbStore) {
                            const imgs = this.settings.content.hero.images;
                            const toMigrate = imgs.filter(img => img && img.url && typeof img.url === 'string' && img.url.startsWith('data:'));
                            if (toMigrate.length > 0) {
                                console.log('Migrating', toMigrate.length, 'data URL images into IndexedDB');
                                Promise.all(toMigrate.map(async (img) => {
                                    try {
                                        const blob = await fetch(img.url).then(r => r.blob());
                                        const id = await window.idbStore.putBlob(blob);
                                        img.id = id; // keep url for immediate render fallback
                                    } catch (e) {
                                        console.warn('Migration failed for one image, keeping data URL');
                                    }
                                })).then(() => {
                                    this.saveData();
                                });
                            }
                        }
                    } else {
                        console.log('No hero images found in loaded settings');
                    }
                }
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        } else {
            console.log('No saved data found in localStorage');
            console.log('🔄 Initializing with default data...');
            
            // Initialize with default data if no saved data exists
            this.products = this.getInitialProducts();
            this.appointments = this.getInitialAppointments();
            this.analytics = this.getInitialAnalytics();
            this.settings = this.getDefaultSettings();
            
            console.log('✅ Default data initialized');
            console.log('Products:', this.products.length);
            console.log('Appointments:', this.appointments.length);
            
            // Save the initialized data
            this.saveData();
        }
    }
}

// Global functions for HTML onclick handlers
function testContentPersistence() {
    console.log('=== TESTING CONTENT PERSISTENCE ===');
    
    // Check if adminPanel is available
    if (!window.adminPanel) {
        console.log('❌ adminPanel not available. Make sure the admin panel is loaded.');
        return false;
    }
    
    // Test 1: Check current settings
    console.log('Current settings:', window.adminPanel.settings);
    
    // Test 2: Update hero content
    window.adminPanel.settings.content.hero.eyebrow = 'TEST EYEBROW';
    window.adminPanel.settings.content.hero.title = 'TEST TITLE';
    window.adminPanel.settings.content.hero.description = 'TEST DESCRIPTION';
    
    // Test 3: Save data
    window.adminPanel.saveData();
    
    // Test 4: Clear current settings
    window.adminPanel.settings.content.hero.eyebrow = 'ORIGINAL';
    window.adminPanel.settings.content.hero.title = 'ORIGINAL';
    window.adminPanel.settings.content.hero.description = 'ORIGINAL';
    
    // Test 5: Load data
    window.adminPanel.loadData();
    
    // Test 6: Check if data was restored
    console.log('Settings after load:', window.adminPanel.settings);
    console.log('Hero content after load:', window.adminPanel.settings.content.hero);
    
    if (window.adminPanel.settings.content.hero.eyebrow === 'TEST EYEBROW') {
        console.log('✅ PERSISTENCE TEST PASSED');
        return true;
    } else {
        console.log('❌ PERSISTENCE TEST FAILED');
        return false;
    }
}

// Manual content update test
function testManualContentUpdate() {
    console.log('=== TESTING MANUAL CONTENT UPDATE ===');
    
    if (!window.adminPanel) {
        console.log('❌ adminPanel not available');
        return false;
    }
    
    // Test 1: Update content directly
    console.log('Updating content directly...');
    window.adminPanel.settings.content.hero.eyebrow = 'MANUAL TEST EYEBROW';
    window.adminPanel.settings.content.hero.title = 'MANUAL TEST TITLE';
    window.adminPanel.settings.content.hero.description = 'MANUAL TEST DESCRIPTION';
    
    // Test 2: Save data
    console.log('Saving data...');
    window.adminPanel.saveData();
    
    // Test 3: Check if form fields are updated
    console.log('Checking form fields...');
    const eyebrowField = document.getElementById('heroEyebrow');
    const titleField = document.getElementById('heroTitle');
    const descriptionField = document.getElementById('heroDescription');
    
    console.log('Form field values:');
    console.log('Eyebrow field:', eyebrowField ? eyebrowField.value : 'NOT FOUND');
    console.log('Title field:', titleField ? titleField.value : 'NOT FOUND');
    console.log('Description field:', descriptionField ? descriptionField.value : 'NOT FOUND');
    
    // Test 4: Trigger form population
    console.log('Triggering form population...');
    window.adminPanel.populateContentForms();
    
    // Test 5: Check form fields again
    console.log('Form field values after population:');
    console.log('Eyebrow field:', eyebrowField ? eyebrowField.value : 'NOT FOUND');
    console.log('Title field:', titleField ? titleField.value : 'NOT FOUND');
    console.log('Description field:', descriptionField ? descriptionField.value : 'NOT FOUND');
    
    return true;
}

// Test refresh persistence
function testRefreshPersistence() {
    console.log('=== TESTING REFRESH PERSISTENCE ===');
    
    if (!window.adminPanel) {
        console.log('❌ adminPanel not available');
        return false;
    }
    
    // Test 1: Check current localStorage
    const currentData = localStorage.getItem('adminPanelData');
    console.log('Current localStorage data:', currentData);
    
    // Test 2: Update content and save
    console.log('Updating content...');
    window.adminPanel.settings.content.hero.eyebrow = 'REFRESH TEST EYEBROW';
    window.adminPanel.settings.content.hero.title = 'REFRESH TEST TITLE';
    window.adminPanel.settings.content.hero.description = 'REFRESH TEST DESCRIPTION';
    
    console.log('Saving data...');
    window.adminPanel.saveData();
    
    // Test 3: Verify save
    const savedData = localStorage.getItem('adminPanelData');
    console.log('Data after save:', savedData);
    
    // Test 4: Parse and verify content
    const parsedData = JSON.parse(savedData);
    console.log('Parsed saved data:', parsedData);
    console.log('Hero content in saved data:', parsedData.settings?.content?.hero);
    
    if (parsedData.settings?.content?.hero?.eyebrow === 'REFRESH TEST EYEBROW') {
        console.log('✅ DATA SAVED CORRECTLY');
        console.log('Now refresh the page and check if the data persists');
        return true;
    } else {
        console.log('❌ DATA NOT SAVED CORRECTLY');
        return false;
    }
}

// Expose test functions globally
window.testManualContentUpdate = testManualContentUpdate;
window.testContentPersistence = testContentPersistence;
window.testLocalStorage = testLocalStorage;
window.testRefreshPersistence = testRefreshPersistence;

// Simple localStorage test that doesn't depend on adminPanel
function testLocalStorage() {
    console.log('=== TESTING LOCALSTORAGE DIRECTLY ===');
    
    // Test 1: Save test data
    const testData = {
        test: {
            hero: {
                eyebrow: 'DIRECT TEST EYEBROW',
                title: 'DIRECT TEST TITLE',
                description: 'DIRECT TEST DESCRIPTION'
            }
        }
    };
    
    localStorage.setItem('testData', JSON.stringify(testData));
    console.log('Test data saved:', testData);
    
    // Test 2: Read test data
    const readData = localStorage.getItem('testData');
    console.log('Test data read:', readData);
    
    // Test 3: Parse and verify
    const parsedData = JSON.parse(readData);
    console.log('Parsed data:', parsedData);
    
    if (parsedData.test.hero.eyebrow === 'DIRECT TEST EYEBROW') {
        console.log('✅ LOCALSTORAGE TEST PASSED');
        return true;
    } else {
        console.log('❌ LOCALSTORAGE TEST FAILED');
        return false;
    }
}

function showSection(sectionName) {
    adminPanel.showSection(sectionName);
}

function hideProductForm() {
    adminPanel.hideProductForm();
}

function exportData() {
    adminPanel.exportData();
}

function importData() {
    adminPanel.importData();
}

function handleImportFile(event) {
    adminPanel.handleImportFile(event);
}

function clearAllData() {
    adminPanel.clearAllData();
}

function exportAppointments() {
    adminPanel.exportAppointments();
}

function closeAppointmentModal() {
    adminPanel.closeAppointmentModal();
}

// Bulk import functions
function hideBulkImportModal() {
    adminPanel.hideBulkImportModal();
}

function handleCSVFile(event) {
    adminPanel.handleCSVFile(event);
}

function hideInventoryImportModal() {
    adminPanel.hideInventoryImportModal();
}

function handleInventoryFile(event) {
    adminPanel.handleInventoryFile(event);
}

// Enhanced test function for admin panel refresh
window.testAdminRefresh = function() {
    console.log('=== TESTING ADMIN PANEL REFRESH ===');
    
    if (!window.adminPanel) {
        console.log('❌ AdminPanel not available');
        return false;
    }
    
    // Step 1: Add a test hero image
    const testImage = {
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMzMzIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiPkFETUlOIFRFU1Q8L3RleHQ+Cjwvc3ZnPg==',
        alt: 'Admin Test Image'
    };
    
    // Ensure hero images array exists
    if (!window.adminPanel.settings.content.hero.images) {
        window.adminPanel.settings.content.hero.images = [];
    }
    
    window.adminPanel.settings.content.hero.images.push(testImage);
    console.log('✅ Added test image, total count:', window.adminPanel.settings.content.hero.images.length);
    
    // Step 2: Save data
    window.adminPanel.saveData();
    console.log('✅ Data saved');
    
    // Step 3: Verify save
    const savedData = localStorage.getItem('adminPanelData');
    if (savedData) {
        const data = JSON.parse(savedData);
        const savedHeroImages = data.settings?.content?.hero?.images || [];
        console.log('✅ Saved hero images count:', savedHeroImages.length);
        
        if (savedHeroImages.length > 0) {
            console.log('✅ Test image saved successfully');
            
            // Step 4: Simulate refresh by clearing and reloading
            console.log('🔄 Simulating page refresh...');
            window.adminPanel.settings.content.hero.images = [];
            console.log('Cleared current images');
            
            // Step 5: Reload data
            window.adminPanel.loadData();
            console.log('✅ Data reloaded');
            
            const reloadedImages = window.adminPanel.settings.content.hero.images || [];
            console.log('✅ Reloaded hero images count:', reloadedImages.length);
            
            if (reloadedImages.length > 0) {
                console.log('✅ Test image persisted after reload');
                return true;
            } else {
                console.log('❌ Test image did not persist after reload');
                return false;
            }
        } else {
            console.log('❌ Test image not saved');
            return false;
        }
    } else {
        console.log('❌ No data in localStorage');
        return false;
    }
};

// Comprehensive test for dynamic website persistence
window.testDynamicPersistence = function() {
    console.log('=== TESTING DYNAMIC WEBSITE PERSISTENCE ===');
    
    if (!window.adminPanel) {
        console.log('❌ AdminPanel not available');
        return false;
    }
    
    // Step 1: Add a test hero image
    const testImage = {
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMzMzIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiPkRZTkFNSUMgVEVTVDwvdGV4dD4KPC9zdmc+',
        alt: 'Dynamic Test Image'
    };
    
    // Ensure hero images array exists
    if (!window.adminPanel.settings.content.hero.images) {
        window.adminPanel.settings.content.hero.images = [];
    }
    
    window.adminPanel.settings.content.hero.images.push(testImage);
    console.log('✅ Added test image, total count:', window.adminPanel.settings.content.hero.images.length);
    
    // Step 2: Save data
    window.adminPanel.saveData();
    console.log('✅ Data saved');
    
    // Step 3: Verify save
    const savedData = localStorage.getItem('adminPanelData');
    if (savedData) {
        const data = JSON.parse(savedData);
        const savedHeroImages = data.settings?.content?.hero?.images || [];
        console.log('✅ Saved hero images count:', savedHeroImages.length);
        
        if (savedHeroImages.length > 0) {
            console.log('✅ Test image saved successfully');
            
            // Step 4: Test homepage visibility
            console.log('🔄 Testing homepage visibility...');
            if (window.refreshHeroSlider) {
                window.refreshHeroSlider();
                console.log('✅ Homepage slider refreshed');
            }
            
            // Step 5: Simulate complete page refresh
            console.log('🔄 Simulating complete page refresh...');
            
            // Clear current admin panel state
            window.adminPanel.settings.content.hero.images = [];
            console.log('Cleared current images');
            
            // Reload data (simulating page refresh)
            window.adminPanel.loadData();
            console.log('✅ Data reloaded');
            
            const reloadedImages = window.adminPanel.settings.content.hero.images || [];
            console.log('✅ Reloaded hero images count:', reloadedImages.length);
            
            if (reloadedImages.length > 0) {
                console.log('✅ DYNAMIC PERSISTENCE WORKING!');
                console.log('✅ Test image persisted after simulated refresh');
                console.log('✅ Website is truly dynamic');
                return true;
            } else {
                console.log('❌ DYNAMIC PERSISTENCE FAILED');
                console.log('❌ Test image did not persist after simulated refresh');
                return false;
            }
        } else {
            console.log('❌ Test image not saved');
            return false;
        }
    } else {
        console.log('❌ No data in localStorage');
        return false;
    }
};

// Global function to force load products in admin panel
window.forceLoadAdminProducts = function() {
    console.log('🔄 FORCE LOADING ADMIN PRODUCTS');
    console.log('===============================');
    
    if (!window.adminPanel) {
        console.log('❌ AdminPanel not available');
        return false;
    }
    
    // Step 1: Check current products
    console.log('Step 1: Current products in admin panel:', window.adminPanel.products?.length || 0);
    
    // Step 2: Force load from localStorage
    console.log('Step 2: Force loading from localStorage...');
    const savedData = localStorage.getItem('adminPanelData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            window.adminPanel.products = data.products || [];
            console.log('✅ Products loaded from localStorage:', window.adminPanel.products.length);
        } catch (e) {
            console.error('❌ Error parsing localStorage data:', e);
            window.adminPanel.products = window.adminPanel.getInitialProducts();
            console.log('✅ Using initial products as fallback:', window.adminPanel.products.length);
        }
    } else {
        console.log('⚠️ No data in localStorage, using initial products');
        window.adminPanel.products = window.adminPanel.getInitialProducts();
        console.log('✅ Initial products loaded:', window.adminPanel.products.length);
    }
    
    // Step 3: Save to ensure persistence
    console.log('Step 3: Saving products to ensure persistence...');
    window.adminPanel.saveData();
    console.log('✅ Products saved');
    
    // Step 4: Display products in admin panel
    console.log('Step 4: Displaying products in admin panel...');
    window.adminPanel.updateProductsList();
    console.log('✅ Products displayed');
    
    // Step 5: Verify display
    const productsList = document.getElementById('productsList');
    if (productsList) {
        const productRows = productsList.querySelectorAll('.product-row');
        console.log('✅ Verification: Found', productRows.length, 'product rows in DOM');
    } else {
        console.log('⚠️ productsList element not found');
    }
    
    console.log('🎉 Force load completed successfully!');
    return true;
};

// Global function to force load products from backend
window.forceLoadProductsFromBackend = function() {
    console.log('🔄 FORCE LOADING PRODUCTS FROM BACKEND');
    console.log('=====================================');
    
    if (!window.adminPanel) {
        console.log('❌ AdminPanel not available');
        return Promise.resolve(false);
    }
    
    // Step 1: Check current products
    console.log('Step 1: Current products in admin panel:', window.adminPanel.products?.length || 0);
    
    // Step 2: Force load from backend
    console.log('Step 2: Force loading from backend...');
    return window.adminPanel.loadProductsFromBackend().then(result => {
        if (result.success && result.data.length > 0) {
            console.log('✅ Products loaded from backend:', result.data.length);
            window.adminPanel.products = result.data;
            window.adminPanel.saveData();
            window.adminPanel.updateProductsList();
            console.log('✅ Products displayed in admin panel');
            
            // Step 3: Verify display
            const productsList = document.getElementById('productsList');
            if (productsList) {
                const productRows = productsList.querySelectorAll('.product-row');
                console.log('✅ Verification: Found', productRows.length, 'product rows in DOM');
            } else {
                console.log('⚠️ productsList element not found');
            }
            
            console.log('🎉 Force load from backend completed successfully!');
            return true;
        } else {
            console.log('❌ No products from backend');
            return false;
        }
    }).catch(error => {
        console.error('❌ Error loading from backend:', error);
        return false;
    });
};

// Global function to debug products loading
window.debugProductsLoading = function() {
    console.log('🔍 DEBUGGING PRODUCTS LOADING');
    console.log('============================');
    
    // Check admin panel
    console.log('Admin Panel Products:', window.adminPanel?.products?.length || 0);
    
    // Check localStorage
    const savedData = localStorage.getItem('adminPanelData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            console.log('localStorage Products:', data.products?.length || 0);
        } catch (e) {
            console.error('Error parsing localStorage:', e);
        }
    } else {
        console.log('No localStorage data');
    }
    
    // Check DOM
    const productsList = document.getElementById('productsList');
    if (productsList) {
        const productRows = productsList.querySelectorAll('.product-row');
        console.log('DOM Product Rows:', productRows.length);
    } else {
        console.log('productsList element not found');
    }
    
    // Check backend
    if (window.apiClient) {
        window.apiClient.getProducts().then(response => {
            console.log('Backend Products:', response.products?.length || 0);
        }).catch(error => {
            console.log('Backend Error:', error.message);
        });
    }
};

// Debug function to force refresh content management
window.forceRefreshContentManager = function() {
    console.log('=== FORCE REFRESHING CONTENT MANAGER ===');
    
    if (!window.adminPanel) {
        console.log('❌ AdminPanel not available');
        return false;
    }
    
    try {
        // Step 1: Check current settings
        console.log('Current settings:', window.adminPanel.settings);
        console.log('Current hero content:', window.adminPanel.settings.content?.hero);
        
        // Step 2: Force update content management
        console.log('Force updating content management...');
        window.adminPanel.updateContentManagement();
        
        // Step 3: Force populate forms
        console.log('Force populating content forms...');
        window.adminPanel.populateContentForms();
        
        // Step 4: Force setup hero image management
        console.log('Force setting up hero image management...');
        window.adminPanel.setupHeroImageManagement();
        
        console.log('✅ Content manager refreshed successfully');
        return true;
    } catch (error) {
        console.error('❌ Error refreshing content manager:', error);
        return false;
    }
};

// Debug function to test content manager functionality
window.testContentManagerFunctionality = function() {
    console.log('=== TESTING CONTENT MANAGER FUNCTIONALITY ===');
    
    if (!window.adminPanel) {
        console.log('❌ AdminPanel not available');
        return false;
    }
    
    try {
        // Step 1: Check if content section exists
        const contentSection = document.getElementById('content');
        console.log('Content section found:', !!contentSection);
        
        // Step 2: Check if forms exist
        const heroForm = document.getElementById('heroContentForm');
        const brandForm = document.getElementById('addBrandForm');
        const socialForm = document.getElementById('socialMediaForm');
        
        console.log('Forms found:', {
            heroForm: !!heroForm,
            brandForm: !!brandForm,
            socialForm: !!socialForm
        });
        
        // Step 3: Check if form elements exist
        const heroElements = {
            eyebrow: document.getElementById('heroEyebrow'),
            title: document.getElementById('heroTitle'),
            description: document.getElementById('heroDescription')
        };
        
        const brandElements = {
            input: document.getElementById('newBrandName')
        };
        
        const socialElements = {
            whatsapp: document.getElementById('whatsappNumber'),
            instagram: document.getElementById('instagramHandle'),
            facebook: document.getElementById('facebookPage')
        };
        
        console.log('Form elements found:', {
            hero: heroElements,
            brand: brandElements,
            social: socialElements
        });
        
        // Step 4: Test form population
        console.log('Testing form population...');
        window.adminPanel.populateContentForms();
        
        // Step 5: Test form listeners setup
        console.log('Testing form listeners setup...');
        window.adminPanel.setupContentFormListeners();
        
        // Step 6: Test hero image management
        console.log('Testing hero image management...');
        window.adminPanel.setupHeroImageManagement();
        
        console.log('✅ Content manager functionality test completed');
        return true;
    } catch (error) {
        console.error('❌ Error testing content manager functionality:', error);
        return false;
    }
};

// Debug function for backend connection issues
window.debugBackendConnection = function() {
    console.log('=== BACKEND CONNECTION DEBUG ===');
    
    // Check authentication
    console.log('Authentication status:');
    console.log('- Logged in:', localStorage.getItem('adminLoggedIn'));
    console.log('- Auth token:', localStorage.getItem('adminToken'));
    
    // Check API client
    console.log('API Client status:');
    console.log('- Available:', !!window.apiClient);
    if (window.apiClient) {
        console.log('- Connected:', window.apiClient.isConnected());
        console.log('- Connection status:', window.apiClient.getConnectionStatus());
        console.log('- Base URL:', window.apiClient.baseURL);
    }
    
    // Test individual API calls
    console.log('Testing API calls...');
    
    // Test health check (no auth required)
    if (window.apiClient) {
        window.apiClient.healthCheck().then(response => {
            console.log('✅ Health check successful:', response);
        }).catch(error => {
            console.error('❌ Health check failed:', error);
        });
        
        // Test products (requires auth)
        window.apiClient.getProducts().then(response => {
            console.log('✅ Products API successful:', response);
        }).catch(error => {
            console.error('❌ Products API failed:', error);
            console.log('Error type:', error.constructor.name);
            console.log('Error message:', error.message);
        });
        
        // Test settings (requires auth)
        window.apiClient.getSettings().then(response => {
            console.log('✅ Settings API successful:', response);
        }).catch(error => {
            console.error('❌ Settings API failed:', error);
            console.log('Error type:', error.constructor.name);
            console.log('Error message:', error.message);
        });
    }
    
    return 'Backend debug complete - check console for details';
};

// Debug function for admin panel hero images
window.debugAdminHeroImages = function() {
    console.log('=== ADMIN PANEL HERO IMAGES DEBUG ===');
    
    if (!window.adminPanel) {
        console.log('❌ AdminPanel not available');
        return 'AdminPanel not available';
    }
    
    // Check current state
    console.log('Current hero images:', window.adminPanel.settings?.content?.hero?.images);
    console.log('Current hero images count:', window.adminPanel.settings?.content?.hero?.images?.length || 0);
    
    // Check localStorage
    const adminData = localStorage.getItem('adminPanelData');
    if (adminData) {
        try {
            const data = JSON.parse(adminData);
            const savedImages = data.settings?.content?.hero?.images || [];
            console.log('Saved hero images:', savedImages);
            console.log('Saved hero images count:', savedImages.length);
            
            // Check each image
            savedImages.forEach((img, index) => {
                console.log(`Saved Image ${index}:`, {
                    hasUrl: !!img.url,
                    hasId: !!img.id,
                    urlType: typeof img.url,
                    urlLength: img.url ? img.url.length : 0,
                    alt: img.alt
                });
            });
        } catch (error) {
            console.error('Error parsing localStorage data:', error);
        }
    } else {
        console.log('No adminPanelData in localStorage');
    }
    
    // Check backend status
    if (window.apiClient) {
        console.log('API Client status:', window.apiClient.getConnectionStatus());
    }
    
    return 'Debug complete - check console for details';
};

// Test function to verify hero images persistence
window.testHeroImagesPersistence = function() {
    console.log('=== TESTING HERO IMAGES PERSISTENCE ===');
    
    if (!window.adminPanel) {
        console.log('❌ AdminPanel not available');
        return false;
    }
    
    // Step 1: Check current hero images
    console.log('Current hero images:', window.adminPanel.settings.content.hero.images);
    console.log('Current hero images count:', window.adminPanel.settings.content.hero.images.length);
    
    // Step 2: Add a test image
    const testImage = {
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMzMzIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPlRFU1QgSU1BR0U8L3RleHQ+Cjwvc3ZnPg==',
        alt: 'Test Image'
    };
    
    window.adminPanel.settings.content.hero.images.push(testImage);
    console.log('Added test image, new count:', window.adminPanel.settings.content.hero.images.length);
    
    // Step 3: Save data
    window.adminPanel.saveData();
    console.log('Data saved');
    
    // Step 4: Verify save
    const savedData = localStorage.getItem('adminPanelData');
    if (savedData) {
        const data = JSON.parse(savedData);
        console.log('Saved hero images:', data.settings.content.hero.images);
        console.log('Saved hero images count:', data.settings.content.hero.images.length);
        
        if (data.settings.content.hero.images.length > 0) {
            console.log('✅ Test image saved successfully');
        } else {
            console.log('❌ Test image not saved');
            return false;
        }
    } else {
        console.log('❌ No data in localStorage');
        return false;
    }
    
    // Step 5: Clear current data and reload
    window.adminPanel.settings.content.hero.images = [];
    console.log('Cleared current images');
    
    // Step 6: Reload data
    window.adminPanel.loadData();
    console.log('Data reloaded');
    console.log('Reloaded hero images:', window.adminPanel.settings.content.hero.images);
    console.log('Reloaded hero images count:', window.adminPanel.settings.content.hero.images.length);
    
    if (window.adminPanel.settings.content.hero.images.length > 0) {
        console.log('✅ Test image persisted after reload');
        return true;
    } else {
        console.log('❌ Test image did not persist after reload');
        return false;
    }
};

// Global function to test data synchronization
window.testDataSynchronization = function() {
    console.log('🧪 TESTING DATA SYNCHRONIZATION');
    console.log('================================');
    
    // Check admin panel data
    const adminProducts = window.adminPanel?.products?.length || 0;
    const adminHeroImages = window.adminPanel?.settings?.content?.hero?.images?.length || 0;
    console.log('🎛️ Admin Panel - Products:', adminProducts, 'Hero Images:', adminHeroImages);
    
    // Check frontend data
    const frontendProducts = window.productDisplay?.products?.length || 0;
    console.log('🏠 Frontend - Products:', frontendProducts);
    
    // Check localStorage data
    const savedData = localStorage.getItem('adminPanelData');
    let localStorageProducts = 0;
    let localStorageHeroImages = 0;
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            localStorageProducts = data.products?.length || 0;
            localStorageHeroImages = data.settings?.content?.hero?.images?.length || 0;
        } catch (e) {
            console.error('Error parsing localStorage data:', e);
        }
    }
    console.log('💾 localStorage - Products:', localStorageProducts, 'Hero Images:', localStorageHeroImages);
    
    // Check synchronization
    const productsSynced = adminProducts === frontendProducts && frontendProducts === localStorageProducts;
    const heroImagesSynced = adminHeroImages === localStorageHeroImages;
    
    if (productsSynced && heroImagesSynced) {
        console.log('✅ Data synchronized across all systems');
        console.log('✅ Products:', adminProducts, 'Hero Images:', adminHeroImages);
        return true;
    } else {
        console.warn('⚠️ Data synchronization issues detected');
        console.log('   Products - Admin:', adminProducts, 'Frontend:', frontendProducts, 'localStorage:', localStorageProducts);
        console.log('   Hero Images - Admin:', adminHeroImages, 'localStorage:', localStorageHeroImages);
        
        // Attempt to fix synchronization
        console.log('🔧 Attempting to fix synchronization...');
        if (window.adminPanel) {
            window.adminPanel.notifyWebsiteUpdate();
            console.log('✅ Sync notification sent');
        }
        return false;
    }
};

// Global function to force complete data synchronization
window.forceDataSync = function() {
    console.log('🔄 FORCING COMPLETE DATA SYNCHRONIZATION');
    console.log('======================================');
    
    if (!window.adminPanel) {
        console.error('❌ Admin panel not available');
        return Promise.resolve(false);
    }
    
    // Step 1: Force load products from backend first
    console.log('Step 1: Force loading products from backend...');
    return window.adminPanel.loadProductsFromBackend().then(result => {
        if (result.success && result.data.length > 0) {
            console.log('✅ Products loaded from backend:', result.data.length);
            window.adminPanel.products = result.data;
        }
        
        // Step 2: Save current admin data
        console.log('Step 2: Saving admin data...');
        window.adminPanel.saveData();
        
        // Step 3: Force notify website update
        console.log('Step 3: Notifying website update...');
        window.adminPanel.notifyWebsiteUpdate();
        
        // Step 4: Force frontend sync
        console.log('Step 4: Force syncing with frontend components...');
        window.adminPanel.forceSyncWithFrontend();
        
        // Step 5: Test synchronization
        console.log('Step 5: Testing synchronization...');
        setTimeout(() => {
            const synced = window.testDataSynchronization();
            if (synced) {
                console.log('🎉 Data synchronization completed successfully!');
            } else {
                console.log('⚠️ Data synchronization still has issues');
            }
        }, 1000);
        
        return true;
    }).catch(error => {
        console.error('❌ Error during force sync:', error);
        return false;
    });
};

// Enhanced data synchronization test
window.testDataSynchronization = function() {
    console.log('🔍 TESTING DATA SYNCHRONIZATION');
    console.log('==============================');
    
    // Check admin panel
    const adminProducts = window.adminPanel?.products?.length || 0;
    console.log('🎛️ Admin Panel Products:', adminProducts);
    
    // Check frontend
    const frontendProducts = window.productDisplay?.products?.length || 0;
    console.log('🏠 Frontend Products:', frontendProducts);
    
    // Check localStorage
    const savedData = localStorage.getItem('adminPanelData');
    let localStorageProducts = 0;
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            localStorageProducts = data.products?.length || 0;
        } catch (e) {
            console.error('❌ Error parsing localStorage:', e);
        }
    }
    console.log('💾 localStorage Products:', localStorageProducts);
    
    // Check backend
    let backendProducts = 0;
    if (window.apiClient) {
        window.apiClient.getProducts().then(response => {
            backendProducts = response.products?.length || 0;
            console.log('🌐 Backend Products:', backendProducts);
            
            // Final synchronization check
            const allSynced = (adminProducts === frontendProducts && 
                             frontendProducts === localStorageProducts && 
                             localStorageProducts === backendProducts);
            
            if (allSynced) {
                console.log('✅ All systems synchronized!');
                console.log(`📊 All systems have ${adminProducts} products`);
            } else {
                console.log('⚠️ Synchronization issues detected:');
                console.log(`   Admin: ${adminProducts}, Frontend: ${frontendProducts}, localStorage: ${localStorageProducts}, Backend: ${backendProducts}`);
            }
            
            return allSynced;
        }).catch(error => {
            console.error('❌ Error checking backend:', error);
            return false;
        });
    }
    
    return adminProducts === frontendProducts && frontendProducts === localStorageProducts;
};

// Comprehensive debugging function
window.debugDataSyncComprehensive = function() {
    console.log('🔍 COMPREHENSIVE DATA SYNC DEBUG');
    console.log('===============================');
    
    // Step 1: Check all systems
    const adminProducts = window.adminPanel?.products?.length || 0;
    const frontendProducts = window.productDisplay?.products?.length || 0;
    const savedData = localStorage.getItem('adminPanelData');
    let localStorageProducts = 0;
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            localStorageProducts = data.products?.length || 0;
        } catch (e) {
            console.error('❌ Error parsing localStorage:', e);
        }
    }
    
    console.log('📊 Current State:');
    console.log(`   Admin Panel: ${adminProducts} products`);
    console.log(`   Frontend: ${frontendProducts} products`);
    console.log(`   localStorage: ${localStorageProducts} products`);
    
    // Step 2: Check backend
    const apiUrl = (window.apiClient?.baseURL + '/products') || '/api/products';
    return fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const backendProducts = data.products?.length || 0;
            console.log(`   Backend: ${backendProducts} products`);
            
            // Step 3: Identify the issue
            if (backendProducts === 0) {
                console.log('❌ ISSUE: Backend has no products');
            } else if (adminProducts === 0) {
                console.log('❌ ISSUE: Admin panel not loading products from backend');
            } else if (frontendProducts === 0) {
                console.log('❌ ISSUE: Frontend not syncing with admin panel');
            } else if (localStorageProducts === 0) {
                console.log('❌ ISSUE: localStorage not being updated');
            } else {
                console.log('✅ All systems have products, checking counts...');
                if (adminProducts !== backendProducts) {
                    console.log('❌ ISSUE: Admin panel count differs from backend');
                }
                if (frontendProducts !== adminProducts) {
                    console.log('❌ ISSUE: Frontend count differs from admin panel');
                }
                if (localStorageProducts !== adminProducts) {
                    console.log('❌ ISSUE: localStorage count differs from admin panel');
                }
            }
            
            // Step 4: Provide solution
            console.log('\n🔧 RECOMMENDED ACTIONS:');
            if (adminProducts === 0) {
                console.log('1. Run: window.fixDataSyncNow()');
            }
            if (frontendProducts !== adminProducts) {
                console.log('2. Run: window.adminPanel.forceSyncWithFrontend()');
            }
            console.log('3. Run: window.forceDataSync()');
            
            // Return summary
            const allSynced = (adminProducts === frontendProducts && 
                             frontendProducts === localStorageProducts && 
                             localStorageProducts === backendProducts);
            
            const result = {
                adminProducts,
                frontendProducts,
                localStorageProducts,
                backendProducts,
                allSynced,
                issues: adminProducts === 0 ? 'Admin panel not loading' : 
                       frontendProducts === 0 ? 'Frontend not syncing' :
                       localStorageProducts === 0 ? 'localStorage not updated' :
                       adminProducts !== backendProducts ? 'Count mismatch' : 'Unknown'
            };
            
            console.log('📊 Debug Result:', result);
            return result;
        })
        .catch(error => {
            console.error('❌ Error checking backend:', error);
            const result = {
                adminProducts,
                frontendProducts,
                localStorageProducts,
                backendProducts: 0,
                allSynced: false,
                issues: 'Backend connection error'
            };
            console.log('📊 Debug Result (Error):', result);
            return result;
        });
};

// Simple immediate fix function
window.fixDataSyncNow = function() {
    console.log('🔧 IMMEDIATE DATA SYNC FIX');
    console.log('=========================');
    
    if (!window.adminPanel) {
        console.log('❌ Admin panel not available');
        return false;
    }
    
    // Step 1: Force load products using direct fetch
    console.log('Step 1: Direct fetch from backend...');
    const apiUrl = (window.apiClient?.baseURL + '/products') || '/api/products';
    return fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.products && data.products.length > 0) {
                console.log('✅ Products fetched:', data.products.length);
                
                // Step 2: Update admin panel
                window.adminPanel.products = data.products;
                console.log('✅ Admin panel updated');
                
                // Step 3: Save to localStorage
                window.adminPanel.saveData();
                console.log('✅ localStorage updated');
                
                // Step 4: Update UI
                window.adminPanel.updateProductsList();
                console.log('✅ UI updated');
                
                // Step 5: Force sync with frontend
                window.adminPanel.forceSyncWithFrontend();
                console.log('✅ Frontend synced');
                
                console.log('🎉 IMMEDIATE FIX COMPLETED!');
                console.log('📊 Admin Panel Products:', window.adminPanel.products.length);
                
                // Step 6: Test synchronization
                setTimeout(() => {
                    const synced = window.testDataSynchronization();
                    console.log('🔍 Sync test result:', synced);
                }, 500);
                
                return true;
            } else {
                console.log('❌ No products in backend response');
                return false;
            }
        })
        .catch(error => {
            console.error('❌ Error in immediate fix:', error);
            return false;
        });
};

// Simple synchronous debug function
window.debugSyncNow = function() {
    console.log('🔍 SIMPLE SYNC DEBUG');
    console.log('===================');
    
    const adminProducts = window.adminPanel?.products?.length || 0;
    const frontendProducts = window.productDisplay?.products?.length || 0;
    const savedData = localStorage.getItem('adminPanelData');
    let localStorageProducts = 0;
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            localStorageProducts = data.products?.length || 0;
        } catch (e) {
            console.error('❌ Error parsing localStorage:', e);
        }
    }
    
    console.log('📊 Current State:');
    console.log(`   Admin Panel: ${adminProducts} products`);
    console.log(`   Frontend: ${frontendProducts} products`);
    console.log(`   localStorage: ${localStorageProducts} products`);
    
    const result = {
        adminProducts,
        frontendProducts,
        localStorageProducts,
        adminPanelExists: !!window.adminPanel,
        productDisplayExists: !!window.productDisplay,
        localStorageData: !!savedData
    };
    
    console.log('📊 Debug Result:', result);
    return result;
};

// Comprehensive fix for all synchronization issues
window.fixAllSyncIssues = function() {
    console.log('🔧 COMPREHENSIVE SYNC FIX');
    console.log('=========================');
    
    if (!window.adminPanel) {
        console.log('❌ Admin panel not available');
        return Promise.resolve(false);
    }
    
    // Step 1: Force load products from backend
    console.log('Step 1: Force loading products from backend...');
    const apiUrl = (window.apiClient?.baseURL + '/products') || '/api/products';
    return fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.products && data.products.length > 0) {
                console.log('✅ Products fetched from backend:', data.products.length);
                
                // Step 2: Update admin panel
                window.adminPanel.products = data.products;
                console.log('✅ Admin panel updated with', data.products.length, 'products');
                
                // Step 3: Save to localStorage
                window.adminPanel.saveData();
                console.log('✅ localStorage updated');
                
                // Step 4: Update UI
                window.adminPanel.updateProductsList();
                console.log('✅ Admin panel UI updated');
                
                // Step 5: Force sync with frontend
                window.adminPanel.forceSyncWithFrontend();
                console.log('✅ Frontend sync completed');
                
                // Step 6: Verify synchronization
                setTimeout(() => {
                    const debugResult = window.debugSyncNow();
                    const synced = (debugResult.adminProducts === debugResult.localStorageProducts);
                    
                    if (synced) {
                        console.log('🎉 ALL SYNC ISSUES FIXED!');
                        console.log('📊 All systems now have', debugResult.adminProducts, 'products');
                    } else {
                        console.log('⚠️ Some sync issues remain');
                        console.log('Debug result:', debugResult);
                    }
                }, 1000);
                
                return true;
            } else {
                console.log('❌ No products in backend response');
                return false;
            }
        })
        .catch(error => {
            console.error('❌ Error in comprehensive fix:', error);
            return false;
        });
};

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
    
    // Add test functions after admin panel is initialized
    window.testContentManagement = function() {
        console.log('🧪 Testing content management functionality...');
        
        try {
            if (!window.adminPanel) {
                console.error('❌ Admin panel not available');
                return false;
            }

            // Test 1: Check if content structure exists
            console.log('Test 1: Checking content structure...');
            if (!window.adminPanel.settings.content) {
                console.log('⚠️ Content structure missing, initializing...');
                window.adminPanel.initializeContentManagement();
            } else {
                console.log('✅ Content structure exists');
            }

            // Test 2: Check form elements
            console.log('Test 2: Checking form elements...');
            const forms = ['heroContentForm', 'addBrandForm', 'socialMediaForm'];
            const missingForms = forms.filter(id => !document.getElementById(id));
            if (missingForms.length > 0) {
                console.error('❌ Missing forms:', missingForms);
                return false;
            } else {
                console.log('✅ All forms found');
            }

            // Test 3: Check hero image elements
            console.log('Test 3: Checking hero image elements...');
            const heroElements = ['uploadHeroImagesBtn', 'heroImageUpload', 'addImageUrlBtn'];
            const missingHeroElements = heroElements.filter(id => !document.getElementById(id));
            if (missingHeroElements.length > 0) {
                console.error('❌ Missing hero elements:', missingHeroElements);
                return false;
            } else {
                console.log('✅ All hero image elements found');
            }

            // Test 4: Test form population
            console.log('Test 4: Testing form population...');
            window.adminPanel.populateContentForms();
            console.log('✅ Forms populated');

            // Test 5: Test form listeners
            console.log('Test 5: Testing form listeners...');
            window.adminPanel.setupContentFormListeners();
            console.log('✅ Form listeners set up');

            // Test 6: Test hero image management
            console.log('Test 6: Testing hero image management...');
            window.adminPanel.setupHeroImageManagement();
            console.log('✅ Hero image management set up');

            console.log('🎉 All content management tests passed!');
            return true;

        } catch (error) {
            console.error('❌ Content management test failed:', error);
            return false;
        }
    };

    // Fix content management issues
    window.fixContentManagement = function() {
        console.log('🔧 Fixing content management issues...');
        
        try {
            if (!window.adminPanel) {
                console.error('❌ Admin panel not available');
                return false;
            }

            // Force comprehensive initialization
            window.adminPanel.initializeContentManagement();
            
            // Force sync with frontend
            window.adminPanel.forceSyncWithFrontend();
            
            console.log('✅ Content management fix completed');
            return true;

        } catch (error) {
            console.error('❌ Content management fix failed:', error);
            return false;
        }
    };
    
    console.log('✅ Admin panel initialized with test functions');
});
