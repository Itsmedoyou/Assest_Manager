import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./jwtAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { setObjectAclPolicy } from "./objectAcl";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

const objectStorageService = new ObjectStorageService();

const multerStorage = multer.memoryStorage();

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === "application/pdf" && ext === ".pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/documents", isAuthenticated, async (req: any, _res, next) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getDocumentsByUser(userId);
      _res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      _res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents/upload", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const category = req.body.category || "other";
      
      const objectId = randomUUID();
      const objectPath = `uploads/${objectId}.pdf`;
      
      await objectStorageService.uploadBuffer(
        req.file.buffer,
        objectPath,
        "application/pdf"
      );

      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      await setObjectAclPolicy(objectFile, {
        owner: userId,
        visibility: "private",
      });

      const documentData = {
        filename: `${objectId}.pdf`,
        originalFilename: req.file.originalname.slice(0, 255),
        filepath: objectPath,
        filesize: req.file.size,
        mimetype: "application/pdf",
        category: category,
        userId: userId,
      };

      const validatedData = insertDocumentSchema.parse(documentData);
      const document = await storage.createDocument(validatedData);

      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get("/api/documents/:id/download", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const document = await storage.getDocument(req.params.id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const objectFile = await objectStorageService.getObjectEntityFile(document.filepath);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(document.originalFilename)}"`
      );

      const stream = objectFile.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading document:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "File not found on server" });
      }
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  app.get("/api/documents/:id/preview", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const document = await storage.getDocument(req.params.id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const objectFile = await objectStorageService.getObjectEntityFile(document.filepath);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline");

      const stream = objectFile.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error previewing document:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "File not found on server" });
      }
      res.status(500).json({ message: "Failed to preview document" });
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const document = await storage.getDocument(req.params.id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await objectStorageService.deleteObject(document.filepath);

      const deleted = await storage.deleteDocument(req.params.id);

      if (deleted) {
        res.status(200).json({ message: "Document deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete document" });
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  app.use((err: any, _req: any, res: any, next: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File size must be less than 10MB" });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err.message === "Only PDF files are allowed") {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  });

  return httpServer;
}
