## Requirements

- Node.js v18+ https://nodejs.org

## Dependencies

    react                   ^19.2.0
    react-dom               ^19.2.0
    react-router-dom        ^7.13.1
    @supabase/supabase-js   ^2.99.1
    leaflet                 ^1.9.4
    react-leaflet           ^5.0.0
    styled-components       ^6.3.11
    vite                    ^8.0.0-beta.13

## Setup

1. Clone repo and install dependencies

   git clone git@git.cs.bham.ac.uk:software-engineering-2025-26/BinaryBandits.git
   cd BinaryBandits
   npm install

2. Create .env file in the project root

   VITE_SUPABASE_URL=https://pqzjivrrcdxlxnazyswh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxemppdnJyY2R4bHhuYXp5c3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjQ5MzMsImV4cCI6MjA4ODgwMDkzM30.R6z2BBNsKX45a-fzRsx75RI5VbclXjBJEiKMUcDOUrQ

   A .env file is already included in the repository with the Supabase credentials.
   Should work after npm install.

## Running

    npm run dev
    npm run build
    npm run preview

### Test Accounts

Moderator test account
Email: moderator@bham.ac.uk
Password: password123

User test account
Email: test@example.com
Password: password123

## Supabase Access

Email: binarybandits25@gmail.com
Password: rokgu5-vynkyT-xujxew

## Database Schema

The full database schema is in schema.sql at /database.
This includes all table definitions, RLS policies, and the trigger that
auto-creates accessibility_preferences and user_roles rows on signup.

## Testing

Unit tests (Vitest):

    npm run test

End-to-end tests (Playwright):

    npx playwright install
    npx playwright test

### Dev Dependencies

    vitest                      ^4.0.7
    @testing-library/react      ^16.3.0
    @testing-library/jest-dom   ^6.9.1
    @testing-library/user-event ^14.6.1
    @playwright/test            (via npx)
    @axe-core/playwright        (WCAG audit)
