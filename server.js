exports.handler = async function(context, event, callback) {
    const twiml = new Twilio.twiml.VoiceResponse();

    const from = event.From || "";

    // 🚫 Blocked / spam patterns
    const spamPatterns = [
        /^000/,              // starts with 000
        /^123456/,           // fake sequence
        /^111/,              // repeated numbers
        /^999/,
        /^555/,              // often fake
        /^(\d)\1{6,}$/       // same digit repeated (e.g. 7777777)
    ];

    // ✅ Function to check spam
    function isSpam(number) {
        return spamPatterns.some(pattern => pattern.test(number));
    }

    // 🚨 If spam → reject call
    if (isSpam(from)) {
        console.log("Blocked spam call from:", from);

        twiml.reject(); // instantly hangs up
        return callback(null, twiml);
    }

    // ✅ Otherwise allow call
    console.log("Allowed call from:", from);

    twiml.say("Please wait while we connect your call.");
    twiml.dial(context.MY_PHONE_NUMBER); // your number

    return callback(null, twiml);
};