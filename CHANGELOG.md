# Changelog

All notable changes to Connecta will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-25

### 🎉 First Public Release

This is the first public release of Connecta - a modern Discord-like communication platform with premium features.

### ✨ Added

#### Premium System
- **Connecta Premium subscription** ($4.99/month or $47.99/year with 20% discount)
- **12+ Premium Features** across customization, performance, social, and storage categories
- **Active subscription management** with renewal dates and days remaining
- **Subscription cancellation** with feature loss preview
- **Purchase tracking system** with localStorage persistence

#### Store
- **15 Products** including:
  - Premium subscriptions (monthly and yearly)
  - Avatar frames ($2.99-$3.99): Neon Glow, Cosmic Star, Fire Ring, Ice Crystal
  - Themes ($1.99-$2.49): Dark Purple, Ocean, Sunset
  - Sticker packs ($0.99-$1.99): Emoji Pack Pro, Animated Stickers, Meme Pack
  - Server boosts ($2.99-$6.99)
- **Full checkout flow** with payment method selection
- **Mock payment processing** (90% success rate for testing)
- **Category filtering and search** functionality

#### Profile Customization
- **Premium theme integration** - 4 free themes, 3 premium themes
- **Accent colors** - 2 free colors, 4 premium colors with lock icons
- **Avatar frames** - Premium exclusive frames (Neon, Cosmic)
- **Premium badge** displayed next to username
- **Custom banners** with gradient options
- **Profile link generation** (connecta.link/u/{code})

#### Social Features
- **Friends system** with Supabase database integration
- **Add/accept/remove friends** with RLS policies
- **Friend requests** with real-time updates
- **Verification badges** in chat and profiles
- **Mutual servers** display (placeholder)

#### Communication
- **Direct messaging** with auto-reply in dev mode
- **Verification badge display** in chat messages
- **Link generation system**:
  - Profile links (connecta.link/u/{code})
  - Server invites (connecta.link/s/{CODE})
  - Call links (connecta.link/v/{code} or /a/{code})
  - Friend invites (connecta.link/f/{code})
  - Group invites (connecta.link/g/{code})

#### Server Management
- **Role color customization** with 10 color options
- **Server settings** interface
- **Role creation and editing**

#### Bug Reporting
- **Direct Telegram integration** for bug reports
- **Real Telegram bot** (token: 8214180041:...)
- **Instant bug submission** to Telegram chat

#### Settings
- **Keyboard shortcuts** (Ctrl+, and Ctrl+Shift+S)
- **Quick settings access**
- **Profile customization drawer**

#### Technical
- **Supabase integration** with project ovwhuvapliwlkuunpqbc
- **RLS policies** for secure data access
- **RPC functions** for friend management
- **localStorage** for purchase persistence
- **Environment variables** support (VITE_DEV_MODE)
- **Development mode** with Telegram verification bypass

### 📦 Components

#### Design System
- GlassCard with glassmorphism effects
- Premium-aware Button components
- Badge system with status indicators
- Avatar with frame support
- Input components with validation
- Waveform visualization

#### UI Components (shadcn/ui)
- Complete set of 40+ components
- Accessible and customizable
- Tailwind CSS integration
- Dark theme optimized

### 🏗️ Architecture

- **React 18.3.1** with TypeScript
- **Vite 6.3.5** for fast development
- **Tailwind CSS 4.1.12** for styling
- **Supabase** for backend
- **GitHub Actions** for CI/CD

### 🔧 Configuration

- Development mode with mock data
- Production-ready build system
- Local Supabase development environment
- Environment variable configuration

### 📝 Documentation

- README.md with project overview
- Guidelines.md with design system rules
- ATTRIBUTIONS.md for credits
- Inline code documentation

### 🐛 Bug Fixes

- Fixed Settings keyboard shortcuts (Ctrl+, and Ctrl+Shift+S)
- Fixed verification badge duplication in chat
- Fixed banner upload in profile customization
- Fixed color selection persistence

### 🔐 Security

- Row Level Security (RLS) policies on friendships table
- Secure Supabase integration
- User-specific data access
- Protected RPC functions

---

## How to Create a Release

To create a new release:

1. Update version in `package.json`
2. Update this CHANGELOG.md with new changes
3. Commit changes:
   ```bash
   git add .
   git commit -m "Release v1.0.0"
   ```
4. Create and push a tag:
   ```bash
   git tag v1.0.0
   git push origin main --tags
   ```
5. GitHub Actions will automatically:
   - Build the application
   - Create release archives (zip and tar.gz)
   - Create a GitHub Release with release notes
   - Deploy to GitHub Pages

[1.0.0]: https://github.com/yourusername/connecta/releases/tag/v1.0.0
