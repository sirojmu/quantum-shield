/**
 * QuantumShield Desktop — preload script.
 * Securely exposes a minimal API to the renderer via contextBridge.
 */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  saveFile: (bytes, suggestedName, filters) =>
    ipcRenderer.invoke("save-file", bytes, suggestedName, filters),
  openFile: () => ipcRenderer.invoke("open-file"),
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
});
