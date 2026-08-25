import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function signJwt(payload: { sub: string; email: string; name: string }): string {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

export function verifyJwt(token: string): { sub: string; email: string; name: string } | null {
  try {
    return jwt.verify(token, SECRET) as { sub: string; email: string; name: string };
  } catch {
    return null;
  }
}
