#!/bin/bash

source .env

export DB_USER=$DB_USER
export DB_PASSWORD=$DB_PASSWORD
export DB_HOST=$DB_HOST
export DB_PORT=$DB_PORT
export DB_NAME=$DB_NAME

# Path menuju direktori migrasi
MIGRATION_PATH="db/migrations"

# String koneksi database
DATABASE_URL="postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=disable"

# Eksekusi perintah migrasi up
migrate -database "$DATABASE_URL" -path "$MIGRATION_PATH" up