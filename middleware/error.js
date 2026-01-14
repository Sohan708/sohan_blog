export function notFound(req, res, next) {
  res.status(404);
  return res.render('public/404', { title: 'Not Found' });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status);
  return res.render('public/error', {
    title: 'Error',
    message: err.message || 'Something went wrong'
  });
}

