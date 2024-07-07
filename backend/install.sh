#!/bin/bash
echo "==== START - Install ===="

echo "> RUN MIGRATION"
./migration.sh

echo "> GENERATE SWAGGER"
swag init

echo "==== Install End Successfully ===="