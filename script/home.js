const STORAGE_KEY_THEME = "ig_theme_v1";
const STORAGE_KEY_TUTORIAL_UNLOCKED = "ff_tutorial_unlocked_v1";

function loadTheme() {
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  return saved === "dark" ? "dark" : "light";
}

function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEY_THEME, theme);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function getNavLogoSrc(theme) {
  return theme === "light" ? "./assets/f&f-logo-light.png" : "./assets/f&f-logo.png";
}

function setNavLogo(theme) {
  const logo = document.querySelector(".top-nav-logo");
  if (!(logo instanceof HTMLImageElement)) return;
  logo.src = getNavLogoSrc(theme);
}

function setThemeToggleButton(theme) {
  const button = document.getElementById("toggle-theme");
  if (!(button instanceof HTMLButtonElement)) return;

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
  button.setAttribute("data-tip", label);
  button.innerHTML =
    theme === "dark"
      ? `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>`
      : `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"></path></svg>`;
}

function setTutorialUnlocked(unlocked) {
  const shell = document.querySelector("[data-tutorial-shell]");
  if (!(shell instanceof HTMLElement)) return;
  shell.classList.toggle("is-locked", !unlocked);
}

let activeTheme = loadTheme();
applyTheme(activeTheme);
setNavLogo(activeTheme);
setThemeToggleButton(activeTheme);
setTutorialUnlocked(localStorage.getItem(STORAGE_KEY_TUTORIAL_UNLOCKED) === "true");

document.getElementById("toggle-theme")?.addEventListener("click", () => {
  activeTheme = activeTheme === "dark" ? "light" : "dark";
  applyTheme(activeTheme);
  saveTheme(activeTheme);
  setNavLogo(activeTheme);
  setThemeToggleButton(activeTheme);
});

document.querySelector("[data-tutorial-unlock]")?.addEventListener("click", () => {
  localStorage.setItem(STORAGE_KEY_TUTORIAL_UNLOCKED, "true");
  setTutorialUnlocked(true);
});

document.querySelector("[data-tutorial-reset]")?.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY_TUTORIAL_UNLOCKED);
  setTutorialUnlocked(false);
});
