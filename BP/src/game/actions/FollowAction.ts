import { Player } from "@minecraft/server";
import { EventActionManager } from "../../core/EventActionManager"; 
import { ActionForm, ModalForm } from "../../core/Form";
import { EventActionForm } from "../../core/EventActionForm";

export class FollowActionGui {
    private readonly _player: Player;
    private readonly _eventActionForm: EventActionForm<FollowAction>;
    private readonly _manager: EventActionManager<FollowAction>;
    private readonly _eventKey: string = 'follow';
    private readonly _options: ActionType[] = ['Summon', 'Play Sound', 'Fill', 'Clear Blocks', 'Screen Title', 'Screen Subtitle'];

    constructor(player: Player, followActionManager: EventActionManager<FollowAction>) {
        this._player = player;
        this._eventActionForm = new EventActionForm(player, followActionManager);
        this._manager = followActionManager;
    }

    public show(): void {
        this._eventActionForm.continueWithActions(this.createNewFollowAction.bind(this), (actions) => {
            const followActions = actions.get(this._eventKey) || [];
            const form = new ActionForm(this._player, 'Follow Actions');

            form.body(`§2§kii§r§fTotal Actions: §d${followActions.length}§2§kii§r\nThese Actions will be executed when someone follows you.`);

            followActions.forEach((action, index) => {
                form.button(`§2§kii§r§8${index + 1}. ${action.actionType}§2§kii§r§r`, () => {
                    this._eventActionForm.showActionInfo(action, index);
                });
            });

            form.button('Create New Follow Action', () => {
                this._eventActionForm.showCreateActionForm({
                    eventKey: this._eventKey,
                }, this._options);
            });
            form.button('Clear All Follow Actions', () => this._eventActionForm.showClearAllActionsFromEvent(this._eventKey));
            form.show();
        });
    }

    private createNewFollowAction(): void {
        new ActionForm(this._player, 'No Follow Actions')
            .button('Create New Follow Action', () => {
                this._eventActionForm.showCreateActionForm({
                    eventKey: this._eventKey,
                }, this._options);
            })
            .show();
    }
}