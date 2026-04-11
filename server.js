const express = require("express");
const app = express();
const twilio = require("twilio");

app.use(express.urlencoded({ extended: true }));

let callHistory = {};

// 🔹 STEP 1: Incoming call
app.all("/call", (req, res) => {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    let from = (req.body?.From || req.query?.From || "").replace("+", "").trim();

    console.log("Incoming call:", from);

    // Track repeat callers
    callHistory[from] = (callHistory[from] || 0) + 1;

    // 🚫 Spam patterns
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

    // 🚫 HIGH RISK → block
    if (score >= 70) {
        twiml.say("This call has been blocked.");
        twiml.hangup();
    } 
    else {
        // ⌨️ Press 1 check (cheap filter)
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

// 🔹 STEP 2: Press 1 verification
app.post("/press-check", (req, res) => {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    const digit = req.body.Digits;
    let from = (req.body?.From || "").replace("+", "").trim();

    console.log("Pressed:", digit);

    // ⚠️ suspicious if repeat caller
    const suspicious = (callHistory[from] || 0) > 2;

    if (digit === "1") {
        if (suspicious) {
            // 🧠 Only suspicious calls go to AI check
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
            // ✅ Normal caller → connect immediately
            twiml.say("Connecting your call.");
            twiml.dial("+16623490604");
        }
    } else {
        twiml.say("Invalid input. Goodbye.");
        twiml.hangup();
    }

    res.type("text/xml");
    res.send(twiml.toString());
});

// 🔹 STEP 3: Voice AI check
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
        twiml.say("We could not verify your response. Goodbye.");
        twiml.hangup();
    } else {
        twiml.say("Thank you. Connecting your call.");
        twiml.dial("+16623490604");
    }

    res.type("text/xml");
    res.send(twiml.toString());
});

// 🔹 Health check
app.get("/", (req, res) => {
    res.send("CallShield Hybrid System Running 🚀");
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});