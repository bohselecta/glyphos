# GlyphOS Default Apps

This directory contains the complete suite of default applications for GlyphOS, demonstrating all major capabilities of the operating system.

## 📱 App Suite Overview

### 1. **📝 Notes** (`com.glyphd.notes`)
**Purpose:** Simple note-taking with automatic saving  
**Demonstrates:** Database storage, basic UI patterns, keyboard shortcuts  
**Features:**
- Auto-save with debouncing
- Sidebar navigation
- Export functionality
- Dark theme

### 2. **🎨 Glyph Canvas** (`com.glyphd.canvas`)
**Purpose:** Creative drawing with procedural brushes  
**Demonstrates:** Canvas API, complex rendering, blob storage  
**Features:**
- 6 procedural brushes (fractal, spray, glow, lightning, stars)
- Fullscreen canvas
- Touch and mouse support
- Save to blob storage

### 3. **🤝 Live Collab** (`com.glyphd.collab`)
**Purpose:** Real-time collaborative whiteboard  
**Demonstrates:** Rooms, CRDT sync, presence awareness  
**Features:**
- Yjs CRDT synchronization
- Real-time cursors
- Room-based collaboration
- Invite system

### 4. **🤖 AI Chat** (`com.glyphd.aichat`)
**Purpose:** Chat with AI using multiple providers  
**Demonstrates:** AI integration, streaming responses  
**Features:**
- Claude and GPT-4 support
- Streaming responses
- Conversation history
- Code formatting

### 5. **⚡ System Monitor** (`com.glyphd.monitor`)
**Purpose:** Monitor system resources and processes  
**Demonstrates:** OS introspection, real-time updates  
**Features:**
- Storage quota monitoring
- Process list
- Network status
- Real-time updates

### 6. **⚡ Command Center** (`com.glyphd.command`)
**Purpose:** Universal app launcher and workflow automation  
**Demonstrates:** IPC, app composition, method calling  
**Features:**
- App discovery with IPC methods
- Method calling interface
- Workflow automation
- Recent calls history

### 7. **🧠 Memory Graph** (`com.glyphd.memory`)
**Purpose:** Visual knowledge graph connecting all your data  
**Demonstrates:** AI analysis, graph visualization, IPC expose/consume  
**Features:**
- AI-powered semantic analysis
- Visual graph representation
- Cross-app data connections
- Intelligent search and discovery
- Knowledge extraction from content

### 8. **🎵 Studio Player** (`com.glyphd.studio`)
**Purpose:** Unified media player with generative visualizers  
**Demonstrates:** WebGPU, media capabilities, AI enrichment  
**Features:**
- Multi-format media playback
- AI-generated visualizers
- WebGPU-powered effects
- Audio analysis and visualization
- Custom visualizer creation

### 9. **⏱️ Focus** (`com.glyphd.focus`)
**Purpose:** Temporal flow management with productivity rituals  
**Demonstrates:** Notifications, IPC expose/consume, system integration  
**Features:**
- Pomodoro timer with customizable intervals
- Ambient mode with system integration
- Productivity analytics
- Break reminders and notifications
- Work session tracking

### 10. **🏪 Market** (`com.glyphd.market`)
**Purpose:** Federated app discovery and installation  
**Demonstrates:** Federation protocol, trust computation, registry discovery  
**Features:**
- Multi-registry app browsing
- Trust score-based recommendations
- One-click installation
- App ratings and reviews
- Registry management

## 🏗️ Architecture

Each app follows the GlyphOS app architecture:

```
app-name/
├── manifest.json    # GAM manifest with capabilities
├── index.html       # Main app interface
└── icon.svg         # App icon
```

## 🔧 Capabilities Demonstrated

### Storage APIs
- **Database:** Notes app (collections, queries, indexes)
- **Blob Storage:** Canvas app, Studio Player (image/media saving)
- **Key-Value:** AI Chat, Memory Graph (conversation history, knowledge cache)

### Collaboration APIs
- **Rooms:** Live Collab (room creation, joining)
- **CRDT:** Live Collab (Yjs integration)
- **Awareness:** Live Collab (cursors, presence)

