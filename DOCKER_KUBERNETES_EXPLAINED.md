# Docker & Kubernetes in Stewart AI Platform
## Containerization Strategy Explained

---

## 🐳 Docker vs Kubernetes: What We Use

### Quick Answer:
**We use DOCKER for containerization, and Cloud Run (which is built on Kubernetes/Knative) for orchestration.**

---

## 📦 Docker: What and How We Use It

### What is Docker?

**Docker** is a containerization platform that packages applications with all their dependencies into a single, portable unit called a **container**.

**Think of it like:**
- A shipping container for code
- Everything the app needs is inside
- Runs the same everywhere (dev laptop, cloud, production)

### Our Dockerfile

Located at: [`StewartAI.Api/Dockerfile`](../StewartAI/StewartAI.Api/Dockerfile)

```dockerfile
# Stage 1: Build the application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files
COPY ["StewartAI.Api/StewartAI.Api.csproj", "StewartAI.Api/"]
COPY ["StewartAI.Application/StewartAI.Application.csproj", "StewartAI.Application/"]
COPY ["StewartAI.Domain/StewartAI.Domain.csproj", "StewartAI.Domain/"]
COPY ["StewartAI.Infrastructure/StewartAI.Infrastructure.csproj", "StewartAI.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "StewartAI.Api/StewartAI.Api.csproj"

# Copy all source code
COPY . .

# Build the application
WORKDIR "/src/StewartAI.Api"
RUN dotnet build "StewartAI.Api.csproj" -c Release -o /app/build

# Publish the application
RUN dotnet publish "StewartAI.Api.csproj" -c Release -o /app/publish

# Stage 2: Create runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Copy published application from build stage
COPY --from=build /app/publish .

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Set environment variable for ASP.NET Core
ENV ASPNETCORE_URLS=http://+:8080

# Run the application
ENTRYPOINT ["dotnet", "StewartAI.Api.dll"]
```

### What This Dockerfile Does:

**Stage 1: Build (Multi-stage build)**
1. Uses .NET SDK 9.0 image (has compiler, tools)
2. Copies project files
3. Restores NuGet packages
4. Builds the application
5. Publishes optimized release build

**Stage 2: Runtime**
1. Uses .NET ASP.NET 9.0 image (smaller, runtime only)
2. Copies only the published files (not source code)
3. Exposes port 8080
4. Sets up entry point

**Why Multi-stage?**
- ✅ Smaller final image (~200MB vs ~1GB)
- ✅ No build tools in production
- ✅ Faster deployment
- ✅ More secure (less attack surface)

### Docker Commands We Use:

**Build Image Locally:**
```bash
docker build -t stewart-ai:latest .
```

**Run Container Locally:**
```bash
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your-key-here \
  stewart-ai:latest
```

**Push to Registry:**
```bash
docker tag stewart-ai:latest gcr.io/gen-lang-client-0091163233/stewart-ai
docker push gcr.io/gen-lang-client-0091163233/stewart-ai
```

---

## ☸️ Kubernetes: How Cloud Run Uses It

### What is Kubernetes?

**Kubernetes (K8s)** is a container orchestration platform that:
- Manages multiple containers
- Auto-scales based on load
- Handles load balancing
- Provides self-healing
- Manages deployments

**Think of it like:**
- A conductor for an orchestra of containers
- Ensures containers run smoothly
- Replaces failed containers
- Distributes traffic

### Cloud Run = Managed Kubernetes

**Cloud Run is built on Knative**, which runs on Kubernetes.

**What this means:**
```
Your Docker Container
    ↓
Cloud Run (Knative)
    ↓
Google Kubernetes Engine (GKE)
    ↓
Google's Infrastructure
```

**But you don't manage Kubernetes directly!**

### Traditional Kubernetes vs Cloud Run

**Traditional Kubernetes (GKE):**
```yaml
# You write YAML files like this:
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stewart-ai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: stewart-ai
  template:
    metadata:
      labels:
        app: stewart-ai
    spec:
      containers:
      - name: stewart-ai
        image: gcr.io/project/stewart-ai
        ports:
        - containerPort: 8080
        env:
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: gemini-secret
              key: api-key
---
apiVersion: v1
kind: Service
metadata:
  name: stewart-ai-service
spec:
  type: LoadBalancer
  selector:
    app: stewart-ai
  ports:
  - port: 80
    targetPort: 8080
```

