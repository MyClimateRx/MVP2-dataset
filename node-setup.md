# Node.js Setup Guide for Environmental Data Map

## Prerequisites
- Node.js (LTS version 18.x or later)
- npm (comes with Node.js)
- A text editor or IDE of your choice

## Initial Setup

1. **Install Node.js**
   - Download from [nodejs.org](https://nodejs.org)
   - Choose the LTS (Long Term Support) version
   - Follow the installation wizard for your operating system
   - Verify installation:
   ```bash
   node --version
   npm --version
   ```

2. **Project Dependencies**
   Install the required packages:
   ```bash
   npm init -y
   npm install express node-fetch cors
   ```

3. **Project Structure**
   Create the following directory structure:
   ```
   project-root/
   ├── public/
   │   └── geoJsons/
   ├── package.json
   └── server.js
   ```

4. **Start the Server**
   ```bash
   node server.js
   ```
   The server should now be running at http://localhost:3000

## Common Issues and Solutions

### Port Already in Use
If port 3000 is already in use:
```bash
Error: listen EADDRINUSE: address already in use :::3000
```
Solution: Either:
- Kill the process using port 3000
- Change the port number in server.js

### Module Not Found
If you see:
```bash
Error: Cannot find module 'express'
```
Solution:
```bash
npm install
```

### Type Module Error
If you get ES module errors, ensure your package.json includes:
```json
{
  "type": "module"
}
```

## Development Tips
- Use `nodemon` for automatic server restarts during development:
  ```bash
  npm install nodemon --save-dev
  ```
  Then run:
  ```bash
  npx nodemon server.js
  ```

Need help? Check the error logs in your terminal or contact [your contact info].
