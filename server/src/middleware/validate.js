// Parse req.body / req.query / req.params with a Zod schema and replace them
// with the parsed (typed, defaulted, stripped) result. Throws ZodError, which
// the error handler turns into a 400.
export const validate = (schemas) => (req, res, next) => {
  if (schemas.body) req.body = schemas.body.parse(req.body);
  if (schemas.params) req.params = schemas.params.parse(req.params);
  // req.query is a getter in Express 5, so store parsed query separately.
  if (schemas.query) req.validatedQuery = schemas.query.parse(req.query);
  next();
};
