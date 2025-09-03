# User Endpoints

This document outlines the available API endpoints for regular users.

## Authentication

-   **`POST /api/v1/auth/register`**

    -   Registers a new user or logs them in.
    -   **Request Body:** `{ "phoneNumber": "..." }`

-   **`POST /api/v1/auth/logout`**

    -   Logs out the currently authenticated user.
    -   **Authentication Required:** Yes

-   **`GET /api/v1/auth/me`**
    -   Retrieves the profile of the currently authenticated user.
    -   **Authentication Required:** Yes

## Categories

-   **`GET /api/v1/category`**

    -   Retrieves a list of all product categories.

-   **`GET /api/v1/category/:categoryName`**
    -   Retrieves all products within a specific category.

## Products

-   **`GET /api/v1/product`**

    -   Retrieves a list of all products. Supports filtering and pagination.
    -   **Query Parameters:** `page`, `limit`, `sort`, `order`, `category`, `sizes`

-   **`GET /api/v1/product/search`**

    -   Searches for products based on a query.
    -   **Query Parameters:** `q`

-   **`GET /api/v1/product/latest`**

    -   Retrieves the latest products.

-   **`GET /api/v1/product/:id`**
    -   Retrieves a single product by its ID.

## Cart and Orders

-   **`POST /api/v1/order/:userId/add`**

    -   Adds an item to the user's shopping cart.
    -   **Authentication Required:** Yes
    -   **Request Body:** `{ "productId": "...", "quantity": "..." }`

-   **`GET /api/v1/order/:userId/see`**

    -   Retrieves the contents of the user's shopping cart.
    -   **Authentication Required:** Yes

-   **`DELETE /api/v1/order/:userId/delete`**

    -   Removes an item from the user's shopping cart.
    -   **Authentication Required:** Yes
    -   **Request Body:** `{ "productId": "..." }`

-   **`POST /api/v1/order/:userId`**

    -   Places a new order.
    -   **Authentication Required:** Yes

-   **`GET /api/v1/order/:userId`**

    -   Retrieves a list of the user's past orders.
    -   **Authentication Required:** Yes

-   **`GET /api/v1/order/:id`**
    -   Retrieves a specific order by its ID.
    -   **Authentication Required:** Yes

## Wishlist

-   **`POST /api/v1/wishlist`**

    -   Adds a product to the user's wishlist.
    -   **Authentication Required:** Yes
    -   **Request Body:** `{ "productId": "..." }`

-   **`GET /api/v1/wishlist`**

    -   Retrieves the user's wishlist.
    -   **Authentication Required:** Yes

-   **`DELETE /api/v1/wishlist/:productId`**
    -   Removes a product from the user's wishlist.
    -   **Authentication Required:** Yes

## User Address

-   **`POST /api/v1/address`**
    -   Adds a new address for the user.
    -   **Authentication Required:** Yes
    -   **Request Body:** `{ "addressLine1": "...", "city": "...", "state": "...", "postalCode": "...", "country": "..." }`

## Payments

-   **`POST /api/v1/payment/razorpay/create-order/:id`**

    -   Creates a Razorpay payment order.
    -   **Authentication Required:** Yes

-   **`POST /api/v1/payment/razorpay/verify`**
    -   Verifies a Razorpay payment.
    -   **Authentication Required:** Yes
