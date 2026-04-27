/**
 * Load backend/.env before the rest of the app so OPENAI_*, MONGO_*, etc. are available.
 * Must be the first `import` in server.js.
 */
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const dir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(dir, ".env") });
