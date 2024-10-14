import { Player } from "@minecraft/server";
import { EventActionForm } from "../../core/EventActionForm";
import { ActionForm, ModalForm } from "../../core/Form";
import { EventActionManager } from "../../core/EventActionManager";
import { EventActionFormBase } from "./EventActionFormBase";

export class ChatActionForm extends EventActionFormBase<ChatAction> {

    constructor(player: Player, chatActionManager: EventActionManager<ChatAction>) {
        super(player, new EventActionForm(player, chatActionManager));
    }

    public show(): void {
        const chatEvents = this._eventActionForm.actionManager.getAllEvents();
        const form = new ActionForm(this._player, 'Chat Actions');

        chatEvents.forEach((actions, eventKey) => {
            form.button(`§2§kii§r§e${eventKey} §8Chat§2§kii§r\n§2Actions: [${actions.length}]`, () => {
                this.showChatActionsForm(eventKey, `Actions for ${eventKey} Chat`, actions);
            });
        });
        form.button('Create New Chat Action', () => this.showCreateNewActionForm());
        form.button('Clear All Actions', () => this._eventActionForm.showClearAllActionsForm(chatEvents));
        form.show();
    }

    private showCreateNewActionForm(): void {
        new ModalForm(this._player, 'Create New Chat Action')
            .textField('string', 'Enter the chat for action', 'chat', 'hello')
            .submitButton('Continue')
            .show(response => {
                const chat = response[0] as string;
                this._eventActionForm.showCreateActionForm({
                    eventKey: chat,
                    chat
                }, this._actionOptions);
            });
    }

    private showChatActionsForm(eventKey: string, formTitle: string, chatActions: ChatAction[]): void {
        const form = new ActionForm(this._player, formTitle);

        form.body(`§2§kii§r§fTotal Actions: §d${chatActions.length}§2§kii§r\nExecuted when viewer sends the chat: §e${eventKey}§f.`);
        
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

        form.button('Clear All Actions', () => {
            this._eventActionForm.showClearAllActionsFromEvent(eventKey);
        }); 

        form.show();
    }
}
