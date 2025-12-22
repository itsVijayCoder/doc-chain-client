This is a [Next.js](https://nextjs.org) project bootstrapped with
[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the
result.

## Testing the Application

### Mock Authentication (Development Mode)

The application includes mock authentication for easy testing without a backend
API. Mock auth is enabled by default in development mode.

**Test Credentials:**

1. **Admin Account** (Full Access)

   -  Email: `admin@docchain.com`
   -  Password: `admin123`
   -  Access: All pages including Admin Dashboard

2. **Standard User Account**
   -  Email: `user@docchain.com`
   -  Password: `user123`
   -  Access: User Dashboard and regular features

**Quick Login:**

-  Navigate to `/login`
-  Click the "Fill" button next to the desired test account
-  Click "Sign in"

### Environment Configuration

To toggle mock authentication, update `.env.local`:

```env
# Enable mock auth (default in development)
NEXT_PUBLIC_USE_MOCK_AUTH=true

# Disable mock auth (use real API)
NEXT_PUBLIC_USE_MOCK_AUTH=false
```

### Available Routes

-  `/login` - Login page with test credentials
-  `/register` - Registration page
-  `/dashboard` - User dashboard (requires authentication)
-  `/admin-dashboard` - Admin dashboard (requires admin role)
-  `/documents` - Document management
-  `/shared` - Shared documents
-  `/favorites` - Favorite documents
-  `/trash` - Deleted documents

You can start editing the page by modifying `app/page.tsx`. The page
auto-updates as you edit the file.

This project uses
[`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
to automatically optimize and load [Geist](https://vercel.com/font), a new font
family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

-  [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
   features and API.
-  [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out
[the Next.js GitHub repository](https://github.com/vercel/next.js) - your
feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the
[Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
from the creators of Next.js.

Check out our
[Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)
for more details.
