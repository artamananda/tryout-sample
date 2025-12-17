.PHONY: test test-verbose test-coverage test-coverage-html test-unit test-integration clean-coverage

# Run all tests
test:
@echo "Running all tests..."
@go test ./... -v

# Run tests with verbose output
test-verbose:
@echo "Running tests with verbose output..."
@go test ./... -v -count=1

# Run tests with coverage
test-coverage:
@echo "Running tests with coverage..."
@go test ./... -coverprofile=coverage.out -covermode=atomic -coverpkg=./...
@go tool cover -func=coverage.out | grep total

# Generate HTML coverage report
test-coverage-html: test-coverage
@echo "Generating HTML coverage report..."
@go tool cover -html=coverage.out -o coverage.html
@echo "Coverage report generated: coverage.html"

# Run unit tests only
test-unit:
@echo "Running unit tests..."
@go test ./internal/helper/... ./internal/exception/... ./internal/common/... -v

# Run repository tests
test-repo:
@echo "Running repository tests..."
@go test ./internal/repository/... -v

# Run service tests
test-service:
@echo "Running service tests..."
@go test ./internal/service/... -v

# Run controller tests
test-controller:
@echo "Running controller tests..."
@go test ./internal/controller/... -v

# Run tests with race detector
test-race:
@echo "Running tests with race detector..."
@go test ./... -race

# Clean coverage files
clean-coverage:
@echo "Cleaning coverage files..."
@rm -f coverage.out coverage.html

# Install test dependencies
test-deps:
@echo "Installing test dependencies..."
@go get github.com/stretchr/testify/assert
@go get github.com/stretchr/testify/mock
@go get github.com/DATA-DOG/go-sqlmock
@go install github.com/vektra/mockery/v2@latest

# Run all tests and show summary
test-summary: test-coverage
@echo "\n========== Test Summary =========="
@echo "Test files created:"
@find internal -name "*_test.go" | wc -l
@echo "\nSource files:"
@find internal -name "*.go" -not -name "*_test.go" | wc -l
@echo "\nCoverage by package:"
@go tool cover -func=coverage.out | grep -E "internal/(common|config|controller|entity|exception|helper|middleware|model|repository|service)" | awk '{print $$1, $$NF}' | sort -u
@echo "\nTotal Coverage:"
@go tool cover -func=coverage.out | grep total

# Help command
help:
@echo "Available make targets:"
@echo "  test                - Run all tests"
@echo "  test-verbose        - Run tests with verbose output"
@echo "  test-coverage       - Run tests with coverage report"
@echo "  test-coverage-html  - Generate HTML coverage report"
@echo "  test-unit           - Run unit tests only"
@echo "  test-repo           - Run repository tests"
@echo "  test-service        - Run service tests"
@echo "  test-controller     - Run controller tests"
@echo "  test-race           - Run tests with race detector"
@echo "  test-summary        - Run tests and show detailed summary"
@echo "  clean-coverage      - Remove coverage files"
@echo "  test-deps           - Install test dependencies"
