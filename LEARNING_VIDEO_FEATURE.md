# Learning Video Feature

Dokumentasi lengkap untuk fitur Learning Video di CMS dan Web.

## Backend API

### Endpoints

#### Get All Learning Videos

```
GET /v1/api/learning-video?page=1&page_size=10&search=&program_id=
Headers: Authorization: Bearer {token}
Response: 200 OK
```

**Query Parameters:**

- `page` (int): Page number (default: 1)
- `page_size` (int): Items per page (default: 10)
- `search` (string): Search by title
- `program_id` (string): Filter by program ID (if not provided, returns only videos with program_id = NULL)

**Response:**

```json
{
  "code": 200,
  "message": "Learning videos retrieved successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "title": "Python Tutorial",
        "url": "https://youtube.com/watch?v=123",
        "program_id": null,
        "created_at": "2026-01-31T10:00:00Z",
        "updated_at": "2026-01-31T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 10,
    "total_page": 1
  }
}
```

#### Get Learning Video By ID

```
GET /v1/api/learning-video/{id}
Headers: Authorization: Bearer {token}
Response: 200 OK
```

#### Create Learning Video

```
POST /v1/api/learning-video
Headers: Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Python Tutorial",
  "url": "https://youtube.com/watch?v=123",
  "program_id": "prog-123"
}
```

#### Update Learning Video

```
PUT /v1/api/learning-video/{id}
Headers: Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Updated Title",
  "url": "https://youtube.com/watch?v=updated",
  "program_id": "prog-456"
}
```

#### Delete Learning Video

```
DELETE /v1/api/learning-video/{id}
Headers: Authorization: Bearer {token}
Response: 200 OK
```

## CMS Admin UI

Located at: `cms/src/screens/LearningVideo/`

### Features

- List all learning videos with pagination
- Search videos by title
- Create new learning video
- Edit existing learning video
- Delete learning video
- Filter by program ID

### Components

1. **index.tsx** - Main screen with list and controls
2. **ModalCreateLearningVideo.tsx** - Modal for creating new video
3. **ModalUpdateLearningVideo.tsx** - Modal for editing video

### API Service

Located at: `cms/src/api/learningVideo.ts`

Functions:

- `apiGetLearningVideos()` - Fetch all videos with pagination
- `apiGetLearningVideoById()` - Fetch single video
- `apiCreateLearningVideo()` - Create new video
- `apiUpdateLearningVideo()` - Update video
- `apiDeleteLearningVideo()` - Delete video

## Web User UI

Located at: `web/src/screens/LearningVideo/`

### Features

- Browse all learning videos
- Search videos by title
- View video details in card format
- Open video in new tab
- Responsive grid layout
- Pagination support

### Design

- Beautiful gradient header
- Card-based layout (responsive: 1 column on mobile, 3 columns on desktop)
- Play button icon overlay
- Hover effects for better UX

### API Service

Located at: `web/src/api/learningVideo.ts`

Functions:

- `apiGetLearningVideos()` - Fetch all videos with pagination
- `apiGetLearningVideoById()` - Fetch single video

## Unit Tests

### Repository Tests

File: `backend/internal/repository/learning_video_repository_test.go`

Test cases:

- `TestLearningVideoRepository_Create` - Test creating a learning video
- `TestLearningVideoRepository_FindByID` - Test finding video by ID
- `TestLearningVideoRepository_FindByID_NotFound` - Test 404 case
- `TestLearningVideoRepository_Update` - Test updating video
- `TestLearningVideoRepository_Delete` - Test deleting video
- `TestLearningVideoRepository_FindAll_WithoutProgramID` - Test filtering without program_id (returns NULL only)
- `TestLearningVideoRepository_FindAll_WithProgramID` - Test filtering with program_id
- `TestLearningVideoRepository_FindAll_WithSearch` - Test search functionality

### Service Tests

File: `backend/internal/service/learning_video_service_test.go`

Test cases:

- `TestLearningVideoService_Create` - Test service create method
- `TestLearningVideoService_Create_InvalidRequest` - Test validation
- `TestLearningVideoService_FindByID` - Test finding by ID
- `TestLearningVideoService_FindByID_NotFound` - Test 404 case
- `TestLearningVideoService_Update` - Test update method
- `TestLearningVideoService_Delete` - Test delete method
- `TestLearningVideoService_FindAll_WithoutProgramID` - Test pagination and filtering
- `TestLearningVideoService_FindAll_WithProgramID` - Test with program filter
- `TestLearningVideoService_FindAll_WithSearch` - Test search
- `TestLearningVideoService_FindAll_Pagination` - Test pagination logic

### Controller Tests

File: `backend/internal/controller/learning_video_controller_test.go`

Test cases:

- `TestLearningVideoController_FindAll` - Test list endpoint

## Running Tests

### Run all tests

```bash
cd backend
go test ./...
```

### Run specific test file

```bash
go test -v ./internal/repository -run TestLearningVideo
go test -v ./internal/service -run TestLearningVideo
go test -v ./internal/controller -run TestLearningVideo
```

### Run with coverage

```bash
go test -cover ./...
```

## Key Features

1. **JWT Authentication**: All endpoints require bearer token authentication
2. **Role-based Access**: Admin can create/update/delete, users can only view
3. **Pagination**: Support for page-based pagination with configurable page size
4. **Search**: Full-text search by video title
5. **Program Filtering**: Videos can be associated with programs
6. **Validation**: Input validation on both frontend and backend

## Database Schema

```sql
CREATE TABLE learning_videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(512) NOT NULL,
    program_id VARCHAR(36),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);
```

## Integration Steps

1. Run migration: `./migration.sh`
2. Start backend: `go run main.go`
3. Navigate to CMS: `localhost:3000/learning-video` (admin only)
4. Navigate to Web: `localhost:3001/learning-video` (user accessible)

## Notes

- When `program_id` is not provided in GET request, only videos with `program_id = NULL` are returned
- Videos must have valid URLs (http or https)
- Titles are required and must be at least 3 characters
