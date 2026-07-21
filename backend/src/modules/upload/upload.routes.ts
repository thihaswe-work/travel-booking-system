import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../../config';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { asyncHandler } from '../../middleware/asyncHandler';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(config.upload.path)) {
      fs.mkdirSync(config.upload.path, { recursive: true });
    }
    cb(null, config.upload.path);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxFileSize },
});

const router = Router();

const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const single = upload.single('file');
  single(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        res.status(400).json({ success: false, error: { message: err.message, code: 'UPLOAD_ERROR' } });
      } else {
        res.status(400).json({ success: false, error: { message: err.message, code: 'INVALID_FILE_TYPE' } });
      }
      return;
    }
    next();
  });
};

router.post(
  '/',
  authenticate,
  authorize('admin', 'travel_agent'),
  uploadMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, error: { message: 'No file uploaded', code: 'NO_FILE' } });
      return;
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/uploads/${req.file.filename}`;
    res.status(201).json({ success: true, data: { url, filename: req.file.filename } });
  }),
);

export default router;
