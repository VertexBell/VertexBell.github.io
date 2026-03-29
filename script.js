/* Centralized scripts for all HTML pages */

/* Common fade-in on load */
window.addEventListener('load', () => {
    // gentle fade-in on full load (use CSS animation fallback for reduced motion)
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.style.opacity = 1;
    } else {
        document.body.animate(
            { opacity: [0,1] },
            { duration: 700, easing: 'cubic-bezier(.2,.9,.2,1)', fill: 'forwards' }
        );
    }
});

/* -------------------------
   Utilities used by pages
   ------------------------- */

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Extract ::img:: inline markup
function extractInlineImage(text) {
    if (!text) return { html: escapeHtml(text || ''), image: null };
    const imgPattern = /::img::\s*(.*?)\s*::\/img::/s;
    const m = text.match(imgPattern);
    if (m) {
        const url = m[1].trim();
        const cleaned = text.replace(imgPattern, '').trim();
        return { html: escapeHtml(cleaned), image: url };
    }
    return { html: escapeHtml(text), image: null };
}

/* -------------------------
   index.html: Last News logic
   ------------------------- */

// Simple YAML parser for the small page.yml structure (last_news)
function parseSimpleYAML(yamlText) {
    const lines = yamlText.split(/\r?\n/);
    const result = {};
    let currentKey = null;
    let currentItem = null;
    for (let raw of lines) {
        const line = raw.replace(/\t/g,'    ');
        if (!line.trim() || line.trim().startsWith('#')) continue;
        if (/^[\w-]+:\s*$/.test(line)) {
            currentKey = line.split(':')[0].trim();
            result[currentKey] = [];
            currentItem = null;
        } else if (/^\s*-\s*/.test(line)) {
            // new list item
            currentItem = {};
            result[currentKey].push(currentItem);
            const rest = line.replace(/^\s*-\s*/, '');
            if (/:/.test(rest)) {
                const [k, v] = rest.split(/:\s*(.*)/s).slice(0,2);
                currentItem[k.trim()] = v !== undefined ? v.trim() : '';
            }
        } else if (/^\s+[\w-]+:\s*(.*)/.test(line)) {
            const m = line.match(/^\s+([\w-]+):\s*(.*)/);
            if (m && currentItem) currentItem[m[1]] = m[2] || '';
        }
    }
    return result;
}

async function loadAndRenderLastNews() {
    try {
        const resp = await fetch('page.yml');
        if (!resp.ok) throw new Error('Failed to load page.yml');
        const text = await resp.text();
        const data = parseSimpleYAML(text);

        const newsList = document.getElementById('news-list');
        if (!newsList) return;
        newsList.innerHTML = '';

        if (data.last_news) {
            data.last_news.forEach(item => {
                const card = document.createElement('article');
                card.className = 'featured-item';

                // Prefer inline image in summary or image field
                let imageUrl = null;
                if (item.image && item.image.includes('::img::')) {
                    const parsed = extractInlineImage(item.image);
                    imageUrl = parsed.image;
                } else if (item.image && item.image !== 'placeholder.jpg') {
                    imageUrl = item.image;
                }

                // Also check summary for inline image markup
                let summaryHtml = '';
                if (item.summary && item.summary.includes('::img::')) {
                    const parsed = extractInlineImage(item.summary);
                    summaryHtml = parsed.html;
                    if (!imageUrl && parsed.image) imageUrl = parsed.image;
                } else {
                    summaryHtml = escapeHtml(item.summary || '');
                }

                if (imageUrl) {
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = item.title || 'News';
                    card.appendChild(img);
                } else {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'placeholder-block';
                    card.appendChild(placeholder);
                }

                const h4 = document.createElement('h4');
                h4.textContent = item.title || '';
                const p = document.createElement('p');
                p.innerHTML = summaryHtml;
                card.appendChild(h4);
                card.appendChild(p);
                newsList.appendChild(card);
            });
        }
    } catch (e) {
        console.warn('Could not load page.yml', e);
    }
}

/* -------------------------
   products.html: Products logic
   ------------------------- */

// Parser for numeric-keyed products block
function parseProductsYAML(yamlText) {
    const lines = yamlText.split(/\r?\n/);
    const products = [];
    let inProducts = false;
    let current = null;

    for (let raw of lines) {
        const line = raw.replace(/\t/g, '    ');
        if (!line.trim() || line.trim().startsWith('#')) continue;

        if (/^\s*products:\s*$/.test(line)) {
            inProducts = true;
            continue;
        }

        if (!inProducts) continue;

        const keyMatch = line.match(/^(\s*)(\d+):\s*$/);
        if (keyMatch) {
            if (current) products.push(current);
            current = {};
            continue;
        }

        const fieldMatch = line.match(/^(\s+)([\w-]+):\s*(.*)$/);
        if (fieldMatch && current) {
            const k = fieldMatch[2];
            let v = fieldMatch[3] !== undefined ? fieldMatch[3].trim() : '';
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                v = v.slice(1, -1);
            }
            current[k] = v;
        } else {
            if (/^[^\s]/.test(line)) break;
        }
    }
    if (current) products.push(current);
    return products;
}

