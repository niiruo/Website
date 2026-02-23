/**
 * Hotel Tracker — Main App
 * Requires: database.js → auth.js → app.js  (load in this order)
 */

let hotels       = [];
let map          = null;
let markers      = [];
let hotelReviews = {};
let userMarker   = null;
let userLatLng   = null;
let distanceLines = [];

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initializeApp);

// Remove the hardcoded const hotelDatabase = [...];

async function initializeApp() {
    try {
        // Fetch from your new PHP API
        const response = await fetch('api/get_hotels.php');
        if (!response.ok) throw new Error("Network response was not ok");
        
        // Assign the data to your global hotels variable
        hotels = await response.json(); 
        
        console.log("Hotels loaded from SQL:", hotels);
    } catch (error) {
        console.error("Could not load hotels from database:", error);
        // Optional: you can keep a small hardcoded array here as a fallback
        hotels = []; 
    }

    loadReviewsFromStorage();

    // Only proceed once 'hotels' is populated
    if (document.getElementById('map')) initMap();
    if (document.getElementById('hotelGrid')) displayHotels(hotels);

    setupSearch();
    loadUserProfile();
}

// ── Reviews — localStorage first, DB if available ─────────────
function loadReviewsFromStorage() {
    try { hotelReviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEWS) || '{}'); }
    catch (e) { hotelReviews = {}; }
}

function saveReviewsToStorage() {
    try { localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(hotelReviews)); }
    catch (e) {}
}

async function loadReviewsForHotel(hotelId) {
    // Try to get from database first
    try {
        const res = await fetch(`api/reviews.php?action=get&hotel_id=${hotelId}`);
        if (!res.ok) throw new Error('API unavailable');
        const data = await res.json();
        if (Array.isArray(data)) {
            hotelReviews[hotelId] = data.map(r => ({
                user: r.user_name, comment: r.comment,
                rating: r.rating,  date: r.date
            }));
            saveReviewsToStorage();
            return;
        }
    } catch (e) {
        // API not available — use localStorage reviews (already loaded)
    }
}

async function postReview(hotelId) {
    const textarea = document.getElementById('commentText');
    if (!textarea) return;
    const comment = textarea.value.trim();
    if (!comment) { alert('Please write a review before posting.'); return; }

    const user     = getCurrentUser();
    const userName = user ? user.name : 'Guest';
    const today    = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format

    // Always save to localStorage immediately so it shows up
    if (!hotelReviews[hotelId]) hotelReviews[hotelId] = [];
    const newReview = { user: userName, comment, rating: 5, date: today };
    hotelReviews[hotelId].unshift(newReview);
    saveReviewsToStorage();
    textarea.value = '';
    displayReviews(hotelId);

    // Also try to save to database if user is logged in
    if (user) {
        try {
            await fetch('api/reviews.php?action=add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, hotel_id: hotelId, rating: 5, comment })
            });
        } catch (e) {
            // DB save failed silently — localStorage version already saved above
        }
    }
}

function displayReviews(hotelId) {
    const el = document.getElementById('commentsDisplay');
    if (!el) return;
    const reviews = hotelReviews[hotelId] || [];
    el.innerHTML = reviews.length === 0
        ? "<p style='color:#999;text-align:center;padding:20px;'>No reviews yet. Be the first!</p>"
        : reviews.map(r => `
            <div class='comment-item'>
                <strong>👤 ${r.user}</strong>
                <span style="float:right;color:#888;font-size:0.85rem;">${r.date}</span>
                <p style="margin-top:5px;">${r.comment}</p>
            </div>`).join('');
}

// ── Map ────────────────────────────────────────────────────────
function initMap() {
    if (map) return;
    map = L.map('map').setView([12.8797, 121.7740], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
    }).addTo(map);

    hotels.forEach(hotel => {
        const m = L.marker(hotel.coordinates).addTo(map).bindPopup(
            `<div style="text-align:center"><b>${hotel.name}</b><br>
             ₱${hotel.price.toLocaleString()}/night<br>
             <small>${hotel.location}</small></div>`
        );
        markers.push({ hotelId: hotel.id, marker: m });
    });

    // Detect user location and add to map
    detectUserLocation();

    // Fix: prevent map drag from triggering toggleMapSize
    // We use a dedicated toggle button instead of clicking the map container
    setupMapToggleButton();
}

