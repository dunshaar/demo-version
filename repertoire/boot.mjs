import('./app.mjs?v=20260930-limit20').catch(() => {
  document.querySelector('#load-error').hidden = false;
  document.querySelector('#results-count').textContent = 'Список недоступен';
  document.querySelector('#storage-status').textContent = 'Список не загрузился. Обновите страницу, чтобы продолжить.';
});
