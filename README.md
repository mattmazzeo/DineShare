# DineShare

A React Native app for sharing dining experiences with friends, powered by Supabase and Plaid integration.

## Features

- 🔐 User authentication with Supabase
- 🏦 Bank account integration via Plaid
- 📱 Social feed of dining posts
- 🍽️ Restaurant discovery and stats
- 👥 Friend connections
- 💰 Transaction tracking and categorization

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in your Supabase and Plaid credentials

3. **Database setup:**
   - Run the SQL schema in `supabase-schema.sql` in your Supabase project
   - This creates all necessary tables and RLS policies

4. **Start the app:**
   ```bash
   npm start
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── navigation/         # Navigation configuration
├── screens/            # App screens
├── services/           # API services (Supabase, Plaid)
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Key Technologies

- **React Native** with Expo
- **TypeScript** for type safety
- **Supabase** for backend and authentication
- **Plaid** for bank account integration
- **React Query** for data fetching
- **React Navigation** for navigation

## Database Schema

The app uses a comprehensive database schema with:
- User profiles and authentication
- Restaurant data and statistics
- Transaction tracking from bank accounts
- Social posts and interactions
- Friend connections and relationships

See `supabase-schema.sql` for the complete schema.
