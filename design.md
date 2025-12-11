# Design Document - Patient Portal Medical Document Management

## Part 1: Design Document

### 1. Tech Stack Choices

#### Q1. What frontend framework did you use and why?
**React with TypeScript** was chosen for the following reasons:
- **Component-based architecture**: React's component model allows for reusable UI elements (UploadZone, DocumentTable, DeleteConfirmationDialog)
- **Type safety**: TypeScript provides compile-time type checking, reducing runtime errors
- **Rich ecosystem**: Access to libraries like TanStack Query for data fetching and date-fns for date formatting
- **Developer experience**: Hot module replacement and excellent tooling with Vite
- **Industry standard**: Widely adopted, making it easier to maintain and extend

#### Q2. What backend framework did you choose and why?
**Express.js with TypeScript** was selected because:
- **Lightweight and flexible**: Minimal overhead, perfect for REST API development
- **Middleware support**: Easy integration with multer for file handling
- **JavaScript/TypeScript**: Shared language with frontend enables code sharing (types, validation schemas)
- **Mature ecosystem**: Well-documented with extensive community support
- **Performance**: Fast and efficient for I/O operations like file uploads

#### Q3. What database did you choose and why?
**PostgreSQL** was chosen over SQLite for:
- **Scalability**: Better performance under concurrent connections
- **ACID compliance**: Robust transaction support for data integrity
- **Production-ready**: Same database in development and production (Replit's built-in PostgreSQL)
- **Rich features**: JSON support, advanced indexing, and powerful query capabilities
- **ORM support**: Excellent integration with Drizzle ORM for type-safe queries

#### Q4. If you were to support 1,000 users, what changes would you consider?
1. **User Authentication**: Implement user login/signup with session management
2. **File Storage**: Move from local filesystem to cloud storage (AWS S3, Google Cloud Storage)
3. **Database Partitioning**: Add user_id foreign key to documents table and create indexes
4. **Caching**: Implement Redis for session storage and frequently accessed metadata
5. **CDN**: Use a Content Delivery Network for faster file downloads
6. **Load Balancing**: Distribute traffic across multiple server instances
7. **Rate Limiting**: Prevent abuse with request throttling per user
8. **Background Jobs**: Queue file processing tasks for large uploads
9. **Monitoring**: Add logging, metrics, and alerting (e.g., Prometheus, Grafana)
10. **Database Connection Pooling**: Optimize concurrent database connections

---

### 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Upload Zone │  │ Doc Table   │  │ Delete Confirmation     │  │
│  │ Component   │  │ Component   │  │ Dialog Component        │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                      │                │
│         └────────────────┼──────────────────────┘                │
│                          │                                       │
│                    TanStack Query                                │
│                    (Data Fetching)                               │
└──────────────────────────┼───────────────────────────────────────┘
                           │ HTTP/REST
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express.js)                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    API Routes                                ││
│  │  POST /api/documents/upload  │  GET /api/documents          ││
│  │  GET /api/documents/:id/download  │  DELETE /api/documents/:id ││
│  └─────────────────────────────────────────────────────────────┘│
│                          │                                       │
│  ┌───────────────────────┼───────────────────────────────────┐  │
│  │                  Multer Middleware                         │  │
│  │              (File Upload Handling)                        │  │
│  └───────────────────────┼───────────────────────────────────┘  │
│                          │                                       │
│  ┌───────────────────────┴───────────────────────────────────┐  │
│  │                   Storage Layer                            │  │
│  │              (Database + Filesystem)                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          ▼                                  ▼
┌──────────────────┐              ┌──────────────────┐
│   PostgreSQL     │              │   Local uploads/ │
│   Database       │              │   Directory      │
│                  │              │                  │
│ ┌──────────────┐ │              │ ┌──────────────┐ │
│ │  documents   │ │              │ │  PDF Files   │ │
│ │  table       │ │              │ │              │ │
│ └──────────────┘ │              │ └──────────────┘ │
└──────────────────┘              └──────────────────┘
```

**Data Flow Summary:**
1. Frontend components make API calls via TanStack Query
2. Express.js receives requests and routes to appropriate handlers
3. Multer middleware handles multipart form data for file uploads
4. Storage layer manages both database operations (metadata) and filesystem operations (files)
5. Responses flow back through the same chain

---

### 3. API Specification

#### Endpoint 1: Upload a PDF Document
| Property | Value |
|----------|-------|
| **URL** | `/api/documents/upload` |
| **Method** | `POST` |
| **Content-Type** | `multipart/form-data` |

**Request:**
```bash
curl -X POST http://localhost:5000/api/documents/upload \
  -F "file=@/path/to/document.pdf"
