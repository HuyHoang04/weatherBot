"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogBot = void 0;
const botbuilder_1 = require("botbuilder");
class DialogBot extends botbuilder_1.ActivityHandler {
    /**
     *
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
     */
    constructor(conversationState, userState, dialog, conversationReferences) {
        super();
        if (!conversationState)
            throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState)
            throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog)
            throw new Error('[DialogBot]: Missing parameter. dialog is required');
        this.conversationReferences1 = conversationReferences;
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        //////////////
        this.dialogState = this.conversationState.createProperty('DialogState');
        this.onConversationUpdate((context, next) => __awaiter(this, void 0, void 0, function* () {
            addConversationReference(context.activity);
            yield next();
        }));
        this.onMessage((context, next) => __awaiter(this, void 0, void 0, function* () {
            //////////////
            addConversationReference(context.activity);
            console.log('Running dialog with Message Activity.');
            // Run the Dialog with the new message Activity.
            yield this.dialog.run(context, this.dialogState);
            yield next();
        }));
        this.onDialog((context, next) => __awaiter(this, void 0, void 0, function* () {
            // Save any state changes. The load happened during the execution of the Dialog.
            yield this.conversationState.saveChanges(context, false);
            yield this.userState.saveChanges(context, false);
            yield next();
        }));
        /////////////
        function addConversationReference(activity) {
            const conversationReference = botbuilder_1.TurnContext.getConversationReference(activity);
            console.log('Adding conversation reference:', conversationReference);
            conversationReferences[conversationReference.conversation.id] = conversationReference;
        }
        this.onMembersAdded((context, next) => __awaiter(this, void 0, void 0, function* () {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Send a greeting like "Hi" to start';
            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    yield context.sendActivity(botbuilder_1.MessageFactory.text(welcomeText, welcomeText));
                }
            }
            yield next();
        }));
    }
}
exports.DialogBot = DialogBot;
//# sourceMappingURL=dialogBot.js.map