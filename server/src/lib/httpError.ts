// Domain failures express themselves by throwing; the global error handler
// maps status codes. Services stay HTTP-free.
export class HttpError extends Error {
  constructor(
    public status: 400 | 401 | 403 | 404 | 409,
    message: string
  ) {
    super(message);
  }
}