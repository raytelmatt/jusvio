#!/bin/bash

# Run Playwright test against production site www.jusivo.com
# This test creates a task under matter details

echo "Running Playwright test against www.jusivo.com..."
echo "Test: Create a Task in Matter Details"
echo ""

BASE_URL=https://www.jusivo.com npx playwright test tests/e2e-create-task.spec.ts --reporter=line

echo ""
echo "Test completed!"
