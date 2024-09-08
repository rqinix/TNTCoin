import { Player } from "@minecraft/server";
import { EventActionManager } from "../../core/EventActionManager";
import { ActionForm, ModalForm } from "../../core/Form";
import { DEFAULT_GIFT, TIKTOK_GIFT } from "../../lang/tiktokGifts";
import { EventActionForm } from "../../core/EventActionForm";

export class GiftActionGui {
    private _player: Player;
    private _manager: EventActionManager<GiftAction>;
    private _eventActionForm: EventActionForm<GiftAction>;
    private _actionOptions: ActionType[] = ['Summon', 'Play Sound', 'Fill', 'Clear Blocks', 'Screen Title', 'Screen Subtitle'];

    constructor(player: Player, giftActionManager: EventActionManager<GiftAction>) {
        this._player = player;
        this._manager = giftActionManager;
        this._eventActionForm = new EventActionForm(player, giftActionManager);
    }

    public show(): void {
        const giftActions = this._manager.getAllActions();
        const form = new ActionForm(this._player, 'Gift Actions')

        form.body('§2§kii§r§fTotal Gift Actions: §d' + giftActions.size + '§2§kii§r\nThese Actions will be executed when someone sends you a gift.');

        giftActions.forEach((actions, eventKey) => {
            let giftName = '';
            let giftEmoji = '';

            actions.forEach((action) => {
                giftName = action.giftName;
                giftEmoji = action.giftEmoji;
            });

            form.button(`§2§kii§r§8${giftEmoji}${giftName}§2§kii§r\n§2Actions: [${actions.length}]`, () => {
                this.showGiftActions(eventKey, `Actions for ${giftEmoji}${giftName}`, actions);
            });
        });

        form.button('Create New Gift Action', this.createNewGiftAction.bind(this));
        form.show();
    }

    private createNewGiftAction(): void {
        const availableGifts = Object.keys(TIKTOK_GIFT).filter(giftName => TIKTOK_GIFT[giftName].id !== null && TIKTOK_GIFT[giftName].emoji !== '');
        const giftOptions = availableGifts.map(giftName => {
            const gift = TIKTOK_GIFT[giftName];
            const giftEmoji = gift.emoji || DEFAULT_GIFT;
            return `${giftEmoji} ${giftName}`;
        });

        new ModalForm(this._player, 'Create New Gift Action')
            .dropdown('Select Gift to Add Action', giftOptions, 5)
            .submitButton('Continue')
            .show(response => {
                const selectedGift = response[0] as number;

                const giftName = availableGifts[selectedGift];
                const gift = TIKTOK_GIFT[giftName];
                const giftId = gift.id;
                const giftEmoji = gift.emoji || DEFAULT_GIFT;

                this._eventActionForm.showCreateActionForm({
                    eventKey: giftId?.toString() || giftName,
                    giftName: giftName,
                    giftId: giftId,
                    giftEmoji: giftEmoji,
                }, this._actionOptions);
            });
    }

    private showGiftActions(eventKey: string, formTitle: string, giftActions: GiftAction[]): void {
        const form = new ActionForm(this._player, formTitle);
        form.body(`§2§kii§r§fTotal Actions: §d${giftActions.length}§2§kii§r\nThese Actions will be executed when someone sends you this gift.`);
        giftActions.forEach((action, index) => {
            let text: string = '';
            switch (action.actionType) {
                case 'Summon':
                    text += ` - ${action.summonOptions.entityName.toUpperCase()} x${action.summonOptions?.amount}`;
                    break;
                case 'Play Sound':
                    text += ` - ${action.playSound}`;
                    break;
            }
            form.button(`§2§kii§r§8${index + 1}. ${action.actionType}${text}§2§kii§r`, () => {
                this._eventActionForm.showActionInfo(action, index);
            });
        });
        form.button('Clear All Actions for this Gift', () => this._eventActionForm.showClearAllActionsFromEvent(eventKey)); 
        form.show();
    }
}