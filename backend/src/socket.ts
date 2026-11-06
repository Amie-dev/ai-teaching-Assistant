import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { prisma } from './db.js';
import { conversationService } from './modules/agents/conversationService.js';
import { logger } from './utils/logger.js';

interface UserPresence {
  userId: string;
  name: string;
  hallId: string;
}

export function setupSocketIO(server: HttpServer): Server {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Track active presence per hall: hallId -> Map<socketId, UserPresence>
  const hallPresence = new Map<string, Map<string, UserPresence>>();

  io.on('connection', (socket: Socket) => {
    logger.info(`[Socket.IO] Client connected: ${socket.id}`);

    // Join hall
    socket.on('hall:join', async (data: { hallId: string; userId: string; name: string }) => {
      const { hallId, userId, name } = data;
      if (!hallId) return;

      socket.join(hallId);

      if (!hallPresence.has(hallId)) {
        hallPresence.set(hallId, new Map());
      }
      hallPresence.get(hallId)!.set(socket.id, { userId, name, hallId });

      const onlineUsers = Array.from(hallPresence.get(hallId)!.values()).map((p) => ({
        userId: p.userId,
        name: p.name,
      }));

      io.to(hallId).emit('presence:update', { hallId, users: onlineUsers });
      logger.info(`[Socket.IO] ${name} (${socket.id}) joined hall ${hallId}. Online: ${onlineUsers.length}`);
    });

    // Leave hall
    socket.on('hall:leave', (data: { hallId: string }) => {
      const { hallId } = data;
      if (!hallId) return;

      socket.leave(hallId);
      const hallMap = hallPresence.get(hallId);
      if (hallMap) {
        hallMap.delete(socket.id);
        const onlineUsers = Array.from(hallMap.values()).map((p) => ({
          userId: p.userId,
          name: p.name,
        }));
        io.to(hallId).emit('presence:update', { hallId, users: onlineUsers });
      }
    });

    // Send hall message
    socket.on('message:send', async (data: {
      hallId: string;
      text: string;
      senderId?: string;
      senderName: string;
    }) => {
      try {
        const { hallId, text, senderId, senderName } = data;
        if (!hallId || !text || !text.trim()) return;

        // Check if hall is locked
        const hall = await prisma.hall.findUnique({
          where: { id: hallId },
          select: { id: true, status: true, classroomId: true, type: true },
        });

        if (!hall) return;

        if (hall.status === 'LOCKED') {
          socket.emit('error', { message: 'This discussion hall is locked by the instructor.' });
          return;
        }

        // Persist human message
        const message = await prisma.message.create({
          data: {
            hallId,
            senderId: senderId || null,
            senderName: senderName || 'Student',
            text: text.trim(),
            isAssistant: false,
          },
        });

        const formattedMsg = {
          id: message.id,
          hallId: message.hallId,
          senderId: message.senderId,
          senderName: message.senderName,
          isAssistant: false,
          text: message.text,
          routeLabel: null,
          sources: [],
          pinned: message.pinned,
          createdAt: message.createdAt,
        };

        // Broadcast to all connected clients in the hall
        io.to(hallId).emit('message:new', formattedMsg);

        // Check for @assistant mention (PRD v2 Section 5.6)
        const assistantMentionRegex = /@assistant\b/i;
        if (assistantMentionRegex.test(text)) {
          const rawQuestion = text.replace(assistantMentionRegex, '').trim();
          const questionToAsk = rawQuestion.length > 0 ? rawQuestion : 'Please summarize what was discussed.';

          // Notify hall that AI is reasoning
          io.to(hallId).emit('assistant:thinking', { hallId, active: true });

          try {
            // Process question isolated to this classroom's resources
            const aiRes = await conversationService.processQuestion(
              questionToAsk,
              undefined,
              false,
              hall.classroomId
            );

            // Persist AI message in PostgreSQL
            const aiMessage = await prisma.message.create({
              data: {
                hallId,
                senderName: 'AI Teaching Assistant',
                isAssistant: true,
                text: aiRes.message.text,
                routeLabel: aiRes.route,
                sources: JSON.stringify(aiRes.message.sources || []),
              },
            });

            const formattedAiMsg = {
              id: aiMessage.id,
              hallId: aiMessage.hallId,
              senderId: null,
              senderName: 'AI Teaching Assistant',
              isAssistant: true,
              text: aiMessage.text,
              routeLabel: aiMessage.routeLabel,
              sources: aiRes.message.sources || [],
              pinned: false,
              createdAt: aiMessage.createdAt,
            };

            io.to(hallId).emit('assistant:thinking', { hallId, active: false });
            io.to(hallId).emit('message:new', formattedAiMsg);
          } catch (aiErr: any) {
            logger.error('[Socket.IO] Error running AI assistant in hall:', aiErr);
            io.to(hallId).emit('assistant:thinking', { hallId, active: false });
          }
        }
      } catch (err: any) {
        logger.error('[Socket.IO] Error processing message:send:', err);
      }
    });

    // Typing indicator
    socket.on('typing', (data: { hallId: string; name: string; isTyping: boolean }) => {
      socket.to(data.hallId).emit('typing', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
      for (const [hallId, hallMap] of hallPresence.entries()) {
        if (hallMap.has(socket.id)) {
          hallMap.delete(socket.id);
          const onlineUsers = Array.from(hallMap.values()).map((p) => ({
            userId: p.userId,
            name: p.name,
          }));
          io.to(hallId).emit('presence:update', { hallId, users: onlineUsers });
        }
      }
      logger.info(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

