import { Player } from "@minecraft/server";
import { EventActionManager } from "lib/Events/EventActionManager";
import { EventActionForm } from "app/forms/EventActionForm";
import ModalForm from "lib/Forms/ModalForm";
import ActionForm from "lib/Forms/ActionForm";
import { EventActionFormBase } from "./EventActionFormBase";
import { ShareAction } from "types";

export class ShareActionForm extends EventActionFormBase<ShareAction> {
    private readonly _eventKey: string = 'share';

    constructor(player: Player, shareActionManager: EventActionManager<ShareAction>) {
        super(player, new EventActionForm(player, shareActionManager));
    }

    public show(): void {
        const shareActions = this._eventActionForm.actionManager.getEvents().get(this._eventKey);
        const parentForm = this._parentForm;
        const form = new ActionForm(this._player, 'Share Actions');
        form.setParent(this._parentForm);
        if (shareActions) {
            form.body(`§2§kii§r§fTotal Actions: §d${shareActions?.length ?? 0}§2§kii§r\nExecuted when viewer shares your live!`);
            shareActions.forEach((action, index) => {
                form.button(`§2§kii§r§8${index + 1}. ${action.actionType}§2§kii§r`, () => {
                    this._eventActionForm.showActionInfo(action, index, form);
                });
            });
        }
        form.button('§2Create New Share Action', () => {
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