const express = require("express");
const cors = require("cors");
const app = express();
const twilio = require("twilio");

app.use(cors()); // ✅ FIXES YOUR DASHBOARD ISSUE
app.use(express.urlencoded({ extended: true }));

// 🧠 Memory storage
let callHistory = {};
let callLogs = [];

// 🔹 Incoming call
app.all("/call", (req, res) => {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    let from = (req.body?.From || req.query?.From || "").replace("+", "").trim();

    console.log("Incoming call:", from);

    // Save call
    callLogs.unshift({
        number: from,
        time: new Date().toLocaleTimeString(),
        status: "Checking"
    });

    // Track repeat calls
    callHistory[from] = (callHistory[from] || 0) + 1;

    // Spam patterns
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

    let score = 0;

    if (!from || from.length < 10) score += 50;
    if (isSpam(from)) score += 50;
    if (callHistory[from] > 3) score += 30;

    console.log("Spam score:", score);

    if (score >= 70) {
        callLogs[0].status = "Spam Blocked";

        twiml.say("This call has been blocked.");
        twiml.hangup();
    } 
    else {
        const gather = twiml.gather({
            numDigits: 1,
            action: "/press-check",
            method: "POST",
            timeout: 5
        });

        gather.say("To connect your call, please press 1.");

        twiml.say("No input received. Goodbye.");
        twiml.hangup();
    }

    res.type("text/xml");
    res.send(twiml.toString());
});

// 🔹 Press 1 check
app.post("/press-check", (req, res) => {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    const digit = req.body.Digits;
    let from = (req.body?.From || "").replace("+", "").trim();

    console.log("Pressed:", digit);

    const suspicious = (callHistory[from] || 0) > 2;

    if (digit === "1") {
        if (suspicious) {
            const gather = twiml.gather({
                input: "speech",
                action: "/voice-check",
                method: "POST",
                timeout: 5,
                speechTimeout: "auto"
            });

            gather.say("Please say your name to connect your call.");

            twiml.say("No response detected. Goodbye.");
            twiml.hangup();
        } else {
            callLogs[0].status = "Allowed";

            twiml.say("Connecting your call.");
            twiml.dial("+16623490604"); // 👈 YOUR NUMBER
        }
    } else {
        callLogs[0].status = "Failed Verification";

        twiml.say("Invalid input. Goodbye.");
        twiml.hangup();
    }

    res.type("text/xml");
    res.send(twiml.toString());
});

// 🔹 Voice check
app.post("/voice-check", (req, res) => {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    const speech = req.body.SpeechResult || "";
    const confidence = parseFloat(req.body.Confidence || 0);

    console.log("Speech:", speech);
    console.log("Confidence:", confidence);

    let score = 0;

    if (!speech) score += 70;
    if (speech.length < 2) score += 40;
    if (confidence < 0.3) score += 30;

    if (score >= 70) {
        callLogs[0].status = "Spam Blocked";

        twiml.say("We could not verify your response. Goodbye.");
        twiml.hangup();
    } else {
        callLogs[0].status = "Allowed";

        twiml.say("Thank you. Connecting your call.");
        twiml.dial("+16623490604"); // 👈 YOUR NUMBER
    }

    res.type("text/xml");
    res.send(twiml.toString());
});

// 📊 API for dashboard
app.get("/api/calls", (req, res) => {
    res.json(callLogs.slice(0, 20));
});

// 🟢 Optional homepage (so you don’t see “Cannot GET /” anymore)
app.get("/", (req, res) => {
    res.send("CallShield backend is running ✅");
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});