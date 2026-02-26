# 🚀 Master Prompt — Notion Clone (Angular + NestJS)

> Paste this entire prompt into Claude to scaffold the full project.  
> Works best with **Claude Sonnet 4+** or **Claude Opus 4+** in a long context session.  
> Use **Claude Code** (CLI) for best results — it can create files, run commands, and iterate autonomously.

---

## SYSTEM CONTEXT

You are a senior full-stack engineer building a production-grade **Notion clone** from scratch. You write clean, typed, well-structured code with no shortcuts. You follow the architecture and conventions defined below exactly. You never use `any` in TypeScript. You never put business logic in controllers or Angular components. You always write DTOs, always validate inputs, and always handle errors explicitly.

---

## PROJECT OVERVIEW

Build a full-stack **Notion clone** called **"Notely"** with:

- **Frontend:** Angular 17+ (standalone components, signals, NgRx)
- **Backend:** NestJS 10+ (modular, TypeORM, PostgreSQL, Redis, WebSockets)
- **Database:** PostgreSQL (via TypeORM with migrations)
- **Cache / Sessions:** Redis
- **Real-time:** Socket.IO (`@nestjs/websockets`)
- **Auth:** JWT (access + refresh tokens) + Google OAuth
- **File Storage:** AWS S3 (or MinIO for local dev)
- **Containerization:** Docker + Docker Compose

---

## PHASE-BY-PHASE BUILD INSTRUCTIONS

Build the project in the following phases **in order**. Complete each phase fully before moving to the next. After each phase, confirm what was built and what files were created.

---

### PHASE 1 — Project Scaffolding & Infrastructure

