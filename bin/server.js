import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("\n  ✓ Starting Flowing AI Main...\n");

const { createApp } = await import("../server/index.js");
const app = createApp();
const port = process.env.PORT || 1337;

app.listen(port, "0.0.0.0", () => {
  console.log(`  ✓ Server ready at http://localhost:${port}\n`);
});
