(() => {
  let theme;
  try {
    theme = localStorage.getItem('aion2-theme');
  } catch {
    theme = null;
  }

  if (theme !== 'dark' && theme !== 'light') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
