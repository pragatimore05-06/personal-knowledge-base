const StorageService = (() => {
  const NOTES_KEY = "mindvault_notes";
  const SETTINGS_KEY = "mindvault_settings";

  function getNotes() {
    try {
      return JSON.parse(localStorage.getItem(NOTES_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveNotes(notes) {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }

  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { theme: "light" };
    } catch {
      return { theme: "light" };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function exportData() {
    return {
      app: "MindVault",
      version: 1,
      exportedAt: new Date().toISOString(),
      notes: getNotes(),
      settings: getSettings()
    };
  }

  function importData(data) {
    if (!data || !Array.isArray(data.notes)) {
      throw new Error("Invalid backup file.");
    }
    saveNotes(data.notes);
    saveSettings(data.settings || { theme: "light" });
  }

  function clearAll() {
    localStorage.removeItem(NOTES_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  }

  return { getNotes, saveNotes, getSettings, saveSettings, exportData, importData, clearAll };
})();
