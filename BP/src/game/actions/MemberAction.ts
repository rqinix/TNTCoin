import { Player } from "@minecraft/server";
import { EventActionManager } from "../../core/EventActionManager";
import { EventActionForm } from "../../core/EventActionForm";
import { ActionForm } from "../../core/Form";
import { EventActionFormBase } from "./EventActionFormBase";

export class MemberActionForm extends EventActionFormBase<MemberAction> {
    private readonly _eventKey: string = 'member';

    constructor(player: Player, memberActionManager: EventActionManager<MemberAction>) {
        super(player, new EventActionForm(player, memberActionManager));
    }

    public show(): void {
        const memberActions = this._eventActionForm.actionManager.getAllEvents().get(this._eventKey);
        const form = new ActionForm(this._player, 'Member Actions');

        if (memberActions) {
            form.body(`§2§kii§r§fTotal Actions: §d${memberActions?.length ?? 0}§2§kii§r\nExecuted when viewer join your live!`);

            memberActions.forEach((action, index) => {
                form.button(`§2§kii§r§8${index + 1}. ${action.actionType}§2§kii§r`, () => {
                    this._eventActionForm.showActionInfo(action, index);
                });
            });
        }

        form.button('Create New Member Action', () => {
            this._eventActionForm.showCreateActionForm({
                eventKey: this._eventKey,
            }, this._actionOptions);
        });

        form.button('Clear All Actions', () => {
            this._eventActionForm.showClearAllActionsFromEvent(this._eventKey)
        });

        form.show();
    }
}