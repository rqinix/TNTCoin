import { Player } from "@minecraft/server";
import { EventActionManager } from "../../core/EventActionManager";
import { EventActionForm } from "../../core/EventActionForm";
import { ActionForm } from "../../core/Form";

export class ShareActionGui {
    private readonly _player: Player;
    private readonly _eventActionForm: EventActionForm<ShareAction>;
    private readonly _eventKey: string = 'share';
    private readonly _options: ActionType[] = ['Summon', 'Play Sound', 'Fill', 'Clear Blocks', 'Screen Title', 'Screen Subtitle'];

    constructor(player: Player, shareActionManager: EventActionManager<ShareAction>) {
        this._player = player;
        this._eventActionForm = new EventActionForm(player, shareActionManager);
    }

    public show(): void {
        const shareActions = this._eventActionForm.actionManager.getAllActions().get(this._eventKey);
        const form = new ActionForm(this._player, 'Share Actions');

        form.body(`§2§kii§r§fTotal Actions: §d${shareActions.length}§2§kii§r\nThese Actions will be executed when someone shares your live.`);

        shareActions.forEach((action, index) => {
            form.button(`§2§kii§r§8${index + 1}. ${action.actionType}§2§kii§r`, () => {
                this._eventActionForm.showActionInfo(action, index);
            });
        });
        
        form.button('Create New Share Action', () => {
            this._eventActionForm.showCreateActionForm({
                eventKey: this._eventKey,
            }, this._options);
        });

        form.button('Clear All Share Actions', () => {
            this._eventActionForm.showClearAllActionsForm(this._eventActionForm.actionManager.getAllActions())
        });

        form.show();
    }
}