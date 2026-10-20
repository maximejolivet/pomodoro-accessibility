const { contextBridge, ipcRenderer } = require('electron');

// Seules ces fonctions passent du renderer au process principal : pas d'accès direct à Node
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  notifications: {
    schedule: (alerts, withSound) => ipcRenderer.invoke('notif:schedule', alerts, withSound),
    scheduleReminders: (reminders, withSound) =>
      ipcRenderer.invoke('notif:scheduleReminders', reminders, withSound),
    cancelAll: () => ipcRenderer.invoke('notif:cancelAll'),
    test: (title, body, withSound) => ipcRenderer.invoke('notif:test', title, body, withSound),
    takePendingTap: () => ipcRenderer.invoke('notif:takePendingTap'),
    onReminderTapped: callback => {
      ipcRenderer.on('notif:reminderTapped', (_event, routineId) => callback(routineId));
    },
    onAppState: callback => {
      ipcRenderer.on('app:state', (_event, isActive) => callback(isActive));
    },
  },
});
