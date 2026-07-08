import fs from "fs";

let code = fs.readFileSync("server.ts", "utf8");

const inventoryEndpoint = `
  app.get("/api/inventory", async (req, res) => {
    try {
      const inventoryUrl = process.env.INVENTORY_SCRIPT_URL;
      if (!inventoryUrl) {
        throw new Error("INVENTORY_SCRIPT_URL environment variable is missing.");
      }
      
      const response = await fetch(inventoryUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch inventory from Google Script");
      }
      
      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      console.error("Inventory fetch error:", error);
      return res.status(500).json({ status: "error", message: error.message });
    }
  });
`;

code = code.replace('app.post("/api/chat"', inventoryEndpoint + '\n  app.post("/api/chat"');
fs.writeFileSync("server.ts", code);
