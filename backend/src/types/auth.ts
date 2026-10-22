// Shape of the JWT payload created in userController.login and
// read back by the auth middleware.
// iat/exp are added automatically by jwt.sign (expiresIn: "1h").
export interface AuthPayload {
  id: number;
  email: string;
  iat?: number;
  exp?: number;
}
