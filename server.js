const express = require("express");
const app = express();
const twilio = require("twilio");

app.use(express.urlencoded({ extended: true }));

// 🔹 STEP 1: Incoming call
app.all("/call", (req, res) => {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    let from = (req.body?.From || req.query?.From || "").replace("+", "").trim();

    console.log("Incoming call from:", from);

    // 🚫 Basic spam patterns
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

    // ❌ Block obvious spam
    if (!from || from.length < 10 || isSpam(from)) {
        twiml.say("This call has been blocked.");
        twiml.reject();
    } 
    else {
        // 🔊 Ask user to press 1
        const gather = twiml.gather({
            numDigits: 1,
            action: "/verify",
            method: "POST",
            timeout: 5
        });

        gather.say("To connect your call, please press 1.");

        // If no input
        twiml.say("No input received. Goodbye.");
        twiml.hangup();
    }

    res.type("text/xml");
    res.send(twiml.toString());
});

// 🔹 STEP 2: Handle key press
app.post("/verify", (req, res) => {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    const digit = req.body.Digits;

    console.log("User pressed:", digit);

    if (digit === "1") {
        twiml.say("Connecting your call.");
        twiml.dial("+16623490604"); // 👈 YOUR NUMBER HERE
    } else {
        twiml.say("Invalid input. Goodbye.");
        twiml.hangup();
    }

    res.type("text/xml");
    res.send(twiml.toString());
});

// 🔹 Health check
app.get("/", (req, res) => {
    res.send("CallShield backend is running ✅");
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});