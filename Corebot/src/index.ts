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
import { Suggestion } from './suggestion/suggestion';
import { WeatherService } from './weather/weatherService';
import { UserProfileService } from './userProfile/userProfileService';
import corsMiddleware from 'restify-cors-middleware2';
import { sendDailySuggestion } from './utils/sendDailySuggestion';
import { SuggestionService } from './suggestion/suggestionService';

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
  origins: ['http://127.0.0.1:5500', 'http://localhost:4200', 'http://127.0.0.1:4200'],
  allowHeaders: ['Authorization', 'Content-Type'],
  exposeHeaders: ['Authorization']
});
server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.bodyParser());


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


cron.schedule('* 14 * * *', async () => {
    console.log('Running daily weather notification job...');
    await sendDailySuggestion(weatherService, userProfileService, adapter, conversationReferences);
}, {
    timezone: "Asia/Ho_Chi_Minh"
});


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
        console.log('POST /api/suggestions received data:', req.body);
        
        const suggestions: Suggestion[] = req.body;
        if (!Array.isArray(suggestions) || suggestions.length === 0) {
            console.log('Invalid suggestions data - not an array or empty');
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid suggestions data' }));
            return;
        }

        console.log('Valid suggestions data, calling saveAll...');
        const result = await suggestionService.saveAll(suggestions);
        console.log('SaveAll completed with result:', result);
        
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(201);
        res.end(JSON.stringify({ message: 'Suggestions saved successfully', result }));
    } catch (error) {
        console.error('Error saving suggestions:', error);
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to save suggestions', details: error.message }));
    }
});

// Test endpoint để tạo dữ liệu mẫu
server.post('/api/suggestions/test', async (req, res, next) => {
    try {
        console.log('Creating test data...');
        
        const testSuggestions = [
            {
                id: 'test_35',
                temperature: 35,
                items: ['Áo thun cotton', 'Quần short', 'Dép xăng đan']
            },
            {
                id: 'test_30', 
                temperature: 30,
                items: ['Áo sơ mi', 'Quần jeans', 'Giày sneaker']
            }
        ];

        const result = await suggestionService.saveAll(testSuggestions);
        console.log('Test data created:', result);
        
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(201);
        res.end(JSON.stringify({ message: 'Test data created', result }));
    } catch (error) {
        console.error('Error creating test data:', error);
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(500);
        res.end(JSON.stringify({ error: error.message }));
    }
});

// DELETE endpoint để xóa suggestion theo temperature
server.del('/api/suggestions/:temperature', async (req, res, next) => {
    try {
        const temperature = parseInt(req.params.temperature);
        console.log(`DELETE /api/suggestions/${temperature} called`);
        
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
        res.end(JSON.stringify({ error: 'Failed to delete suggestion', details: error.message }));
    }
});


