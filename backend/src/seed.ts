import bcrypt from 'bcryptjs';
import { prisma } from './db.js';
import { logger } from './utils/logger.js';

export async function seedDatabase() {
  try {
    const existingTeacher = await prisma.user.findUnique({
      where: { email: 'teacher@brainware.edu' },
    });

    if (existingTeacher) {
      logger.info('Database already seeded. Skipping initial seed.');
      return;
    }

    logger.info('Seeding initial users and classroom into PostgreSQL...');

    const salt = await bcrypt.genSalt(10);
    const teacherPasswordHash = await bcrypt.hash('teacher123', salt);
    const studentPasswordHash = await bcrypt.hash('student123', salt);

    const teacher = await prisma.user.create({
      data: {
        email: 'teacher@brainware.edu',
        passwordHash: teacherPasswordHash,
        name: 'Prof. Ria Pyne',
        avatar: '👩‍🏫',
      },
    });

    const student = await prisma.user.create({
      data: {
        email: 'student@brainware.edu',
        passwordHash: studentPasswordHash,
        name: 'Aminul Islam',
        avatar: '👨‍🎓',
      },
    });

    const classroom = await prisma.classroom.create({
      data: {
        name: 'Operating Systems & Distributed Computing',
        subject: 'B.Tech CSE (Semester 7)',
        description: 'Course resources, Socratic tutoring, and real-time discussion halls for Semester 7.',
        joinCode: 'CSE701',
        ownerId: teacher.id,
        aiEnabled: true,
        socraticTurnLimit: 3,
      },
    });

    // Memberships
    await prisma.membership.createMany({
      data: [
        {
          userId: teacher.id,
          classroomId: classroom.id,
          role: 'TEACHER',
        },
        {
          userId: student.id,
          classroomId: classroom.id,
          role: 'STUDENT',
        },
      ],
    });

    // Default Discussion Halls
    const generalHall = await prisma.hall.create({
      data: {
        classroomId: classroom.id,
        name: 'general',
        description: 'General course discussion and collaboration',
        topic: 'General Q&A',
        type: 'OPEN',
        status: 'ACTIVE',
        createdById: teacher.id,
      },
    });

    const doubtsHall = await prisma.hall.create({
      data: {
        classroomId: classroom.id,
        name: 'doubts',
        description: 'Got questions? Mention @assistant to get grounded answers from our lecture PDFs!',
        topic: 'Doubts & Course Assistance',
        type: 'OPEN',
        status: 'ACTIVE',
        createdById: teacher.id,
      },
    });

    const announcementsHall = await prisma.hall.create({
      data: {
        classroomId: classroom.id,
        name: 'announcements',
        description: 'Official syllabus, exam schedules, and lab deadlines',
        topic: 'Official Announcements',
        type: 'ANNOUNCEMENT',
        status: 'ACTIVE',
        createdById: teacher.id,
      },
    });

    // Seed initial welcome message in announcements
    await prisma.message.create({
      data: {
        hallId: announcementsHall.id,
        senderId: teacher.id,
        senderName: teacher.name,
        text: 'Welcome to the B.Tech CSE Semester 7 AI Teaching Assistant platform! Lecture PDFs are available under Resources. In any discussion hall, type @assistant <question> to summon the course tutor.',
        pinned: true,
      },
    });

    // Seed initial message in general hall
    await prisma.message.create({
      data: {
        hallId: generalHall.id,
        senderId: student.id,
        senderName: student.name,
        text: 'Hello everyone! Excited to use the new multi-classroom AI tutor.',
      },
    });

    logger.info(`Seeding complete: Classroom "${classroom.name}" (Code: ${classroom.joinCode}) created.`);
  } catch (err) {
    logger.error('Error during database seeding:', err);
  }
}