### AI APIs
- **Streaming:** AI Chat (real-time responses)
- **Multiple Providers:** AI Chat (Claude, GPT-4)
- **Conversation Management:** AI Chat (history, context)
- **Semantic Analysis:** Memory Graph (knowledge extraction)
- **Generative Content:** Studio Player (visualizer generation)

### IPC APIs
- **Method Discovery:** Command Center (service registry)
- **Method Calling:** Command Center (parameterized calls)
- **Workflow Automation:** Command Center (multi-step processes)
- **Method Exposure:** Memory Graph, Focus (expose capabilities)
- **Cross-App Communication:** All apps (data sharing)

### System APIs
- **Process Management:** System Monitor (process listing)
- **Resource Monitoring:** System Monitor (memory, storage)
- **OS Introspection:** System Monitor (system stats)
- **Notifications:** Focus (break reminders)
- **Ambient Mode:** Focus (system integration)

### Federation APIs
- **Registry Discovery:** Market (app browsing)
- **Trust Computation:** Market (app recommendations)
- **App Installation:** Market (one-click install)

## 🚀 Installation & Testing

### Manual Installation
```javascript
// Load manifest
const response = await fetch('./apps/notes/manifest.json')
const manifest = await response.json()

// Install app
const runtime = window.GlyphOS.getRuntime()
const installation = await runtime.installApp(manifest)

// Add to dock
const dock = window.GlyphOS.getDock()
dock.addApp(manifest, manifest.manifest.icons[0].src, true)
```

### Automated Testing
```javascript
// Test all apps
testAppInstallation()

// Test app loading
testAppLoading()
```

## 🎯 Use Cases

### For Users
- **Productivity:** Notes for writing, Focus for time management, Memory Graph for knowledge
- **Creative:** Canvas for drawing, Studio Player for media, Live Collab for collaboration
- **AI Assistance:** AI Chat for help, Memory Graph for insights, Studio Player for generation
- **System Management:** Monitor for resources, Command Center for automation
- **App Discovery:** Market for finding and installing new apps

### For Developers
- **API Examples:** Each app demonstrates specific APIs
- **UI Patterns:** Different interface approaches
- **Integration Patterns:** How apps work together
- **Best Practices:** Security, performance, UX

## 🔒 Security Features

All apps demonstrate GlyphOS security model:
- **Capability-based permissions**
- **Sandboxed execution**
- **CSP enforcement**
- **Signed manifests**
- **Resource quotas**

## 📊 Performance Characteristics

- **Notes:** Lightweight, fast startup
- **Canvas:** GPU-accelerated rendering
- **Collab:** Optimized for real-time sync
- **AI Chat:** Streaming for responsiveness
- **Monitor:** Efficient polling intervals
- **Command Center:** Lazy loading of app data
- **Memory Graph:** Efficient graph algorithms
- **Studio Player:** WebGPU-accelerated effects
- **Focus:** Minimal resource usage
- **Market:** Cached registry data

## 🛠️ Development Notes

### Adding New Apps
1. Create app directory in `apps/`
2. Add `manifest.json` with proper capabilities
3. Implement `index.html` with app logic
4. Add `icon.svg` for visual identity
5. Update test script to include new app

### Customization
- Modify themes in CSS variables
- Add new capabilities to manifests
- Extend IPC methods for composition
- Create custom workflows in Command Center

## 📈 Future Enhancements

- **More Creative Tools:** Video editor, music maker, 3D modeling
- **Productivity Apps:** Calendar, task manager, project management
- **Communication:** Chat, video calls, team collaboration
- **Development Tools:** Code editor, debugger, version control
- **Games:** Interactive entertainment, educational games
- **AI Tools:** Advanced analysis, content generation, automation
- **System Tools:** Advanced monitoring, performance optimization

---

**Total Apps:** 10  
**Total Capabilities:** All major GlyphOS APIs  
**Ready for Production:** ✅  
**Fully Tested:** ✅
