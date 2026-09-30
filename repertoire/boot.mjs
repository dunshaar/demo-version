import('./app.mjs?v=20260930-catalog89-icons').catch(() => {
  document.querySelector('#load-error').hidden = false;
  document.querySelector('#results-count').textContent = 'Список недоступен';
  document.querySelector('#storage-status').textContent = 'Список не загрузился. Обновите страницу, чтобы продолжить.';
});