#### 1.1 Root Monorepo Structure
Create a monorepo with the following layout:
```
notely/
├── backend/          # NestJS app
├── frontend/         # Angular app
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

#### 1.2 Docker Compose (Development)
Create `docker-compose.yml` with these services:
- **postgres** — image: postgres:16, port 5432, volume for persistence
- **redis** — image: redis:7-alpine, port 6379
- **minio** — image: minio/minio, port 9000/9001, for local S3-compatible storage
- **backend** — NestJS, port 3000, hot reload via volume mount
- **frontend** — Angular, port 4200, hot reload via volume mount

#### 1.3 Backend Bootstrap (NestJS)
```bash
npx @nestjs/cli new backend --strict --package-manager npm
```

Install these packages:
```
@nestjs/config @nestjs/typeorm @nestjs/jwt @nestjs/passport @nestjs/websockets @nestjs/platform-socket.io
@nestjs/swagger @nestjs/throttler @nestjs/bull
typeorm pg class-validator class-transformer
passport passport-jwt passport-google-oauth20
bcryptjs uuid
socket.io redis ioredis
@aws-sdk/client-s3 @aws-sdk/s3-request-presigner
bull
helmet
```

Configure:
- `tsconfig.json` with `strict: true`, `strictNullChecks: true`
- `@nestjs/config` with `.env` validation using `Joi`
- `@nestjs/swagger` at `/api/docs`
- `ValidationPipe` globally with `whitelist: true, forbidNonWhitelisted: true, transform: true`
- `helmet()` middleware
- CORS for frontend URL

#### 1.4 Frontend Bootstrap (Angular)
```bash
npx @angular/cli new frontend --routing=true --style=scss --strict
```

Install:
```
@ngrx/store @ngrx/effects @ngrx/entity @ngrx/router-store @ngrx/store-devtools
@angular/material @angular/cdk
socket.io-client
```

Configure:
- `provideStore()`, `provideEffects()`, `provideRouterStore()`, `provideStoreDevtools()`
- Angular Material theme (custom indigo/pink or dark theme)
- `HttpClient` with `provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))`
- Lazy-loaded feature routes

---

### PHASE 2 — Database Entities & Migrations

Create all TypeORM entities in `backend/src/database/entities/`. Every entity must:
- Use `uuid` primary keys (`@PrimaryGeneratedColumn('uuid')`)
- Have `createdAt` and `updatedAt` (`@CreateDateColumn`, `@UpdateDateColumn`)
- Be registered in the module's TypeORM `forFeature([])` array

#### Entities to create:

**User**
```typescript
@Entity('users')
export class User {
  id: string           // uuid PK
  email: string        // unique, not null
  passwordHash: string // nullable (OAuth users have no password)
  name: string
  avatarUrl: string    // nullable
  createdAt: Date
  updatedAt: Date
  // Relations:
  workspaceMemberships: WorkspaceMember[]
  ownedWorkspaces: Workspace[]
}
```

**Workspace**
```typescript
@Entity('workspaces')
export class Workspace {
  id: string
  name: string
  iconEmoji: string    // default: '🏠'
  ownerId: string      // FK → User
  createdAt: Date
  updatedAt: Date
  // Relations:
  owner: User
  members: WorkspaceMember[]
  pages: Page[]
}
```

**WorkspaceMember** (join table with role)
```typescript
@Entity('workspace_members')
export class WorkspaceMember {
  id: string
  workspaceId: string  // FK → Workspace
  userId: string       // FK → User
  role: WorkspaceRole  // enum: owner | admin | member | viewer
  joinedAt: Date
}
```

**Page**
```typescript
@Entity('pages')
export class Page {
  id: string
  title: string          // default: 'Untitled'
  icon: string           // nullable (emoji or image url)
  coverImage: string     // nullable
  workspaceId: string    // FK → Workspace
  parentId: string       // nullable, self-referencing FK
  isDatabase: boolean    // default: false
  isTemplate: boolean    // default: false
  isDeleted: boolean     // default: false (soft delete)
  deletedAt: Date        // nullable
  order: number          // fractional index string for ordering
  createdById: string    // FK → User
  updatedById: string    // FK → User
  createdAt: Date
  updatedAt: Date
  // Relations:
  workspace: Workspace
  parent: Page
  children: Page[]
  blocks: Block[]
  createdBy: User
  updatedBy: User
}
```

**Block**
```typescript
@Entity('blocks')
export class Block {
  id: string
  type: BlockType      // enum (see below)
  pageId: string       // FK → Page
  parentBlockId: string // nullable, self-referencing FK
  content: object      // jsonb — type-specific payload
  order: number        // for sibling ordering
  createdById: string
  createdAt: Date
  updatedAt: Date
  // Relations:
  page: Page
  parentBlock: Block
  children: Block[]
}
```

**BlockType enum:**
```typescript
export enum BlockType {
  PARAGRAPH = 'paragraph',
  HEADING_1 = 'heading_1',
  HEADING_2 = 'heading_2',
  HEADING_3 = 'heading_3',
  BULLETED_LIST_ITEM = 'bulleted_list_item',
  NUMBERED_LIST_ITEM = 'numbered_list_item',
  TO_DO = 'to_do',
  TOGGLE = 'toggle',
  CODE = 'code',
  QUOTE = 'quote',
  CALLOUT = 'callout',
  DIVIDER = 'divider',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
  EMBED = 'embed',
  BOOKMARK = 'bookmark',
  COLUMN_LIST = 'column_list',
  COLUMN = 'column',
  CHILD_PAGE = 'child_page',
  CHILD_DATABASE = 'child_database',
  TABLE_OF_CONTENTS = 'table_of_contents',
  EQUATION = 'equation',
}
```

**DatabaseProperty**
```typescript
@Entity('database_properties')
export class DatabaseProperty {
  id: string
  pageId: string      // FK → Page (must have isDatabase=true)
  name: string
  type: PropertyType  // enum: text|number|select|multi_select|date|person|checkbox|url|email|phone|formula|relation|rollup|files
  config: object      // jsonb: options for select, formula expression, etc.
  order: number
}
```

After creating all entities, generate and run the initial TypeORM migration:
```bash
npm run migration:generate -- -n InitialSchema
npm run migration:run
```

---

### PHASE 3 — Auth Module (NestJS)

Build `AuthModule` with full JWT + Google OAuth authentication.

#### Files to create:
- `auth.module.ts`
- `auth.controller.ts`
- `auth.service.ts`
- `strategies/jwt.strategy.ts`
- `strategies/jwt-refresh.strategy.ts`
- `strategies/google.strategy.ts`
- `guards/jwt-auth.guard.ts`
- `guards/jwt-refresh.guard.ts`
- `guards/google-auth.guard.ts`
- `dto/register.dto.ts`
- `dto/login.dto.ts`
- `dto/auth-response.dto.ts`

#### Auth flows to implement:

**POST /api/auth/register**
- Validate email/password (min 8 chars, email format)
- Check email not already taken → throw `ConflictException`
- Hash password with `bcryptjs` (saltRounds: 12)
- Create user, generate tokens, return `AuthResponseDto`

**POST /api/auth/login**
- Validate credentials, throw `UnauthorizedException` if invalid
- Generate and return access + refresh tokens

**POST /api/auth/refresh**
- Validate refresh token from httpOnly cookie
- Issue new access token + rotate refresh token (invalidate old one)

**POST /api/auth/logout**
- Invalidate refresh token in Redis
- Clear httpOnly cookie

**GET /api/auth/google** + **GET /api/auth/google/callback**
- Passport Google OAuth20 strategy
- Find or create user by Google email
- Redirect to frontend with tokens

#### Token strategy:
- `accessToken`: JWT, signed with `JWT_SECRET`, expires in 15 minutes
- `refreshToken`: JWT, signed with `JWT_REFRESH_SECRET`, expires in 7 days
- Refresh tokens stored in Redis as: `refresh:{userId}:{tokenId}` → `true` (for rotation/revocation)
- `refreshToken` sent as **httpOnly, sameSite=strict, secure cookie** (NOT in response body)
- `accessToken` returned in response body only (stored in memory by Angular)

#### DTOs (use class-validator):
```typescript
// register.dto.ts
export class RegisterDto {
  @IsEmail() email: string;
  @MinLength(8) password: string;
  @IsString() @MinLength(1) name: string;
}

