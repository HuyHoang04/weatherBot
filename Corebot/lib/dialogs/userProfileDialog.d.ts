import { StatePropertyAccessor, TurnContext, UserState } from 'botbuilder';
import { ComponentDialog } from 'botbuilder-dialogs';
import { WeatherService } from '../weather/weatherService';
export declare class UserProfileDialog extends ComponentDialog {
    private userProfile;
    private weatherService;
    private userProfileService;
    constructor(userState: UserState, weatherService: WeatherService);
    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    run(turnContext: TurnContext, accessor: StatePropertyAccessor): Promise<void>;
    private wellcome;
    private confirmCity;
    private changeDialog;
    private startLoop;
    private mainLoop;
}
