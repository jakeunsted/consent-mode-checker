# Description: Dockerfile for the Lambda function

# Use the official Node.js 18 image
FROM public.ecr.aws/lambda/nodejs:18

# Copy package.json
COPY package*.json ./

# Copy methods folder
COPY src/methods ./src/methods

# Copy configs folder
COPY src/configs ./src/configs

# Copy the Lambda function code
COPY index.js ./

# Install dependencies
RUN npm install

# Environment variables
ENV RUN_IN_DOCKER=true

# Copy the Lambda function code
CMD [ "index.handler" ]