// login.dto.ts
export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

// auth-response.dto.ts
export class AuthResponseDto {
  accessToken: string;
  user: { id: string; email: string; name: string; avatarUrl: string | null };
}
```

---

### PHASE 4 — Workspaces & Users Modules (NestJS)

#### UsersModule
- `GET /api/users/me` — return current user profile
- `PATCH /api/users/me` — update name, avatarUrl
- `DELETE /api/users/me` — soft-delete account

#### WorkspacesModule
Endpoints:
- `GET /api/workspaces` — list all workspaces for current user (via WorkspaceMember)
- `POST /api/workspaces` — create workspace, auto-add creator as `owner`
- `GET /api/workspaces/:id` — get workspace (auth + membership check)
- `PATCH /api/workspaces/:id` — update name/icon (admin/owner only)
- `DELETE /api/workspaces/:id` — delete (owner only), cascade delete pages
- `POST /api/workspaces/:id/invite` — invite user by email, create WorkspaceMember with role `member`
- `PATCH /api/workspaces/:id/members/:userId` — change role (owner/admin only)
- `DELETE /api/workspaces/:id/members/:userId` — remove member (owner/admin only, cannot remove owner)

Create `WorkspaceMemberGuard` that:
1. Extracts `workspaceId` from route params
2. Checks current user is a member of that workspace
3. Attaches member role to request for role checks downstream

---

### PHASE 5 — Pages Module (NestJS)

#### PagesService methods:
- `getPageTree(workspaceId, userId)` — returns nested tree structure (recursive query or CTEs)
- `createPage(dto, userId)` — create with auto-generated fractional index order
- `getPageWithBlocks(pageId, userId)` — return page + all blocks (ordered)
- `updatePage(pageId, dto, userId)` — update title/icon/cover
- `deletePage(pageId, userId)` — soft delete (set `isDeleted=true`, `deletedAt=now`)
- `restorePage(pageId, userId)` — undo soft delete
- `duplicatePage(pageId, userId)` — deep clone page + all blocks recursively
- `movePage(pageId, dto, userId)` — change `parentId` and/or `workspaceId`

#### Endpoints:
- `GET /api/workspaces/:wid/pages` — page tree (only non-deleted, root-level pages with children)
- `POST /api/workspaces/:wid/pages` — create page
- `GET /api/pages/:id` — full page + blocks
- `PATCH /api/pages/:id` — update
- `DELETE /api/pages/:id` — soft delete
- `POST /api/pages/:id/restore` — restore from trash
- `GET /api/workspaces/:wid/trash` — list deleted pages
- `POST /api/pages/:id/duplicate` — deep clone
- `PATCH /api/pages/:id/move` — reparent/move

---

### PHASE 6 — Blocks Module (NestJS)

#### BlocksService methods:
- `getBlocksForPage(pageId)` — flat list, ordered; client reconstructs tree
- `createBlock(dto, userId)` — insert at specified position, shift others if needed
- `updateBlock(blockId, dto, userId)` — update `content` jsonb
- `deleteBlock(blockId, userId)` — delete + recursively delete children
- `moveBlock(blockId, dto, userId)` — change `parentBlockId` and/or `pageId`, update order

#### Block content schema per type (TypeScript interfaces):
```typescript
interface ParagraphContent { richText: RichTextItem[]; }
interface HeadingContent { richText: RichTextItem[]; level: 1|2|3; }
interface ToDoContent { richText: RichTextItem[]; checked: boolean; }
interface CodeContent { richText: RichTextItem[]; language: string; caption: string; }
interface ImageContent { url: string; caption: string; width?: number; }
interface RichTextItem {
  text: string;
  annotations: { bold?: boolean; italic?: boolean; strikethrough?: boolean; code?: boolean; color?: string; };
  href?: string;
}
```

#### Endpoints:
- `GET /api/pages/:pid/blocks` — all blocks for page
- `POST /api/pages/:pid/blocks` — create block
- `PATCH /api/blocks/:id` — update block content
- `DELETE /api/blocks/:id` — delete block
- `PATCH /api/blocks/:id/move` — reorder / reparent

---

### PHASE 7 — Real-time Collaboration (NestJS WebSocket Gateway)

Create `CollaborationGateway` in `CollaborationModule`.

#### Events (client → server):
- `join:page` `{ pageId }` — join a Socket.IO room for that page
- `leave:page` `{ pageId }` — leave room
- `block:update` `{ blockId, content, version }` — broadcast to all others in room
- `block:create` `{ block, pageId }` — broadcast new block to room
- `block:delete` `{ blockId, pageId }` — broadcast deletion
- `block:move` `{ blockId, newOrder, newParentId, pageId }` — broadcast move
- `cursor:move` `{ pageId, blockId, offset }` — broadcast cursor position

#### Events (server → client):
- `block:updated` — same as above, to all *other* clients in room
- `block:created`
- `block:deleted`
- `block:moved`
- `cursor:moved` — includes userId, userName, color
- `presence:joined` `{ userId, userName, avatarUrl }` — user joined page
- `presence:left` `{ userId }` — user left page

#### Implementation notes:
- Use Redis adapter (`@socket.io/redis-adapter`) for multi-instance support
- Authenticate WS connections via JWT in `handshake.auth.token`
- Store active presence in Redis: `presence:{pageId}` → Set of `{userId, socketId}`
- Emit `presence:joined` to room when user joins, `presence:left` when they disconnect

---

### PHASE 8 — Search Module (NestJS)

#### SearchService
- Full-text search using PostgreSQL `tsvector`:
  ```sql
  SELECT p.*, ts_rank(search_vector, query) as rank
  FROM pages p, plainto_tsquery('english', $1) query
  WHERE p.workspace_id = $2
    AND p.is_deleted = false
    AND search_vector @@ query
  ORDER BY rank DESC
  LIMIT 20
  ```
- Add `search_vector` generated column to `pages` table
- Also search block content (text blocks) with a separate query
- Return unified results: `{ type: 'page'|'block', id, title, snippet, pageId, pageTitle }`

#### Endpoint:
- `GET /api/search?q=&workspaceId=&types=page,block&limit=20`

---

### PHASE 9 — Files Module (NestJS)

#### FilesService
- Generate presigned S3 PUT URL for direct browser upload
- After upload confirmed: save file record to DB
- Generate presigned GET URLs for private files

#### Endpoints:
- `POST /api/files/upload-url` — returns `{ uploadUrl, fileKey, publicUrl }`
  - Validates: `contentType` (allow only images, PDFs, common docs), `fileSize` (max 100MB)
- `DELETE /api/files/:id` — delete from S3 + DB

---

### PHASE 10 — Angular: Core Setup

Build the Angular app foundation.

#### Folder structure:
```
src/app/
├── core/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.guard.ts
│   │   └── token.service.ts        # in-memory token storage ONLY
│   ├── interceptors/
│   │   ├── auth.interceptor.ts     # adds Authorization header
│   │   └── error.interceptor.ts    # global error handling
│   └── layout/
│       └── app-shell.component.ts
├── shared/
│   ├── components/
│   │   ├── icon/
│   │   ├── avatar/
│   │   ├── spinner/
│   │   ├── modal/
│   │   └── toast/
│   └── pipes/
├── store/
│   ├── auth/
│   ├── workspaces/
│   ├── pages/
│   ├── blocks/
│   ├── collaboration/
│   └── ui/
└── features/
    ├── auth/
    ├── workspace/
    ├── editor/
    ├── database/
    ├── sidebar/
    └── search/
