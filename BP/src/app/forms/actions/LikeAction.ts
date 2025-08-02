import { Player } from "@minecraft/server";
import { EventActionForm } from "app/forms/EventActionForm";
import ModalForm from "lib/Forms/ModalForm";
import ActionForm from "lib/Forms/ActionForm";
import { EventActionManager } from "lib/Events/EventActionManager";
import { EventActionFormBase } from "./EventActionFormBase";
import { LikeAction } from "types";

export class LikeActionForm extends EventActionFormBase<LikeAction> {

    constructor(player: Player, likeActionManager: EventActionManager<LikeAction>) {
        super(player, new EventActionForm(player, likeActionManager));
    }

    public show(): void {
        const likeEvents = this._eventActionForm.actionManager.getEvents();
        const parentForm = this._parentForm;
        const form = new ActionForm(this._player, 'Like Actions');
        form.setParent(this._parentForm);
        likeEvents.forEach((actions, eventKey) => {
            form.button(`§2§kii§r§4${eventKey}§8 Likes§2§kii§r\n§2Actions: [${actions.length}]`, () => {
                this.showLikeActionsForm(eventKey, `Actions for ${eventKey} Likes`, actions);
            });
        });
        form.button('§2Create New Like Action', this.showCreateNewActionForm.bind(this))
            .button(
                '§cClear All', 
                this._eventActionForm.showClearAllActionsForm.bind(this._eventActionForm, likeEvents, form)
            )
            .show(response => {
                response.canceled && parentForm && parentForm.show();
            });
    }

    private showCreateNewActionForm(): void {
        const form = this.createModalForm('Create New Like Action');
        form.textField('number', 'Enter the number of likes for action', 'number of likes', '100')
            .submitButton('Continue')
            .show((response, isCanceled) => {
                isCanceled && this.show();
                const amount = Math.max(1, parseInt(response[0] as string));
                this._eventActionForm.showActionSelectionForm(
                    { eventKey: amount.toString(), likeCount: amount, }, 
                    this._actionOptions,
                    form
                );
            });
    }

    private showLikeActionsForm(eventKey: string, formTitle: string, likeActions: LikeAction[]): void {
        const form = new ActionForm(this._player, formTitle)
            .body(`§2§kii§r§fTotal Actions: §d${likeActions.length}§2§kii§r\nExecuted when viewer sends §e${eventKey}§f likes!`);
        likeActions.forEach((action, index) => {
            let text: string = '';
            if (action.actionType === 'Summon') {
                text += ` - ${action.summonOptions.entityName.toUpperCase()} x${action.summonOptions?.amount}`;
            } else if (action.actionType === 'Play Sound') {
                text += ` - ${action.playSound}`;
            }
            form.button(`§2§kii§r§8${index + 1}. ${action.actionType}${text}§2§kii§r`, () => {
                this._eventActionForm.showActionInfo(action, index);
            });
        });
        form.button('§cClear All', this._eventActionForm.showConfirmationForm.bind(this._eventActionForm, eventKey))
            .show(response => {
                response.canceled && this.showCreateNewActionForm();
            });
    }
}