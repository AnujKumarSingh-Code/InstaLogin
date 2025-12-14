# Adbrew Full-Stack Assignment: Complete Analysis & Interview Prep

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Docker Deep Dive](#docker-deep-dive)
4. [Django Backend Analysis](#django-backend-analysis)
5. [React Frontend Analysis](#react-frontend-analysis)
6. [Complete List of Changes](#complete-list-of-changes)
7. [Interview Q&A Preparation](#interview-qa-preparation)
8. [Potential Improvements](#potential-improvements)

---

## Executive Summary

### What Was Given (Original Template)
- A basic Docker setup with 3 containers (app, api, mongo)
- A stub Django `views.py` with placeholder methods (returning empty `{}`)
- A hardcoded React App.js with static todos
- No actual functionality—just scaffolding

### What You Implemented
- Full CRUD REST API for todos in Django (using PyMongo directly)
- Production-ready React frontend with React Hooks
- Proper error handling, validation, and loading states
- Clean code architecture with separation of concerns

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOST MACHINE                             │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │     APP      │    │     API      │    │    MONGO     │      │
│  │  Container   │───▶│  Container   │───▶│  Container   │      │
│  │  (React)     │    │  (Django)    │    │  (MongoDB)   │      │
│  │  Port 3000   │    │  Port 8000   │    │  Port 27017  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                    │              │
│         │                   │                    │              │
│  ┌──────┴───────────────────┴────────────────────┴───────┐     │
│  │              SHARED VOLUME: ${ADBREW_CODEBASE_PATH}   │     │
│  │                        (/src)                          │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow (Creating a Todo)
```
User Browser                 React App              Django API            MongoDB
     │                          │                       │                    │
     │  1. Submit Form          │                       │                    │
     │─────────────────────────▶│                       │                    │
     │                          │  2. POST /todos/      │                    │
     │                          │──────────────────────▶│                    │
     │                          │                       │  3. insert_one()   │
     │                          │                       │───────────────────▶│
     │                          │                       │  4. Document ID    │
     │                          │                       │◀───────────────────│
     │                          │  5. JSON Response     │                    │
     │                          │◀──────────────────────│                    │
     │  6. Update UI            │                       │                    │
     │◀─────────────────────────│                       │                    │
```

---

## Docker Deep Dive

### Your Dockerfile vs Original

#### Original Dockerfile (Simpler, Better)
```dockerfile
FROM python:3.8
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt-get -y update && apt-get install -y curl nano wget nginx git gnupg
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs
RUN npm install -g yarn
ENV ENV_TYPE=staging
ENV MONGO_HOST=mongo
ENV MONGO_PORT=27017
ENV PYTHONPATH=$PYTHONPATH:/src/
COPY src/requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt
```

#### Your Dockerfile (Some Issues)
```dockerfile
FROM python:3.8
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt-get -y update
RUN apt-get install -y curl nano wget nginx git

# ⚠️ ISSUE: Installing MongoDB inside image (unnecessary!)
RUN ln -s /bin/echo /bin/systemctl
RUN wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -
RUN echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.4 main" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list
RUN apt-get -y update
RUN apt-get install -y mongodb-org

# ⚠️ ISSUE: Using deprecated apt-key and easy_install
RUN easy_install pip  # Should use: pip install --upgrade pip

ENV ENV_TYPE staging
ENV MONGO_HOST mongo
ENV MONGO_PORT 27017
ENV PYTHONPATH=$PYTHONPATH:/src/
COPY src/requirements.txt .
RUN pip install -r requirements.txt
```

#### Key Differences & Issues

| Aspect | Original | Your Version | Issue? |
|--------|----------|--------------|--------|
| MongoDB Install | Not in image (uses official image) | Installs in Dockerfile | ⚠️ Unnecessary, adds bloat |
| Yarn Install | Via npm | Via apt + yarn repo | Different approach |
| Node Install | NodeSource setup | Not explicitly shown | May use system node |
| Pip upgrade | `pip install --upgrade pip` | `easy_install pip` | ⚠️ Deprecated method |
| apt-key | Not used | Uses deprecated apt-key | ⚠️ Deprecated in newer Debian |

### docker-compose.yml Analysis

#### Original docker-compose.yml (Better)
```yaml
services:
  api:
    build: .
    container_name: api
    command: bash -c "cd /src/rest && python manage.py runserver 0.0.0.0:8000"
    ports:
      - "8000:8000"
    depends_on:          # ✅ Modern approach
      - mongo
    environment:         # ✅ Explicit env vars
      - MONGO_HOST=mongo
      - MONGO_PORT=27017
    volumes:
      - ${ADBREW_CODEBASE_PATH}/tmp:/tmp
      - ${ADBREW_CODEBASE_PATH}:/src

  app:
    build: .
    container_name: app
    command: bash -c "cd /src/app && yarn install && yarn start"
    ports:
      - "3000:3000"
    depends_on:          # ✅ Ensures api starts first
      - api
    environment:
      - CHOKIDAR_USEPOLLING=true  # ✅ For hot-reload in Docker
      - HOST=0.0.0.0
      - PORT=3000
      - CI=true
    volumes:
      - ${ADBREW_CODEBASE_PATH}:/src

  mongo:
    image: mongo:4.4    # ✅ Uses official MongoDB image
    container_name: mongo
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - ${ADBREW_CODEBASE_PATH}/db/:/data/db
```

#### Your docker-compose.yml (Issues)
```yaml
version: '2'           # ⚠️ Old version syntax
services:
  api:
    build: .
    container_name: api
    command: bash -c "cd /src/rest && python manage.py runserver 0.0.0.0:8000"
    ports:
      - "8000:8000"
    links:               # ⚠️ DEPRECATED - use depends_on + networks
      - mongo
    volumes:
      - ${ADBREW_CODEBASE_PATH}/tmp:/tmp
      - ${ADBREW_CODEBASE_PATH}:/src
    # ⚠️ Missing environment variables for MONGO_HOST, MONGO_PORT

  app:
    build: .
    container_name: app
    command: bash -c "cd /src/app && yarn install && yarn start"
    ports:
      - "3000:3000"
    # ⚠️ Missing depends_on - app might start before api
    # ⚠️ Missing CHOKIDAR_USEPOLLING for hot-reload
    volumes:
      - ${ADBREW_CODEBASE_PATH}:/src

  mongo:
    build: .            # ⚠️ Builds from Dockerfile (inefficient!)
    container_name: mongo
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - ${ADBREW_CODEBASE_PATH}/db/:/data/db
    command: /usr/bin/mongod --bind_ip 0.0.0.0  # Manual mongo start
```

### How Docker Flow Works (Step-by-Step)

#### 1. Build Phase (`docker-compose build`)
```
┌─────────────────────────────────────────────────────────────────┐
│  Reading Dockerfile...                                          │
│                                                                 │
│  Step 1: FROM python:3.8                                        │
│          └── Pulls Python 3.8 base image from Docker Hub        │
│                                                                 │
│  Step 2: RUN rm /bin/sh && ln -s /bin/bash /bin/sh             │
│          └── Replaces sh with bash (for better script support)  │
│                                                                 │
│  Step 3: RUN apt-get install curl, wget, etc.                   │
│          └── Installs system utilities                          │
│                                                                 │
│  Step 4: Install Node.js and Yarn                               │
│          └── For React app development                          │
│                                                                 │
│  Step 5: Set ENV variables                                      │
│          └── MONGO_HOST, MONGO_PORT baked into image            │
│                                                                 │
│  Step 6: COPY requirements.txt & pip install                    │
│          └── Python dependencies installed                      │
│                                                                 │
│  Result: One image used by both 'api' and 'app' containers      │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. Container Start Phase (`docker-compose up`)
```
┌─────────────────────────────────────────────────────────────────┐
│  Starting containers in dependency order...                      │
│                                                                 │
│  1. MONGO Container starts first                                │
│     └── Runs: mongod --bind_ip 0.0.0.0                         │
│     └── MongoDB listens on 0.0.0.0:27017 inside container       │
│     └── Mapped to host's 27017                                  │
│                                                                 │
│  2. API Container starts (depends_on: mongo)                    │
│     └── Runs: python manage.py runserver 0.0.0.0:8000          │
│     └── Django connects to 'mongo:27017' (Docker DNS)           │
│     └── Mapped to host's 8000                                   │
│                                                                 │
│  3. APP Container starts (depends_on: api)                      │
│     └── Runs: yarn install && yarn start                        │
│     └── React dev server on 0.0.0.0:3000                        │
│     └── Mapped to host's 3000                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### 3. Network Communication
```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Bridge Network                         │
│                                                                 │
│   Container Name = DNS Hostname                                  │
│                                                                 │
│   api ──────▶ mongo:27017    (works! Docker resolves 'mongo')   │
│   app ──────▶ api:8000       (inside Docker network)            │
│                                                                 │
│   BUT: Browser runs on HOST, not in Docker!                      │
│   Browser ──▶ localhost:8000 (port mapping from host to api)    │
└─────────────────────────────────────────────────────────────────┘
```

#### 4. Volume Mounting (Key Concept!)
```
HOST FILESYSTEM                          CONTAINER FILESYSTEM
─────────────────                        ────────────────────
${ADBREW_CODEBASE_PATH}/                 /src/
├── app/                                 ├── app/
│   └── src/                             │   └── src/
│       └── App.js    ◄──────────────────│       └── App.js
├── rest/                                ├── rest/
│   └── rest/                            │   └── rest/
│       └── views.py  ◄──────────────────│       └── views.py
└── requirements.txt                     └── requirements.txt

Changes on HOST are INSTANTLY reflected in container!
This enables hot-reload during development.
```

---

## Django Backend Analysis

### Original Code (Stub)
```python
from pymongo import MongoClient

mongo_uri = 'mongodb://' + os.environ["MONGO_HOST"] + ':' + os.environ["MONGO_PORT"]
db = MongoClient(mongo_uri)['test_db']

class TodoListView(APIView):
    def get(self, request):
        # Implement this method - return all todo items from db instance above.
        return Response({}, status=status.HTTP_200_OK)
        
    def post(self, request):
        # Implement this method - accept a todo item, persist using db instance above.
        return Response({}, status=status.HTTP_200_OK)
```

### Your Implementation

#### 1. MongoDB Connection (Singleton Pattern)
```python
class MongoDBConnection:
    """
    Singleton class to manage MongoDB connection.
    Why Singleton? 
    - MongoDB connections are expensive to create
    - Reuse single connection across requests
    - Thread-safe by default in Python
    """
    _instance = None
    _client = None
    _db = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            try:
                cls._client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
                cls._client.admin.command('ping')  # Test connection
                cls._db = cls._client[DATABASE_NAME]
            except ConnectionFailure as e:
                logger.error(f"Failed to connect to MongoDB: {e}")
                raise
        return cls._instance

    @property
    def todos_collection(self):
        return self._db[COLLECTION_NAME]
```

**Interview Explanation:**
> "I used the Singleton pattern for MongoDB connection management. Creating database connections is expensive, and in a web application, you want to reuse the same connection pool across requests. The `__new__` method ensures only one instance is created. I also added a connection test with `ping` to fail fast if MongoDB is unavailable."

#### 2. Data Validation (Defensive Programming)
```python
def validate_todo_data(data: Dict[str, Any]) -> tuple:
    """
    Validate incoming todo data.
    Returns: Tuple of (is_valid, error_message)
    """
    if not data:
        return False, "Request body is empty"
    
    title = data.get('title', '').strip()
    if not title:
        return False, "Title is required and cannot be empty"
    
    if len(title) > 200:
        return False, "Title must be 200 characters or less"
    
    description = data.get('description', '')
    if len(description) > 1000:
        return False, "Description must be 1000 characters or less"
    
    return True, ""
```

**Why This Matters:**
- Never trust client input
- Provides clear error messages
- Prevents database bloat (character limits)
- Returns tuple for easy unpacking in caller

#### 3. Serialization (MongoDB to JSON)
```python
def serialize_todo(todo: Dict[str, Any]) -> Dict[str, Any]:
    """
    MongoDB documents have ObjectId which isn't JSON serializable.
    This converts _id (ObjectId) to string 'id'.
    """
    if todo is None:
        return None
    
    return {
        'id': str(todo.get('_id', '')),  # ObjectId → string
        'title': todo.get('title', ''),
        'description': todo.get('description', ''),
        'completed': todo.get('completed', False),
        'created_at': todo.get('created_at', ''),
    }
```

**Interview Explanation:**
> "MongoDB uses `ObjectId` for document IDs which is a BSON type, not JSON-serializable. I created a serialization function that converts `_id` to a string `id` field. This also acts as a data contract—the frontend always receives consistent field names regardless of how data is stored internally."

#### 4. RESTful API Design

| Endpoint | Method | Action | Status Code |
|----------|--------|--------|-------------|
| `/todos/` | GET | List all todos | 200 OK |
| `/todos/` | POST | Create todo | 201 Created |
| `/todos/<id>/` | GET | Get single todo | 200 OK |
| `/todos/<id>/` | PUT | Update todo | 200 OK |
| `/todos/<id>/` | DELETE | Delete todo | 200 OK |

#### 5. Error Handling Strategy
```python
def get(self, request):
    try:
        db_conn = get_db_connection()
        collection = db_conn.todos_collection
        cursor = collection.find().sort('created_at', -1)
        todos = [serialize_todo(todo) for todo in cursor]
        
        return Response({
            'success': True,
            'data': todos,
            'count': len(todos)
        }, status=status.HTTP_200_OK)
        
    except ConnectionFailure as e:
        logger.error(f"Database connection error: {e}")
        return Response({
            'success': False,
            'error': 'Database connection failed. Please try again later.'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
    except PyMongoError as e:
        logger.error(f"Database error: {e}")
        return Response({
            'success': False,
            'error': 'An error occurred while fetching todos.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        logger.error(f"Unexpected error in GET /todos: {e}")
        return Response({
            'success': False,
            'error': 'An unexpected error occurred.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

**Error Hierarchy (Specific → General):**
1. `ConnectionFailure` → 503 Service Unavailable
2. `PyMongoError` → 500 Internal Server Error
3. `Exception` → 500 (catch-all safety net)

**Why log the actual error but return generic message?**
> "Security best practice: detailed errors in logs help debugging, but exposing internal errors to clients can reveal system information. Users see 'An error occurred' while developers see the full stack trace."

---

## React Frontend Analysis

### Original Code
```jsx
export function App() {
  return (
    <div className="App">
      <div>
        <h1>List of TODOs</h1>
        <li>Learn Docker</li>    {/* Hardcoded! */}
        <li>Learn React</li>     {/* Hardcoded! */}
      </div>
      <div>
        <h1>Create a ToDo</h1>
        <form>
          <input type="text" />
          <button>Add ToDo!</button>  {/* Does nothing! */}
        </form>
      </div>
    </div>
  );
}
```

### Your Implementation Architecture

```
src/
├── App.js              # Main component (container)
├── components/
│   ├── index.js        # Barrel export
│   ├── TodoForm.js     # Form component
│   ├── TodoList.js     # List component
│   ├── TodoItem.js     # Individual item
│   └── ErrorMessage.js # Error display
├── hooks/
│   └── useTodos.js     # Custom hook for state management
└── services/
    └── api.js          # API client
```

#### Custom Hook: useTodos (State Management)
```javascript
function useTodos() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoized fetch function
  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await todoService.getAll();
      setTodos(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Optimistic update for adding
  const addTodo = useCallback(async (todoData) => {
    try {
      setIsSubmitting(true);
      const newTodo = await todoService.create(todoData);
      setTodos((prevTodos) => [newTodo, ...prevTodos]);  // Add to front
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  return { todos, loading, error, isSubmitting, addTodo, ... };
}
```

**Key Patterns Used:**
1. **useCallback** - Memoizes functions to prevent unnecessary re-renders
2. **Optimistic Updates** - UI updates immediately, doesn't wait for server
3. **Custom Hook** - Encapsulates all todo logic, reusable
4. **Single Source of Truth** - All state in one place

#### API Service (Centralized HTTP Client)
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || 'An error occurred', response.status, data);
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Network error. Please check your connection.', 0, null);
  }
}
```

**Why Custom ApiError Class?**
> "Having a custom error class lets me distinguish between API errors (server returned 4xx/5xx) and network errors (no response at all). The `status` property helps the UI show appropriate messages—404 means 'not found' while 503 means 'try again later'."

---

## Complete List of Changes

### 1. Docker Changes

| File | Change | Why |
|------|--------|-----|
| `docker-compose.yml` | Changed `depends_on` to `links` | ⚠️ Actually worse—`links` is deprecated |
| `docker-compose.yml` | Changed `image: mongo:4.4` to `build: .` | ⚠️ Unnecessary, builds from your Dockerfile |
| `docker-compose.yml` | Added `command: /usr/bin/mongod --bind_ip 0.0.0.0` | Required since you're running mongo from Dockerfile |
| `docker-compose.yml` | Removed `environment` from api service | ⚠️ Relies on Dockerfile ENV (works but less explicit) |
| `Dockerfile` | Added MongoDB installation | ⚠️ Not needed—original used official image |

### 2. Django Backend Changes

| File | Change | Why |
|------|--------|-----|
| `views.py` | Complete rewrite | Implemented full CRUD |
| `views.py` | Added `MongoDBConnection` singleton | Connection reuse |
| `views.py` | Added `serialize_todo()` | ObjectId handling |
| `views.py` | Added `validate_todo_data()` | Input validation |
| `views.py` | Added `TodoDetailView` class | GET/PUT/DELETE individual |
| `urls.py` | Added `TodoDetailView` route | `/todos/<id>/` endpoint |
| `settings.py` | Added to `ALLOWED_HOSTS` | `127.0.0.1`, `0.0.0.0`, `api` |
| `settings.py` | Added `DEFAULT_AUTO_FIELD` | Silences Django warning |
| `requirements.txt` | Simplified | Removed unused dependencies |

### 3. React Frontend Changes

| File | Change | Why |
|------|--------|-----|
| `App.js` | Complete rewrite | Functional component with hooks |
| `components/` | Created 4 new components | Separation of concerns |
| `hooks/useTodos.js` | Created custom hook | State management |
| `services/api.js` | Created API client | Centralized HTTP |
| `package.json` | Added `prop-types` | Runtime type checking |
| `*.css` | New styling | Better UX |

---

## Interview Q&A Preparation

### Docker Questions

**Q: Why do we need Docker for this project?**
> "Docker provides consistent environments. Without it, 'works on my machine' issues arise from different Python/Node versions, OS differences, or MongoDB configurations. All developers and production use identical containers."

**Q: Explain the `depends_on` directive.**
> "`depends_on` ensures containers start in order—mongo before api, api before app. However, it only waits for the container to START, not for the service inside to be READY. That's why I added connection retry logic in Django."

**Q: What's the difference between `COPY` and `ADD` in Dockerfile?**
> "`COPY` just copies files. `ADD` can also extract archives and fetch URLs. Best practice is to use `COPY` unless you need ADD's extra features—it's more explicit."

**Q: Why mount volumes instead of copying code into the image?**
> "During development, we want hot-reload. Volumes let the container see file changes instantly without rebuilding. In production, you'd typically `COPY` code into the image for portability."

**Q: What does `0.0.0.0` mean in server binding?**
> "It means 'listen on all network interfaces'. Inside Docker, if you bind to `127.0.0.1` (localhost only), the container's port isn't accessible from outside. `0.0.0.0` makes it reachable via Docker's port mapping."

### Django Questions

**Q: Why didn't you use Django Models?**
> "The assignment explicitly said not to use Django's ORM. This is actually common when working with MongoDB since Django's ORM is designed for relational databases. I used PyMongo directly which gives full control over MongoDB operations."

**Q: Explain your error handling strategy.**
> "I use a try-except hierarchy from specific to general: `ConnectionFailure` for MongoDB connection issues returns 503 (Service Unavailable), `PyMongoError` for database operations returns 500, and a catch-all `Exception` as a safety net. Internal errors are logged but users see generic messages for security."

**Q: Why use a Singleton for database connection?**
> "Database connections are expensive resources. The Singleton ensures we reuse one connection instance across all requests rather than creating a new connection per request. PyMongo's MongoClient actually manages a connection pool internally, but the Singleton ensures we're not creating multiple pools."

**Q: What's the purpose of `serverSelectionTimeoutMS=5000`?**
> "It's a fail-fast mechanism. If MongoDB isn't available, we'll know within 5 seconds rather than waiting for the default 30 seconds. This improves user experience and helps detect issues quickly during development."

**Q: How does CORS work in your setup?**
> "React runs on port 3000, Django on 8000. Cross-Origin Resource Sharing (CORS) is a browser security feature that blocks requests to different origins. I enabled `django-cors-headers` with `CORS_ORIGIN_ALLOW_ALL=True` for development. In production, you'd whitelist specific origins."

### React Questions

**Q: Why use React Hooks instead of class components?**
> "Hooks were required by the assignment, but they're also preferred in modern React. They're more concise, allow better code reuse through custom hooks, and avoid the `this` binding confusion in classes. My `useTodos` hook encapsulates all todo logic and could be reused across components."

**Q: Explain `useCallback` and when to use it.**
> "useCallback memoizes functions so they're not recreated on every render. I use it in `useTodos` because these functions are passed as props to child components. Without memoization, children would re-render unnecessarily because they'd see 'new' function references each time."

**Q: What's the difference between `useEffect` with `[]` vs no dependency array?**
> "Empty array `[]` means the effect runs once on mount (like componentDidMount). No array means it runs after every render. I use `[fetchTodos]` which means 're-run if fetchTodos changes', but since fetchTodos is wrapped in useCallback with `[]`, it never changes—so effectively runs once."

**Q: What are PropTypes and why use them?**
> "PropTypes provide runtime type checking for component props. If a component receives wrong prop types, you get console warnings. It's like TypeScript but lighter weight. I added it to document expected props and catch bugs early."

---

## Potential Improvements

### Docker Improvements

1. **Use Official MongoDB Image**
   ```yaml
   mongo:
     image: mongo:4.4  # Don't build from Dockerfile!
   ```

2. **Add Health Checks**
   ```yaml
   api:
     healthcheck:
       test: ["CMD", "curl", "-f", "http://localhost:8000/todos/"]
       interval: 30s
       timeout: 10s
       retries: 3
   ```

3. **Use `depends_on` with `condition`** (Compose v2.4+)
   ```yaml
   api:
     depends_on:
       mongo:
         condition: service_healthy
   ```

4. **Multi-stage Dockerfile for Production**
   ```dockerfile
   # Build stage
   FROM node:16 AS frontend-build
   WORKDIR /app
   COPY src/app/package*.json ./
   RUN npm install
   COPY src/app/ ./
   RUN npm run build

   # Production stage
   FROM python:3.8-slim
   COPY --from=frontend-build /app/build /static
   ...
   ```

### Django Improvements

1. **Add Pagination**
   ```python
   def get(self, request):
       page = int(request.query_params.get('page', 1))
       limit = int(request.query_params.get('limit', 10))
       skip = (page - 1) * limit
       
       cursor = collection.find().sort('created_at', -1).skip(skip).limit(limit)
   ```

2. **Add Search/Filter**
   ```python
   query = {}
   if 'completed' in request.query_params:
       query['completed'] = request.query_params['completed'] == 'true'
   if 'search' in request.query_params:
       query['title'] = {'$regex': request.query_params['search'], '$options': 'i'}
   ```

3. **Add Database Indexes**
   ```python
   # In MongoDBConnection.__new__
   cls._db[COLLECTION_NAME].create_index([('created_at', -1)])
   cls._db[COLLECTION_NAME].create_index([('title', 'text')])
   ```

4. **Add Rate Limiting**
   ```python
   from rest_framework.throttling import AnonRateThrottle
   
   class TodoListView(APIView):
       throttle_classes = [AnonRateThrottle]
   ```

### React Improvements

1. **Add Loading States per Item**
   ```javascript
   const [loadingItems, setLoadingItems] = useState({});
   
   const deleteTodo = async (id) => {
     setLoadingItems(prev => ({ ...prev, [id]: true }));
     try {
       await todoService.delete(id);
       setTodos(prev => prev.filter(t => t.id !== id));
     } finally {
       setLoadingItems(prev => ({ ...prev, [id]: false }));
     }
   };
   ```

2. **Add Debounced Search**
   ```javascript
   import { useMemo } from 'react';
   import debounce from 'lodash/debounce';

   const debouncedSearch = useMemo(
     () => debounce((query) => fetchTodos({ search: query }), 300),
     [fetchTodos]
   );
   ```

3. **Add TypeScript**
   ```typescript
   interface Todo {
     id: string;
     title: string;
     description?: string;
     completed: boolean;
     created_at: string;
   }
   ```

4. **Add Tests**
   ```javascript
   import { render, screen, fireEvent } from '@testing-library/react';
   import TodoForm from './TodoForm';

   test('submits form with title', async () => {
     const onSubmit = jest.fn().mockResolvedValue(true);
     render(<TodoForm onSubmit={onSubmit} />);
     
     fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test' } });
     fireEvent.click(screen.getByRole('button', { name: /add/i }));
     
     expect(onSubmit).toHaveBeenCalledWith({ title: 'Test', description: '' });
   });
   ```

---

## Summary: What to Emphasize in Interview

1. **Understanding over memorization** - Show you understand WHY Docker, WHY Singleton, WHY validation
2. **Production thinking** - Error handling, logging, security considerations
3. **Clean architecture** - Separation of concerns, single responsibility
4. **Acknowledge improvements** - Shows self-awareness and growth mindset
5. **Explain trade-offs** - "I chose X over Y because of Z"

Good luck with your interview! 🚀