```

#### TokenService (CRITICAL — no localStorage):
```typescript
@Injectable({ providedIn: 'root' })
export class TokenService {
  private accessToken: string | null = null;  // IN MEMORY ONLY

  setToken(token: string): void { this.accessToken = token; }
  getToken(): string | null { return this.accessToken; }
  clearToken(): void { this.accessToken = null; }
}
```

#### AuthInterceptor:
- Attach `Authorization: Bearer {token}` to all requests to the API domain
- On `401` response: call `authService.refreshToken()`, retry original request once
- On refresh failure: dispatch `AuthActions.logout()`, navigate to `/login`

#### ErrorInterceptor:
- `403` → dispatch toast: "You don't have permission to do this"
- `404` → dispatch toast: "Not found"
- `500` → dispatch toast: "Something went wrong. Please try again."
- `0` (network error) → dispatch toast: "You appear to be offline"

---

### PHASE 11 — Angular: NgRx Store

#### Auth Store (`store/auth/`):
```typescript
// State
interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Actions
AuthActions.login({ email, password })
AuthActions.loginSuccess({ user, accessToken })
AuthActions.loginFailure({ error })
AuthActions.logout()
AuthActions.refreshToken()
AuthActions.refreshTokenSuccess({ accessToken })
AuthActions.loadCurrentUser()
AuthActions.loadCurrentUserSuccess({ user })
```

#### Pages Store (`store/pages/`):
```typescript
// Use @ngrx/entity EntityAdapter
interface PagesState extends EntityState<Page> {
  selectedPageId: string | null;
  loading: boolean;
  error: string | null;
  tree: PageTreeNode[];
}