function makeItemCard(item, kind) {
    // vertical product card
    const card = document.createElement('article');
    card.className = kind === 'games' ? 'game-item product-card' : 'software-item product-card';
    card.tabIndex = 0;
    card.setAttribute('role','button');
    card.setAttribute('aria-label', (item.title || 'Product') + ' details');

    // image (cover)
    let imageUrl = null;
    if (item.image && item.image.includes('::img::')) {
        imageUrl = extractInlineImage(item.image).image;
    } else if (item.image && item.image !== 'placeholder.jpg' && item.image !== '') {
        imageUrl = item.image;
    }

    const imgWrap = document.createElement('div');
    imgWrap.className = 'product-image-wrap';
    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = item.title || '';
        img.className = 'product-cover';
        imgWrap.appendChild(img);
    } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder-block';
        placeholder.style.height = '220px';
        placeholder.style.borderRadius = '8px';
        placeholder.style.background = '#2a2a2a';
        imgWrap.appendChild(placeholder);
    }
    card.appendChild(imgWrap);

    // body: title + price block
    const body = document.createElement('div');
    body.className = 'product-body';
    const h3 = document.createElement('h3');
    h3.textContent = item.title || '';
    h3.className = 'product-title';
    body.appendChild(h3);

    const priceRow = document.createElement('div');
    priceRow.className = 'product-price-row';

    const price = document.createElement('div');
    price.className = 'product-price';
    price.textContent = item.price ? item.price : '—';

    priceRow.appendChild(price);

    if (item.discount) {
        const disc = document.createElement('div');
        disc.className = 'product-discount';
        disc.textContent = item.discount;
        priceRow.appendChild(disc);
    } else if (item.free === 'true' || item.free === true || item.price === 'US$ 0' || item.price === '0') {
        const free = document.createElement('div');
        free.className = 'product-free';
        free.textContent = 'Free';
        priceRow.appendChild(free);
    }

    body.appendChild(priceRow);



    card.appendChild(body);

    // click opens modal with more details
    card.addEventListener('click', () => openProductModal(item));
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProductModal(item); } });

    return card;
}

// --- Product modal builder ---
function openProductModal(item) {
    // ensure single modal instance
    let existing = document.getElementById('product-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'product-modal';
    modal.className = 'product-modal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.tabIndex = -1;

    const panel = document.createElement('div');
    panel.className = 'product-panel';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'product-close';
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('click', () => modal.remove());
    panel.appendChild(closeBtn);

    // header
    const header = document.createElement('div');
    header.className = 'product-panel-header';
    const title = document.createElement('h2');
    title.textContent = item.title || '';
    header.appendChild(title);
    panel.appendChild(header);

    // main content: gallery + details
    const content = document.createElement('div');
    content.className = 'product-panel-content';

    // gallery
    const gallery = document.createElement('div');
    gallery.className = 'product-gallery';

    // gather images from 'images' CSV or single image
    const imgs = [];
    if (item.images) {
        // split comma separated inline image markers
        const parts = item.images.split(',').map(s => s.trim()).filter(Boolean);
        parts.forEach(p => {
            if (p.includes('::img::')) {
                const u = extractInlineImage(p).image;
                if (u) imgs.push(u);
            } else {
                imgs.push(p);
            }
        });
    }
    // fallback to single image field
    if (imgs.length === 0 && item.image) {
        const single = item.image.includes('::img::') ? extractInlineImage(item.image).image : item.image;
        if (single) imgs.push(single);
    }

    if (imgs.length === 0) {
        const ph = document.createElement('div');
        ph.className = 'placeholder-block';
        ph.style.height = '260px';
        gallery.appendChild(ph);
    } else {
        // show first as large, others as thumbnails
        const mainImg = document.createElement('img');
        mainImg.className = 'product-main-img';
        mainImg.src = imgs[0];
        gallery.appendChild(mainImg);

        if (imgs.length > 1) {
            const thumbs = document.createElement('div');
            thumbs.className = 'product-thumbs';
            imgs.forEach((u, i) => {
                const t = document.createElement('img');
                t.src = u;
                t.className = 'thumb' + (i===0 ? ' active' : '');
                t.addEventListener('click', () => { mainImg.src = u; thumbs.querySelectorAll('img').forEach(im => im.classList.remove('active')); t.classList.add('active'); });
                thumbs.appendChild(t);
            });
            gallery.appendChild(thumbs);
        }
    }

    content.appendChild(gallery);

    // details block
    const details = document.createElement('div');
    details.className = 'product-details';

    if (item.description) {
        const desc = document.createElement('div');
        desc.className = 'product-description';
        desc.textContent = item.description;
        details.appendChild(desc);
    }

    // action button area
    const actions = document.createElement('div');
    actions.className = 'product-actions';

    const isFree = (item.free === 'true' || item.free === true || item.price === 'US$ 0' || item.price === '0');
    const actionBtn = document.createElement('button');
    actionBtn.className = 'product-action-button';
    actionBtn.textContent = isFree ? 'Download' : 'Buy';
    actionBtn.addEventListener('click', () => {
        // placeholder behaviour: open purchase/download link if provided
        if (item.link) {
            window.open(item.link, '_blank');
        } else {
            actionBtn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }], { duration: 320 });
        }
    });

    actions.appendChild(actionBtn);
    details.appendChild(actions);

    content.appendChild(details);
    panel.appendChild(content);
    modal.appendChild(panel);
    document.body.appendChild(modal);

    // focus management
    setTimeout(() => modal.focus(), 120);

    // close on escape / click outside
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', onKey); }});
}

