FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /intuition-mcp-server

# Copy package files first for better layer caching
COPY package*.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm run build

# Expose the port that the server will run on
EXPOSE 3001

# Start the server
CMD ["pnpm", "run", "start:http"]