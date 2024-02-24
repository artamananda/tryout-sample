# Gunakan golang sebagai base image
FROM golang:1.20-alpine

# Copy go.mod and go.sum to cache dependencies
COPY go.mod go.sum ./

# Download and install dependencies
RUN go mod download

# Copy migration script into the container
COPY .env ./
COPY migration.sh ./
COPY . .

# Run migration script
RUN ['./migration.sh']
