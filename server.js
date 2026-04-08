const axios = require("axios");
const express = require("express");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("CallShield backend is LIVE 🚀");
});

// 📞 Incoming call handler
app.post("/api/calls/incoming", async (req, res) => {
  const from = req.body.From || "Unknown";

  try {
    const response = await axios.get(
      `http://apilayer.net/api/validate?access_key=f74827e20dae4f557a2de6b0e55caa63&number=${from}&carrier=1&line_type=1`
    );

    const data = response.data;

    console.log("Incoming number:", from);
    console.log("Line type:", data.line_type);
    console.log("Carrier:", data.carrier);

    // 🚨 STRONG SPAM FILTER
    if (
      !data.valid ||
      data.line_type === "voip" ||
      data.line_type === "fixed_line_or_voip" ||
      !data.carrier ||
      data.carrier === "Unknown"
    ) {
      return res.send(`
        <Response>
          <Say>This call has been blocked as spam.</Say>
          <Hangup/>
        </Response>
      `);
    }

    // 🔐 HUMAN CHECK (PRESS 1)
    return res.send(`
      <Response>
        <Say>Please press 1 to connect your call.</Say>
        <Gather numDigits="1" action="/api/verify-human" method="POST"/>
      </Response>
    `);

  } catch (err) {
    console.error("API Error:", err);

    return res.send(`
      <Response>
        <Say>Error occurred. Connecting call.</Say>
        <Dial>+19018206993</Dial>
      </Response>
    `);
  }
});

// 🔢 Verify human input
app.post("/api/verify-human", (req, res) => {
  const digit = req.body.Digits;

  if (digit === "1") {
    return res.send(`
      <Response>
        <Say>Connecting your call</Say>
        <Dial>+19018206993</Dial>
      </Response>
    `);
  }

  return res.send(`
    <Response>
      <Say>Invalid input. Goodbye.</Say>
      <Hangup/>
    </Response>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});