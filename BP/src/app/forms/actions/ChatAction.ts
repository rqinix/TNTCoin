import { Player } from "@minecraft/server";
import { EventActionForm } from "app/forms/EventActionForm";
import ActionForm from "lib/Forms/ActionForm";
import { EventActionManager } from "lib/Events/EventActionManager";
import { EventActionFormBase } from "./EventActionFormBase";
import { ChatAction } from "types";

export class ChatActionForm extends EventActionFormBase<ChatAction> {

    constructor(player: Player, chatActionManager: EventActionManager<ChatAction>) {
        super(player, new EventActionForm(player, chatActionManager));
    }

    public show(): void {
        const chatEvents = this._eventActionForm.actionManager.getEvents();
        const parentForm = this._parentForm;
        const form = new ActionForm(this._player, 'Chat Actions');
        form.setParent(this._parentForm);
        chatEvents.forEach((actions, eventKey) => {
            form.button(`§2§kii§r§e${eventKey} Chat§2§kii§r\n§2Actions: [${actions.length}]`, () => {
                this.showChatActionsForm(eventKey, `Actions for ${eventKey} Chat`, actions);
            });
        });
        form.button('§2Create New Chat Action', this.showCreateNewActionForm.bind(this))
            .button('§cClear All', this._eventActionForm.showClearAllActionsForm.bind(this._eventActionForm, chatEvents, form))
            .show(response => {
                response.canceled && parentForm && parentForm.show();
            });
    }
    
    private showCreateNewActionForm(): void {
        const form = this.createModalForm('Create New Chat Action');
        form.textField('string', 'Enter the chat for action', 'chat', 'hello')
            .submitButton('Continue')
            .show((response, isCanceled) => {
                isCanceled && this.show();
                const chat = response[0] as string;
                this._eventActionForm.showActionSelectionForm(
                    { eventKey: chat, chat }, 
                    this._actionOptions,
                    form
                );
            });
    }

    private showChatActionsForm(eventKey: string, formTitle: string, chatActions: ChatAction[]): void {
        const form = new ActionForm(this._player, formTitle)
            .body(`§2§kii§r§fTotal Actions: §d${chatActions.length}§2§kii§r\nExecuted when viewer sends the chat: §e${eventKey}§f.`);
        chatActions.forEach((action, index) => {
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
        form.button(
            '§cClear All Actions', 
            this._eventActionForm.showConfirmationForm.bind(this._eventActionForm, eventKey, form)
        )
            .show(response => {
                response.canceled && this.showCreateNewActionForm();
            });
    }
}
