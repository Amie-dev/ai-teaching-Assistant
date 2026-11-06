import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

export const classroomRouter = Router();

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/classrooms - List enrolled classrooms
classroomRouter.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { userId: req.user!.id },
      include: {
        classroom: {
          include: {
            _count: {
              select: {
                memberships: true,
                resources: true,
                halls: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const classrooms = memberships.map((m) => ({
      ...m.classroom,
      role: m.role,
      memberCount: m.classroom._count.memberships,
      resourceCount: m.classroom._count.resources,
      hallCount: m.classroom._count.halls,
    }));

    res.json({ classrooms });
  } catch (err: any) {
    logger.error('Failed to list classrooms:', err);
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

// POST /api/classrooms - Create a new classroom
classroomRouter.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, subject, description } = req.body;
    if (!name || !subject) {
      res.status(400).json({ error: 'Classroom name and subject are required.' });
      return;
    }

    let joinCode = generateJoinCode();
    while (await prisma.classroom.findUnique({ where: { joinCode } })) {
      joinCode = generateJoinCode();
    }

    const classroom = await prisma.classroom.create({
      data: {
        name: name.trim(),
        subject: subject.trim(),
        description: description?.trim() || null,
        joinCode,
        ownerId: req.user!.id,
        memberships: {
          create: {
            userId: req.user!.id,
            role: 'TEACHER',
          },
        },
        halls: {
          create: [
            {
              name: 'general',
              description: 'General course discussion and collaboration',
              topic: 'General Q&A',
              type: 'OPEN',
              status: 'ACTIVE',
              createdById: req.user!.id,
            },
            {
              name: 'doubts',
              description: 'Ask course questions. Mention @assistant to get instant AI answers grounded in course PDFs.',
              topic: 'Doubts & Course Assistance',
              type: 'OPEN',
              status: 'ACTIVE',
              createdById: req.user!.id,
            },
            {
              name: 'announcements',
              description: 'Official announcements from the instructor.',
              topic: 'Announcements',
              type: 'ANNOUNCEMENT',
              status: 'ACTIVE',
              createdById: req.user!.id,
            },
          ],
        },
      },
      include: {
        halls: true,
      },
    });

    res.status(201).json({
      classroom: {
        ...classroom,
        role: 'TEACHER',
        memberCount: 1,
      },
    });
  } catch (err: any) {
    logger.error('Failed to create classroom:', err);
    res.status(500).json({ error: 'Failed to create classroom' });
  }
});

// POST /api/classrooms/join - Join with join code
classroomRouter.post('/join', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { joinCode } = req.body;
    if (!joinCode) {
      res.status(400).json({ error: 'Join code is required.' });
      return;
    }

    const classroom = await prisma.classroom.findUnique({
      where: { joinCode: joinCode.trim().toUpperCase() },
      include: {
        _count: { select: { memberships: true, resources: true, halls: true } },
      },
    });

    if (!classroom) {
      res.status(404).json({ error: 'Invalid join code. Classroom not found.' });
      return;
    }

    const existing = await prisma.membership.findUnique({
      where: {
        userId_classroomId: {
          userId: req.user!.id,
          classroomId: classroom.id,
        },
      },
    });

    if (existing) {
      res.json({
        classroom: {
          ...classroom,
          role: existing.role,
          memberCount: classroom._count.memberships,
        },
        message: 'Already enrolled in this classroom.',
      });
      return;
    }

    const membership = await prisma.membership.create({
      data: {
        userId: req.user!.id,
        classroomId: classroom.id,
        role: 'STUDENT',
      },
    });

    res.status(201).json({
      classroom: {
        ...classroom,
        role: membership.role,
        memberCount: classroom._count.memberships + 1,
      },
      message: 'Successfully joined classroom.',
    });
  } catch (err: any) {
    logger.error('Failed to join classroom:', err);
    res.status(500).json({ error: 'Failed to join classroom' });
  }
});

