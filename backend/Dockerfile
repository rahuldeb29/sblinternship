FROM node:18

WORKDIR /app

# Copy only package files from backend
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
