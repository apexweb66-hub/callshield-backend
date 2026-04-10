const express = require("express");
const app = express();
const twilio = require("twilio");

app.use(express.urlencoded({ extended: true }));

app.all("/call", (req, res) => {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    let from = (req.body?.From || req.query?.From || "").replace("+", "").trim();

    console.log("Incoming call from:", from);

    const spamPatterns = [
        /^000/,
        /^123456/,
        /^111/,
        /^999/,
        /^555/,
        /^(\d)\1{6,}$/
    ];

    function isSpam(number) {
        return spamPatterns.some(pattern => pattern.test(number));
    }

    if (!from || from.length < 10) {
        twiml.say("Invalid caller.");
        twiml.reject();
    }
    else if (isSpam(from)) {
        twiml.say("Spam call blocked.");
        twiml.reject();
    }
    else {
        twiml.say("Please wait while we connect your call.");
        twiml.dial(process.env.MY_PHONE_NUMBER);
    }

    res.type("text/xml");
    res.send(twiml.toString());
});

// health check
app.get("/", (req, res) => {
    res.send("CallShield backend is running ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});