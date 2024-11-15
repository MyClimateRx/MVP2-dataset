// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Add the config endpoint
app.get("/config", (req, res) => {
	res.json({
		mapTilerKey: process.env.MAPTILER_API_KEY,
	});
});

// Rest of your existing endpoints...

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
