# Ajasra Backend

## Local Development

To install dependencies:
```bash
bun install
```

To run locally:
```bash
bun run dev
```

## Docker Setup

This project includes Docker configuration for easy deployment and development.

### Prerequisites

- Docker and Docker Compose installed on your machine

### Running with Docker

1. Build and start the containers:
```bash
docker-compose up --build
```

2. For running in detached mode:
```bash
docker-compose up -d
```

3. To stop the containers:
```bash
docker-compose down
```

### Docker Configuration

- The backend service runs on port 5000
- Redis service is included and configured
- Local development files are mounted as volumes for hot-reloading

### Environment Variables

Environment variables are loaded from the .env file. In Docker, some variables are overridden in the docker-compose.yml file to ensure proper connectivity between services.
