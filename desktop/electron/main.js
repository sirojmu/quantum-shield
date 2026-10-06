/**
 * QuantumShield Desktop — Electron main process.
 * Creates the BrowserWindow and exposes native file dialogs.
 */

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 940,
    height: 700,
    minWidth: 720,
    minHeight: 560,
    title: "QuantumShield Desktop",
    backgroundColor: "#0c1213",
    frame: false, // custom title bar
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.loadFile(path.join(__dirname, "..", "dist", "index.html"));

  if (isDev) {
    win.webContents.openDevTools({ mode: "detach" });
  }
}

// IPC: save file with native dialog
ipcMain.handle("save-file", async (event, bytes, suggestedName, filters) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showSaveDialog(win, {
    title: "Save file",
    defaultPath: suggestedName,
    filters: filters || [{ name: "All Files", extensions: ["*"] }],
  });
  if (result.canceled || !result.filePath) return false;
  const buffer = Buffer.from(bytes);
  fs.writeFileSync(result.filePath, buffer);
  return true;
});

// IPC: open file with native dialog (unused in current renderer, kept for future)
ipcMain.handle("open-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const buffer = fs.readFileSync(filePath);
  return {
    name: path.basename(filePath),
    bytes: Array.from(buffer),
    mimeType: "application/octet-stream",
  };
});

// IPC: window controls
ipcMain.on("window-minimize", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});
ipcMain.on("window-maximize", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  }
});
ipcMain.on("window-close", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
