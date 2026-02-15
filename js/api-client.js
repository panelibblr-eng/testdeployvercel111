// API Client for Monica Opto Hub Backend
class ApiClient {
    constructor(baseURL = null) {
        // Auto-detect API URL based on environment
        if (!baseURL) {
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const port = window.location.port;

            // If opened directly from disk or no hostname, force localhost backend
            if (protocol === 'file:' || !hostname) {
                this.baseURL = 'http://localhost:3001/api';
            } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
                // Local development
                this.baseURL = 'http://localhost:3001/api';
            } else {
                // For production, use same origin (no hardcoded localhost)
                // This works for both same-domain and subdomain deployments
                // Also works with Netlify Functions via redirects
                const apiPort = port && port !== '80' && port !== '443' ? `:${port}` : '';
                this.baseURL = `${protocol}//${hostname}${apiPort}/api`;
            }
        } else {
            this.baseURL = baseURL;
        }
        
        this.token = localStorage.getItem('adminToken');
        this.retryConfig = {
            maxRetries: 3,
            retryDelay: 1000, // 1 second
            retryMultiplier: 2, // Exponential backoff
            timeout: 10000 // 10 seconds
        };
        this.connectionStatus = 'unknown';
        this.lastHealthCheck = 0;
        this.healthCheckInterval = 30000; // 30 seconds
        this.offlineMode = false;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Start health monitoring
        this.startHealthMonitoring();
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('adminToken', token);
        } else {
            localStorage.removeItem('adminToken');
        }
    }

    // Build headers depending on body type
    buildHeaders(body, overrideHeaders = {}) {
        const headers = {};
        // Only set JSON content type when not sending FormData
        if (!(typeof FormData !== 'undefined' && body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        // Apply any explicit overrides (e.g., to add custom headers)
        return { ...headers, ...overrideHeaders };
    }

    // Health monitoring methods
    startHealthMonitoring() {
        // Check connection health periodically
        setInterval(() => {
            this.checkConnectionHealth();
        }, this.healthCheckInterval);
        
        // Initial health check
        this.checkConnectionHealth();
    }

    async checkConnectionHealth() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                this.connectionStatus = 'connected';
                this.offlineMode = false;
                this.lastHealthCheck = Date.now();
                console.log('✅ Backend connection healthy');
            } else {
                this.connectionStatus = 'error';
                console.warn('⚠️ Backend health check failed:', response.status);
            }
        } catch (error) {
            this.connectionStatus = 'disconnected';
            this.offlineMode = true;
            console.warn('❌ Backend connection lost:', error.message);
            this.notifyConnectionStatus('disconnected');
        }
    }

    notifyConnectionStatus(status) {
        // Dispatch custom event for connection status changes
        window.dispatchEvent(new CustomEvent('connectionStatusChanged', {
            detail: { status, timestamp: Date.now() }
        }));
    }

    // Cache management
    getCacheKey(endpoint, options = {}) {
        const method = options.method || 'GET';
        const body = options.body ? JSON.stringify(options.body) : '';
        return `${method}:${endpoint}:${body}`;
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('📦 Cache hit for:', key);
            return cached.data;
        }
        if (cached) {
            this.cache.delete(key);
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache cleared');
    }

    // Enhanced request method with retry logic and caching
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = { ...options };
        config.headers = this.buildHeaders(options.body, options.headers || {});
        
        // Check cache for GET requests
        const cacheKey = this.getCacheKey(endpoint, options);
        if (options.method === 'GET' || !options.method) {
            const cached = this.getFromCache(cacheKey);
            if (cached && !this.offlineMode) {
                return cached;
            }
        }

        // Retry logic
        let lastError;
        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            let timeoutId = null;
            let controller = null;
            
            try {
                // Only log on first attempt to reduce noise
                if (attempt === 0) {
                    console.log(`🔄 API request to: ${endpoint}`);
                }
                
                // Add timeout with proper cleanup
                controller = new AbortController();
                timeoutId = setTimeout(() => {
                    controller.abort();
                }, this.retryConfig.timeout);
                config.signal = controller.signal;
                
                const response = await fetch(url, config);
                
                // Clear timeout on success
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                
                if (!response.ok) {
                    const errorText = await response.text();
                    
                    // Parse error to check if it's a database connection error
                    let errorData = null;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch (e) {
                        // Not JSON, use as-is
                    }
                    
                    const isDatabaseError = errorData && (
                        errorData.message && (
                            errorData.message.includes('MongoDB') ||
                            errorData.message.includes('querySrv') ||
                            errorData.message.includes('EREFUSED') ||
                            errorData.message.includes('Database not available')
                        )
                    );
                    
                    // Only log non-database errors to reduce noise
                    if (!isDatabaseError) {
                        console.error('API response error:', response.status, errorText);
                    } else {
                        // Silent for database errors - they're expected when MongoDB isn't available
                        if (attempt === 0) {
                            console.log('ℹ️ Database not available, using localStorage');
                        }
                    }
                    
                    // Handle authentication errors
                    if (response.status === 401 || response.status === 403) {
                        this.setToken(null);
                        localStorage.removeItem('adminLoggedIn');
                        
                        if (window.adminPanel) {
                            window.adminPanel.clearAuth();
                            window.adminPanel.checkAuth();
                        }
                    }
                    
                    // Don't retry on client errors (4xx) or database errors (expected)
                    if (response.status >= 400 && response.status < 500) {
                        throw new Error(`HTTP ${response.status}: ${errorText}`);
                    }
                    
                    // For database errors (5xx), return empty/default data instead of throwing
                    if (isDatabaseError && response.status === 500) {
                        // Return empty object for GET requests so frontend can use localStorage
                        if (options.method === 'GET' || !options.method) {
                            return { success: true, settings: {}, message: 'Database not available' };
                        }
                        // For other methods, throw but don't retry
                        throw new Error(`Database unavailable: ${errorData?.message || 'MongoDB connection failed'}`);
                    }
                    
                    // Retry on other server errors (5xx)
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
                
                const data = await response.json();
                
                // Only log success on first attempt or if it's not a routine GET request
                if (attempt === 0 || (options.method && options.method !== 'GET')) {
                    console.log('✅ API response success');
                }
                
                // Cache successful GET responses
                if (options.method === 'GET' || !options.method) {
                    this.setCache(cacheKey, data);
                }
                
                // Update connection status on success
                this.connectionStatus = 'connected';
                this.offlineMode = false;
                
                return data;
                
            } catch (error) {
                // Clean up timeout
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                
                lastError = error;
                
                // Handle AbortError (timeout) with better message
                if (error.name === 'AbortError') {
                    const timeoutError = new Error(`Request timeout after ${this.retryConfig.timeout}ms: ${endpoint}`);
                    timeoutError.name = 'TimeoutError';
                    
                    // Only log timeout on last attempt to reduce noise
                    if (attempt === this.retryConfig.maxRetries) {
                        console.warn(`⏱️ Request timeout: ${endpoint}`);
                    }
                    
                    // Don't retry on timeout if it's the last attempt
                    if (attempt === this.retryConfig.maxRetries) {
                        throw timeoutError;
                    }
                    
                    // Continue to retry for timeout errors
                    lastError = timeoutError;
                }
                
                // Check if error is database-related
                const isDatabaseError = error.message && (
                    error.message.includes('MongoDB') ||
                    error.message.includes('querySrv') ||
                    error.message.includes('EREFUSED') ||
                    error.message.includes('Database not available') ||
                    error.message.includes('Database unavailable')
                );
                
                // Don't retry on certain errors - throw immediately
                if (error.name !== 'AbortError' && 
                    (error.message.includes('HTTP 4') && !error.message.includes('HTTP 5')) ||
                    isDatabaseError) {
                    // Only log 404 errors if they're not for products (less verbose)
                    if (error.message.includes('404')) {
                        // Silent for 404s on routine requests
                        if (!endpoint.includes('/products') && attempt === 0) {
                            console.log(`ℹ️ Resource not found (404): ${endpoint}`);
                        }
                    } else if (isDatabaseError) {
                        // Silent for database errors - expected when MongoDB isn't available
                        // Don't log at all, just return empty data
                    } else {
                        // Only log on first attempt
                        if (attempt === 0) {
                            console.warn(`❌ API request failed: ${error.message}`);
                        }
                    }
                    // Throw immediately for 4xx errors and database errors - don't retry
                    throw error;
                }
                
                // Only log retry attempts if not a timeout (timeouts are handled above)
                if (error.name !== 'AbortError' && attempt < this.retryConfig.maxRetries) {
                    console.warn(`❌ API request attempt ${attempt + 1} failed: ${error.message}`);
                }
                
                // Wait before retry (exponential backoff)
                if (attempt < this.retryConfig.maxRetries) {
                    const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.retryMultiplier, attempt);
                    // Only log retry delay for non-timeout errors to reduce noise
                    if (error.name !== 'AbortError') {
                        console.log(`⏳ Waiting ${delay}ms before retry...`);
                    }
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        // All retries failed
        this.connectionStatus = 'disconnected';
        this.offlineMode = true;
        this.notifyConnectionStatus('disconnected');
        
        // Try to return cached data as fallback
        if (options.method === 'GET' || !options.method) {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log('🔄 Using cached data as fallback');
                return cached;
            }
        }
        
        // Enhanced error message
        if (lastError.name === 'TypeError' && lastError.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to server. Please check your internet connection and ensure the backend server is running.');
        }
        
        throw new Error(`Request failed after ${this.retryConfig.maxRetries + 1} attempts: ${lastError.message}`);
    }

    // Authentication methods
    async login(username, password) {
        const response = await this.request('/admin/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        this.setToken(response.token);
        return response;
    }

    async logout() {
        try {
            await this.request('/admin/logout', { method: 'POST' });
        } finally {
            this.setToken(null);
        }
    }

    // Product methods
    async getProducts(filters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        });
        
        const queryString = params.toString();
        const endpoint = queryString ? `/products?${queryString}` : '/products';
        
        return await this.request(endpoint);
    }

    async getProduct(id) {
        try {
            return await this.request(`/products/${id}`);
        } catch (error) {
            // If product not found, return null instead of throwing
            if (error.message.includes('404')) {
                console.log(`ℹ️ Product with ID ${id} not found`);
                return null;
            }
            throw error;
        }
    }

    async getBrands() {
        return await this.request('/products/brands');
    }

    async createProduct(productData) {
        // Accept FormData directly to preserve appended files
        const body = (typeof FormData !== 'undefined' && productData instanceof FormData)
            ? productData
            : (() => {
                const fd = new FormData();
                Object.entries(productData).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        fd.append(key, value);
                    }
                });
                return fd;
            })();

        console.log('Creating product - using FormData:', body instanceof FormData);
        if (body instanceof FormData) {
            console.log('FormData entries:', Array.from(body.entries()));
        }

        return await this.request('/products', {
            method: 'POST',
            headers: {}, // Let browser set Content-Type for FormData
            body
        });
    }

    async updateProduct(id, productData) {
        console.log('API Client - updateProduct called with ID:', id, 'and data:', productData);
        const body = (typeof FormData !== 'undefined' && productData instanceof FormData)
            ? productData
            : (() => {
                const fd = new FormData();
                Object.entries(productData).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        fd.append(key, value);
                    }
                });
                return fd;
            })();

        if (body instanceof FormData) {
            console.log('API Client - FormData entries:', Array.from(body.entries()));
        }
        console.log('API Client - Making PUT request to:', `/products/${id}`);

        return await this.request(`/products/${id}`, {
            method: 'PUT',
            headers: {}, // Let browser set Content-Type for FormData
            body
        });
    }

    async deleteProduct(id) {
        return await this.request(`/products/${id}`, { method: 'DELETE' });
    }

    async getProductStats() {
        return await this.request('/products/stats/summary');
    }

    async bulkImportProducts(products) {
        return await this.request('/products/bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ products })
        });
    }

    async bulkImportInventory(inventoryItems) {
        return await this.request('/products/inventory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inventoryItems })
        });
    }

    // Admin methods
    async getProfile() {
        return await this.request('/admin/profile');
    }

    async updateProfile(profileData) {
        return await this.request('/admin/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async getDashboard() {
        return await this.request('/admin/dashboard');
    }

    async getSettings() {
        return await this.request('/admin/settings');
    }

    async updateSettings(settings) {
        return await this.request('/admin/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    // Appointment methods
    async getAppointments(filters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        });
        
        const queryString = params.toString();
        const endpoint = queryString ? `/appointments?${queryString}` : '/appointments';
        
        return await this.request(endpoint);
    }

    async getAppointment(id) {
        return await this.request(`/appointments/${id}`);
    }

    async createAppointment(appointmentData) {
        return await this.request('/appointments', {
            method: 'POST',
            body: JSON.stringify(appointmentData)
        });
    }

    async updateAppointmentStatus(id, status) {
        return await this.request(`/appointments/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    async deleteAppointment(id) {
        return await this.request(`/appointments/${id}`, { method: 'DELETE' });
    }

    async getAppointmentStats() {
        return await this.request('/appointments/stats/summary');
    }

    // Analytics methods
    async trackVisitor(visitorData) {
        return await this.request('/analytics/track', {
            method: 'POST',
            body: JSON.stringify(visitorData)
        });
    }

    async getAnalyticsStats(period = '30') {
        return await this.request(`/analytics/stats?period=${period}`);
    }

    async getVisitorTimeline(period = '7') {
        return await this.request(`/analytics/timeline?period=${period}`);
    }

    async getPageAnalytics(period = '30') {
        return await this.request(`/analytics/pages?period=${period}`);
    }

    // Health check
    async healthCheck() {
        return await this.request('/health');
    }

    // Connection status methods
    getConnectionStatus() {
        return {
            status: this.connectionStatus,
            offlineMode: this.offlineMode,
            lastHealthCheck: this.lastHealthCheck,
            cacheSize: this.cache.size
        };
    }

    isConnected() {
        return this.connectionStatus === 'connected' && !this.offlineMode;
    }

    isOffline() {
        return this.offlineMode;
    }

    // Force reconnection
    async reconnect() {
        console.log('🔄 Attempting to reconnect...');
        this.offlineMode = false;
        this.connectionStatus = 'unknown';
        await this.checkConnectionHealth();
        return this.isConnected();
    }

    // Offline data management
    getOfflineData() {
        try {
            const adminData = localStorage.getItem('adminPanelData');
            return adminData ? JSON.parse(adminData) : null;
        } catch (error) {
            console.error('Error reading offline data:', error);
            return null;
        }
    }

    saveOfflineData(data) {
        try {
            localStorage.setItem('adminPanelData', JSON.stringify(data));
            console.log('💾 Data saved for offline use');
        } catch (error) {
            console.error('Error saving offline data:', error);
        }
    }

    // Batch operations for offline support
    async batchRequest(requests) {
        const results = [];
        const errors = [];
        
        for (const request of requests) {
            try {
                const result = await this.request(request.endpoint, request.options);
                results.push({ success: true, data: result, request });
            } catch (error) {
                errors.push({ success: false, error: error.message, request });
            }
        }
        
        return { results, errors, total: requests.length };
    }
}

// Create global API client instance
window.apiClient = new ApiClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}
