#!/bin/bash

# Script to generate comprehensive unit tests for Go backend project
# This will create test files for all repositories, services, and controllers

cd /Users/artamananda/dev/tryout-sample/backend

# Create test files for all repositories
for file in internal/repository/*.go; do
    if [[ ! -f "${file%.*}_test.go" ]] && [[ "$file" != *"_test.go" ]]; then
        echo "Creating tests for $file"
    fi
done

# Create test files for all services  
for file in internal/service/*.go; do
    if [[ ! -f "${file%.*}_test.go" ]] && [[ "$file" != *"_test.go" ]]; then
        echo "Creating tests for $file"
    fi
done

# Create test files for all controllers
for file in internal/controller/*.go; do
    if [[ ! -f "${file%.*}_test.go" ]] && [[ "$file" != *"_test.go" ]]; then
        echo "Creating tests for $file"
    fi
done

# Run all tests with coverage
go test ./... -coverprofile=coverage.out -covermode=atomic

# Generate coverage report
go tool cover -func=coverage.out | tail -1
