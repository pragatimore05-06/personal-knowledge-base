const NotesManager = (() => {
  let notes = StorageService.getNotes();

  function getAll() {
    return [...notes];
  }

  function getById(id) {
    return notes.find(note => note.id === id);
  }

  function save(noteData) {
    const now = new Date().toISOString();

    if (noteData.id) {
      notes = notes.map(note =>
        note.id === noteData.id
          ? { ...note, ...noteData, updatedAt: now }
          : note
      );
    } else {
      notes.unshift({
        ...noteData,
        id: Utils.createId(),
        createdAt: now,
        updatedAt: now,
        archived: false
      });
    }

    StorageService.saveNotes(notes);
  }

  function remove(id) {
    notes = notes.filter(note => note.id !== id);
    StorageService.saveNotes(notes);
  }

  function duplicate(id) {
    const original = getById(id);
    if (!original) return;

    const now = new Date().toISOString();
    notes.unshift({
      ...original,
      id: Utils.createId(),
      title: `${original.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
      archived: false
    });
    StorageService.saveNotes(notes);
  }

  function toggleFavorite(id) {
    const note = getById(id);
    if (!note) return;
    note.favorite = !note.favorite;
    note.updatedAt = new Date().toISOString();
    StorageService.saveNotes(notes);
  }

  function togglePin(id) {
    const note = getById(id);
    if (!note) return;
    note.pinned = !note.pinned;
    note.updatedAt = new Date().toISOString();
    StorageService.saveNotes(notes);
  }

  function toggleArchive(id) {
    const note = getById(id);
    if (!note) return;
    note.archived = !note.archived;
    note.updatedAt = new Date().toISOString();
    StorageService.saveNotes(notes);
  }

  function replaceAll(importedNotes) {
    notes = importedNotes;
    StorageService.saveNotes(notes);
  }

  return {
    getAll,
    getById,
    save,
    remove,
    duplicate,
    toggleFavorite,
    togglePin,
    toggleArchive,
    replaceAll
  };
})();
