/*
  Theme switcher (vanilla JavaScript)
  Follows: https://dev.to/codedgar/how-to-create-a-dark-theme-system-in-5-minutes-or-less-with-vanilla-js-2922

  1. Find the toggle button.
  2. On click, add or remove the dark_mode class on <body>.
  3. Save the current theme in localStorage.
  4. On page load, restore the saved theme.
  5. Listen for storage events so other open tabs stay in sync.
*/

/* Find the button in about.html by its id */
let theme_toggler = document.querySelector('#theme_toggler');

/* Click handler: flip the dark_mode class, then store the result */
theme_toggler.addEventListener('click', function () {
  document.body.classList.toggle('dark_mode');

  /* If the body now has dark_mode, save that name; otherwise save default */
  if (document.body.classList.contains('dark_mode')) {
    localStorage.setItem('website_theme', 'dark_mode');
  } else {
    localStorage.setItem('website_theme', 'default');
  }
});

/*
  Restore the saved theme when the page loads.
  Removes both possible classes first, then adds the stored one.
*/
function retrieve_theme() {
  var theme = localStorage.getItem('website_theme');
  if (theme != null) {
    document.body.classList.remove('default', 'dark_mode');
    document.body.classList.add(theme);
  }
}

/* Apply the saved theme immediately so a refresh keeps the same look */
retrieve_theme();

/* If the user changes the theme in another tab, update this tab too */
window.addEventListener('storage', function () {
  retrieve_theme();
}, false);
