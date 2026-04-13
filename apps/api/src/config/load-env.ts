import path from "path";
import { config } from "dotenv";

// __dirname is available in CommonJS (NodeNext without "type":"module")
// apps/api/src/config -> up 4 = workspace root
config({ path: path.resolve(__dirname, "../../../../.env.local") });
