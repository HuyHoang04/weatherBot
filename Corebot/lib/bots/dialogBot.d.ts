import { ActivityHandler, BotState } from 'botbuilder';
import { Dialog } from 'botbuilder-dialogs';
export declare class DialogBot extends ActivityHandler {
    conversationReferences1: any;
    private conversationState;
    private userState;
    private dialog;
    private dialogState;
    /**
     *
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
     */
    constructor(conversationState: BotState, userState: BotState, dialog: Dialog, conversationReferences: any);
}
