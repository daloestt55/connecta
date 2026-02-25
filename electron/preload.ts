import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  
  // Notifications
  showNotification: (options: { title: string; body: string }) => 
    ipcRenderer.invoke('notification:show', options),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  
  // External links
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  
  // Updates
  checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
  
  // Deep linking
  onDeepLink: (callback: (url: string) => void) => {
    ipcRenderer.on('deep-link', (_, url) => callback(url));
  },
  
  // Platform info
  platform: process.platform,
  isElectron: true,
});

// Expose type definitions for TypeScript
export interface ElectronAPI {
  getVersion: () => Promise<string>;
  getPath: (name: string) => Promise<string>;
  showNotification: (options: { title: string; body: string }) => Promise<void>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  checkForUpdates: () => Promise<{ available: boolean; version: string }>;
  onDeepLink: (callback: (url: string) => void) => void;
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
