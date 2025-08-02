import { Player } from "@minecraft/server";
import { EventActionManager } from "lib/Events/EventActionManager";
import { EventActionForm } from "app/forms/EventActionForm";
import ModalForm from "lib/Forms/ModalForm";
import ActionForm from "lib/Forms/ActionForm";
import { EventActionFormBase } from "./EventActionFormBase";
import { MemberAction } from "types";

export class MemberActionForm extends EventActionFormBase<MemberAction> {
    private readonly _eventKey: string = 'member';

    constructor(player: Player, memberActionManager: EventActionManager<MemberAction>) {
        super(player, new EventActionForm(player, memberActionManager));
    }

    public show(): void {
        const memberActions = this._eventActionForm.actionManager.getEvents().get(this._eventKey);
        const parentForm = this._parentForm;
        const form = new ActionForm(this._player, 'Member Actions');
        form.setParent(this._parentForm);
        if (memberActions) {
            form.body(`§2§kii§r§fTotal Actions: §d${memberActions?.length ?? 0}§2§kii§r\nExecuted when viewer join your live!`);
            memberActions.forEach((action, index) => {
                form.button(`§2§kii§r§8${index + 1}. ${action.actionType}§2§kii§r`, () => {
                    this._eventActionForm.showActionInfo(action, index, form);
                });
            });
        }
        form.button('§2Create New Member Action', () => {
            this._eventActionForm.showActionSelectionForm(
                { eventKey: this._eventKey }, 
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