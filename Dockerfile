# Description: Dockerfile for the Lambda function

# Use the official Node.js 18 image
FROM public.ecr.aws/lambda/nodejs:18

# Copy package.json
COPY package*.json ./

# Copy methods folder
COPY methods ./methods

# Install dependencies
RUN npm install

# Copy the Lambda function code
CMD [ "index-for-aws.handler" ]