// Actions
PagesActions.loadPageTree({ workspaceId })
PagesActions.loadPageTreeSuccess({ pages })
PagesActions.createPage({ workspaceId, parentId?, title })
PagesActions.createPageSuccess({ page })
PagesActions.updatePage({ id, changes })
PagesActions.updatePageSuccess({ page })
PagesActions.deletePage({ id })
PagesActions.deletePageSuccess({ id })
PagesActions.selectPage({ id })
```

#### Blocks Store (`store/blocks/`):
```typescript
interface BlocksState extends EntityState<Block> {
  loadedPageIds: string[];
  pendingOperations: PendingOperation[];  // for optimistic updates
  loading: boolean;
}

// Optimistic update pattern:
BlocksActions.updateBlockOptimistic({ id, content, previousContent })
BlocksActions.updateBlockSuccess({ block })
BlocksActions.updateBlockRollback({ id, previousContent })
```

#### Collaboration Store (`store/collaboration/`):
```typescript
interface CollaborationState {
  onlineUsers: Record<string, OnlineUser>;  // pageId → users
  cursors: Record<string, CursorPosition>; // userId → cursor
  editingBlocks: Record<string, string>;   // blockId → userId
}
```

---

### PHASE 12 — Angular: Auth Feature

Create these standalone components in `features/auth/`:

**LoginComponent** (`/login`)
- Email + password form using Reactive Forms
- "Sign in with Google" button
- Dispatches `AuthActions.login()`
- Subscribes to auth loading/error state
- On success: navigate to `/workspace`

**RegisterComponent** (`/register`)
- Name + email + password form
- Password strength indicator
- Dispatches `AuthActions.register()`

**OAuthCallbackComponent** (`/auth/callback`)
- Reads token from URL query params
- Calls `TokenService.setToken()`
- Dispatches `AuthActions.loginSuccess()`
- Navigates to workspace

---

### PHASE 13 — Angular: App Shell & Sidebar

**AppShellComponent** — root layout:
```html
<div class="app-shell">
  <app-sidebar />
  <main class="content-area">
    <router-outlet />
  </main>
