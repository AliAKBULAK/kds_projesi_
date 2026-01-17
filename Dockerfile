FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose port
EXPOSE 3000

# Start command
# We use a script to wait for DB or specifically run setup if needed
# But simple start is enough, assuming DB is ready or app handles retry
CMD [ "npm", "start" ]
