import fs from "node:fs";
import path from "node:path";

const MANIFEST = path.join(process.cwd(), "app", "agents", "TapTap_AI_Agents", "agents.manifest.json");
const API_URL = "http://localhost:3000/api/agents";

async function seedAgents() {
  if (!fs.existsSync(MANIFEST)) {
    console.error(`Missing manifest: ${MANIFEST}`);
    process.exit(1);
  }

  const agents = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  console.log(`Found ${agents.length} agents to seed...`);

  let success = 0;
  let failed = 0;

  for (const agent of agents) {
    try {
      console.log(`Seeding ${agent.name}...`);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agent),
      });

      if (response.ok) {
        console.log(`✅ ${agent.name} seeded successfully`);
        success++;
      } else {
        const error = await response.text();
        console.error(`❌ Failed to seed ${agent.name}: ${response.status} - ${error}`);
        failed++;
      }
    } catch (error) {
      console.error(`❌ Error seeding ${agent.name}:`, error.message);
      failed++;
    }
  }

  console.log(`\n✅ Seeded ${success} agents successfully`);
  if (failed > 0) {
    console.log(`❌ Failed to seed ${failed} agents`);
  }
}

seedAgents().catch(console.error);