</div>
```

**SidebarComponent**:
- Workspace switcher dropdown (list workspaces, create new)
- "Quick Find" button (opens search modal, Cmd+K shortcut)
- "New Page" button
- Page tree (recursive `PageTreeNodeComponent`)
- Favorites section
- Trash link
- User profile at bottom (avatar, name, settings link, logout)

**PageTreeNodeComponent** (recursive):
- Shows page icon + title
- Toggle expand/collapse children
- Hover: show options menu (rename, delete, duplicate, move)
- Active page highlighted
- Drag handle for reordering (Angular CDK DragDrop)
- Right-click context menu

---

### PHASE 14 — Angular: Block Editor

This is the core of the app. Build the block editor in `features/editor/`.

#### EditorComponent
- Renders a list of blocks using `*ngFor` with `BlockRendererComponent`
- Manages block selection and keyboard navigation:
  - `Enter` → create new block after current
  - `Backspace` on empty block → delete block and move cursor up
  - `Tab` → indent block (increase nesting)
  - `Shift+Tab` → outdent
  - `↑/↓` → move focus between blocks
  - `/` at start of block → open SlashCommandMenu

#### BlockRendererComponent
Dynamic block switching:
```typescript
@Component({
  selector: 'app-block-renderer',
  template: `
    <ng-container [ngSwitch]="block.type">
      <app-text-block *ngSwitchCase="'paragraph'" [block]="block" />
      <app-heading-block *ngSwitchCase="'heading_1'" [block]="block" />
      <app-heading-block *ngSwitchCase="'heading_2'" [block]="block" />
      <app-heading-block *ngSwitchCase="'heading_3'" [block]="block" />
      <app-todo-block *ngSwitchCase="'to_do'" [block]="block" />
      <app-list-block *ngSwitchCase="'bulleted_list_item'" [block]="block" />
      <app-list-block *ngSwitchCase="'numbered_list_item'" [block]="block" />
      <app-toggle-block *ngSwitchCase="'toggle'" [block]="block" />
      <app-code-block *ngSwitchCase="'code'" [block]="block" />
      <app-image-block *ngSwitchCase="'image'" [block]="block" />
      <app-divider-block *ngSwitchCase="'divider'" [block]="block" />
      <app-callout-block *ngSwitchCase="'callout'" [block]="block" />
    </ng-container>
  `
})
```

#### TextBlockComponent
- Uses `contenteditable="true"` div
- Handles `input` events → dispatch `BlocksActions.updateBlockOptimistic()`
- Debounce API sync: 500ms after last keystroke
- Inline formatting toolbar appears on text selection (bold, italic, strikethrough, code, link, color)
- Parses `**text**` → bold, `_text_` → italic on space/enter (markdown shortcuts)

#### SlashCommandMenuComponent
- Triggered by typing `/` at start of empty block
- Positioned below cursor using Angular CDK Overlay
- Searchable list of block types with icon + name + description
- Keyboard navigation (↑/↓, Enter to select, Escape to close)
- Groups: Text, Media, Lists, Advanced
- On select: transform current block type, dispatch update

#### BlockToolbarComponent
- Appears on block hover (left side: drag handle, right side: ⋮ menu)
- Drag handle: Angular CDK DragDrop for reordering
- ⋮ menu options: Delete, Duplicate, Turn into (change type), Copy link, Comment, Move to

---

### PHASE 15 — Angular: Collaboration Service

**CollaborationService**:
```typescript
@Injectable({ providedIn: 'root' })
export class CollaborationService {
  private socket: Socket;

