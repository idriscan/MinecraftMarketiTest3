// MineStore Main Functionality

// Login Check
document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    console.log("MineStore Hazır!");

    // Initialize cart count
    updateCartBadge();

    // Render cart if on cart page
    if (window.location.pathname.includes('cart.html')) {
        renderCart();
    }

    // Render checkout if on checkout page
    if (window.location.pathname.includes('checkout.html')) {
        renderCheckout();
        setupCheckoutForm();
    }

    // Buy Button Functionality
    const buyButtons = document.querySelectorAll('.btn-add-cart');

    buyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.target;
            const name = btn.getAttribute('data-name');
            const price = parseInt(btn.getAttribute('data-price'));
            let imageUrl = null;

            // Get the product card for animation and image extraction
            const card = btn.closest('.product-card');
            if (card) {
                // Shake Animation
                card.classList.remove('shake-animation');
                void card.offsetWidth; // Trigger reflow
                card.classList.add('shake-animation');

                // Image Extraction
                const img = card.querySelector('img');
                if (img) {
                    imageUrl = img.src;
                    flyToCart(img);
                }
            }

            addToCart(name, price, imageUrl);

            // Visual feedback
            const originalText = btn.innerText;
            btn.innerText = "EKLENDİ!";
            btn.style.backgroundColor = "#333";

            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.backgroundColor = "";
            }, 1000);
        });
    });
});

function checkLogin() {
    // If we are on login page, do nothing
    if (window.location.pathname.includes('login.html')) return;

    // LOGIN REQUIREMENT REMOVED PER USER REQUEST
    // const isLoggedIn = localStorage.getItem('minestore_isLoggedIn');
    // if (!isLoggedIn) {
    //     window.location.href = 'login.html';
    // }
}

function addToCart(name, price, imageUrl) {
    let cart = JSON.parse(localStorage.getItem('minestore_cart')) || [];

    // Save item with image
    // If no image provided (e.g. from a different context), use placeholder
    const itemImage = imageUrl || 'images/placeholder.png';

    // Simple ID generator
    cart.push({ name, price, image: itemImage, id: Date.now() });

    localStorage.setItem('minestore_cart', JSON.stringify(cart));
    updateCartBadge(true); // true to trigger pulse

    // Show Toast
    showToast(`${name} sepete eklendi!`);
}

function updateCartBadge(animate = false) {
    const cart = JSON.parse(localStorage.getItem('minestore_cart')) || [];
    const badges = document.querySelectorAll('.badge'); // In case used in mobile menu too
    badges.forEach(badge => {
        badge.innerText = cart.length;
        badge.style.display = cart.length > 0 ? 'inline-block' : 'none';

        if (animate) {
            badge.classList.remove('pulse');
            void badge.offsetWidth;
            badge.classList.add('pulse');
        }
    });
}

// Flying Item Animation
function flyToCart(startElement) {
    const cartIcon = document.querySelector('.navbar a[href*="cart"]');
    if (!cartIcon || !startElement) return;

    // Clone the image
    const flyer = startElement.cloneNode();
    flyer.classList.add('flying-item');

    const startRect = startElement.getBoundingClientRect();
    const endRect = cartIcon.getBoundingClientRect();

    flyer.style.left = `${startRect.left}px`;
    flyer.style.top = `${startRect.top}px`;
    flyer.style.width = `${startRect.width}px`;
    flyer.style.height = `${startRect.height}px`;

    document.body.appendChild(flyer);

    // Animate to cart
    setTimeout(() => {
        flyer.style.left = `${endRect.left + endRect.width / 2 - 25}px`; // Center on cart
        flyer.style.top = `${endRect.top + endRect.height / 2 - 25}px`;
        flyer.style.width = '50px';
        flyer.style.height = '50px';
        flyer.style.opacity = '0.5';
    }, 10);

    // Cleanup
    setTimeout(() => {
        flyer.remove();
    }, 800);
}

function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem('minestore_cart')) || [];
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('minestore_cart', JSON.stringify(cart));

    // Refresh UI based on current page
    if (window.location.pathname.includes('cart.html')) renderCart();
    if (window.location.pathname.includes('checkout.html')) renderCheckout();

    updateCartBadge();
}

function clearCart() {
    localStorage.removeItem('minestore_cart');
    if (window.location.pathname.includes('cart.html')) renderCart();
    updateCartBadge();
}