// GET /api/classrooms/:id - Classroom overview and user role
classroomRouter.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const classroomId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const membership = await prisma.membership.findUnique({
      where: {
        userId_classroomId: {
          userId: req.user!.id,
          classroomId,
        },
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'Access denied. You are not enrolled in this classroom.' });
      return;
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        halls: { orderBy: { createdAt: 'asc' } },
        resources: { orderBy: { createdAt: 'desc' } },
        _count: { select: { memberships: true } },
      },
    });

    if (!classroom) {
      res.status(404).json({ error: 'Classroom not found.' });
      return;
    }

    res.json({
      classroom: {
        ...classroom,
        role: membership.role,
        memberCount: classroom._count.memberships,
      },
    });
  } catch (err: any) {
    logger.error('Failed to get classroom:', err);
    res.status(500).json({ error: 'Failed to load classroom details' });
  }
});

// GET /api/classrooms/:id/members - List members
classroomRouter.get('/:id/members', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const classroomId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const members = await prisma.membership.findMany({
      where: { classroomId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    res.json({
      members: members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatar: m.user.avatar,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (err: any) {
    logger.error('Failed to get members:', err);
    res.status(500).json({ error: 'Failed to load members' });
  }
});

// GET /api/classrooms/:id/halls - List discussion halls
classroomRouter.get('/:id/halls', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const classroomId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const halls = await prisma.hall.findMany({
      where: { classroomId },
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      halls: halls.map((h) => ({
        ...h,
        messageCount: h._count.messages,
      })),
    });
  } catch (err: any) {
    logger.error('Failed to list halls:', err);
    res.status(500).json({ error: 'Failed to load halls' });
  }
});

// POST /api/classrooms/:id/halls - Create a hall (Teacher/TA)
classroomRouter.post('/:id/halls', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const classroomId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, description, topic, type } = req.body;

    const membership = await prisma.membership.findUnique({
      where: {
        userId_classroomId: {
          userId: req.user!.id,
          classroomId,
        },
      },
    });

    if (!membership || (membership.role !== 'TEACHER' && membership.role !== 'TA')) {
      res.status(403).json({ error: 'Only teachers and TAs can create discussion halls.' });
      return;
    }

    if (!name) {
      res.status(400).json({ error: 'Hall name is required.' });
      return;
    }

    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');

    const hall = await prisma.hall.create({
      data: {
        classroomId,
        name: cleanName,
        description: description?.trim() || null,
        topic: topic?.trim() || null,
        type: type || 'OPEN',
        status: 'ACTIVE',
        createdById: req.user!.id,
      },
    });

    res.status(201).json({ hall });
  } catch (err: any) {
    logger.error('Failed to create hall:', err);
    res.status(500).json({ error: 'Failed to create hall' });
  }
});

// GET /api/halls/:hid/messages - Get paged message history
classroomRouter.get('/halls/:hid/messages', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const hallId = Array.isArray(req.params.hid) ? req.params.hid[0] : req.params.hid;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await prisma.message.findMany({
      where: { hallId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.json({
      messages: messages.map((m) => ({
        id: m.id,
        hallId: m.hallId,
        senderId: m.senderId,
        senderName: m.sender?.name || m.senderName,
        isAssistant: m.isAssistant,
        text: m.text,
        routeLabel: m.routeLabel,
        sources: m.sources ? JSON.parse(m.sources) : [],
        pinned: m.pinned,
        createdAt: m.createdAt,
      })),
    });
  } catch (err: any) {
    logger.error('Failed to get hall messages:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// PATCH /api/halls/:hid - Lock or unlock a hall
classroomRouter.patch('/halls/:hid', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const hallId = Array.isArray(req.params.hid) ? req.params.hid[0] : req.params.hid;
    const { status, name, topic } = req.body;

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        classroom: {
          include: {
            memberships: {
              where: { userId: req.user!.id },
            },
          },
        },
      },
    });

    if (!hall) {
      res.status(404).json({ error: 'Hall not found.' });
      return;
    }

    const userMembership = hall.classroom.memberships[0];
    if (!userMembership || (userMembership.role !== 'TEACHER' && userMembership.role !== 'TA')) {
      res.status(403).json({ error: 'Only teachers and TAs can modify discussion halls.' });
      return;
    }

    const updated = await prisma.hall.update({
      where: { id: hallId },
      data: {
        ...(status ? { status } : {}),
        ...(name ? { name } : {}),
        ...(topic !== undefined ? { topic } : {}),
      },
    });

    res.json({ hall: updated });
  } catch (err: any) {
    logger.error('Failed to update hall:', err);
    res.status(500).json({ error: 'Failed to update hall' });
  }
});

