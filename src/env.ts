// Single entry point for loading .env.
// Wraps dotenv directly (instead of "dotenv/config") so we can pass quiet: true
// and keep the startup log clean — dotenv v17 prints an "injected env" banner
// on stdout by default, which pollutes the server logs.
// IMPORTANT: every file that needs process.env must import THIS module first.
import dotenv from "dotenv";

dotenv.config({ quiet: true });