  connect(token: string): void
  joinPage(pageId: string): void
  leavePage(pageId: string): void
  emitBlockUpdate(event: BlockUpdateEvent): void
  onBlockUpdate(): Observable<BlockUpdateEvent>
  onPresenceJoined(): Observable<PresenceEvent>
  onPresenceLeft(): Observable<PresenceEvent>
  onCursorMoved(): Observable<CursorEvent>
}
```

**CollaborationEffects**:
- On `BlocksActions.updateBlockSuccess` → emit `block:update` via socket
- On socket `block:updated` → dispatch `BlocksActions.updateBlockFromRemote()`
- On `PagesActions.selectPage` → emit `join:page`, unsubscribe from previous page
- On socket `presence:joined/left` → dispatch `CollaborationActions.updatePresence()`

**PresenceAvatarsComponent**:
- Shows stacked avatars of users currently on the page
- Tooltip with user name on hover
- Animated entry/exit

---

### PHASE 16 — Angular: Search

**SearchModalComponent** (full-screen modal, Cmd+K):
- Input with instant search (debounce 300ms)
- Results grouped: Pages, Blocks
- Each result: icon + title + workspace breadcrumb
- Keyboard: ↑/↓ to navigate results, Enter to open, Escape to close
- Recent pages shown when query is empty

**SearchEffects**:
- On `SearchActions.search({ query, workspaceId })` → call API after 300ms debounce
- On success → dispatch `SearchActions.searchSuccess({ results })`

---

### PHASE 17 — Angular: Database Views

For pages with `isDatabase=true`:

**DatabasePageComponent** — container, view switcher (Table/Board/Calendar/Gallery)

**TableViewComponent**:
- Virtual scroll (`CdkVirtualScrollViewport`) for performance
- Column headers = DatabaseProperty names (sortable, filterable)
- Each row = Page (click to open as full page)
- Add column button → opens property type picker
- Inline cell editing per property type
- Filter bar: add multi-condition filters
- Sort bar: multi-key sorting

**BoardViewComponent** (Kanban):
- Columns driven by a `select` property
- Drag cards between columns (Angular CDK DragDrop)
- Add card button per column
- Add column = add new select option

---

### PHASE 18 — Polish, Error Handling & Tests

#### Error Handling:
- NestJS: `AllExceptionsFilter` — catches everything, returns standardized `{ statusCode, message, error, timestamp, path }`
- Angular: `ErrorInterceptor` per Phase 10 spec
- Block editor: on API error → rollback optimistic update, show inline red border on block

#### Loading States:
- Page tree loading: skeleton shimmer
- Editor loading: skeleton blocks
- Database loading: skeleton rows

#### Unit Tests (NestJS):
Write Jest tests for:
- `AuthService`: `register()`, `login()`, `refreshToken()`, `logout()`
- `PagesService`: `getPageTree()`, `createPage()`, `deletePage()`
- `BlocksService`: `createBlock()`, `updateBlock()`, `deleteBlock()`

#### Unit Tests (Angular):
Write Jest tests for:
- All NgRx reducers (test state transitions for every action)
- All NgRx selectors
- `AuthService`, `CollaborationService`
- `TextBlockComponent`: keyboard events, content changes

---

## CODING STANDARDS (ENFORCE THROUGHOUT)

### NestJS Rules:
1. **No business logic in controllers** — controllers only call service methods
2. **Always use DTOs** — never expose entities directly from endpoints
3. **Always validate** — `class-validator` on every input DTO
4. **Explicit error handling** — use NestJS HTTP exceptions, never let errors bubble silently
5. **Service return types** — always typed, never return `any`
6. **Module boundaries** — never import another module's repository directly; always go through its service
7. **Logging** — use NestJS `Logger` in every service, log method entry with params at `debug` level, errors at `error` level
8. **Pagination** — all list endpoints return `{ data: T[], total: number, page: number, limit: number }`

### Angular Rules:
1. **No business logic in components** — all logic in services or NgRx effects
2. **Never use localStorage/sessionStorage** — all auth state in memory
3. **Strongly typed store** — no `any` in actions, reducers, or selectors
4. **Standalone components** — all components use `standalone: true`
5. **OnPush change detection** — all components use `ChangeDetectionStrategy.OnPush`
6. **Signals for local state** — use Angular 17 signals for component-local state, NgRx for shared state
7. **Reactive forms** — never use template-driven forms
8. **Accessibility** — all interactive elements have `aria-label` or visible label

### Database Rules:
1. **Always use migrations** — never `synchronize: true` in production
2. **Soft deletes** — pages and users are soft-deleted only
3. **Indexes** — add indexes on all FK columns and frequently queried fields
4. **Transactions** — use TypeORM transactions for operations that touch multiple tables

---

## ENVIRONMENT VARIABLES

### Backend `.env`:
```env
# App
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:4200

# Database
DATABASE_URL=postgresql://notely:notely@localhost:5432/notely

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# AWS S3 / MinIO
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=notely
S3_ENDPOINT=http://localhost:9000  # MinIO for local dev
```

### Frontend `environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'http://localhost:3000',
};
```

---

## START COMMAND

Begin by building **Phase 1** completely. Create all the scaffolding files, Docker Compose configuration, install all dependencies, and confirm everything starts with:

```bash
docker-compose up -d postgres redis minio
cd backend && npm run start:dev
cd frontend && ng serve
```

After Phase 1 is confirmed working, proceed to Phase 2. **Do not skip phases.** After each phase ask: "Phase N complete. Shall I proceed to Phase N+1?"

When you encounter a decision not covered by this document, apply the following priority:
1. What makes the code most maintainable and testable?
2. What follows Angular/NestJS official best practices?
3. What is most consistent with the patterns already established in this codebase?
