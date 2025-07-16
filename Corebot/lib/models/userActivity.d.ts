export declare class UserActivity {
    channelData: {
        clientActivityID: string;
    };
    text: string;
    textFormat: string;
    type: string;
    channelId: string;
    from: {
        id: string;
        name: string;
        role: string;
    };
    locale: string;
    localTimestamp: string;
    localTimezone: string;
    attachments: any[];
    entities: {
        requiresBotState: boolean;
        supportsListening: boolean;
        supportsTts: boolean;
        type: string;
    }[];
    conversation: {
        id: string;
    };
    id: string;
    recipient: {
        id: string;
        name: string;
        role: string;
    };
    timestamp: string;
    serviceUrl: string;
    activity: {
        id: any;
    };
}
