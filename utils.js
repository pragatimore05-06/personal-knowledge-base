const Utils = (() => {
  function createId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function formatDate(dateValue) {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date(dateValue));
  }

  function escapeHTML(value = "") {
    return value.replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function truncate(value = "", length = 140) {
    return value.length > length ? `${value.slice(0, length)}...` : value;
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  return { createId, formatDate, escapeHTML, truncate, showToast };
})();
