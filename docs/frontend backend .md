# Project Summary — Frontend and Backend

This is a simple cafe web application with a static frontend, an Express.js backend, and a PostgreSQL database integrated using Docker Compose.

## What you can do in this project

### Frontend
- View the cafe landing page (`index.html`)
- See the menu items and available products
- Submit a customer order through the order section
- Use the admin form to add or edit menu items
- Use the standalone reservation page (`reservation.html`) for table booking UI

Note: The reservation form is static and does not appear to be connected to the backend API.

### Backend
- Provide a REST API for menu and order operations
- Store menu items and customer orders in PostgreSQL
- Initialize default menu items automatically
- Handle form submissions from the frontend for:
  - Creating menu items
  - Updating menu items
  - Placing orders


## How it works together

### `docker-compose.yml`
This file launches 3 services:
- Frontend on port 8085
- Backend on port 3000
- PostgreSQL Database

### Dependency flow
- Backend depends on the database being healthy
- Frontend depends on backend startup

### `server.js`
- CORS enabled
- Connection to PostgreSQL using environment variables
- Automatic creation of required database tables if they do not exist

### Database Tables
1. `menu_items`
2. `orders`

### Default Data
- Inserts default menu entries automatically

### Exposed API Endpoints
- `GET /api/health`
- `GET /api/menu`
- `POST /api/menu`
- `PUT /api/menu/:id`
- `POST /api/orders`


## `app.js` (frontend JS behavior)
- Loads menu items from `GET /api/menu`
- Renders menu cards and the order dropdown
- Allows administrators to add or edit menu items using `POST /api/menu` and `PUT /api/menu/:id`
- Submits customer orders using `POST /api/orders`
- Displays status messages for successful and failed operations


## How the data flows

1. Frontend page loads — JavaScript calls the backend API.
2. Backend queries PostgreSQL and returns menu data.
3. User places an order — Frontend sends order details to `POST /api/orders`.
4. Backend processing:
   - Order validation
   - Item availability checks
   - Total price calculation
   - Order storage in the `orders` table
5. Menu management:
   - Admin adds or edits menu items — Frontend sends changes to backend — Backend updates the `menu_items` table.


## Important note
The main frontend and backend are fully integrated through the `/api` endpoints. The reservation page exists in the frontend, but no backend API for reservation storage has been implemented in the provided files.


## Complete workflow overview

### Customer Order Workflow
1. Customer opens `index.html`
2. Frontend requests menu data using `GET /api/menu`
3. Backend retrieves menu items from PostgreSQL
4. Menu is displayed on the frontend
5. Customer selects items and submits an order
6. Frontend sends order data to `POST /api/orders`
7. Backend validates the request
8. Backend calculates the total amount
9. Backend stores the order in the `orders` table
10. Success response is returned to the frontend
11. Customer sees the confirmation message


### Admin Menu Update Workflow
1. Administrator opens the admin section
2. Admin enters menu item details
3. Frontend sends data using `POST /api/menu` or `PUT /api/menu/:id`
4. Backend validates the request
5. Backend updates the `menu_items` table
6. Updated menu information is saved in PostgreSQL
7. Refreshed menu data becomes available to customers


## Architecture summary
- Frontend (HTML, CSS, JavaScript)
- Express.js Backend API
- PostgreSQL Database
- Menu Items & Customer Orders Storage

This architecture follows a simple Three-Tier Application Design, where the frontend, backend, and database are separated into independent services and connected through REST APIs.
