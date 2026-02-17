// init.js - Initializes all systems when DOM is ready
document.addEventListener('DOMContentLoaded', function () {

    // Show announcement on mobile
    (function () {
        var banner = document.getElementById('announcementBanner');
        if (banner && window.innerWidth <= 768) {
            banner.style.display = 'block';
            banner.style.visibility = 'visible';
            banner.style.opacity = '1';
        }
    })();

    // Initialize ProductDisplay
    setTimeout(function () {
        if (typeof ProductDisplay !== 'undefined' && !window.productDisplay) {
            window.productDisplay = new ProductDisplay();
        }

        if (typeof WebsiteContentManager !== 'undefined' && !window.websiteContentManager) {
            window.websiteContentManager = new WebsiteContentManager();
        }
    }, 1000);

    // WhatsApp button delegation
    document.body.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-wa-product]');
        if (btn) {
            var productInfo = decodeURIComponent(btn.getAttribute('data-wa-product'));
            window.open('https://wa.me/917000532010?text=' + encodeURIComponent('Hi! I am interested in ' + productInfo + '. Can you provide more information?'), '_blank');
        }
    });

    console.log('init.js loaded successfully');
});
