import { Player } from "@minecraft/server";
import { EventActionManager } from "lib/Events/EventActionManager"; 
import ModalForm from "lib/Forms/ModalForm";
import ActionForm from "lib/Forms/ActionForm";
import { EventActionForm } from "app/forms/EventActionForm";
import { EventActionFormBase } from "./EventActionFormBase";
import { FollowAction } from "types";

export class FollowActionForm extends EventActionFormBase<FollowAction> {
    private readonly _eventKey: string = 'follow';

    constructor(player: Player, followActionManager: EventActionManager<FollowAction>) {
        super(player, new EventActionForm(player, followActionManager));
    }

    public show(): void {
        const followActions = this._eventActionForm.actionManager.getEvents().get(this._eventKey);
        const parentForm = this._parentForm;
        const form = new ActionForm(this._player, 'Follow Actions');
        form.setParent(this._parentForm);
        if (followActions) {
            form.body(`§2§kii§r§fTotal Actions: §d${followActions.length}§2§kii§r\nExecuted when viewer follows you!`);
            followActions.forEach((action, index) => {
                form.button(`§2§kii§r§8${index + 1}. ${action.actionType}§2§kii§r§r`, () => {
                    this._eventActionForm.showActionInfo(action, index, form);
                });
            });
        }
        form.button('§2Create New Follow Action', () => {
                this._eventActionForm.showActionSelectionForm(
                    { eventKey: this._eventKey, }, 
                    this._actionOptions,
                    form
                );
            })
            .button(
                '§cClear All', 
                this._eventActionForm.showConfirmationForm.bind(this._eventActionForm, this._eventKey, form)
            )
            .show(response => {
                response.canceled && parentForm && parentForm.show();
            });
    }
}