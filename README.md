# AeroStart

A modern, customizable browser start page with elegant search experience and personalized settings.

## ✨ Features

- 🎨 **Multi-Theme Support** - 8 preset theme colors to choose from
- 🖼️ **Custom Wallpapers** - Support for image and video backgrounds with multiple fit modes
- 🔍 **Multiple Search Engines** - Built-in Google, Baidu, Bing, DuckDuckGo, Bilibili
- ⏰ **Real-time Clock** - Support for 12/24 hour format with optional seconds display
- 🎭 **Dynamic Blur** - Background automatically blurs during search for enhanced focus
- 💾 **Local Storage** - All settings automatically saved to browser local storage
- 📱 **Responsive Design** - Perfect adaptation to all screen sizes
- 🎬 **Smooth Animations** - Carefully designed transitions and interactive animations

## 🚀 Quick Start

**Prerequisites:** Node.js 16+

### Install Dependencies

```bash
pnpm install
# or
npm install
```

### Run Development Server

```bash
pnpm dev
# or
npm run dev
```

Visit `http://localhost:3000` to view the application.

### Build for Production

```bash
pnpm build
# or
npm run build
```

## 🎯 Usage Guide

### Search Functionality
- Enter keywords in the search box and press Enter to search
- Click the icon on the left side of the search box to switch search engines
- Background automatically blurs during search to enhance focus

### Settings Panel
- Right-click the background to enter Dashboard mode
- Click the settings icon in the top right corner to open the settings panel
- Customizable options:
  - Clock format (12/24 hour)
  - Background wallpaper (preset or custom URL)
  - Theme color
  - Search box opacity
  - Background blur intensity

### Wallpaper Settings
- Support for image and video backgrounds
- 5 fit modes: Cover, Contain, Fill, Center, Repeat
- Add custom wallpaper URLs

## 🛠️ Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite 6
- **Language:** TypeScript
- **Styling:** Tailwind CSS

## 📁 Project Structure

```
AeroStart/
├── components/          # React components
│   ├── Clock.tsx       # Clock component
│   ├── SearchBox.tsx   # Search box component
│   ├── SettingsModal.tsx # Settings panel
│   └── ...
├── utils/              # Utility functions
├── context/            # React Context
├── constants.ts        # Constants configuration
├── types.ts           # TypeScript type definitions
├── App.tsx            # Main application component
└── index.tsx          # Application entry point
```

## 🎨 Customization

### Add Search Engine

Edit the `SEARCH_ENGINES` array in `constants.ts`:

```typescript
{
  name: 'Engine Name',
  urlPattern: 'https://example.com/search?q=',
  icon: 'SVG icon string'
}
```

### Add Theme Color

Edit the `THEMES` array in `constants.ts`:

```typescript
{ name: 'Theme Name', hex: '#colorcode' }
```

## 📄 License

MIT License

## 🤝 Contributing

Issues and Pull Requests are welcome!
