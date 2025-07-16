"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path = __importStar(require("path"));
const restify = __importStar(require("restify"));
const botbuilder_1 = require("botbuilder");
const dialogBot_1 = require("./bots/dialogBot");
const userProfileDialog_1 = require("./dialogs/userProfileDialog");
const suggestion_1 = require("./models/suggestion");
const weatherService_1 = require("./services/weatherService");
const userProfileService_1 = require("./services/userProfileService");
const restify_cors_middleware2_1 = __importDefault(require("restify-cors-middleware2"));
const sendDailySuggestion_1 = require("./utils/sendDailySuggestion");
const suggestionService_1 = require("./services/suggestionService");
const userActivity_1 = require("./models/userActivity");
const ENV_FILE = path.join(__dirname, '..', '.env');
(0, dotenv_1.config)({ path: ENV_FILE });
console.log('API Key loaded:', process.env.OPENWEATHER_API_KEY ? `${process.env.OPENWEATHER_API_KEY.substring(0, 8)}...` : 'NOT FOUND');
const botFrameworkAuthentication = new botbuilder_1.ConfigurationBotFrameworkAuthentication(process.env);
const adapter = new botbuilder_1.CloudAdapter(botFrameworkAuthentication);
// Catch-all for errors.
adapter.onTurnError = (context, error) => __awaiter(void 0, void 0, void 0, function* () {
    console.error(`\n [onTurnError] unhandled error: ${error}`);
    yield context.sendTraceActivity('OnTurnError Trace', `${error}`, 'https://www.botframework.com/schemas/error', 'TurnError');
    yield context.sendActivity('The bot encounted an error or bug.');
    yield context.sendActivity('To continue to run this bot, please fix the bot source code.');
    yield conversationState.delete(context);
});
// A bot requires a state storage system to persist the dialog and user state between messages.
const memoryStorage = new botbuilder_1.MemoryStorage();
// Create conversation state with in-memory storage provider.
const conversationState = new botbuilder_1.ConversationState(memoryStorage);
const userState = new botbuilder_1.UserState(memoryStorage);
const suggestion = new suggestion_1.Suggestion();
const suggestionService = new suggestionService_1.SuggestionService();
const weatherService = new weatherService_1.WeatherService();
const userProfileService = new userProfileService_1.UserProfileService();
// Create the main dialog.
const dialog = new userProfileDialog_1.UserProfileDialog(userState, weatherService);
const onTurnErrorHandler = (context, error) => __awaiter(void 0, void 0, void 0, function* () {
    console.error(`\n [onTurnError] unhandled error: ${error}`);
    yield context.sendTraceActivity('OnTurnError Trace', `${error}`, 'https://www.botframework.com/schemas/error', 'TurnError');
    yield context.sendActivity('The bot encountered an error or bug.');
    yield context.sendActivity('To continue to run this bot, please fix the bot source code.');
});
const conversationReferences = {};
const bot = new dialogBot_1.DialogBot(conversationState, userState, dialog, conversationReferences);
const server = restify.createServer();
const cors = (0, restify_cors_middleware2_1.default)({
    origins: ['http://127.0.0.1:5500', 'http://localhost:4200', 'http://127.0.0.1:4200', 'https://graph.facebook.com', 'https://developers.facebook.com/docs/graph-api/webhooks/getting-started/#mtls-for-webhooks'],
    allowHeaders: ['Authorization', 'Content-Type'],
    exposeHeaders: ['Authorization']
});
server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}.`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});
server.on('upgrade', (req, socket, head) => __awaiter(void 0, void 0, void 0, function* () {
    // Create an adapter scoped to this WebSocket connection to allow storing session data.
    const streamingAdapter = new botbuilder_1.CloudAdapter(botFrameworkAuthentication);
    // Set onTurnError for the CloudAdapter created for each connection.
    streamingAdapter.onTurnError = onTurnErrorHandler;
    yield streamingAdapter.process(req, socket, head, (context) => bot.run(context));
}));
// cron.schedule('* 14 * * *', async () => {
//     console.log('Running daily weather notification job...');
//     await sendDailySuggestion(weatherService, userProfileService, adapter, conversationReferences);
// }, {
//     timezone: "Asia/Ho_Chi_Minh"
// });
server.post('/api/messages', (req, res, next) => {
    adapter.process(req, res, (context) => __awaiter(void 0, void 0, void 0, function* () { return yield bot.run(context); }));
});
server.get('/api/notify', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, sendDailySuggestion_1.sendDailySuggestion)(weatherService, userProfileService, adapter, conversationReferences);
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.write('<html><body><h1>Daily weather suggestions have been sent!</h1></body></html>');
        res.end();
    }
    catch (error) {
        console.error('Error in /api/notify:', error);
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(500);
        res.write('<html><body><h1>Error sending notifications</h1></body></html>');
        res.end();
    }
}));
server.get('/api/suggestions', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('GET /api/suggestions called');
        const suggestions = yield suggestionService.getAll();
        console.log('Retrieved suggestions from database:', suggestions);
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify(suggestions));
    }
    catch (error) {
        console.error('Error fetching suggestions:', error);
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to fetch suggestions' }));
    }
}));
server.post('/api/suggestions', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const suggestions = req.body;
        if (!Array.isArray(suggestions) || suggestions.length === 0) {
            console.log('Invalid suggestions data - not an array or empty');
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid suggestions data' }));
            return;
        }
        const result = yield suggestionService.saveAll(suggestions);
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(201);
        res.end(JSON.stringify({ message: 'Suggestions saved successfully', result }));
    }
    catch (error) {
        console.error('Error saving suggestions:', error);
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to save suggestions' }));
    }
}));
server.del('/api/suggestions/:temperature', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const temperature = parseInt(req.params.temperature);
        ;
        if (isNaN(temperature)) {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid temperature parameter' }));
            return;
        }
        const result = yield suggestionService.deleteByTemperature(temperature);
        console.log(`Deleted suggestion for temperature ${temperature}:`, result);
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({ message: `Suggestion for ${temperature}°C deleted successfully` }));
    }
    catch (error) {
        console.error('Error deleting suggestion:', error);
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to delete suggestion' }));
    }
}));
server.get("/messaging-webhook", (req, res, next) => {
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];
    if (mode && token) {
        if (mode === "subscribe" && token === process.env.FACEBOOK_VERIFY_TOKEN) {
            console.log("WEBHOOK_VERIFIED");
            res.writeHead(200);
            res.end(challenge);
        }
        else {
            console.log("Verification failed");
            res.writeHead(403);
            res.end();
        }
    }
    else {
        console.log("Missing parameters");
        res.writeHead(400);
        res.end();
    }
});
server.post("/messaging-webhook", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        console.log('Facebook message received:', req.body);
        const activity = new userActivity_1.UserActivity;
        const messagingEvent = req.body.entry[0].messaging[0];
        activity.text = ((_a = messagingEvent.message) === null || _a === void 0 ? void 0 : _a.text) || '';
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
            clientActivityID: ((_b = messagingEvent.message) === null || _b === void 0 ? void 0 : _b.mid) || ''
        };
        activity.id = `fb_message_${((_c = messagingEvent.message) === null || _c === void 0 ? void 0 : _c.mid) || Date.now()}`;
        activity.serviceUrl = 'https://facebook.com';
        activity.activity = { id: activity.id };
        adapter.process(req, res, (context) => __awaiter(void 0, void 0, void 0, function* () { return yield bot.run(context); }));
        res.writeHead(200);
    }
    catch (error) {
        console.error('Facebook webhook error:', error);
        res.writeHead(500);
    }
}));
//# sourceMappingURL=index.js.map