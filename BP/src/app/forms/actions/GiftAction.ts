import { Player } from "@minecraft/server";
import { EventActionManager } from "lib/Events/EventActionManager";
import ModalForm from "lib/Forms/ModalForm";
import ActionForm from "lib/Forms/ActionForm";
import { EventActionForm } from "app/forms/EventActionForm";
import { DEFAULT_GIFT, TIKTOK_GIFT } from "lang/tiktokGifts";
import { EventActionFormBase } from "./EventActionFormBase";

export class GiftActionForm extends EventActionFormBase<GiftAction> {

    constructor(player: Player, giftActionManager: EventActionManager<GiftAction>) {
        super(player, new EventActionForm(player, giftActionManager));
    }

    public show(): void {
        const giftEvents = this._eventActionForm.actionManager.getEvents();
        const form = new ActionForm(this._player, 'Gift Actions');
        form.setParent(this._parentForm);
        giftEvents.forEach((actions, eventKey) => {
            let giftName = '';
            let giftEmoji = '';
            actions.forEach((action) => {
                giftName = action.giftName;
                giftEmoji = action.giftEmoji; 
            });
            form.button(`§2§kii§r§8${giftEmoji}§e${giftName}§2§kii§r\n§2Actions: [${actions.length}]`, () => {
                this.showGiftActions(eventKey, giftEmoji, giftName, actions);
            });
        });
        form.button('§2Create New Gift Action', this.showCreateNewActionForm.bind(this))
            .button(
                '§cClear All', 
                this._eventActionForm.showClearAllActionsForm.bind(this._eventActionForm, giftEvents, form)
            )
            .show(response => {
                response.canceled && this._parentForm.show();
            });
    }

    private showCreateNewActionForm(): void {
        const availableGifts = Object.keys(TIKTOK_GIFT).filter(giftName => TIKTOK_GIFT[giftName].id !== null && TIKTOK_GIFT[giftName].emoji !== '');
        const giftOptions = availableGifts.map(giftName => {
            const gift = TIKTOK_GIFT[giftName];
            const giftEmoji = gift.emoji || DEFAULT_GIFT;
            return `${giftEmoji} ${giftName}`;
        });
        const form = this.createModalForm('Create New Gift Action');
        form.dropdown('Select Gift to Add Action', giftOptions, 5)
            .submitButton('Continue')
            .show((response, isCanceled) => {
                isCanceled && this.show();
                const selectedGift = response[0] as number;
                const giftName = availableGifts[selectedGift];
                const gift = TIKTOK_GIFT[giftName];
                const giftId = gift.id;
                const giftEmoji = gift.emoji || DEFAULT_GIFT;
                this._eventActionForm.showActionSelectionForm(
                    {
                        eventKey: giftId?.toString() || giftName,
                        giftName: giftName,
                        giftId: giftId,
                        giftEmoji: giftEmoji,
                    }, 
                    this._actionOptions,
                    form
                );
            });
    }    
    
    private showGiftActions(eventKey: string, giftEmoji: string, giftName: string, giftActions: GiftAction[]): void {
        const parentForm = this._parentForm;
        const form = new ActionForm(this._player, `Actions for ${giftEmoji}${giftName}`)
            .body(`§2§kii§r§fTotal Actions: §d${giftActions.length}§2§kii§r\nExecuted when viewer sends a §e${giftEmoji}${giftName}§f gift.`);
        form.setParent(parentForm);
        giftActions.forEach((action, index) => {
            let text: string = '';
            if (action.actionType === 'Summon') {
                text += ` - ${action.summonOptions.entityName.toUpperCase()} x${action.summonOptions?.amount}`;
            } else if (action.actionType === 'Play Sound') {
                text += ` - ${action.playSound}`;
            }
            form.button(`§2§kii§r§8${index + 1}. ${action.actionType}${text}§2§kii§r`, () => {
                this._eventActionForm.showActionInfo(action, index, form);
            });
        });
        form.button(
            '§cClear All Actions', 
            this._eventActionForm.showConfirmationForm.bind(this._eventActionForm, eventKey, form))
            .show(response => {
                response.canceled && parentForm && parentForm.show();
            }
        );
    }
}