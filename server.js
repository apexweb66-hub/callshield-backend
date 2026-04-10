const express = require("express");

const app = express();

// ✅ FIXED (no body-parser needed)
app.use(express.urlencoded({ extended: false }));

const FORWARD_NUMBER = "+16623490604";

// 📞 Incoming call
app.post("/incoming", (req, res) => {
  const from = req.body.From;

  console.log("Incoming call from:", from);

  const isHighRisk =
    !from ||
    from.length < 10 ||
    from.includes("0000");

  if (isHighRisk) {
    return res.send(`
      <Response>
        <Say>This call has been blocked.</Say>
        <Hangup/>
      </Response>
    `);
  }

  return res.send(`
    <Response>
      <Gather numDigits="1" action="/verify">
        <Say>Please press 1 to connect your call</Say>
      </Gather>
    </Response>
  `);
});

// 📲 Handle key press
app.post("/verify", (req, res) => {
  const digit = req.body.Digits;

  if (digit === "1") {
    return res.send(`
      <Response>
        <Say>Connecting your call</Say>
        <Dial>${FORWARD_NUMBER}</Dial>
      </Response>
    `);
  } else {
    return res.send(`
      <Response>
        <Say>Invalid input. Goodbye.</Say>
        <Hangup/>
      </Response>
    `);
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});