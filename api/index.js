const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const cors = require('cors');

const app = express();
app.use(express.json());

const phonepeBaseURL = "https://api.phonepe.com/v3/transaction";
const merchantID = "M110NES2UDXSUAT";
const merchantKey = "<your_merchant_key>";
const saltKey = "5afb2d8c-5572-47cf-a5a0-93bb79647ffa";

// Function to generate checksum
function generateChecksum(requestPayload) {
    const checksumString = `${btoa(requestPayload)}/pg/v1/pay${saltKey}`;
    const checksum = crypto.createHash("sha256").update(checksumString).digest("hex");
    return checksum;
}

// enabling CORS for any unknown origin(https://xyz.example.com)
app.use(cors());

app.get("/", async (req, res) => {
    res.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>PhonePe Payment Gateway</title>
            </head>
            <body>
                <h1>Welcome tp PhonePe Payment Gateway node app</h1>
            </body>
        </html> 
    `);
    res.send();
});

// Payment initiation API
app.post("/initiate", async (req, res) => {
    try {
        const { amount, orderId, callbackUrl } = req.body;

        // const requestBody = {
        //     merchantId: merchantID,
        //     transactionId: orderId,
        //     amount: amount * 100,  // Convert to paise
        //     merchantOrderId: orderId,
        //     callbackUrl: callbackUrl,
        // };

        const requestBody = {
            "merchantId": merchantID,
            "merchantTransactionId": orderId,
            "merchantUserId": "MUID123",
            "amount": amount * 100,
            "redirectUrl": callbackUrl,
            "redirectMode": "REDIRECT",
            "callbackUrl": callbackUrl,
            "paymentInstrument": {
              "type": "PAY_PAGE"
            }
          }

        const checksum = generateChecksum(JSON.stringify(requestBody));

        const headers = {
            "Content-Type": "application/json",
            "X-VERIFY": checksum + "###" + 1,
        };

        const response = await axios.post(`https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay`, {request: btoa(JSON.stringify(requestBody))}, {
            headers: headers,
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).send("Error initiating payment" + JSON.stringify(error));
    }
});

// Payment status check
app.post("/status", async (req, res) => {
    try {
        const { orderId } = req.body;

        const requestBody = {
            merchantId: merchantID,
            transactionId: orderId,
        };

        const checksum = generateChecksum(JSON.stringify(requestBody));

        const headers = {
            "Content-Type": "application/json",
            "X-VERIFY": checksum + "###" + saltKey,
        };

        const response = await axios.post(`${phonepeBaseURL}/status`, requestBody, {
            headers: headers,
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).send("Error fetching payment status");
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});