# Design Guidelines: Patient Portal - Medical Document Management

## Design Approach
**Selected Approach:** Design System-Based (Material Design 3)
**Justification:** Healthcare document management requires clarity, trust, and efficiency. Material Design 3 provides excellent patterns for data-heavy applications with strong visual feedback for file operations.

## Core Design Principles
1. **Medical Trust:** Clean, professional interface that instills confidence
2. **Operational Clarity:** File actions (upload, download, delete) are immediately obvious
3. **Feedback First:** Every operation provides clear success/error states
4. **Scannable Content:** Document lists are easy to scan and process

---

## Typography System

### Font Family
- **Primary:** Inter (Google Fonts) - excellent for UI and data display
- **Fallback:** system-ui, -apple-system, sans-serif

### Type Scale
- **Page Title:** text-3xl font-semibold (Documents, Upload New Document)
- **Section Headers:** text-xl font-semibold
- **Body Text:** text-base font-normal
- **Metadata/Labels:** text-sm font-medium
- **Small Details:** text-xs font-normal (file sizes, timestamps)

---

## Layout System

### Spacing Primitives
**Standardized Tailwind Units:** 2, 4, 6, 8, 12, 16
- Tight spacing: p-2, gap-2
- Standard spacing: p-4, gap-4, m-6
- Section spacing: p-8, py-12, gap-8
- Large containers: p-16

### Container Structure
```
Main Container: max-w-6xl mx-auto px-4 py-8
Card Components: p-6 rounded-lg shadow-sm
Lists/Tables: divide-y spacing
Form Groups: space-y-4
```

### Grid Layout
- Single column on mobile (base)
- Document cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for list view option
- Table layout: Responsive table with horizontal scroll on mobile

---

## Component Library

### 1. Upload Zone (Hero Component)
**Drag-and-drop file upload area** - prominent but not full-height
- Border-dashed upload zone (min-h-64)
- Large upload icon (w-12 h-12)
- Clear instructions: "Drag & drop PDF files here, or click to browse"
- File type restriction notice: "PDF files only, max 10MB"
- Upload button below zone: "Select PDF File"

### 2. Document List/Table
**Primary content area** - table format for desktop, cards for mobile

**Table Columns:**
- Filename (with PDF icon, truncate long names)
- File Size (human-readable: "2.3 MB")
- Upload Date (relative: "2 days ago" with tooltip for exact date)
- Actions (Download + Delete buttons in row)

**Table Features:**
- Alternating row treatment for scannability
- Hover state on rows
- Empty state: illustration + "No documents uploaded yet"
- Loading skeleton for async operations

### 3. Action Buttons
**Download Button:**
- Outlined style with download icon
- Label: "Download"
- Size: medium (px-4 py-2)

**Delete Button:**
- Outlined style with trash icon
- Label: "Delete"
- Opens confirmation modal

**Upload Button:**
- Filled/solid style
- Icon + text: "Upload PDF"
- Prominent in upload zone

### 4. Toast Notifications
**Position:** Top-right corner, stack vertically
**Types:**
- Success: "Document uploaded successfully"
- Error: "Failed to upload. File must be a PDF under 10MB"
- Info: "Document deleted"

**Auto-dismiss:** 4 seconds, with close button

### 5. Delete Confirmation Modal
- Centered overlay modal
- Title: "Delete Document?"
- Message: "Are you sure you want to delete [filename]? This action cannot be undone."
- Actions: "Cancel" (outlined) + "Delete" (filled, critical)

### 6. File Upload Input (Hidden)
- Hidden native input, triggered by custom button
- Accept: ".pdf" only
- Validation: client-side file type and size check

### 7. Loading States
- Upload: Progress indicator or spinner in upload zone
- List loading: Skeleton rows (3-4 shimmer placeholders)
- Button loading: Spinner replaces icon, disabled state

---

## Page Layout Structure

### Header Section (Not Navigation)
- Page title: "My Medical Documents"
- Optional subtitle: "Securely manage your prescriptions, test results, and referral notes"
- Spacing: pb-8

### Upload Section
- Upload zone component (described above)
- Spacing: mb-12

### Documents List Section
- Section header with count: "Your Documents (5)"
- Table/grid component
- Spacing: responsive (py-8)

### Footer (Minimal)
- Simple text: "Secure patient portal - Your data is encrypted"
- Spacing: pt-16 pb-8

---

## Interaction Patterns

### File Upload Flow
1. Click upload zone OR drag file over (highlight zone)
2. File selection triggers validation
3. Show progress/spinner
4. Success: Toast + immediate list update
5. Error: Toast with specific message

### Delete Flow
1. Click delete button
2. Modal appears
3. Confirm → Delete → Toast → List updates
4. Cancel → Modal closes

### Download Flow
1. Click download button
2. Brief loading state on button
3. Browser download initiates

---

## Responsive Behavior

### Mobile (< 768px)
- Stack upload zone and list vertically
- Table converts to card layout
- Actions become icon-only buttons
- Modal full-width with bottom sheet behavior

### Tablet (768px - 1024px)
- Table view with horizontal scroll if needed
- 2-column card grid option

### Desktop (> 1024px)
- Full table layout
- Multi-column card grid option (if implemented)
- Comfortable spacing (p-8, gap-8)

---

## Accessibility Requirements
- File input: Proper label association
- Buttons: aria-labels for icon-only versions
- Modal: Focus trap, ESC to close, aria-modal
- Table: Proper thead/tbody structure
- Toast: aria-live region for screen readers
- Delete confirmation: Clear focus management

---

## Critical UX Decisions
- **No login required:** Single-user assumption means no authentication UI
- **Immediate feedback:** Every action shows instant response
- **Error prevention:** Client-side validation before server upload
- **Confirmation on destructive actions:** Delete requires confirmation
- **File type enforcement:** PDF-only clearly communicated and enforced