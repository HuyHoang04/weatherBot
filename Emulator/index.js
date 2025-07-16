const express = require('express');
const axios = require('axios');
const app = express();
const dotenv = require('dotenv');
const EMULATOR_PORT = 50788;
const BOT_ENDPOINT = 'http://localhost:3978/api/messages';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
dotenv.config({override: true });


// function sendMess(message) {
//     const userActivity = {
//         channelData: {
//             clientActivityID: "17525481977707wmaq60o6bc"
//         },
//         text: message,
//         textFormat: "plain",
//         type: "message",
//         channelId: "emulator",
//         from: {
//             id: "64c38c0a-b18c-4047-a29c-0cbffac887f7",
//             name: "User",
//             role: "user"
//         },
//         locale: "en-US",
//         localTimestamp: new Date().toISOString(),
//         localTimezone: "Asia/Saigon",
//         attachments: [],
//         entities: [
//             {
//             requiresBotState: true,
//             supportsListening: true,
//             supportsTts: true,
//             type: "ClientCapabilities"
//             }
//         ],
//         conversation: {
//             id: "517eab00-6127-11f0-bcec-adeca403bd8c|livechat"
//         },
//         id: "5356c660-6127-11f0-bcec-adeca403bd8c",
//         recipient: {
//             id: "51784260-6127-11f0-9a0c-ab37b22e1701",
//             name: "Bot",
//             role: "bot"
//         },
//         timestamp: "2025-07-15T02:56:37.829Z",
//         serviceUrl: `http://localhost:${EMULATOR_PORT}`
//         };
//     axios.post(BOT_ENDPOINT, userActivity, {
//         headers: { 'Content-Type': 'application/json' },
//         timeout: 5000 
//     })
//     .then(response => {
//         console.log(` Message sent successfully: "${message}"`);
//     })
//     .catch(error => { console.error(' Error sending message to bot:', error.message);
//     });
// }

app.post('/send', (req, res) => {
    console.log('Received request body:', req.body);
    const message = req.body && req.body.message ? req.body.message : 'Hello';
    sendMess(message);
    res.status(200).send('Message sent to bot');
});


app.post('/v3/conversations/:conversationId/activities/:activityId', (req, res) => {
    try {
         console.log('Received bot reply:', req);
        const pageId = req.body.channelId;
        const message = req.body.text;
        const pageAccessToken  = process.env.PAGE_TOKEN;

        messengerHandler(pageId, pageAccessToken, pageAccessToken, message);
        res.status(200).send({ id: req.params.activityId }); 
    }catch (error) {
        console.error('Error handling bot reply:', error);
        res.status(500).send('Error handling bot reply');
    }
});


async function messengerHandler(pageId, pageAccessToken, psid, message) {
{
    axios.post(`https://graph.facebook.com/v23.0/${pageId}/messages?access_token=${pageAccessToken}`, {
        recipient: {
            id: psid
        },
        messaging_type: "RESPONSE",
        message: {
            text: message
        }
    })
}
}


// Start server
app.listen(EMULATOR_PORT, () => {
    console.log(`Server is running at http://localhost:${EMULATOR_PORT}`);
});

