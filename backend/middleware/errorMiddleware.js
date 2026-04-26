export function notFound(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

export function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  const message = err instanceof Error ? err.message : "Server error";
  if (process.env.NODE_ENV !== "production") {
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("Error:", message);
    if (stack) console.error(stack);
  }
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
}