**Cloud Run (Managed Kubernetes):**
```bash
# You just run this command:
gcloud run deploy stewart-ai \
  --source . \
  --region us-central1 \
  --set-env-vars GEMINI_API_KEY=xxx
```

**Cloud Run handles:**
- ✅ Creating Kubernetes deployment
- ✅ Creating service
- ✅ Setting up load balancer
- ✅ Configuring auto-scaling
- ✅ Managing SSL certificates
- ✅ Setting up health checks
- ✅ Handling rolling updates

---

## 🔄 Our Deployment Flow

### Step-by-Step: From Code to Running Container

```
1. Developer writes code
   ↓
2. Commit to GitHub
   ↓
3. Run: gcloud run deploy stewart-ai --source .
   ↓
4. Cloud Build detects Dockerfile
   ↓
5. Cloud Build runs: docker build
   ↓
6. Docker creates container image
   ↓
7. Image pushed to Artifact Registry
   ↓
8. Cloud Run pulls image
   ↓
9. Cloud Run creates Kubernetes deployment (behind the scenes)
   ↓
10. Kubernetes starts container(s)
   ↓
11. Load balancer routes traffic
   ↓
12. Application is live!
```

### What Happens Behind the Scenes (Kubernetes):

**When you deploy to Cloud Run:**

1. **Kubernetes Deployment Created:**
```yaml
# Cloud Run creates this automatically
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: stewart-ai
spec:
  template:
    spec:
      containers:
      - image: gcr.io/gen-lang-client-0091163233/stewart-ai
        resources:
          limits:
            memory: 512Mi
            cpu: 1000m
        env:
        - name: GEMINI_API_KEY
          value: xxx
```

2. **Auto-scaling Configuration:**
```yaml
# Cloud Run manages this
spec:
  autoscaling:
    minScale: 0      # Scale to zero
    maxScale: 10     # Max 10 instances
    target: 80       # 80 concurrent requests per instance
```

3. **Service Mesh:**
```yaml
# Cloud Run sets up Istio/Envoy
spec:
  traffic:
  - percent: 100
    latestRevision: true
```

---

## 🎯 Docker Concepts We Use

### 1. **Containerization**
**What:** Package app + dependencies into isolated unit
**Why:** Consistency across environments
**How:** Dockerfile defines the container

### 2. **Multi-stage Builds**
**What:** Multiple FROM statements in Dockerfile
**Why:** Smaller final image, faster deployments
**How:** Build stage + Runtime stage

### 3. **Image Layers**
**What:** Each Dockerfile instruction creates a layer
**Why:** Caching speeds up builds
**How:** Order instructions from least to most changing

### 4. **Container Registry**
**What:** Storage for Docker images
**Why:** Share images across environments
**How:** GCP Artifact Registry

### 5. **Environment Variables**
**What:** Configuration passed to container
**Why:** Keep secrets out of code
**How:** `-e` flag or `--set-env-vars`

---

## ☸️ Kubernetes Concepts (Managed by Cloud Run)

### 1. **Pods**
**What:** Smallest deployable unit (1+ containers)
**Cloud Run:** Each request may get its own pod
**Benefit:** Isolation and scaling

### 2. **Services**
**What:** Stable endpoint for pods
**Cloud Run:** Automatic HTTPS endpoint
**Benefit:** Load balancing

### 3. **Deployments**
**What:** Desired state for pods
**Cloud Run:** Managed automatically
**Benefit:** Rolling updates, rollbacks

### 4. **Auto-scaling (HPA)**
**What:** Horizontal Pod Autoscaler
**Cloud Run:** Scales 0-10 instances automatically
**Benefit:** Cost + performance optimization

### 5. **Ingress**
**What:** External access to services
**Cloud Run:** Built-in load balancer + SSL
**Benefit:** HTTPS without configuration

### 6. **ConfigMaps & Secrets**
**What:** Configuration and sensitive data
**Cloud Run:** Environment variables
**Benefit:** Secure secret management

---

## 🔍 Why We Chose This Approach

### Docker: YES ✅
**Reasons:**
- Industry standard
- Portable across clouds
- Easy local development
- Reproducible builds
- Version control for infrastructure

### Direct Kubernetes: NO ❌
**Reasons:**
- Too complex for this project
- Requires YAML expertise
- Manual scaling configuration
- More operational overhead
- Overkill for our needs

