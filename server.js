const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("CallShield backend is LIVE 🚀");
});

app.post("/api/calls/incoming", (req, res) => {
  const from = req.body.From || "Unknown";

  const spamNumbers = ["+1234567890"];

  if (spamNumbers.includes(from)) {
    return res.send(`
      <Response>
        <Reject/>
      </Response>
    `);
  }

  return res.send(`
    <Response>
      <Say>Call allowed</Say>
    </Response>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running");
});