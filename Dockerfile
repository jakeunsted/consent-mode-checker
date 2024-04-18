# Description: Dockerfile for the Lambda function

# Use the official Node.js 16 image
FROM public.ecr.aws/lambda/nodejs:20

# Copy package.json
COPY package*.json ./

# Copy methods folder
COPY methods ./methods

# Install dependencies
RUN npm install

# Copy the Lambda function code
CMD [ "index.handler" ]

