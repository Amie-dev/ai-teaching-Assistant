import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { documentService } from '../modules/ingestion/documentService.js';
import { AppError } from '../utils/errorHandler.js';

const router = Router();

// Multer in-memory storage with type and size validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new AppError('Only PDF documents (.pdf) are supported.', 400));
    }
  },
});

/**
 * POST /api/documents - Upload and ingest one or multiple PDFs
 */
router.post(
  '/',
  upload.array('files', 10),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new AppError('No PDF files uploaded. Please attach at least one valid PDF.', 400);
      }

      const classroomId = (req.body.classroomId as string) || (req.query.classroomId as string) || undefined;
      if (!classroomId) {
        throw new AppError('classroomId is required to associate uploaded course materials with a classroom.', 400);
      }

      const results = [];
      for (const file of files) {
        const doc = await documentService.processUploadedFile(file, classroomId);
        results.push(doc);
      }

      res.status(201).json({
        success: true,
        documents: results,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/documents - List all documents
 */
router.get('/', (req: Request, res: Response) => {
  const classroomId = (req.query.classroomId as string) || undefined;
  const documents = documentService.getDocuments(classroomId);
  res.json({
    success: true,
    documents,
  });
});

/**
 * GET /api/documents/:id - Get specific document
 */
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const doc = documentService.getDocument(docId);
  if (!doc) {
    return next(new AppError('Document not found', 404));
  }
  res.json({
    success: true,
    document: doc,
  });
});

/**
 * DELETE /api/documents/:id - Delete document and its vectors
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await documentService.deleteDocument(docId);
    if (!deleted) {
      return next(new AppError('Document not found', 404));
    }
    res.json({
      success: true,
      message: 'Document and its embeddings were deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/documents/:id/pages/:n - Retrieve page text for the Source Viewer
 */
router.get('/:id/pages/:n', async (req: Request, res: Response, next: NextFunction) => {
  const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramN = Array.isArray(req.params.n) ? req.params.n[0] : req.params.n;
  const pageNum = parseInt(paramN, 10);
  if (isNaN(pageNum) || pageNum <= 0) {
    return next(new AppError('Invalid page number', 400));
  }

  const page = await documentService.getPage(docId, pageNum);
  const doc = documentService.getDocument(docId);

  if (!page) {
    return next(new AppError(`Page ${pageNum} not found for document ${docId}`, 404));
  }

  res.json({
    success: true,
    documentId: docId,
    fileName: doc?.fileName || 'Document',
    pageNumber: page.pageNumber,
    text: page.text,
    isEmpty: page.isEmpty,
  });
});

export default router;
