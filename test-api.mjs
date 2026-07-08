import fetch from "node-fetch";

async function run() {
  const url = "http://localhost:3000/api/chat";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Hola, estoy buscando un SUV",
        inventory: [],
        history: []
      })
    });
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response:", JSON.stringify(json, null, 2));
  } catch (error) {
    console.error("Error calling chat API:", error);
  }
}
run();