### Cloud Run (Managed Kubernetes): YES ✅
**Reasons:**
- Best of both worlds
- Docker simplicity + Kubernetes power
- Fully managed (no YAML)
- Auto-scaling built-in
- Pay-per-use pricing
- Fast deployments

---

## 📊 Comparison Table

| Feature | Docker Only | Kubernetes (GKE) | Cloud Run |
|---------|-------------|------------------|-----------|
| **Containerization** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Auto-scaling** | ❌ No | ✅ Manual config | ✅ Automatic |
| **Load Balancing** | ❌ No | ✅ Manual config | ✅ Automatic |
| **HTTPS/SSL** | ❌ No | ✅ Manual config | ✅ Automatic |
| **Management** | Manual | Complex | Fully managed |
| **Cost** | Server cost | Cluster cost | Pay-per-use |
| **Complexity** | Low | High | Low |
| **Best For** | Local dev | Large apps | Serverless apps |

---

## 🛠️ Technical Details

### Container Lifecycle in Cloud Run:

**1. Cold Start (First Request)**
```
Request arrives
    ↓
Kubernetes schedules pod
    ↓
Pull Docker image from registry
    ↓
Start container
    ↓
Initialize .NET runtime
    ↓
Load application
    ↓
Process request
    ↓
Return response
Time: ~2-3 seconds
```

**2. Warm Instance (Subsequent Requests)**
```
Request arrives
    ↓
Route to existing container
    ↓
Process request
    ↓
Return response
Time: ~100-500ms
```

**3. Scale Up (Traffic Spike)**
```
Multiple requests arrive
    ↓
Kubernetes detects load
    ↓
Starts new containers (up to max-instances)
    ↓
Load balancer distributes traffic
    ↓
All requests processed
Time: ~2-3 seconds for new instances
```

**4. Scale to Zero (No Traffic)**
```
No requests for 15 minutes
    ↓
Kubernetes terminates containers
    ↓
No cost incurred
    ↓
Next request triggers cold start
```

### Resource Allocation:

**Per Container:**
- CPU: 1 vCPU (1000 millicores)
- Memory: 512 MiB
- Disk: Ephemeral (lost on restart)
- Network: 1 Gbps

**Kubernetes manages:**
- CPU throttling
- Memory limits
- Network policies
- Health checks

---

## 🎓 Key Takeaways

### What We Use:
1. **Docker** - For containerization
2. **Dockerfile** - Defines our container
3. **Cloud Run** - Managed Kubernetes platform
4. **Knative** - Serverless layer on Kubernetes
5. **GKE** - Underlying Kubernetes (managed by Google)

### What We DON'T Manage:
1. ❌ Kubernetes YAML files
2. ❌ Pod scheduling
3. ❌ Load balancer configuration
4. ❌ SSL certificate management
5. ❌ Auto-scaling rules
6. ❌ Health check setup

### What Cloud Run Manages for Us:
1. ✅ Kubernetes cluster
2. ✅ Container orchestration
3. ✅ Auto-scaling (0-10 instances)
4. ✅ Load balancing
5. ✅ HTTPS/SSL
6. ✅ Health checks
7. ✅ Rolling updates
8. ✅ Traffic splitting

---

## 🚀 Production Considerations

### If We Needed Full Kubernetes (GKE):

**Use Cases:**
- Complex microservices (10+ services)
- Custom networking requirements
- Stateful applications (databases)
- Advanced traffic routing
- Multi-region deployments
- Custom auto-scaling logic

**Our Project:**
- Single containerized application
- Stateless (SQLite is ephemeral)
- Simple HTTP traffic
- Standard auto-scaling needs
- Single region deployment

**Conclusion:** Cloud Run is perfect for our needs!

---

## 📝 Summary

**Docker:**
- ✅ We write a Dockerfile
- ✅ Docker builds our container image
- ✅ Image contains .NET app + dependencies
- ✅ Portable and reproducible

**Kubernetes (via Cloud Run):**
- ✅ Cloud Run uses Kubernetes under the hood
- ✅ We don't write Kubernetes YAML
- ✅ Kubernetes handles orchestration
- ✅ Auto-scaling, load balancing, SSL all managed

**Best of Both Worlds:**
- Docker's simplicity
- Kubernetes' power
- Serverless convenience
- Production-grade reliability

---

**This is modern cloud-native architecture: containerized with Docker, orchestrated by Kubernetes, simplified by Cloud Run! 🚀**
