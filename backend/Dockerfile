FROM golang:1.20.2-alpine3.17 as builder

ARG GO_BUILD_COMMAND="go build -tags static_all"
# Install some build deps + ssh tools for the setup below.
RUN apk update && apk --no-cache add  build-base  git bash  coreutils openssh  openssl

# this command if you get source from bitbucket repos
# Create the directory where the application will reside
RUN mkdir -p /go/src/github.com/artamananda/tryout-sample

WORKDIR /go/src/github.com/artamananda/tryout-sample

COPY . .

# application builder step
RUN go mod tidy && go mod download && go mod vendor
RUN eval $GO_BUILD_COMMAND

FROM alpine:3.19

RUN apk --no-cache add ca-certificates bash jq curl tzdata

ENV BUILDDIR=/go/src/github.com/artamananda/tryout-sample
ENV PROJECT_DIR=/opt/tryout-sample
RUN mkdir -p $PROJECT_DIR/database/migration
# Set the working directory
WORKDIR $PROJECT_DIR

COPY --from=builder $BUILDDIR/tryout-sample tryout-sample
COPY --from=builder $BUILDDIR/.env $PROJECT_DIR/.env
COPY --from=builder $BUILDDIR/db/migrations $PROJECT_DIR/db/migrations/
COPY --from=builder $BUILDDIR/migration.sh $PROJECT_DIR/migration.sh

# Define the command to run the application
RUN ./migration.sh
CMD ["sh","-c","/opt/tryout-sample/tryout-sample"]