// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { config } from 'dotenv';
import * as path from 'path';
import * as restify from 'restify';
import { INodeSocket } from 'botframework-streaming';
import * as cron from 'node-cron';

import {
    CloudAdapter,
    ConfigurationBotFrameworkAuthentication,
    ConfigurationBotFrameworkAuthenticationOptions,
    ConversationState,
    MemoryStorage,
    UserState
} from 'botbuilder';

import { DialogBot } from './bots/dialogBot';
import { UserProfileDialog } from './dialogs/userProfileDialog';
import { Suggestion } from './models/suggestion';
import { WeatherService } from './services/weatherService';
import { UserProfileService } from './services/userProfileService';
import corsMiddleware from 'restify-cors-middleware2';
import { sendDailySuggestion } from './utils/sendDailySuggestion';
import { SuggestionService } from './services/suggestionService';
import { UserActivity } from './models/userActivity';

const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

console.log('API Key loaded:', process.env.OPENWEATHER_API_KEY ? `${process.env.OPENWEATHER_API_KEY.substring(0, 8)}...` : 'NOT FOUND');

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(process.env as ConfigurationBotFrameworkAuthenticationOptions);

const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {

    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    await context.sendActivity('The bot encounted an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
    await conversationState.delete(context);
};

// A bot requires a state storage system to persist the dialog and user state between messages.
const memoryStorage = new MemoryStorage();

// Create conversation state with in-memory storage provider.
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

const suggestion = new Suggestion();
const suggestionService = new SuggestionService();
const weatherService = new WeatherService();
const userProfileService = new UserProfileService();

// Create the main dialog.
const dialog = new UserProfileDialog(userState, weatherService);

const onTurnErrorHandler = async (context, error) => {

    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};


const conversationReferences = {};
const bot = new DialogBot(conversationState, userState, dialog, conversationReferences);


const server = restify.createServer();
const cors = corsMiddleware({
  origins: ['http://127.0.0.1:5500', 'http://localhost:4200', 'http://127.0.0.1:4200', 'https://graph.facebook.com','https://developers.facebook.com/docs/graph-api/webhooks/getting-started/#mtls-for-webhooks'],
  allowHeaders: ['Authorization', 'Content-Type'],
  exposeHeaders: ['Authorization']
});
server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }.`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

server.on('upgrade', async (req, socket, head) => {
    // Create an adapter scoped to this WebSocket connection to allow storing session data.
    const streamingAdapter = new CloudAdapter(botFrameworkAuthentication);

    // Set onTurnError for the CloudAdapter created for each connection.
    streamingAdapter.onTurnError = onTurnErrorHandler;

    await streamingAdapter.process(req, socket as unknown as INodeSocket, head, (context) => bot.run(context));
});


// cron.schedule('* 14 * * *', async () => {
//     console.log('Running daily weather notification job...');
//     await sendDailySuggestion(weatherService, userProfileService, adapter, conversationReferences);
// }, {
//     timezone: "Asia/Ho_Chi_Minh"
// });


server.post('/api/messages', (req, res, next) => {
    adapter.process(req, res, async (context) => await bot.run(context));
});

server.get('/api/notify', async (req, res, next) => {
    try {
        await sendDailySuggestion(weatherService, userProfileService, adapter, conversationReferences);
        
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.write('<html><body><h1>Daily weather suggestions have been sent!</h1></body></html>');
        res.end();
    } catch (error) {
        console.error('Error in /api/notify:', error);
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(500);
        res.write('<html><body><h1>Error sending notifications</h1></body></html>');
        res.end();
    }
});

server.get('/api/suggestions', async (req, res, next) => {
    try {
        console.log('GET /api/suggestions called');
        const suggestions = await suggestionService.getAll();
        console.log('Retrieved suggestions from database:', suggestions);
        
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify(suggestions));
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to fetch suggestions' }));
    }
});

server.post('/api/suggestions', async (req, res, next) => {
    try {
        
        const suggestions: Suggestion[] = req.body;
        if (!Array.isArray(suggestions) || suggestions.length === 0) {
            console.log('Invalid suggestions data - not an array or empty');
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid suggestions data' }));
            return;
        }

        const result = await suggestionService.saveAll(suggestions);
        
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(201);
        res.end(JSON.stringify({ message: 'Suggestions saved successfully', result }));
    } catch (error) {
        console.error('Error saving suggestions:', error);
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to save suggestions'}));
    }
});


server.del('/api/suggestions/:temperature', async (req, res, next) => {
    try {
        const temperature = parseInt(req.params.temperature);;
        
        if (isNaN(temperature)) {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid temperature parameter' }));
            return;
        }

        const result = await suggestionService.deleteByTemperature(temperature);
        console.log(`Deleted suggestion for temperature ${temperature}:`, result);
        
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({ message: `Suggestion for ${temperature}°C deleted successfully` }));
    } catch (error) {
        console.error('Error deleting suggestion:', error);
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to delete suggestion' }));
    }
});


server.get("/messaging-webhook", (req, res, next) => {
  let mode = req.query["hub.mode"] ;
  let token = req.query["hub.verify_token"] ;
  let challenge = req.query["hub.challenge"] ;


  if (mode && token) {
    if (mode === "subscribe" && token === process.env.FACEBOOK_VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.writeHead(200);
      res.end(challenge);
    } else {
      console.log("Verification failed");
      res.writeHead(403);
      res.end();
    }
  } else {
    console.log("Missing parameters");
    res.writeHead(400);
    res.end();
  }
});

server.post("/messaging-webhook", async (req, res, next) => {
  try {
    console.log('Facebook message received:', req.body);
    const activity = new UserActivity;
    const messagingEvent = req.body.entry[0].messaging[0];

    activity.text = messagingEvent.message?.text || '';
    activity.type = 'message'; 
    activity.channelId = req.body.entry[0].id; 
    activity.locale = 'en-US'; 
    activity.attachments = [];
    activity.entities = []; 

    activity.from = {
        id: messagingEvent.sender.id,
        name: '', 
        role: 'user'
    };

    activity.recipient = {
        id: messagingEvent.recipient.id,
        name: '', 
        role: 'bot' 
    };

    activity.conversation = {
        id: messagingEvent.sender.id 
    };

    activity.timestamp = new Date(messagingEvent.timestamp).toISOString();
    activity.localTimestamp = new Date().toISOString(); 
    activity.localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone; 

    activity.channelData = {
        clientActivityID: messagingEvent.message?.mid || '' 
    };

    activity.id = `fb_message_${messagingEvent.message?.mid || Date.now()}`; 

    activity.serviceUrl = 'https://facebook.com'; 
    activity.activity = { id: activity.id }; 

    adapter.process(req, res, async (context) => await bot.run(context));
    
    res.writeHead(200);
  } catch (error) {
    console.error('Facebook webhook error:', error);
    res.writeHead(500);
  }
});


