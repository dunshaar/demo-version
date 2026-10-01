import('./app.mjs?v=20261001-no-want-all').catch(() => {
  document.querySelector('#load-error').hidden = false;
  document.querySelector('#results-count').textContent = 'Список недоступен';
  document.querySelector('#storage-status').textContent = 'Список не загрузился. Обновите страницу, чтобы продолжить.';
});
