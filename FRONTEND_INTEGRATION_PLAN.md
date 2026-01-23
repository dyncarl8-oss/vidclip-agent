# Frontend-Backend Integration Plan
## Pocat.io - YouTube Video Clipper

### Current State Analysis

**Frontend (React + Vite):**
- ✅ Beautiful UI with dashboard, editor, and home pages
- ❌ All data is MOCK/hardcoded (MOCK_CLIPS, fake thumbnails)
- ❌ No API calls to backend
- ❌ No real video playback
- ❌ No real clip generation

**Backend (AdonisJS):**
- ✅ Full API with video info, project creation, download, streaming
- ✅ Clip rendering endpoints
- ✅ Smart caching system
- ✅ Database integration (SQLite dev / Turso prod)

---

## Implementation Plan

### Phase 1: API Service Layer (Foundation)
**Goal:** Create a centralized API service for frontend-backend communication

#### 1.1 Create API Service (`frontend/client/src/lib/api.ts`)
```typescript
// Centralized API calls with proper error handling
- getVideoInfo(url: string)
- createProject(title, youtubeUrl, userId)
- getProjects()
- getProject(id)
- getDownloadStatus(projectId)
- streamVideo(projectId)
- renderClip(videoUrl, startTime, endTime, aspectRatio)
- getClipStatus(clipId)
- batchProcessClips(projectId, clips)
```

#### 1.2 Create Types (`frontend/client/src/lib/types.ts`)
```typescript
// TypeScript interfaces matching backend responses
- VideoInfo
- Project
- Clip
- DownloadStatus
- ClipRenderResponse
```

---

### Phase 2: Dashboard Integration
**Goal:** Replace mock data with real API data

#### 2.1 Projects List
- [ ] Fetch projects from `GET /v2/projects`
- [ ] Display real thumbnails from YouTube
- [ ] Show actual status (processing/completed/failed)
- [ ] Show real clip counts

#### 2.2 New Project Dialog
- [ ] Call `GET /video/info?url=...` to validate and preview YouTube URL
- [ ] Call `POST /v2/projects` to create project and start download
- [ ] Navigate to editor with real project ID

#### 2.3 Real-time Updates
- [ ] Poll `GET /v2/projects/:id/download-status` for progress
- [ ] Update UI with download percentage
- [ ] React-query for state management

---

### Phase 3: Editor Integration
**Goal:** Real video playback and clip generation

#### 3.1 Video Player
- [ ] Load project data from `GET /v2/projects/:id`
- [ ] Stream video from `GET /v2/projects/:id/stream`
- [ ] Real HTML5 video player with range requests
- [ ] Display actual video duration

#### 3.2 Clip Generation
- [ ] Replace MOCK_CLIPS with real timeline selection
- [ ] Call `POST /clips/render` with real timestamps
- [ ] Poll `GET /clips/status/:clipId` for completion
- [ ] Download completed clips

#### 3.3 AI Clips (Future)
- [ ] Integrate AI analysis for auto-clip suggestions
- [ ] Batch process with `POST /v2/projects/:id/batch-clips`

---

### Phase 4: State Management & Polish
**Goal:** Robust state handling and UX

#### 4.1 React Query Integration
- [ ] useQuery for fetching projects, video info
- [ ] useMutation for creating projects, rendering clips
- [ ] Optimistic updates for better UX

#### 4.2 Error Handling
- [ ] Toast notifications for errors
- [ ] Retry logic for failed requests
- [ ] Loading states throughout

#### 4.3 User Experience
- [ ] Progress indicators during download
- [ ] Success animations
- [ ] Proper form validation

---

## Files to Create/Modify

### New Files:
1. `frontend/client/src/lib/api.ts` - API service layer
2. `frontend/client/src/lib/types.ts` - TypeScript interfaces
3. `frontend/client/src/hooks/use-projects.ts` - Project hooks
4. `frontend/client/src/hooks/use-video.ts` - Video hooks
5. `frontend/client/src/hooks/use-clips.ts` - Clip hooks
6. `frontend/client/src/components/video-player.tsx` - Real video player

### Modified Files:
1. `frontend/client/src/pages/dashboard.tsx` - Real data integration
2. `frontend/client/src/pages/editor.tsx` - Real video playback
3. `frontend/client/src/lib/queryClient.ts` - Enhanced configuration

---

## API Endpoint Mapping

| Frontend Action | Backend Endpoint | Method |
|-----------------|------------------|--------|
| Check video info | `/video/info?url=` | GET |
| List projects | `/v2/projects` | GET |
| Create project | `/v2/projects` | POST |
| Check download progress | `/v2/projects/:id/download-status` | GET |
| Stream video | `/v2/projects/:id/stream` | GET |
| Render clip | `/clips/render` | POST |
| Check clip status | `/clips/status/:clipId` | GET |
| Batch process | `/v2/projects/:id/batch-clips` | POST |

---

## Execution Order

1. **Phase 1** - API Layer (1-2 hours)
   - Create api.ts with all endpoints
   - Create types.ts for TypeScript safety

2. **Phase 2** - Dashboard (2-3 hours)
   - Real project listing
   - YouTube URL import with preview
   - Real-time download progress

3. **Phase 3** - Editor (3-4 hours)
   - Video streaming and playback
   - Manual clip creation
   - Clip download

4. **Phase 4** - Polish (1-2 hours)
   - Error handling
   - Loading states
   - Toast notifications

**Total Estimated Time: 7-11 hours**

---

## Ready to Start?

Confirm to proceed with Phase 1: Creating the API service layer and types.
