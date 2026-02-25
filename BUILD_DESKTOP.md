# Connecta Desktop App - Build Instructions

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Run in development mode (web)
npm run dev

# Run in Electron development mode
npm run dev:electron
```

### Building for Production

#### Windows
```bash
# Build EXE installer and portable version
npm run build:win

# Build only portable version
npm run build:portable
```

After build completes, find your installers in the `release/` folder:
- `Connecta-Setup-1.0.0.exe` - Full installer with setup wizard
- `Connecta-Portable-1.0.0.exe` - Portable version (no installation required)

## 📦 What Gets Built

### Windows Installer Features:
- ✅ Full NSIS installer with setup wizard
- ✅ Option to choose installation directory
- ✅ Desktop shortcut creation
- ✅ Start Menu shortcut
- ✅ Auto-update support (placeholder)
- ✅ Protocol handler for `connecta://` URLs
- ✅ Uninstaller included

### Portable Version:
- ✅ Single EXE file
- ✅ No installation required
- ✅ Run from USB drive
- ✅ Stores settings in app folder

## 🔧 Technical Details

### Technologies Used:
- **Electron** - Desktop app framework
- **Vite** - Build tool
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Backend & real-time communication

### File Structure:
```
├── electron/
│   ├── main.ts        # Main process (Node.js)
│   └── preload.ts     # Preload script (bridge)
├── src/               # React app
├── build/             # Build resources (icons, installer script)
├── dist/              # Web build output
├── dist-electron/     # Electron build output
└── release/           # Final installers
```

## 🌐 Real-Time Communication

The app uses Supabase for real-time features:
- ✅ Direct messaging across the internet
- ✅ Friend requests
- ✅ Online status
- ✅ File sharing
- ✅ Voice/Video calls (WebRTC)

### Environment Variables:
Create a `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_TELEGRAM_BOT_TOKEN=your_bot_token
VITE_TELEGRAM_CHAT_ID=your_chat_id
```

## 🎨 Customization

### Change App Icon:
Replace these files in `build/` folder:
- `icon.ico` - Windows icon (256x256)
- `icon.png` - General icon (512x512)
- `icon.icns` - macOS icon (512x512)

You can generate icons from a single PNG using:
- https://icoconvert.com/ (for .ico)
- https://iconverticons.com/ (for .icns)

### Change App Name:
Edit `package.json`:
```json
{
  "name": "your-app-name",
  "productName": "Your App Name"
}
```

Edit `electron-builder.json`:
```json
{
  "appId": "com.yourcompany.yourapp",
  "productName": "Your App Name"
}
```

## 🐛 Troubleshooting

### Build fails
```bash
# Clear caches
rm -rf node_modules dist dist-electron release
npm install
npm run build:win
```

### Icon not showing
- Make sure `build/icon.ico` exists
- Icon must be 256x256 or larger
- Rebuild after changing icon

### App won't connect to internet
- Check `.env` file has correct Supabase credentials
- Make sure Windows Firewall allows the app
- Check Supabase project is active

## 📝 Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Web development server |
| `npm run dev:electron` | Electron development mode |
| `npm run build` | Build web version |
| `npm run build:electron` | Build Electron app (all platforms) |
| `npm run build:win` | Build Windows installer + portable |
| `npm run build:portable` | Build only Windows portable |
| `npm run electron` | Run Electron with built files |
| `npm run pack` | Package without creating installer |
| `npm run dist` | Create installer for current platform |

## 🚢 Distribution

### For Users:
1. Download `Connecta-Setup-1.0.0.exe`
2. Run the installer
3. Follow setup wizard
4. Launch Connecta from Start Menu or Desktop

### For Developers:
```bash
# Clone repository
git clone https://github.com/daloestt55/connecta.git
cd connecta

# Install dependencies
npm install

# Build for Windows
npm run build:win

# Distribute files in release/ folder
```

## 📊 Build Size

Typical build sizes:
- Web version: ~2-3 MB
- Windows installer: ~80-100 MB
- Windows portable: ~120-150 MB
- macOS DMG: ~90-110 MB

Size includes:
- Electron runtime (~70 MB)
- Chromium (~50 MB)
- Node.js (~20 MB)
- Your app (~10 MB)

## 🔐 Security

The app implements:
- Context isolation
- Preload scripts for secure IPC
- Content Security Policy
- External URL blocking
- Sandboxed renderer process

## 📱 Platform Support

Currently optimized for:
- ✅ Windows 10/11 (64-bit)
- ✅ Windows 10/11 (32-bit)
- ⚠️ macOS (experimental)
- ⚠️ Linux (experimental)

## 🆘 Support

For issues or questions:
1. Check [GitHub Issues](https://github.com/daloestt55/connecta/issues)
2. Read [FAQ](FAQ.md)
3. Join our Discord (coming soon)

## 📄 License

MIT License - see LICENSE.txt for details
