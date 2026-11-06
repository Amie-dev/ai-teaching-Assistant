import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'TEACHER' | 'STUDENT';
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'teaching-assistant-super-secret-jwt-key-btech-2026';

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const roleHeader = (req.headers['x-user-role'] as string)?.toUpperCase();
  const isStudent = roleHeader === 'STUDENT';

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.query.token as string | undefined);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true },
      });

      if (user) {
        req.user = {
          ...user,
          role: user.email.includes('student') ? 'STUDENT' : 'TEACHER',
        };
        return next();
      }
    } catch {
      // Fall through to seamless role fallback
    }
  }

  // Seamless zero-friction fallback based on UI role toggle
  try {
    const targetEmail = isStudent ? 'student@brainware.edu' : 'teacher@brainware.edu';
    let user = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: targetEmail,
          passwordHash: 'nopass',
          name: isStudent ? 'Aminul Islam (Student)' : 'Prof. Ria Pyne (Teacher)',
          avatar: isStudent ? '👨‍🎓' : '👩‍🏫',
        },
        select: { id: true, email: true, name: true },
      });
    }

    req.user = {
      ...user,
      role: isStudent ? 'STUDENT' : 'TEACHER',
    };
    next();
  } catch (err: any) {
    // If DB is temporarily unavailable, still provide simulated user so requests do not block
    req.user = {
      id: isStudent ? 'student-id' : 'teacher-id',
      email: isStudent ? 'student@brainware.edu' : 'teacher@brainware.edu',
      name: isStudent ? 'Aminul Islam (Student)' : 'Prof. Ria Pyne (Teacher)',
      role: isStudent ? 'STUDENT' : 'TEACHER',
    };
    next();
  }
};

export function signToken(user: { id: string; email: string; name: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}
