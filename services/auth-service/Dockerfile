# ─────────────────────────────────────────────
# STAGE 1: BUILDER
# This stage installs dependencies and compiles
# TypeScript into JavaScript
# ─────────────────────────────────────────────

# Start from Node.js 20 on Alpine Linux (tiny and fast)
FROM node:20-alpine AS builder

# Set the working directory inside the container
# All following commands run from this folder
WORKDIR /app

# Install pnpm globally inside the container
RUN npm install -g pnpm

# Copy package files first
# We do this BEFORE copying source code
# so Docker can cache the installed packages
# (if code changes but packages don't, Docker skips reinstalling)
COPY package.json pnpm-lock.yaml* ./

# Install ALL dependencies including devDependencies
# We need devDependencies to compile TypeScript
RUN pnpm install 

# Copy the TypeScript source code
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript → JavaScript
# This creates the dist/ folder
RUN pnpm run build

# ─────────────────────────────────────────────
# STAGE 2: PRODUCTION
# This stage creates the final lean container
# It only contains what's needed to RUN the app
# not what's needed to BUILD it
# ─────────────────────────────────────────────

FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Set environment to production
ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install ONLY production dependencies
# No TypeScript compiler, no type definitions
# This keeps the final container small
RUN pnpm install --prod

# Copy the compiled JavaScript from the builder stage
# We don't copy the TypeScript source — just the output
COPY --from=builder /app/dist ./dist

# Tell Docker this container listens on port 3001
EXPOSE 3001

# The command that runs when the container starts
CMD ["node", "dist/index.js"]