async function loadProducts() {
    try {
        const resp = await fetch('page.yml');
        if (!resp.ok) throw new Error('page.yml fetch failed');
        const text = await resp.text();
        const products = parseProductsYAML(text);

        const gamesList = document.getElementById('games-list');
        const softwareList = document.getElementById('software-list');
        if (gamesList) gamesList.innerHTML = '';
        if (softwareList) softwareList.innerHTML = '';

        products.forEach(item => {
            const section = (item.section || '').toLowerCase();
            if (section === 'games' && gamesList) {
                gamesList.appendChild(makeItemCard(item, 'games'));
            } else if (section === 'software' && softwareList) {
                softwareList.appendChild(makeItemCard(item, 'software'));
            }
        });
    } catch (e) {
        console.warn('Could not load products', e);
    }
}

/* -------------------------
   products UI toggle helpers
   ------------------------- */

function showPane(pane) {
    const btnGames = document.getElementById('btn-games');
    const btnSoftware = document.getElementById('btn-software');
    const gamesPane = document.getElementById('games-pane');
    const softwarePane = document.getElementById('software-pane');

    if (!btnGames || !btnSoftware || !gamesPane || !softwarePane) return;

    if (pane === 'games') {
        gamesPane.style.display = 'block';
        softwarePane.style.display = 'none';
        btnGames.setAttribute('aria-pressed','true');
        btnSoftware.setAttribute('aria-pressed','false');
    } else {
        gamesPane.style.display = 'none';
        softwarePane.style.display = 'block';
        btnGames.setAttribute('aria-pressed','false');
        btnSoftware.setAttribute('aria-pressed','true');
    }
}

/* -------------------------
   Boot: detect page and init
   ------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    // If index.html has the news list element, initialize news loader
    if (document.getElementById('news-list')) {
        loadAndRenderLastNews();
    }

    // If products page elements exist, init products and UI
    if (document.getElementById('products-section')) {
        loadProducts();

        const btnGames = document.getElementById('btn-games');
        const btnSoftware = document.getElementById('btn-software');

        if (btnGames && btnSoftware) {
            btnGames.addEventListener('click', () => showPane('games'));
            btnSoftware.addEventListener('click', () => showPane('software'));
        }
    }

    // Ensure header height CSS variable matches actual header so header stays fixed and content offset is correct
    const updateHeaderHeight = () => {
        const header = document.querySelector('header');
        if (!header) return;
        const h = header.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--header-height', `${Math.ceil(h)}px`);
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight, { passive: true });
});

/* -------------------------
   Simple hash-based router
   ------------------------- */

function setActiveNav(route) {
    document.querySelectorAll('.nav-link').forEach(a => {
        if (a.dataset.route === route) {
            a.classList.add('active');
        } else {
            a.classList.remove('active');
        }
    });
}

function showPage(page) {
    document.querySelectorAll('[data-page]').forEach(sec => {
        sec.style.display = sec.dataset.page === page ? 'block' : 'none';
    });
    setActiveNav(page);

    // lazy init page-specific loaders
    if (page === 'home') {
        if (document.getElementById('news-list') && document.getElementById('news-list').children.length === 0) {
            loadAndRenderLastNews();
        }
    } else if (page === 'products') {
        if (document.getElementById('products-section')) {
            loadProducts();
        }
    }
}

function route() {
    const hash = (location.hash || '#home').replace(/^#/, '');
    const valid = ['home','products','contact'];
    const target = valid.includes(hash) ? hash : 'home';
    showPage(target);
}

window.addEventListener('hashchange', route);

document.addEventListener('DOMContentLoaded', () => {
    // wire nav links to route immediately in case anchor default prevented elsewhere
    document.querySelectorAll('.nav-link').forEach(a => {
        a.addEventListener('click', () => {
            // allow hash to change and router to handle
            setTimeout(route, 10);
        });
    });

    // ensure product toggles still work
    const btnGames = document.getElementById('btn-games');
    const btnSoftware = document.getElementById('btn-software');
    if (btnGames && btnSoftware) {
        btnGames.addEventListener('click', () => showPane('games'));
        btnSoftware.addEventListener('click', () => showPane('software'));
    }

    // initial route
    route();
});