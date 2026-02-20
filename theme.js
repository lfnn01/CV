(() => {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const storageKey = "lfa-theme-mode";

  const setLabel = (isNight) => {
    btn.textContent = isNight ? "Day Mode" : "Night Mode";
    btn.setAttribute("aria-label", isNight ? "Switch to day mode" : "Switch to night mode");
  };

  const saved = localStorage.getItem(storageKey);
  if (saved === "night") {
    document.body.classList.add("night-mode");
  }
  setLabel(document.body.classList.contains("night-mode"));

  btn.addEventListener("click", () => {
    const isNight = document.body.classList.toggle("night-mode");
    localStorage.setItem(storageKey, isNight ? "night" : "day");
    setLabel(isNight);
  });
})();
