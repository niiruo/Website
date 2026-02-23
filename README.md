# Hotel Tracker - Philippines

A comprehensive hotel booking and tracking website for exploring hotels across the Philippines.

## 📁 Project Structure

```
hotel-tracker/
│
├── index.html          # Main homepage with hotel grid and map
├── hotels.html         # All available hotels page
├── login.html          # Login/Register/Reset Password page
├── profile.html        # User profile management page
│
├── style.css           # Main stylesheet for all pages
│
├── database.js         # Hotel database and storage keys
├── app.js              # Main application logic (hotels, favorites, map)
├── auth.js             # Authentication system (login, register, logout)
│
└── hoteltrackerlogo.png # Site logo
```

## 🚀 Features

### 1. **Hotel Browsing**
- Grid display of all available hotels
- Filter by category (Beach, City, Mountain)
- Sort by price (Low to High, High to Low)
- Filter by price range
- Filter by star rating
- Search functionality by name or location

### 2. **Interactive Map**
- Leaflet.js integration showing all hotel locations
- Click to expand fullscreen
- Markers with hotel information popups
- Automatic zoom when viewing hotel details

### 3. **Hotel Details Modal**
- Beautiful image gallery (main + 2 sub-images)
- Full hotel description
- Star rating and reviews count
- User reviews and comments section
- Ability to post reviews

### 4. **Favorites System**
- Add/remove hotels to favorites
- Sidebar showing favorite hotels
- View favorites-only page
- Persistent storage using localStorage

### 5. **User Authentication**
- Register new account with validation
- Login with email and password
- "Remember Me" option
- Password reset functionality
- Session management
- Logout functionality

### 6. **User Profile**
- View user information
- Edit profile details (name, phone, DOB)
- Glass morphism design
- Social media links
- Logout confirmation modal

## 🗄️ Database Structure

### Hotels Database (`database.js`)

Each hotel object contains:
```javascript
{
    id: Number,              // Unique identifier
    name: String,            // Hotel name
    location: String,        // City/Province location
    price: Number,           // Price per night in PHP
    category: String,        // "beach", "city", or "mountain"
    image: String,           // Main image filename
    subImages: Array,        // Array of 2 sub-images
    rating: Number,          // Star rating (1-5)
    coordinates: Array,      // [latitude, longitude] for map
    description: String,     // Hotel description
    amenities: Array,        // List of amenities
    reviews: Array           // User reviews (populated at runtime)
}
```

### Current Hotels (10 Total)

1. **Boracay Beach Resort** - ₱4,500/night (Beach)
2. **The Manila Hotel** - ₱3,200/night (City)
3. **Baguio Mountain Lodge** - ₱5,800/night (Mountain)
4. **Cebu Bay Hotel** - ₱3,800/night (City)
5. **El Nido Island Resort** - ₱7,200/night (Beach)
6. **Davao Downtown Inn** - ₱2,300/night (City)
7. **Siargao Surfers Retreat** - ₱3,500/night (Beach)
8. **Bohol Panglao Resort** - ₱5,500/night (Beach)
9. **Tagaytay Ridge View** - ₱4,200/night (Mountain)
10. **Vigan Heritage Mansion** - ₱2,800/night (City)

## 💾 Data Storage

### LocalStorage Keys

All data is stored in browser localStorage with these keys:

- `hotelTracker_favorites` - User's favorite hotels
- `hotelTracker_reviews` - All hotel reviews by hotel ID
- `hotelTracker_currentUser` - Currently logged-in user
- `hotelTracker_users` - All registered users

### Data Format

**Users:**
```javascript
{
    id: Number,
    name: String,
    email: String,
    pass: String,
    createdAt: String (ISO date)
}
```

**Reviews:**
```javascript
{
    hotelId: [
        {
            user: String,
            comment: String,
            date: String
        }
    ]
}
```

## 🎨 Design Features

### Color Scheme
- Primary: Gold (#b8860b)
- Secondary: Blue (#2d6cdf)
- Background: Light gray (#f4f4f4)
- Accent: Orange (#ff8c00)

### Design Elements
- Glass morphism navbar with backdrop blur
- Hover animations on cards and buttons
- Smooth transitions
- Responsive grid layout
- Modal overlays for details
- Fullscreen map expansion
- Heart icon for favorites

## 📱 Responsive Design

The site is fully responsive with breakpoints for:
- Desktop (>768px)
- Tablet (768px)
- Mobile (<500px)

Mobile optimizations:
- Collapsible navigation
- Single column hotel grid
- Stacked filter controls
- Adjusted map size

## 🔧 Setup Instructions

1. **File Structure:**
   - Place all HTML files in the root directory
   - Place all JS files in the root directory
   - Place CSS file in the root directory
   - Place logo image in the root directory

2. **Dependencies:**
   All dependencies are loaded via CDN:
   - Font Awesome 6.0.0
   - Google Fonts (Poppins)
   - Leaflet.js 1.9.4

3. **Running the Project:**
   - Open `index.html` in a web browser
   - Or use a local server (recommended):
     ```bash
     python -m http.server 8000
     # Then visit http://localhost:8000
     ```

## 🔐 Default Test Account

For testing purposes, you can register any account. The system uses localStorage, so data persists in your browser.

## 🐛 Troubleshooting

### Images Not Loading
- Ensure image files are in the same directory as HTML files
- Check browser console for 404 errors
- Images fall back to placeholder if missing

### Data Not Persisting
- Check if localStorage is enabled in your browser
- Clear browser cache and try again
- Check browser console for storage errors

### Map Not Loading
- Ensure internet connection (Leaflet loads from CDN)
- Check browser console for errors
- Verify coordinates are correct in database.js

## 🚀 Future Enhancements

Possible features to add:
- Booking system with dates and pricing
- Payment integration
- Email verification
- Password strength indicator
- Hotel comparison feature
- Booking history
- Admin panel for hotel management
- Photo uploads for reviews
- Social media login
- Backend API integration

## 📄 License

This is a demo project for educational purposes.

## 👨‍💻 Developer Notes

### Adding New Hotels

To add a new hotel, edit `database.js`:

```javascript
{
    id: 11, // Increment from last ID
    name: "Your Hotel Name",
    location: "City, Province",
    price: 3000,
    category: "beach", // or "city" or "mountain"
    image: "yourhotel.jpg",
    subImages: ["sub1.jpg", "sub2.jpg"],
    rating: 4,
    coordinates: [latitude, longitude], // Get from Google Maps
    description: "Hotel description here...",
    amenities: ["WiFi", "Pool", "Restaurant"],
    reviews: []
}
```

### Modifying Styles

All styles are in `style.css`. Key classes:
- `.hotel-card` - Hotel card styling
- `.modal` - Modal overlay and content
- `.navbar` - Navigation bar
- `.hero` - Hero section
- `.glass-nav` - Glass morphism effect

### Security Considerations

⚠️ **Important:** This is a frontend-only demo. For production:
- Never store passwords in plain text
- Use proper backend authentication
- Implement HTTPS
- Add CSRF protection
- Sanitize user inputs
- Use secure password hashing (bcrypt, etc.)

## 🤝 Contributing

This is a demo project, but suggestions are welcome!

## 📧 Contact

For questions or issues, please create an issue in the project repository.

---

**Made with ❤️ for the Philippines tourism industry**
