FROM node:20-alpine

WORKDIR /app

# Copy frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
