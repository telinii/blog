import type { AuthPayload } from "./auth";

// Declaration merging: adds "user" to Express's Request interface,
// so controllers can read req.user without "(req as any)".
// The auth middleware is the only place that fills it.
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
