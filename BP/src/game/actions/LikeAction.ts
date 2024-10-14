import { Player } from "@minecraft/server";
import { EventActionForm } from "../../core/EventActionForm";
import { ActionForm, ModalForm } from "../../core/Form";
import { EventActionManager } from "../../core/EventActionManager";
import { EventActionFormBase } from "./EventActionFormBase";

export class LikeActionForm extends EventActionFormBase<LikeAction> {

    constructor(player: Player, likeActionManager: EventActionManager<LikeAction>) {
        super(player, new EventActionForm(player, likeActionManager));
    }

    public show(): void {
        const likeEvents = this._eventActionForm.actionManager.getAllEvents();
        const form = new ActionForm(this._player, 'Like Actions');

        likeEvents.forEach((actions, eventKey) => {
            form.button(`§2§kii§r§4${eventKey}§8 Likes§2§kii§r\n§2Actions: [${actions.length}]`, () => {
                this.showLikeActionsForm(eventKey, `Actions for ${eventKey} Likes`, actions);
            });
        });
        form.button('Create New Like Action', () => this.showCreateNewActionForm());
        form.button('Clear All Actions', () => this._eventActionForm.showClearAllActionsForm(likeEvents));

        form.show();
    }

    private showCreateNewActionForm(): void {
        new ModalForm(this._player, 'Create New Like Action')
            .textField('number', 'Enter the number of likes for action', '', '100')
            .submitButton('Continue')
            .show(response => {
                const amount = Math.max(1, parseInt(response[0] as string));
                this._eventActionForm.showCreateActionForm({
                    eventKey: amount.toString(),
                    likeCount: amount,
                }, this._actionOptions);
            });
    }

    private showLikeActionsForm(eventKey: string, formTitle: string, likeActions: LikeAction[]): void {
        const form = new ActionForm(this._player, formTitle);

        form.body(`§2§kii§r§fTotal Actions: §d${likeActions.length}§2§kii§r\nExecuted when viewer sends §e${eventKey}§f likes!`);

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

        form.button('Clear All Actions', () => {
            this._eventActionForm.showClearAllActionsFromEvent(eventKey);
        }); 

        form.show();
    }
}