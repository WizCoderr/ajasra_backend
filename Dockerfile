# Use the official Bun image with a dark theme
FROM oven/bun:1-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Set working directory
WORKDIR /app

# Copy package.json and bun.lock files
COPY package.json bun.lock* ./

# Copy prisma schema
COPY prisma ./prisma/

# Copy source code
COPY src ./src/

# Copy environment variables and configuration files
COPY .env .prettierrc tsconfig.json ./

# Install dependencies
RUN bun install

# Generate Prisma client
RUN bunx prisma generate

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["bun", "--watch", "src/index.ts"]