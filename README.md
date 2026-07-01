# 🛒 QuickKart

A modern React Native + Expo Router mobile commerce application demonstrating a complete shopping journey from authentication to order placement.

QuickKart showcases production-style mobile commerce architecture using Expo Router, TypeScript, Redux Toolkit, service-layer abstraction, address management, order tracking, and AI-powered product insights.

---

## 📖 Overview

QuickKart is a frontend mobile commerce application built to integrate with the QuickKartApi backend.

The application provides:

- Secure Authentication
- Product Discovery
- Category Navigation
- Product Search
- AI Product Insights
- Cart Management
- Address Management
- Checkout Flow
- Order Tracking
- Theme Switching

The project follows scalable mobile application architecture patterns suitable for enterprise-grade applications.

---

## ✨ Features

### 🔐 Authentication

- Login
- Signup
- Session Management
- Auto Authentication Routing
- Token Refresh Support

### 🏬 Product Discovery

- Categories
- Subcategories
- Product Listing
- Product Search
- Product Details

### 🤖 AI Product Insights

- Product Analysis
- Pros & Cons
- Health Insights
- Purchase Recommendations
- Confidence Score

Powered through Groq AI integration.

### 🛒 Cart Management

- Add to Cart
- Remove from Cart
- Quantity Updates
- Cart Badge
- Cart Persistence

### 📍 Address Management

- Address CRUD
- Set Default Address
- Map Location Selection
- GPS Location Support

### 📦 Order Management

- Place Orders
- Order History
- Order Details
- Status Tracking

### 🎨 Theme System

- Light Mode
- Dark Mode
- Theme Persistence

### 🔔 User Experience

- Global Toast Notifications
- Loading States
- Optimistic Updates
- Responsive Navigation

---

## 📱 User Flow

```text
App Launch
↓
Authentication
↓
Home
↓
Browse Products
↓
Product Details
↓
Add To Cart
↓
Select Address
↓
Place Order
↓
Order History
↓
Order Details
```

---

## 🏗️ Architecture

### Application Architecture

```text
Presentation Layer
(Screens & Components)
            ↓
Hooks & ViewModels
            ↓
Redux State Layer
            ↓
Services Layer
            ↓
QuickKartApi Backend
```

### State Management

```text
Redux Toolkit
├── authSlice
├── cartSlice
└── deliverySlice
```

### Persistence

```text
Redux Persist
↓
AsyncStorage
```

---

## 📂 Project Structure

```text
app/
├── (auth)/
├── (tabs)/
├── orders/
├── profile/
├── search/
└── address/

src/
├── components/
├── hooks/
├── models/
├── services/
├── store/
├── theme/
├── utils/
└── viewmodels/

assets/
doc/
rest/
```

---

## 🚦 Routing

### Authentication

```text
/login
/signup
```

### Main Application

```text
/home
/search
/cart
/orders
/profile
```

### Additional Routes

```text
/orders/:orderId
/profile/addresses
/profile/address-form
/search/view-all
```

Implemented using:

```text
Expo Router
```

---

## 🔄 State Management

### authSlice

Handles:

- Login
- Logout
- Session
- User Information
- Token Management

### cartSlice

Handles:

- Cart Items
- Quantity Changes
- Cart Totals
- Cart Synchronization

### deliverySlice

Handles:

- Selected Address
- Delivery Preferences

---

## 🌐 Backend Integration

Backend Repository:

```text
QuickKartApi
```

Integrated Modules:

### Authentication

```text
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
```

### Catalog

```text
GET /api/catalog/categories
GET /api/catalog/subcategories
GET /api/catalog/products
GET /api/catalog/search
```

### Cart

```text
GET /api/cart
POST /api/cart/upsert
DELETE /api/cart/{productId}
POST /api/cart/clear
```

### Orders

```text
POST /api/orders/place
GET /api/orders
GET /api/orders/{id}
```

### Addresses

```text
GET
POST
PUT
DELETE
```

through:

```text
/api/addresses
```

---

## 🤖 AI Integration

### AI Product Insights

Implemented in:

```text
src/services/aiInsightService.ts
```

Capabilities:

- Product Summary
- Pros
- Cons
- Health Analysis
- Verdict Generation
- Confidence Estimation

The feature is enabled when a Groq API key is configured.

---

## 🎨 Theme System

Theme implementation:

```text
src/theme/
├── colors.ts
├── spacing.ts
├── common.ts
└── ThemeContext.tsx
```

Supported Modes:

- Light Theme
- Dark Theme

Theme preference is persisted using AsyncStorage.

---

## 🛠 Technology Stack

### Mobile

- React Native
- Expo SDK 54
- Expo Router
- TypeScript

### State Management

- Redux Toolkit
- React Redux
- Redux Persist

### Forms & Validation

- React Hook Form
- Yup

### Storage

- AsyncStorage

### Maps & Location

- React Native Maps
- Expo Location

### AI

- Groq AI

---

## 📚 Documentation

Detailed documentation is available in:

```text
doc/PROJECT_DETAILS.md
```

The document covers:

- Architecture
- Routing
- Components
- Redux Store
- Services
- API Integration
- Security Review
- Future Roadmap
- Change Impact Analysis

---

## 🚧 Planned Enhancements

- Secure Token Storage
- Unit Testing
- Integration Testing
- Enhanced Error Recovery
- Production Logging Strategy
- AI Configuration Improvements
- Push Notifications
- Analytics Dashboard
- Offline Support

---

## 👨‍💻 Developer

**Rahul Tiwari**

Mobile Application Architect | Full Stack Developer | AI Enthusiast

### Technology Expertise

```text
.NET • ASP.NET Core • MAUI • React Native • Flutter • Azure • Firebase • AI
```

---

## 📄 License

Copyright © 2026 Rahul Tiwari

All Rights Reserved.

Unauthorized use, modification, distribution, reproduction, or commercial usage is prohibited without prior written permission from the copyright holder.