function setupMapToggleButton() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Remove any old onclick so dragging never triggers fullscreen
    mapContainer.removeAttribute('onclick');

    if (document.getElementById('mapExpandBtn')) return;

    // ── "Expand Map" button — lives in the sidebar heading ─────
    const expandBtn = document.createElement('button');
    expandBtn.id = 'mapExpandBtn';
    expandBtn.innerHTML = '⛶ Expand Map';
    expandBtn.style.cssText = `
        display: inline-block;
        margin-left: 10px;
        padding: 4px 12px;
        background: #2d6cdf;
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        vertical-align: middle;
    `;
    expandBtn.onclick = () => openMapFullscreen();
    const heading = mapContainer.closest('.side-card')?.querySelector('h4');
    if (heading) heading.appendChild(expandBtn);

    // ── "Exit Fullscreen" button — appended to <body>, always on top ──
    const exitBtn = document.createElement('button');
    exitBtn.id = 'mapExitBtn';
    exitBtn.innerHTML = '✕ Exit Fullscreen';
    exitBtn.style.cssText = `
        display: none;
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        background: rgba(0,0,0,0.78);
        color: white;
        border: none;
        padding: 10px 22px;
        border-radius: 25px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        backdrop-filter: blur(6px);
        box-shadow: 0 4px 18px rgba(0,0,0,0.45);
    `;
    exitBtn.onclick = () => closeMapFullscreen();
    document.body.appendChild(exitBtn);
}

function openMapFullscreen() {
    const d = document.getElementById('map');
    const exitBtn = document.getElementById('mapExitBtn');
    if (!d) return;
    d.classList.add('expanded');
    document.body.style.overflow = 'hidden';
    if (exitBtn) exitBtn.style.display = 'block';
    setTimeout(() => {
        if (map) map.invalidateSize({ animate: false });
        if (userLatLng) drawDistanceLines();
    }, 450);
}

function closeMapFullscreen() {
    const d = document.getElementById('map');
    const exitBtn = document.getElementById('mapExitBtn');
    if (!d) return;
    d.classList.remove('expanded');
    document.body.style.overflow = 'auto';
    if (exitBtn) exitBtn.style.display = 'none';
    setTimeout(() => {
        if (map) map.invalidateSize({ animate: false });
        if (userLatLng) drawDistanceLines();
    }, 450);
}

function detectUserLocation() {
    if (!navigator.geolocation) {
        fallbackToIPLocation();
        return;
    }
    navigator.geolocation.getCurrentPosition(
        pos => placeUserOnMap(pos.coords.latitude, pos.coords.longitude, 'Your Location (GPS)'),
        ()  => fallbackToIPLocation()
    );
}

async function fallbackToIPLocation() {
    try {
        // Use ipapi.co for free IP geolocation (no key required)
        const res  = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.latitude && data.longitude) {
            placeUserOnMap(data.latitude, data.longitude,
                `Your Location (${data.city || 'IP'}, ${data.region || ''}, ${data.country_name || ''})`);
        }
    } catch (e) {
        console.warn('IP geolocation failed:', e);
    }
}

