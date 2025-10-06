# GlyphOS

A web-native operating system for creative applications.

## Architecture

GlyphOS is built as a Progressive Web App (PWA) that provides a desktop-like environment in the browser. It uses iframe sandboxing for app isolation, Yjs CRDTs for real-time collaboration, and a federated app registry for distribution.

## Project Structure

```text
glyphd/
├── kernel/           # Core OS kernel (process management, IPC, capabilities)
├── runtime/          # Shared services (storage, AI, collaboration, federation)
├── desktop/          # Desktop environment (windows, dock, command palette)
├── algorithms/       # Complex algorithms (trust, CRDT, layout, search, WebRTC)
├── specs/            # Complete specification documents and implementations
├── types/            # TypeScript type definitions
├── src/              # Main application entry point
└── apps/             # Example applications
```

## Complete Specifications

The `specs/` directory contains comprehensive specification implementations:

- **GAM Schema**: Complete Glyphd App Manifest specification with validation
- **Storage API**: Comprehensive storage layer (KV, FS, Blob, Database)
- **IPC Protocol**: Inter-app communication with message flows and permissions
- **Registry System**: Registry format, verification, and trust chain validation
- **CLI Tools**: Complete command reference and development workflow tools

See [specs/README.md](specs/README.md) for detailed documentation.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run CLI tools
npm run dev:cli
```

## Key Features

- **App Sandboxing**: Each app runs in an isolated iframe with CSP enforcement
- **Real-time Collaboration**: Yjs CRDTs with WebRTC P2P networking
- **Federated Registry**: Decentralized app discovery and distribution
- **Local-first Storage**: OPFS + IndexedDB with optional cloud sync
- **Capability-based Security**: Apps request permissions explicitly
- **Desktop Environment**: Window management, workspaces, command palette
- **Advanced Algorithms**: Trust computation, CRDT resolution, window layouts, search ranking
- **Complete Specifications**: Production-ready schemas, APIs, protocols, and CLI tools
- **Type Safety**: Comprehensive TypeScript interfaces throughout
- **Security**: Ed25519 signatures, permission validation, secure IPC

## License

MIT
