//! MIDDLEWARE PER GESTIONE UPLOAD FOTO

import multer from "multer";
import path from "path";
import { Request } from "express";
import { BadRequestError } from "@utils/utils";

// configure storage (where to save photos)
const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    // Save to uploads/reports/
    cb(null, path.join(__dirname, "../../uploads/reports"));
  },

  filename: (req, file, cb) => {
    // file name: timestamp_originalname.jpg
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// filter (opzionale per accettare solo jpg e png)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new BadRequestError("Only JPG, JPEG, PNG images are allowed! Not allowed format."));
  }
};

// middleware configurato con storage e filter (defined above)
export const uploadPhotos = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    //fileSize: 5 * 1024 * 1024, // max 5MB per photo (non richiesto ma utile per evitare upload troppo grandi e saturare tutto inutilmente)
    files: 3 // min 1, max 3 photos
  }
}).array("photos", 3); // field "photos" nel form-data (max 3 photos as story)