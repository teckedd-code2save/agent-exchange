import path from "path";
import { config } from "dotenv";

// Load from workspace root .env.local — works regardless of cwd
config({ path: path.resolve(__dirname, "../../../../.env.local") });
