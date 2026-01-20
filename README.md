# Restaurant POS Dashboard

A modern, role-based Point of Sale (POS) dashboard system for restaurants with OTP-based authentication and beautiful glassmorphism UI design.

## Features

### 🔐 Authentication
- **Login System** with email/password and OTP verification
- **Forgot Password** with OTP-based recovery flow
- **JWT Token Management** with secure cookie storage
- **Role-Based Access Control** for different staff types

### 👥 User Roles
- **Admin** - Full system access, menu management, staff management, reports
- **Cashier** - Billing, payments, session management
- **Waiter** - Order creation, table management
- **Kitchen Staff** - Order preparation, queue management

### 🎨 Design
- **Premium Glassmorphism** UI with modern aesthetics
- **Responsive Design** for all screen sizes
- **Smooth Animations** and micro-interactions
- **Custom Color Palette** with restaurant theme
- **Dark Gradients** and vibrant accents

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **State Management**: Redux Toolkit with RTK Query
- **Styling**: Vanilla CSS with CSS Modules
- **TypeScript**: Full type safety
- **Backend API**: Node.js + Express + PostgreSQL (existing)

## Project Structure

```
frontend/
├── app/
│   ├── login/                 # Login page with OTP modal
│   ├── forgot-password/       # Password recovery flow
│   ├── dashboard/
│   │   ├── admin/            # Admin dashboard
│   │   ├── cashier/          # Cashier dashboard
│   │   ├── waiter/           # Waiter dashboard
│   │   └── kitchen/          # Kitchen staff dashboard
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page (redirects to login)
├── components/
│   ├── auth/
│   │   └── AuthGuard.tsx     # Route protection
│   ├── dashboard/
│   │   └── DashboardLayout.tsx # Main dashboard layout
│   ├── ui/
│   │   ├── Button.tsx        # Reusable button component
│   │   ├── Input.tsx         # Reusable input component
│   │   ├── Card.tsx          # Card component
│   │   └── Modal.tsx         # Modal component
│   └── Providers.tsx         # Redux provider
├── store/
│   ├── api/
│   │   └── authApi.ts        # RTK Query API
│   ├── slices/
│   │   └── authSlice.ts      # Auth state slice
│   └── store.ts              # Redux store config
└── styles/
    ├── globals.css           # Global styles
    └── variables.css         # CSS variables
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend server running on `http://localhost:5000`

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd "G:\NEXT.JS\Food Delivery\frontend"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   The `.env.local` file is already created with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## Usage

### Login Flow

1. Navigate to `/login`
2. Enter email and password
3. Click "Sign In"
4. Check email for OTP code
5. Enter OTP in the modal
6. Redirected to role-specific dashboard

### Password Recovery

1. Click "Forgot password?" on login page
2. Enter your email
3. Check email for OTP
4. Enter OTP
5. Set new password
6. Redirected to login

### Dashboard Access

Each role has a unique dashboard:

- **Admin**: `/dashboard/admin` - Full system overview
- **Cashier**: `/dashboard/cashier` - Billing and payments
- **Waiter**: `/dashboard/waiter` - Order management
- **Kitchen**: `/dashboard/kitchen` - Order preparation

## API Endpoints Used

- `POST /api/user/login` - Login with email/password
- `POST /api/user/verify-otp/:email` - Verify OTP
- `POST /api/user/recover-email` - Send recovery OTP
- `POST /api/user/recover-otp/:email` - Verify recovery OTP
- `POST /api/user/recover-password/:email/:otp` - Reset password
- `POST /api/user/logout` - Logout

## Design System

### Colors

- **Primary**: Orange gradient (#f97316 → #ea580c)
- **Secondary**: Blue gradient (#3b82f6 → #1d4ed8)
- **Success**: Green gradient (#10b981 → #059669)
- **Error**: Red (#ef4444)

### Typography

- **Font Family**: Inter (Google Fonts)
- **Headings**: 800, 700, 600 weight
- **Body**: 400, 500 weight

### Components

All components support:
- Multiple variants (primary, secondary, success, danger)
- Different sizes (sm, md, lg)
- Loading states
- Error states
- Responsive design

## Security Features

- JWT tokens stored in httpOnly cookies
- Token persistence in localStorage
- Automatic redirect on unauthorized access
- Role-based route protection
- OTP verification for sensitive operations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Backend Connection Issues

If you see connection errors, ensure:
1. Backend server is running on port 5000
2. CORS is enabled on backend
3. `.env.local` has correct API URL

### OTP Not Received

Check:
1. Email service is configured on backend
2. Email address is correct
3. Check spam folder

### Build Errors

If build fails:
```bash
rm -rf .next node_modules
npm install
npm run build
```

## Next Steps

To extend this application:

1. **Add Real Data**: Connect to actual backend APIs
2. **Implement Features**: Menu management, order creation, billing
3. **Add WebSocket**: Real-time order updates
4. **Add Charts**: Sales analytics and reports
5. **Add Notifications**: Toast notifications for actions
6. **Add Print**: Receipt printing functionality

## License

This project is part of the Restaurant POS system.
