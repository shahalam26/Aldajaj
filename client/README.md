# Dilli Cuts — Final React Client

This client is wired to the existing Aldajaj backend routes.

## Setup

1. Replace your `client/src` with this `src` folder.
2. Replace `client/package.json` and `client/vite.config.js`.
3. Run:

```bash
npm install
npm run dev
```

Optional `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_CASHFREE_MODE=sandbox
```

## Connected backend routes

- `GET /api/products`
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `PATCH /api/users/profile`
- `POST /api/users/addresses`
- `POST /api/orders`
- `GET /api/orders/my-orders`
- `POST /api/orders/pos`
- `GET /api/orders`
- `PATCH /api/orders/:id/status`
- `GET /api/dashboard/today`
- `GET /api/products/inventory`
- `POST /api/products`
- `GET /api/users/customer`
- Cashfree hosted checkout using the payment session returned by `POST /api/orders`.

Customer stock quantities are never requested from the public product API because the backend already excludes `stock` from public product responses.

For production, keep Cashfree payment confirmation server-side through the existing webhook. The frontend only opens checkout and displays the resulting order state.
