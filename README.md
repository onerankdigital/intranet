# Lead Automation Platform - Frontend

A modern Next.js frontend application for managing the Lead Automation Platform backend services.

## Features

- ✅ **Responsive Sidebar Navigation** - Mobile-friendly navigation with collapsible sidebar
- ✅ **shadcn/ui Components** - Beautiful, accessible UI components
- ✅ **Full API Integration** - Manage all backend services from the frontend
- ✅ **Next.js 16** - Leveraging App Router, Server Components, and more
- ✅ **TypeScript** - Full type safety
- ✅ **Dark Mode Support** - Automatic dark mode based on system preferences

## Pages

### Dashboard (`/`)
Overview of all services with quick access cards.

### Authentication (`/auth`)
- **Login** - User authentication with JWT tokens
- **Register** - Create new user accounts
- **Profile** - View current user profile and manage tokens
- **Token Refresh** - Refresh access tokens using refresh tokens

### Clients (`/clients`)
- **Create Client** - Add new clients with custom client IDs
- **List Clients** - View all clients in the system
- **Client Details** - View detailed information about specific clients

### Leads (`/leads`)
- **Ingest Leads** - Add new leads via API (with optional API key authentication)
- **List Leads** - View all leads in the system
- **Lead Details** - View detailed information about specific leads

### Webhooks (`/webhooks`)
- **Webhook Verification** - Verify Meta (Facebook/Instagram) webhooks
- **Webhook Handler** - Handle incoming webhook events from Meta platforms

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (default: `http://localhost:8000`)

### Installation

1. Install dependencies:
```bash
npm install
```

2. (Optional) Create a `.env.local` file to configure API URL:
```bash
# Auto-detection: If not set, the frontend will automatically use the same hostname
# as the current page (useful when accessing via network IP)
# NEXT_PUBLIC_API_URL=http://192.10.44.113:8000

# Or use localhost explicitly:
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Run the development server:
```bash
npm run dev
```

4. Open the app in your browser:
   - Local: [http://localhost:3000](http://localhost:3000)
   - Network: [http://192.10.44.113:3000](http://192.10.44.113:3000) (or your machine's IP)

**Note:** The API URL is auto-detected based on your current hostname. If you access the frontend via a network IP (e.g., `192.10.44.113:3000`), it will automatically use the same IP for the backend API (`192.10.44.113:8000`).

## Project Structure

```
frontend-ui/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── clients/           # Client management pages
│   ├── leads/            # Lead management pages
│   ├── webhooks/         # Webhook management pages
│   ├── layout.tsx        # Root layout with sidebar
│   ├── page.tsx          # Dashboard page
│   └── globals.css       # Global styles and CSS variables
├── components/
│   └── ui/               # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── sidebar.tsx
│       └── ...
├── lib/
│   ├── api.ts            # API client and service functions
│   └── utils.ts          # Utility functions (cn, etc.)
└── public/               # Static assets
```

## Next.js Features Used

- **App Router** - Modern routing with the `app` directory
- **Server Components** - Default React Server Components for better performance
- **Client Components** - Interactive components with `"use client"`
- **Metadata API** - SEO and metadata management
- **Font Optimization** - Automatic font optimization with `next/font`
- **API Routes** - Server-side API integration (via API client)

## API Integration

All API calls go through the centralized API client (`lib/api.ts`):

- **Authentication** - JWT tokens stored in localStorage
- **Error Handling** - Consistent error handling across all API calls
- **Type Safety** - TypeScript interfaces for API responses

### API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/clients` - Create client
- `GET /api/clients` - List clients
- `GET /api/clients/{client_id}` - Get client
- `POST /api/leads/ingest` - Ingest lead
- `GET /api/leads` - List leads
- `GET /api/leads/{lead_id}` - Get lead
- `GET /webhook/meta` - Meta webhook verification
- `POST /webhook/meta` - Meta webhook handler

## Styling

- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **CSS Variables** - Theme customization via CSS variables
- **Dark Mode** - Automatic dark mode support

## Building for Production

```bash
npm run build
npm start
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API Gateway URL
  - **Auto-detection**: If not set, automatically uses the same hostname as the current page
  - **Example**: If frontend is on `192.10.44.113:3000`, API will use `192.10.44.113:8000`
  - **Default**: `http://localhost:8000` (when accessed via localhost)

## License

This project is part of the Lead Automation Platform.
