import { Player } from "@minecraft/server";
import { EventActionManager } from "../../core/EventActionManager";
import { EventActionForm } from "../../core/EventActionForm";
import { ActionForm } from "../../core/Form";

export class MemberActionGui {
    private readonly _player: Player;
    private readonly _manager: EventActionManager<MemberAction>;
    private readonly _eventActionForm: EventActionForm<MemberAction>;
    private readonly _eventKey: string = 'member';
    private readonly _options: ActionType[] = ['Summon', 'Play Sound', 'Fill', 'Clear Blocks', 'Screen Title', 'Screen Subtitle'];

    constructor(player: Player, memberActionManager: EventActionManager<MemberAction>) {
        this._player = player;
        this._manager = memberActionManager;
        this._eventActionForm = new EventActionForm(player, memberActionManager);
    }

    public show(): void {
        this._eventActionForm.continueWithActions(this.createNewMemberAction.bind(this), (actions) => {
            const memberActions = actions.get(this._eventKey) || [];
            const form = new ActionForm(this._player, 'Member Actions');

            form.body(`§2§kii§r§fTotal Actions: §d${memberActions.length}§2§kii§r\nThese Actions will be executed when a new user join to your live.`);

            memberActions.forEach((action, index) => {
                form.button(`§2§kii§r§8${index + 1}. ${action.actionType}§2§kii§r`, () => {
                    this._eventActionForm.showActionInfo(action, index);
                });
            });

            form.button('Create New Member Action', () => {
                this._eventActionForm.showCreateActionForm({
                    eventKey: this._eventKey,
                }, this._options);
            });
            form.button('Clear All Member Actions', () => this._eventActionForm.showClearAllActionsFromEvent(this._eventKey));
            form.show();
        });
    }

    private createNewMemberAction(): void {
        new ActionForm(this._player, 'No Member Actions')
            .button('Create New Member Action', () => {
                this._eventActionForm.showCreateActionForm({
                    eventKey: this._eventKey,
                }, this._options);
            })
            .show();
    }
}