function placeUserOnMap(lat, lng, label) {
    if (!map) return;
    userLatLng = [lat, lng];

    // Custom pulsing user icon
    const userIcon = L.divIcon({
        className: '',
        html: `<div style="
            width:18px;height:18px;
            background:#2d6cdf;
            border:3px solid white;
            border-radius:50%;
            box-shadow:0 0 0 4px rgba(45,108,223,0.35), 0 2px 8px rgba(0,0,0,0.3);
            animation: userPulse 1.8s ease-in-out infinite;
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
    });

    // Inject keyframe animation if not already present
    if (!document.getElementById('userPulseStyle')) {
        const style = document.createElement('style');
        style.id = 'userPulseStyle';
        style.textContent = `
            @keyframes userPulse {
                0%,100% { box-shadow: 0 0 0 4px rgba(45,108,223,0.35), 0 2px 8px rgba(0,0,0,0.3); }
                50%      { box-shadow: 0 0 0 10px rgba(45,108,223,0.1), 0 2px 8px rgba(0,0,0,0.3); }
            }
        `;
        document.head.appendChild(style);
    }

    if (userMarker) userMarker.remove();
    userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<div style="text-align:center;"><b>📍 ${label}</b></div>`);

    // Draw dashed lines from user to each hotel with distance
    drawDistanceLines();

    // Pan map to user location
    map.flyTo([lat, lng], 7, { animate: true, duration: 1.5 });

    // Update any "Locating..." distance tags on hotel cards
    hotels.forEach(hotel => {
        const el = document.getElementById(`dist-${hotel.id}`);
        if (el) {
            const km = haversineDistance(lat, lng, hotel.coordinates[0], hotel.coordinates[1]).toFixed(1);
            el.style.color = '#ff8c00';
            el.textContent = `📏 ${km} km away`;
        }
    });
}

function haversineDistance(lat1, lng1, lat2, lng2) {
    const R    = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a    = Math.sin(dLat/2)**2 +
                 Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function drawDistanceLines() {
    if (!map || !userLatLng) return;

    // Remove old lines
    distanceLines.forEach(l => l.remove());
    distanceLines = [];

    hotels.forEach(hotel => {
        const dist = haversineDistance(userLatLng[0], userLatLng[1],
                                       hotel.coordinates[0], hotel.coordinates[1]);
        const km   = dist.toFixed(1);

        // Dashed polyline
        const line = L.polyline([userLatLng, hotel.coordinates], {
            color: '#ff8c00',
            weight: 1.5,
            opacity: 0.45,
            dashArray: '6, 8'
        }).addTo(map);
        distanceLines.push(line);

        // Update hotel marker popup to include distance
        const markerObj = markers.find(m => m.hotelId === hotel.id);
        if (markerObj) {
            markerObj.marker.setPopupContent(
                `<div style="text-align:center">
                    <b>${hotel.name}</b><br>
                    ₱${hotel.price.toLocaleString()}/night<br>
                    <small>${hotel.location}</small><br>
                    <span style="color:#ff8c00;font-weight:600;">📏 ${km} km from you</span>
                 </div>`
            );
        }
    });
}

// toggleMapSize kept for backward compat (old CSS onclick attr)
function toggleMapSize() {
    const d = document.getElementById('map');
    if (!d) return;
    d.classList.contains('expanded') ? closeMapFullscreen() : openMapFullscreen();
}

// ── Display Hotels ─────────────────────────────────────────────
let currentList = [];

function displayHotels(list) {
    currentList = list;
    const grid = document.getElementById('hotelGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!list.length) {
        grid.innerHTML = '<p style="text-align:center;grid-column:1/-1;padding:40px;color:#666;">No hotels found.</p>';
        return;
    }

    list.forEach(hotel => {
        const card  = document.createElement('div');
        card.className = 'hotel-card';
        card.setAttribute('data-category', hotel.category);
        const distStr = userLatLng
            ? `<p class="distance-tag" style="font-size:0.82rem;color:#ff8c00;margin:4px 0;">
                   📏 ${haversineDistance(userLatLng[0], userLatLng[1], hotel.coordinates[0], hotel.coordinates[1]).toFixed(1)} km away
               </p>`
            : `<p class="distance-tag" id="dist-${hotel.id}" style="font-size:0.82rem;color:#aaa;margin:4px 0;">📏 Locating...</p>`;

        card.innerHTML = `
            <div class="img-container">
                <img src="${hotel.image}" alt="${hotel.name}"
                     onerror="this.src='https://via.placeholder.com/400x300?text=Hotel+Image'">
            </div>
            <div class="card-info">
                <h3>${hotel.name}</h3>
                <p class="location">📍 ${hotel.location}</p>
                <div class="rating">${'⭐'.repeat(hotel.rating)}</div>
                <p class="price">₱${hotel.price.toLocaleString()} <span>/ night</span></p>
                ${distStr}
                <button class="view-details-btn" onclick="openDetails(${hotel.id})">View Details</button>
            </div>`;
        grid.appendChild(card);
    });
}

function getCurrentDisplayList() {
    return currentList.length ? currentList : hotels;
}

// ── Hotel Details Modal ────────────────────────────────────────
async function openDetails(hotelId) {
    const hotel = hotels.find(h => h.id === hotelId);
    if (!hotel) return;
    const modal = document.getElementById('hotelModal');
    if (!modal) return;

    // Fly map to hotel
    if (map) {
        map.flyTo(hotel.coordinates, 15, { animate: true, duration: 1.5 });
        const tm = markers.find(m => m.hotelId === hotel.id);
        if (tm) setTimeout(() => tm.marker.openPopup(), 1600);
    }

    // Fill in modal fields
    document.getElementById('modalName').innerText        = hotel.name;
    document.getElementById('modalLoc').innerText         = hotel.location;
    document.getElementById('modalImgMain').src           = hotel.image;
    document.getElementById('modalImg1').src              = hotel.subImages[0] || hotel.image;
    document.getElementById('modalImg2').src              = hotel.subImages[1] || hotel.image;
    document.getElementById('modalDesc').innerText        = hotel.description;
    document.getElementById('modalRatingScore').innerText = hotel.rating + '.0';
    document.getElementById('modalStars').innerText       = '⭐'.repeat(hotel.rating);

    // Try loading reviews from DB, fall back to localStorage
    await loadReviewsForHotel(hotelId);
    displayReviews(hotelId);

    // Wire up post button
    const btn = document.getElementById('submitCommentBtn');
    if (btn) btn.onclick = () => postReview(hotel.id);

    modal.style.display      = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('hotelModal');
    if (modal) { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }
}

window.onclick = function(e) {
    const modal = document.getElementById('hotelModal');
    if (e.target === modal) closeModal();
};

// ── Filters & Sort ─────────────────────────────────────────────
function filterHotels(category) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    displayHotels(category === 'all' ? hotels : hotels.filter(h => h.category === category));
}

function sortHotels(order) {
    const s = [...getCurrentDisplayList()];
    if (order === 'low')  s.sort((a,b) => a.price - b.price);
    if (order === 'high') s.sort((a,b) => b.price - a.price);
    displayHotels(s);
}

function filterByPrice(limit) {
    displayHotels(limit === 'any' ? hotels : hotels.filter(h => h.price <= parseInt(limit)));
}

function filterByRating(min) {
    displayHotels(min === 'any' ? hotels : hotels.filter(h => h.rating >= parseInt(min)));
}

function applyOffer(type) {
    if (type === 'promo') displayHotels(hotels.filter(h => h.rating >= 4));
    else displayHotels(hotels);
}

// ── Search ─────────────────────────────────────────────────────
function setupSearch() {
    const btn   = document.getElementById('searchBtn');
    const input = document.getElementById('searchInput');
    if (btn)   btn.addEventListener('click', performSearch);
    if (input) input.addEventListener('keypress', e => e.key === 'Enter' && performSearch());
}

function performSearch() {
    const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    displayHotels(!q ? hotels : hotels.filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        h.category.toLowerCase().includes(q)
    ));
}

function searchByDest(dest) {
    const input = document.getElementById('searchInput');
    if (input) input.value = dest;
    displayHotels(hotels.filter(h =>
        h.location.toLowerCase().includes(dest.toLowerCase()) ||
        h.name.toLowerCase().includes(dest.toLowerCase())
    ));
}

// ── User ───────────────────────────────────────────────────────
function getCurrentUser() {
    try {
        const s = localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);
        return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
}

function loadUserProfile() {
    const user = getCurrentUser();
    if (!user) return;
    const n = document.getElementById('display-name');
    const e = document.getElementById('display-email');
    if (n) n.innerText = user.name;
    if (e) e.innerText = user.email;
}
