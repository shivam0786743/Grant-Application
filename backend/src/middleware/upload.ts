import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { config } from '../config/env';

const storage = multer.memoryStorage();

const allowedExtensions = ['.pdf', '.docx', '.txt', '.md'];

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type for "${file.originalname}". Only PDF, DOCX, and TXT files are accepted.`
      )
    );
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: config.maxFileSizeBytes,
    files: 2
  },
  fileFilter
});