function renderCart() {
    const cartContainer = document.getElementById('cart-items-container');
    if (!cartContainer) return;

    const cart = JSON.parse(localStorage.getItem('minestore_cart')) || [];
    const emptyState = document.getElementById('empty-state');
    const filledState = document.getElementById('filled-state');
    const totalPriceEl = document.getElementById('total-price');

    if (cart.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (filledState) filledState.style.display = 'none';
    } else {
        if (emptyState) emptyState.style.display = 'none';
        if (filledState) filledState.style.display = 'block';

        cartContainer.innerHTML = '';
        let total = 0;

        cart.forEach(item => {
            total += item.price;
            const row = document.createElement('div');
            row.className = 'cart-item-row';

            // Use saved image or absolute placeholder fallback
            const imgSrc = item.image || 'https://placehold.co/100x100?text=Item';

            row.innerHTML = `
                <div class="cart-item-info">
                    <img src="${imgSrc}" alt="${item.name}" class="cart-item-icon" style="object-fit: contain; background: #eee;">
                    <span>${item.name}</span>
                </div>
                <div class="cart-item-actions">
                    <span class="cart-item-price">${item.price} TL</span>
                    <button class="btn-remove" onclick="removeFromCart(${item.id})">Sil</button>
                </div>
            `;
            cartContainer.appendChild(row);
        });

        if (totalPriceEl) totalPriceEl.innerText = `${total} TL`;
    }
}

