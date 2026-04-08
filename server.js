const axios = require("axios");
const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("CallShield backend is LIVE 🚀");
});

app.post("/api/calls/incoming", async (req, res) => {
  const from = req.body.From || "Unknown";

  try {
  const response = await axios.get(
    `http://apilayer.net/api/validate?access_key=f74827e20dae4f557a2de6b0e55caa63&number=${from}`
  );

  const data = response.data;

  if (!data.valid) {
    return res.send(`
      <Response>
        <Say>This call has been blocked.</Say>
        <Hangup/>
      </Response>
    `);
  }

  return res.send(`
    <Response>
      <Say>Connecting your call</Say>
      <Dial>+19018206993</Dial>
    </Response>
  `);

} catch (err) {
  console.error(err);

  return res.send(`
    <Response>
      <Say>Error occurred. Connecting call.</Say>
      <Dial>+19018206993</Dial>
    </Response>
  `);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});