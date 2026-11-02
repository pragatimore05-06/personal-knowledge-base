const SearchService = (() => {
  function filter(notes, options = {}) {
    let result = [...notes];
    const query = (options.query || "").trim().toLowerCase();

    if (query) {
      result = result.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        (note.category || "").toLowerCase().includes(query) ||
        (note.tags || []).some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (options.category) {
      result = result.filter(note => note.category === options.category);
    }

    if (options.tag) {
      result = result.filter(note => (note.tags || []).includes(options.tag));
    }

    if (options.favoriteOnly) {
      result = result.filter(note => note.favorite);
    }

    if (options.archivedOnly) {
      result = result.filter(note => note.archived);
    } else if (!options.includeArchived) {
      result = result.filter(note => !note.archived);
    }

    switch (options.sort) {
      case "alpha":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "created":
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        result.sort((a, b) => {
          if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
    }

    return result;
  }

  return { filter };
})();
