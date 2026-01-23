#!/bin/bash

# Test Runware API with correct format
# Replace YOUR_API_KEY with actual key

curl --request POST \
  --url 'https://api.runware.ai/v1' \
  --header "Authorization: Bearer ${RUNWARE_API_KEY}" \
  --header "Content-Type: application/json" \
  --data-raw '[
  {
    "taskType": "imageInference",
    "taskUUID": "'$(uuidgen)'",
    "numberResults": 1,
    "outputFormat": "JPEG",
    "outputType": ["URL"],
    "includeCost": true,
    "model": "openai:4@1",
    "positivePrompt": "A professional home inspector checking an attic access ladder, photorealistic, 8k, highly detailed"
  }
]'
