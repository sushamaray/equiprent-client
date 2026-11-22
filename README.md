
# EquipRent — Equipment Rental Platform

EquipRent is a full-stack equipment rental marketplace where customers can discover and rent equipment, owners can list and manage equipment, and administrators can manage the platform.

## Features

### Customer
- Register and sign in using email and password
- Google authentication support
- Browse and search equipment
- Filter equipment by category, location, rental type, price, and availability
- View equipment details
- Add or remove favorite equipment
- Book equipment by selecting rental dates and quantity
- Pay securely using Stripe Checkout
- View rental history
- View and update profile information

### Equipment Owner
- Add equipment with image upload
- View, edit, and delete equipment listings
- Manage equipment rental bookings
- Confirm pending bookings
- View equipment statistics and rental earnings
- View and update profile information

### Administrator
- View platform analytics and monthly booking activity
- Approve or reject equipment submissions
- View and manage users
- Change customer and owner roles
- Manage equipment listings
- Monitor rental bookings and payment statuses
- View and update profile information

## Technologies

### Frontend
- Next.js
- React
- Tailwind CSS
- Framer Motion

### Backend
- Node.js
- Express.js
- MongoDB
- Better Auth
- JWT authentication
- Stripe Checkout
- ImgBB image hosting

## Security
- JWT-protected API endpoints
- Role-based access control
- Server-side booking price calculation
- Stripe payment verification
- Protected environment variables
- Database-backed user permissions

## Local Installation

### Frontend

1. Clone the frontend repository.
2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. Start the development server:

```bash
npm run dev
```

Frontend: http://localhost:3000

### Backend

1. Clone the backend repository.
2. Install dependencies:

```bash
npm install
```

3. Configure the backend `.env` with MongoDB, Better Auth, Stripe, ImgBB, and application URLs.
4. Start the backend:

```bash
npm run dev
```

Backend: http://localhost:5000

## User Roles

- **Customer:** Browse equipment, manage favorites, and rent equipment.
- **Owner:** List equipment and manage customer rentals.
- **Admin:** Review equipment, manage users, and monitor the platform.

## Payment Process

1. The customer selects equipment and rental dates.
2. The backend calculates and validates the rental price.
3. The customer proceeds to Stripe Checkout.
4. Payment is verified on the backend.
5. A successful payment creates the corresponding booking record.

## Project Links

- Live Website: Add deployed frontend URL here
- Frontend Repository: Add GitHub frontend URL here
- Backend Repository: Add GitHub backend URL here

## Testing

Frontend:

```bash
npm run lint
npm run build
```

Backend:

```bash
npm test
```

## Notes

- Admin approval is required before new equipment appears publicly.
- Stripe test mode can be used for development payments.
- Google authentication requires valid OAuth credentials.
- Environment files containing secrets must not be committed.

## Project Type

Programming Hero — Assignment 9, Category 003.