```

**Success Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "550e8400-e29b-41d4-a716-446655440000.pdf",
  "originalFilename": "lab_results.pdf",
  "filepath": "/home/user/app/uploads/550e8400-e29b-41d4-a716-446655440000.pdf",
  "filesize": 245780,
  "mimetype": "application/pdf",
  "createdAt": "2024-12-09T10:30:00.000Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Only PDF files are allowed"
}
```

---

#### Endpoint 2: List All Documents
| Property | Value |
|----------|-------|
| **URL** | `/api/documents` |
| **Method** | `GET` |

**Request:**
```bash
curl http://localhost:5000/api/documents
```

**Success Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "550e8400-e29b-41d4-a716-446655440000.pdf",
    "originalFilename": "lab_results.pdf",
    "filepath": "/home/user/app/uploads/550e8400-e29b-41d4-a716-446655440000.pdf",
    "filesize": 245780,
    "mimetype": "application/pdf",
    "createdAt": "2024-12-09T10:30:00.000Z"
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "filename": "123e4567-e89b-12d3-a456-426614174000.pdf",
    "originalFilename": "prescription.pdf",
    "filepath": "/home/user/app/uploads/123e4567-e89b-12d3-a456-426614174000.pdf",
    "filesize": 128450,
    "mimetype": "application/pdf",
    "createdAt": "2024-12-08T14:15:00.000Z"
  }
]
```

---

#### Endpoint 3: Download a Document
| Property | Value |
|----------|-------|
| **URL** | `/api/documents/:id/download` |
| **Method** | `GET` |

**Request:**
```bash
curl -O http://localhost:5000/api/documents/550e8400-e29b-41d4-a716-446655440000/download
```

**Success Response (200 OK):**
- Returns the PDF file as binary data
- Headers: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="original_filename.pdf"`

**Error Response (404 Not Found):**
```json
{
  "message": "Document not found"
}
```

---

#### Endpoint 4: Delete a Document
| Property | Value |
|----------|-------|
| **URL** | `/api/documents/:id` |
| **Method** | `DELETE` |

**Request:**
```bash
curl -X DELETE http://localhost:5000/api/documents/550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200 OK):**
```json
{
  "message": "Document deleted successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "Document not found"
}
```

---

### 4. Data Flow Description

#### Q5. Describe the step-by-step process of what happens when a file is uploaded and when it is downloaded.

**File Upload Process:**
1. **User Interaction**: User drags a PDF file into the upload zone or clicks to browse
2. **Client-Side Validation**: Frontend validates file type (PDF) and size (<10MB)
3. **FormData Creation**: File is wrapped in FormData with key "file"
4. **HTTP Request**: POST request sent to `/api/documents/upload` with multipart/form-data
5. **Multer Processing**: Multer middleware intercepts request, validates file type
6. **File Storage**: Multer saves file to `uploads/` directory with UUID filename
7. **Database Insert**: Document metadata (filename, size, path) saved to PostgreSQL
8. **Response**: Server returns created document object with ID
9. **Cache Invalidation**: Frontend invalidates query cache to refresh document list
10. **UI Update**: New document appears in the table with success toast

**File Download Process:**
1. **User Interaction**: User clicks "Download" button on a document row
2. **HTTP Request**: GET request sent to `/api/documents/:id/download`
3. **Database Lookup**: Server queries PostgreSQL for document by ID
4. **File Retrieval**: Server locates file on filesystem using stored filepath
5. **Response Headers**: Server sets Content-Type and Content-Disposition headers
6. **Stream Response**: File is streamed to client using fs.createReadStream
7. **Browser Action**: Browser receives file and triggers download dialog

---

### 5. Assumptions

#### Q6. What assumptions did you make while building this?

1. **Single User**: No authentication required - all documents belong to one user
2. **File Size Limit**: Maximum upload size is 10MB per file
3. **File Type Restriction**: Only PDF files are accepted
4. **Local Storage**: Files stored on local filesystem (not cloud storage)
5. **No Encryption**: Files stored unencrypted (would need encryption for production)
6. **Sequential Uploads**: One file uploaded at a time (no batch upload)
7. **No Versioning**: Documents cannot be updated, only deleted and re-uploaded
8. **Trusting Client**: Basic validation on client, with server-side enforcement
9. **Development Environment**: Running on localhost with PostgreSQL available
10. **No Concurrent Writes**: No handling for race conditions on same document
11. **Filename Conflicts**: Handled by UUID-based unique filenames
12. **No Retry Logic**: Failed uploads must be manually retried by user
13. **Browser Compatibility**: Modern browsers with FormData and fetch API support
14. **Network Reliability**: Assumes stable network connection for uploads

---

## Part 2: Local Implementation

See the source code in:
- `client/` - React frontend with TypeScript
- `server/` - Express.js backend with TypeScript
- `shared/` - Shared types and schemas (Drizzle ORM)
- `uploads/` - Local file storage directory

### Running Locally

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start the application
npm run dev
```

The application will be available at `http://localhost:5000`
