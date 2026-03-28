import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// apps/api/src/config -> up 4 = workspace root
config({ path: path.resolve(__dirname, "../../../../.env.local") });
