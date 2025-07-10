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
const cron = __importStar(require("node-cron"));
// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const botbuilder_1 = require("botbuilder");
// This bot's main dialog.
const dialogBot_1 = require("./bots/dialogBot");
const userProfileDialog_1 = require("./dialogs/userProfileDialog");
const suggestion_1 = require("./suggestion/suggestion");
const weatherService_1 = require("./weather/weatherService");
const userProfileService_1 = require("./userProfile/userProfileService");
const restify_cors_middleware2_1 = __importDefault(require("restify-cors-middleware2"));
const sendDailySuggestion_1 = require("./utils/sendDailySuggestion");
const suggestionService_1 = require("./suggestion/suggestionService");
// Read environment variables from .env file
const ENV_FILE = path.join(__dirname, '..', '.env');
(0, dotenv_1.config)({ path: ENV_FILE });
// Debug: Check API key
console.log('API Key loaded:', process.env.OPENWEATHER_API_KEY ? `${process.env.OPENWEATHER_API_KEY.substring(0, 8)}...` : 'NOT FOUND');
const botFrameworkAuthentication = new botbuilder_1.ConfigurationBotFrameworkAuthentication(process.env);
// Create the adapter. See https://aka.ms/about-bot-adapter to learn more about using information from
// the .bot file when configuring your adapter.
const adapter = new botbuilder_1.CloudAdapter(botFrameworkAuthentication);
// Catch-all for errors.
adapter.onTurnError = (context, error) => __awaiter(void 0, void 0, void 0, function* () {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${error}`);
    // Send a trace activity, which will be displayed in Bot Framework Emulator
    yield context.sendTraceActivity('OnTurnError Trace', `${error}`, 'https://www.botframework.com/schemas/error', 'TurnError');
    // Send a message to the user
    yield context.sendActivity('The bot encounted an error or bug.');
    yield context.sendActivity('To continue to run this bot, please fix the bot source code.');
    // Clear out state
    yield conversationState.delete(context);
});
// Define the state store for your bot.
// See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state storage system to persist the dialog and user state between messages.
const memoryStorage = new botbuilder_1.MemoryStorage();
// Create conversation state with in-memory storage provider.
const conversationState = new botbuilder_1.ConversationState(memoryStorage);
const userState = new botbuilder_1.UserState(memoryStorage);
const suggestion = new suggestion_1.Suggestion();
const weatherService = new weatherService_1.WeatherService(suggestion);
const userProfileService = new userProfileService_1.UserProfileService();
// Create the main dialog.
const dialog = new userProfileDialog_1.UserProfileDialog(userState, weatherService);
const onTurnErrorHandler = (context, error) => __awaiter(void 0, void 0, void 0, function* () {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${error}`);
    // Send a trace activity, which will be displayed in Bot Framework Emulator
    yield context.sendTraceActivity('OnTurnError Trace', `${error}`, 'https://www.botframework.com/schemas/error', 'TurnError');
    // Send a message to the user
    yield context.sendActivity('The bot encountered an error or bug.');
    yield context.sendActivity('To continue to run this bot, please fix the bot source code.');
});
const conversationReferences = {};
const bot = new dialogBot_1.DialogBot(conversationState, userState, dialog, conversationReferences);
// Create HTTP server.
const server = restify.createServer();
const cors = (0, restify_cors_middleware2_1.default)({
    origins: ['http://127.0.0.1:5500'],
    allowHeaders: ['Authorization', 'Content-Type'],
    exposeHeaders: ['Authorization']
});
server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.bodyParser());
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
cron.schedule('* 9 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Running daily weather notification job...');
    yield (0, sendDailySuggestion_1.sendDailySuggestion)(weatherService, userProfileService, adapter, conversationReferences);
}), {
    timezone: "Asia/Ho_Chi_Minh"
});
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
const suggestionService = new suggestionService_1.SuggestionService();
server.post('/api/suggestions', (req, res, next) => {
    const suggestionId = req.body.id;
    const suggestionText = req.body.message;
    req.accepts('application/json');
    try {
        suggestionService.setSuggestion(suggestionId, suggestionText, suggestion);
    }
    catch (error) {
        console.error('Error setting suggestion:', error);
        res.send(400, { error: error.message });
        return next();
    }
    console.log(suggestion);
    res.send(200, { message: 'Suggestion updated successfully' });
    return next();
});
//# sourceMappingURL=index.js.map