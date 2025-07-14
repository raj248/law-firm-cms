## Read Me

### Build better-sqlite3
Download Electron headers for 22.3.27 Win32
```
npx node-gyp install --target=22.3.27 --arch=ia32 --dist-url=https://electronjs.org/headers
```

Force rebuild better-sqlite3 for Electron
```
npx electron-rebuild -f -w better-sqlite3 --arch=ia32
```

Build for Win32
```
npm run build32
```