// Checkout Page Logic
function renderCheckout() {
    const list = document.getElementById('checkout-items-list');
    const totalEl = document.getElementById('checkout-total-price');
    if (!list || !totalEl) return;

    const cart = JSON.parse(localStorage.getItem('minestore_cart')) || [];
    list.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding: 1rem;">Sepetiniz boş.</p>';
        totalEl.innerText = '0 TL';
        // Disable submit button if empty
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        return;
    }

    cart.forEach(item => {
        total += item.price;
        const div = document.createElement('div');
        div.className = 'checkout-item';

        // Use saved image or absolute placeholder fallback
        const imgSrc = item.image || 'https://placehold.co/100x100?text=Item';

        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${imgSrc}" style="width: 30px; height: 30px; object-fit: contain; border: 1px solid #eee; border-radius: 4px;">
                <span>${item.name}</span>
            </div>
            <span style="font-weight: bold;">${item.price} TL</span>
        `;
        list.appendChild(div);
    });

    totalEl.innerText = `${total} TL`;
}

function setupCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Show the disclaimer modal instead of processing
        showDisclaimerModal();
    });
}

// Disclaimer Modal Functions
function showDisclaimerModal() {
    const modal = document.getElementById('disclaimer-modal');
    if (modal) {
        modal.classList.remove('hidden');

        // Setup close button
        const closeBtn = document.getElementById('close-disclaimer-btn');
        if (closeBtn) {
            closeBtn.onclick = () => {
                closeDisclaimerModal();
            };
        }


        // Close on overlay click (outside the modal box)
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeDisclaimerModal();
            }
        };
    }
}

function closeDisclaimerModal() {
    const modal = document.getElementById('disclaimer-modal');
    if (modal) {
        modal.classList.add('hidden');

        // Clear cart and redirect to homepage
        localStorage.removeItem('minestore_cart');
        updateCartBadge();

        // Redirect to homepage
        window.location.href = 'index.html';
    }
}

// Simple Toast Notification
function showToast(message) {
    // Check if toast container exists
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.cssText = `
        background-color: #333;
        color: #fff;
        padding: 1rem 2rem;
        margin-top: 10px;
        border-radius: 4px;
        border-left: 5px solid #53c43f;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-family: 'Rubik', sans-serif;
        animation: slideIn 0.3s ease-out forwards;
    `;

    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add animation keyframes for toast (kept from original, ensured existence)
// (Note: styles are now largely in style.css, but dynamic generic styles can stay)
const style = document.createElement('style');
style.innerHTML = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    /* Dynamic classes */
`;
document.head.appendChild(style);

// --- CENTRAL PRODUCT DATABASE ---
const allProducts = [
    // TEMEL BLOKLAR
    { id: 1, name: "Toprak", category: "Temel", price: 5, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/dirt.png" },
    { id: 2, name: "Taş", category: "Temel", price: 10, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/stone.png" },
    { id: 3, name: "Meşe Odunu", category: "Temel", price: 15, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/oak_log.png" },
    { id: 4, name: "Kum", category: "Temel", price: 8, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/sand.png" },
    { id: 5, name: "Çakıl", category: "Temel", price: 5, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/gravel.png" },

    // MADEN CEVHERLERİ
    { id: 6, name: "Kömür Cevheri", category: "Maden", price: 40, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/coal_ore.png" },
    { id: 7, name: "Demir Cevheri", category: "Maden", price: 100, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/iron_ore.png" },
    { id: 8, name: "Altın Cevheri", category: "Maden", price: 250, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/gold_ore.png" },
    { id: 9, name: "Elmas Cevheri", category: "Maden", price: 2000, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/diamond_ore.png" },
    { id: 10, name: "Zümrüt Cevheri", category: "Maden", price: 1500, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/emerald_ore.png" },

    // DEKORASYON
    { id: 11, name: "Kitaplık", category: "Dekor", price: 50, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/bookshelf.png" },
    { id: 12, name: "Meşale", category: "Dekor", price: 10, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/torch.png" },
    { id: 13, name: "Çiçek Saksısı", category: "Dekor", price: 25, image: "https://static.wikia.nocookie.net/minecraft_gamepedia/images/b/b3/Flower_Pot_JE2_BE2.png" },
    { id: 14, name: "Renkli Cam", category: "Dekor", price: 30, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/glass.png" },
    { id: 15, name: "Işıktaşı", category: "Dekor", price: 80, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/glowstone.png" },

    // YAPI BLOKLARI
    { id: 16, name: "Tuğla", category: "Yapı", price: 45, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/bricks.png" },
    { id: 17, name: "Kumtaşı", category: "Yapı", price: 20, image: "https://static.wikia.nocookie.net/minecraft_gamepedia/images/d/d6/Sandstone_JE2_BE2.png" },
    { id: 18, name: "Kar Bloğu", category: "Yapı", price: 15, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/snow.png" },
    { id: 19, name: "Obsidyen", category: "Yapı", price: 500, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/obsidian.png" },
    { id: 20, name: "End Taşı", category: "Yapı", price: 120, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/end_stone.png" },

    // ALETLER
    { id: 21, name: "Elmas Kazma", category: "Alet", price: 2500, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/diamond_pickaxe.png" },
    { id: 22, name: "Demir Kürek", category: "Alet", price: 300, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/iron_shovel.png" },
    { id: 23, name: "Altın Balta", category: "Alet", price: 500, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/golden_axe.png" },
    { id: 24, name: "Taş Çapa", category: "Alet", price: 50, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/stone_hoe.png" },
    { id: 25, name: "Olta", category: "Alet", price: 150, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/fishing_rod.png" },

    // SİLAHLAR
    { id: 26, name: "Netherit Kılıç", category: "Silah", price: 5000, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/netherite_sword.png" },
    { id: 27, name: "Yay", category: "Silah", price: 200, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/bow.png" },
    { id: 28, name: "Ok (64'lü)", category: "Mühimmat", price: 100, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/arrow.png" },
    { id: 29, name: "Üçlü Mızrak", category: "Silah", price: 3500, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/trident.png" },
    { id: 30, name: "Tatar Yayı", category: "Silah", price: 600, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/crossbow_standby.png" },

    // ZIRHLAR
    { id: 31, name: "Elmas Miğfer", category: "Zırh", price: 1200, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/diamond_helmet.png" },
    { id: 32, name: "Demir Göğüslük", category: "Zırh", price: 800, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/iron_chestplate.png" },
    { id: 33, name: "Altın Pantolon", category: "Zırh", price: 600, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/golden_leggings.png" },
    { id: 34, name: "Deri Botlar", category: "Zırh", price: 100, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/leather_boots.png" },
    { id: 35, name: "Kalkan", category: "Off-Hand", price: 300, image: "https://static.wikia.nocookie.net/minecraft_gamepedia/images/c/c6/Shield_JE2_BE1.png" },

    // YİYECEK & İKSİRLER
    { id: 36, name: "Ekmek", category: "Yiyecek", price: 10, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/bread.png" },
    { id: 37, name: "Pişmiş Biftek", category: "Yiyecek", price: 25, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/cooked_beef.png" },
    { id: 38, name: "Büyülü Altın Elma", category: "Özel", price: 5000, image: "https://static.wikia.nocookie.net/minecraft_gamepedia/images/a/a2/Enchanted_Golden_Apple_JE2_BE2.gif" },
    { id: 39, name: "İyileştirme İksiri", category: "İksir", price: 150, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/potion.png" },
    { id: 40, name: "Hız İksiri", category: "İksir", price: 150, image: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/potion.png" }
];

// --- SEARCH PAGE LOGIC ---
if (window.location.pathname.includes('search.html')) {
    document.addEventListener('DOMContentLoaded', handleSearchPage);
}

function handleSearchPage() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query') || '';
    const resultsContainer = document.getElementById('search-results-grid');
    const titleEl = document.getElementById('search-title');
    const sortSelect = document.getElementById('sort-select');
    const categorySelect = document.getElementById('category-select');

    if (titleEl) {
        titleEl.innerText = query ? `Arama Sonuçları: "${query}"` : "Tüm Ürünler";
    }

    // Prepare filter options
    // Extract unique categories
    const categories = [...new Set(allProducts.map(p => p.category))];
    if (categorySelect) {
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = cat;
            categorySelect.appendChild(opt);
        });
    }

    // Initial Filter & Render
    filterAndRenderProducts(query, 'all', 'default');

    // Event Listeners for Filters
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            filterAndRenderProducts(query, categorySelect.value, sortSelect.value);
        });
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            filterAndRenderProducts(query, categorySelect.value, sortSelect.value);
        });
    }
}

function filterAndRenderProducts(query, categoryFilter, sortOption) {
    const resultsContainer = document.getElementById('search-results-grid');
    const noResults = document.getElementById('no-results');

    if (!resultsContainer) return;

    // 1. Filter by Query
    let filtered = allProducts.filter(p => {
        const q = query.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    });

    // 2. Filter by Category Dropdown
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // 3. Sort
    if (sortOption === 'price_asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price_desc') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'name_asc') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    // 'relevance' or default keeps original order or effectively filtered order

    // 4. Render
    resultsContainer.innerHTML = '';

    if (filtered.length === 0) {
        if (noResults) noResults.style.display = 'block';
    } else {
        if (noResults) noResults.style.display = 'none';

        filtered.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';

            // Image fallback logic is same as others
            // Just use the URL from DB, if it breaks, the onerror in HTML string handles it?
            // Safer to use the same onerror logic as HTML files
            const fallback = `this.onerror=null; this.src='https://placehold.co/200x200?text=${encodeURIComponent(product.name)}'`;

            card.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" onerror="${fallback}">
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-desc">En kaliteli ${product.category.toLowerCase()} ürünü.</p>
                    <div class="product-footer">
                        <span class="product-price">${product.price} TL</span>
                        <button class="btn-add-cart-dynamic" data-name="${product.name}" data-price="${product.price}" data-image="${product.image}">EKLE</button>
                    </div>
                </div>
            `;
            resultsContainer.appendChild(card);
        });

        // Re-attach listeners for new dynamic buttons using delegation or re-query
        attachDynamicCartListeners();
    }
}

function attachDynamicCartListeners() {
    const buttons = document.querySelectorAll('.btn-add-cart-dynamic');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const name = btn.getAttribute('data-name');
            const price = parseInt(btn.getAttribute('data-price'));
            const image = btn.getAttribute('data-image');

            // Animation logic similar to main listener could be added here
            addToCart(name, price, image);

            const originalText = btn.innerText;
            btn.innerText = "EKLENDİ!";
            btn.style.backgroundColor = "#333";
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.backgroundColor = "";
            }, 1000);
        });
    });
}

// --- CONTACT PAGE LOGIC ---
if (window.location.pathname.includes('contact.html')) {
    document.addEventListener('DOMContentLoaded', setupContactPage);
}

function setupContactPage() {
    const contactForm = document.getElementById('contact-form');
    const modal = document.getElementById('feedback-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // Form Submit & Modal
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Show Modal
            if (modal) {
                modal.classList.remove('hidden');
            }

            // Allow closing
            if (closeModalBtn) {
                closeModalBtn.onclick = () => {
                    modal.classList.add('hidden');
                    contactForm.reset();
                };
            }

            // Close on overlay click
            if (modal) {
                modal.onclick = (e) => {
                    if (e.target === modal) {
                        modal.classList.add('hidden');
                        contactForm.reset();
                    }
                };
            }
        });
    }
}
