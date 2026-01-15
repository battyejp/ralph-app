# Customer Search Frontend

Next.js web application for searching and viewing customers via the Customer API.

## Prerequisites

- Node.js 20+
- npm or yarn

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy the environment file:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your API URL if different from default:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
  app/          # Next.js app router pages
  components/   # React components
    ui/         # shadcn/ui components
  lib/          # Utility functions
```

## Technologies

- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Radix UI primitives
