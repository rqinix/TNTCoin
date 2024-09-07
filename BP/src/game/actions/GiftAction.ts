import { Player } from "@minecraft/server";
import { EventActionManager } from "../../core/EventActionManager";
import { ActionForm, ModalForm } from "../../core/Form";
import { DEFAULT_GIFT, TIKTOK_GIFT } from "../../lang/tiktokGifts";

export class GiftActionManager {
    private _manager: EventActionManager<GiftAction>;

    /**
     * Creates an instance of the GiftActionManager.
     */
    constructor(player: Player) {
        this._manager = new EventActionManager<GiftAction>(player);
    }

    /**
     * Adds an action to a gift.
     * @param action The action to add.
     */
    public addActionToGift(action: GiftAction): void {
        this._manager.addActionToEvent(action);
    }

    /**
     * Removes all actions from a gift.
     * @param {string} giftKey The key of the gift.
     */
    public removeAllActionsFromGift(giftKey: string): void {
        this._manager.removeAllActionsFromEvent(giftKey);
    }

    /**
     * Removes a specific action from a gift.
     * @param {string} giftKey The key of the gift.
     * @param {number} index The index of the action to remove.
     */
    public removeActionFromGift(giftKey: string, index: number): void {
        this._manager.removeActionFromEvent(giftKey, index);
    }

    /**
     * Updates a specific action in a gift.
     * @param {string} giftKey The key of the gift.
     * @param {number} index The index of the action to update.
     */
    public updateGiftAction(giftKey: string, index: number, updatedAction: Partial<GiftAction>): void {
        this._manager.updateActionInEvent(giftKey, index, updatedAction);
    }

    /**
     * Clears all actions for a gift.
     * @param {string} giftKey The key of the gift.
     */
    public clearActionsForGift(giftKey: string): void {
        this._manager.clearActionsForEvent(giftKey);
    }

    /**
     * Clears all actions.
     */
    public clearAllActions(): void {
        this._manager.clearAllEventActions();
    }

    /**
     * Gets all actions for a gift.
     * @param {string} giftKey The key of the gift.
     * @returns The actions for the gift.
     */
    public getActionsForGift(giftKey: string): GiftAction[] {
        console.warn(`Getting actions for Gift Key: ${giftKey}`);
        return this._manager.getActionsForEvent(giftKey);
    }

    /**
     * Gets all actions for all gifts.
     * @returns All actions for all gifts.
     */
    public getAllGiftActions(): Map<string, GiftAction[]> {
        return this._manager.getAllActions();
    }
}

export class GiftActionGui {
    private _player: Player;
    private _manager: GiftActionManager;

    constructor(player: Player, manager: GiftActionManager) {
        this._player = player;
        this._manager = manager;
    }

    /**
     * Shows the gift actions menu to the player.
     */
    public showGiftActionsMenu(): void {
        const giftActions = this._manager.getAllGiftActions();
        new ActionForm(this._player, 'Gift Actions')
            .button(`My Gift Actions: ${giftActions.size}`, this.showMyGiftActions.bind(this))
            .button('Clear All Actions', this._manager.clearAllActions.bind(this._manager))
            .show();
    }

    /**
     * Shows the player's gift actions.
     */
    private showMyGiftActions(): void {
        this.checkIfNoActionsAndProceed(() => {
            const form = new ActionForm(this._player, 'My Gift Actions');

            let giftName: string = '';
            let giftEmoji: string = '';

            this._manager.getAllGiftActions().forEach((actions, eventKey) => {
                actions.forEach(action => {
                    giftName = action.giftName;
                    giftEmoji = action.giftEmoji;
                });
                form.button(`${giftEmoji}${giftName}\n§9§kii§r§2Actions: §5${actions.length}§r§9§kii§r`, () => {
                    this.showActionsForGift(eventKey, `${giftEmoji}${giftName}`, actions);
                });
            });

            form.button('Create Gift Action', this.showCreateActionForm.bind(this));
            form.button('Delete Action', this.showDeleteActionForm.bind(this));

            form.show();
        });
    }

    private showActionsForGift(eventKey: string, giftName: string, actions: GiftAction[]): void {
        const form = new ActionForm(this._player, `Actions for ${giftName}`);

        actions.forEach((action, index) => {
            const { actionType, summonOptions } = action;

            let buttonTitle = `§2${index + 1}§8. §5${actionType}§r`;

            switch (actionType) {
                case 'Summon':
                    buttonTitle += ` §8-§r §9${summonOptions?.entityName.toUpperCase()}§r`;
                    break;
                case 'Play Sound':
                    buttonTitle += ` §8-§r §9${action.playSound}§r`;
                    break;
            }

            form.button(buttonTitle, () => this.showActionInfo(action, index));
        });

        form.button('Clear Actions', () => this._manager.clearActionsForGift(eventKey));
        form.show();
    }

    private showActionInfo(action: GiftAction, index: number): void {
        const { eventKey, giftName, giftId, giftEmoji, actionType, playSound, summonOptions } = action;

        let formTitle = `${giftEmoji}${giftName}: Action ${index + 1}`;
        let formBody = '';

        formBody += (giftId ? `Gift ID: ${giftId}\n` : 'Gift ID: Not available\n');
        formBody += `Action Type: ${actionType}\n`;
        formBody += `Play Sound: ${playSound ?? 'Not set'}\n`;
        if (summonOptions) {
            formBody += `Entity Name: ${summonOptions.entityName}\n`;
            formBody += `Amount: ${summonOptions.amount}\n`;
            formBody += `Location Type: ${summonOptions.locationType}\n`;
            formBody += `On Top: ${summonOptions.onTop ? 'Yes' : 'No'}\n`;
            formBody += `Batch Size: ${summonOptions.batchSize}\n`;
            formBody += `Batch Delay: ${summonOptions.batchDelay}\n`;
        }
    
        const form = new ActionForm(this._player, formTitle);
        form.body(formBody);
        form.button('Edit Action', () => this.showActionTypeForm(action, true, index));
        form.button('Delete Action', () => {
            this._manager.removeActionFromGift(eventKey, index);
            this._player.sendMessage(`§aAction ${index + 1} for ${giftName} deleted.`);
        });
        form.show();
    }

    private showCreateActionForm(): void {
        const availableGifts = Object.keys(TIKTOK_GIFT).filter(giftName => TIKTOK_GIFT[giftName].id !== null && TIKTOK_GIFT[giftName].emoji !== '');
        const giftOptions = availableGifts.map(giftName => `${TIKTOK_GIFT[giftName].emoji} ${giftName}`);
        const actionOptions: GiftAction['actionType'][] = ['Summon', 'Clear Blocks', 'Fill', 'Play Sound'];

        new ModalForm(this._player, 'Create Gift Action')
            .dropdown('Select Gift', giftOptions, 5)
            .dropdown('Select Action', actionOptions, 0)
            .submitButton('Create')
            .show(response => {
                const selectedGift = response[0] as number;
                const selectedActionType = response[1] as number;

                const giftName = availableGifts[selectedGift];
                const gift = TIKTOK_GIFT[giftName];
                const giftId = gift.id;
                const giftEmoji = gift.emoji || DEFAULT_GIFT;
                const actionType = actionOptions[selectedActionType];

                this.showActionTypeForm({
                    eventKey: giftId.toString() || giftName,
                    giftName,
                    giftId,
                    giftEmoji,
                    actionType,
                }, false);
            });
    }

    private showDeleteActionForm(): void {
        this.checkIfNoActionsAndProceed((giftActions) => {
            const form = new ActionForm(this._player, 'Delete Gift Action');

            let giftName: string = '';
            let giftEmoji: string = '';

            giftActions.forEach((actions, eventKey) => {
                actions.forEach(action => {
                    giftName = action.giftName;
                    giftEmoji = action.giftEmoji;
                });
                form.button(`${giftEmoji}${giftName}\n§9§kii§r§4(Click to Delete)§9§kii§r`, () => {
                    new ActionForm(this._player, `Delete Actions for ${giftEmoji}${giftName}?`)
                        .body('Are you sure you want to delete all actions for this gift?')
                        .button('Yes', () => {
                            this._manager.clearActionsForGift(eventKey);
                            this._player.sendMessage(`§aActions for ${giftName} cleared.`);
                            this._player.playSound('random.orb');
                        })
                        .button('No')
                        .show();
                });
            });

            form.show();
        });
    }

    private checkIfNoActionsAndProceed(callback: (giftAction: Map<string, GiftAction[]>) => void): void {
        const allGiftActions = this._manager.getAllGiftActions();
        if (allGiftActions.size === 0) {
            new ActionForm(this._player, 'No Gift Actions Found')
                .body('No Gift Actions found.')
                .button('Create Gift Action', this.showCreateActionForm.bind(this))
                .show();
        } else {
            callback(allGiftActions);
        }
    }

    private showActionTypeForm(action: GiftAction, isEdit: boolean, index?: number): void {
        console.warn(`Creating Action: ${JSON.stringify(action)}`);
        switch (action.actionType) {
            case 'Summon':
                this.showCustomSummonForm(action, isEdit, index);
                break;
            case 'Clear Blocks':
                this.showClearBlocksForm(action, isEdit, index);
                break;
            case 'Fill':
                this.showFillForm(action, isEdit, index);
                break;
            case 'Play Sound':
                this.showPlaySoundForm(action, isEdit, index);
                break;
        }
    }

    private showCustomSummonForm(action: GiftAction, isEdit: boolean, index?: number): void {
        if (action.actionType !== 'Summon') return;

        const { eventKey, giftName, giftEmoji, playSound: sound, summonOptions } = action;

        const entityName = summonOptions?.entityName || 'tnt_minecart';
        const amount = summonOptions?.amount || 1;
        const locationType = summonOptions?.locationType || 'random';
        const onTop = summonOptions?.onTop ?? true;
        const playSound = sound || 'kururin';
        const batchSize = summonOptions?.batchSize || 10;
        const batchDelay = summonOptions?.batchDelay || 10;

        let formTitle = '';
        formTitle += `${giftEmoji}${giftName}: ${isEdit ? 'Edit' : 'Create'} Action`;
        if (index !== undefined) formTitle += ` ${index + 1}`;
    
        new ModalForm(this._player, formTitle)
            .textField('string', 'Entity Name', 'Entity Name', entityName)
            .textField('number', 'Amount', 'Amount', amount.toString())
            .dropdown('Location Type', ['Random', 'Center'], locationType === 'random' ? 0 : 1)
            .toggle('On Top', onTop)
            .textField('string', 'Play Sound', 'Play Sound', playSound)
            .textField('number', 'Batch Size', 'Batch Size', batchSize.toString())
            .textField('number', 'Batch Delay', 'Batch Delay', batchDelay.toString())
            .submitButton('Confirm')
            .show(response => {
                const updatedEntityName = response[0] as string;
                const updatedAmount = Math.max(1, response[1] as number);
                const updatedLocationType = response[2] === 0 ? 'random' : 'center';
                const updatedOnTop = response[3] as boolean;
                const updatedPlaySound = response[4] as string;
                const updatedBatchSize = Math.max(1, response[5] as number);
                const updatedBatchDelay = Math.max(1, response[6] as number);
    
                const updatedAction: GiftAction = {
                    ...action,
                    playSound: updatedPlaySound,
                    summonOptions: {
                        entityName: updatedEntityName,
                        amount: updatedAmount,
                        locationType: updatedLocationType,
                        onTop: updatedOnTop,
                        batchSize: updatedBatchSize,
                        batchDelay: updatedBatchDelay,
                    }
                };
    
                if (isEdit && index !== undefined) {
                    this._manager.updateGiftAction(eventKey, index, updatedAction);
                    this._player.sendMessage(`§aAction for ${giftName} updated.`);
                } else {
                    this._manager.addActionToGift(updatedAction);
                    this._player.sendMessage(`§aNew action added for ${giftName}.`);
                }

                this._player.playSound('random.orb');
            });
    }

    private showClearBlocksForm(action: GiftAction, isEdit: boolean, index?: number): void {
        if (action.actionType !== 'Clear Blocks') return;

        const { eventKey, giftName, giftId, giftEmoji, actionType, playSound: sound } = action;
        const playSound = sound || 'cat_laughing';

        new ModalForm(this._player, `${isEdit ? 'Edit Clear Blocks' : 'Clear Blocks Action'} for ${giftEmoji}${giftName}`)
            .textField('string', 'Play Sound', 'Play Sound', playSound)
            .submitButton('Confirm')
            .show(response => {
                const playSound = response[0] as string;

                if (isEdit && index !== undefined) {
                    this._manager.updateGiftAction(eventKey, index, { playSound });
                    this._player.sendMessage(`§aAction for ${giftName} updated.`);
                } else {
                    this._manager.addActionToGift({
                        eventKey,
                        giftName,
                        giftId,
                        giftEmoji,
                        actionType,
                        playSound,
                    });
                    this._player.sendMessage(`§aNew action added for ${giftName}.`);
                }

                this._player.playSound('random.orb');
            });
    }
    
    private showFillForm(action: GiftAction, isEdit: boolean, index?: number): void {
        if (action.actionType !== 'Fill') return;

        const { eventKey, giftName, giftId, giftEmoji, actionType, playSound: sound } = action;
        const playSound = sound || 'wait_wait_wait';

        new ModalForm(this._player, `${isEdit ? 'Edit Fill' : 'Fill Action'} for ${giftEmoji}${giftName}`)
            .textField('string', 'Play Sound', 'Play Sound', playSound)
            .submitButton('Confirm')
            .show(response => {
                const playSound = response[0] as string;
    
                if (isEdit && index !== undefined) {
                    this._manager.updateGiftAction(eventKey, index, { playSound });
                    this._player.sendMessage(`§aAction for ${giftName} updated.`);
                } else {
                    this._manager.addActionToGift({
                        eventKey,
                        giftName,
                        giftId,
                        giftEmoji,
                        actionType,
                        playSound,
                    });
                    this._player.sendMessage(`§aNew action added for ${giftName}.`);
                }

                this._player.playSound('random.orb');
            });
    }

    private showPlaySoundForm(action: GiftAction, isEdit: boolean, index?: number): void {
        if (action.actionType !== 'Play Sound') return;

        const { eventKey, giftName, giftId, giftEmoji, actionType, playSound: sound } = action;

        const playSound = sound || 'random.orb';
        new ModalForm(this._player, `${isEdit ? 'Edit Play Sound' : 'Play Sound Action'} for ${giftEmoji}${giftName}`)
            .textField('string', 'Play Sound', 'Play Sound', playSound)
            .submitButton('Confirm')
            .show(response => {
                const playSound = response[0] as string;
    
                if (isEdit && index !== undefined) {
                    this._manager.updateGiftAction(eventKey, index, { playSound });
                    this._player.sendMessage(`§aAction for ${giftName} updated.`);
                } else {
                    this._manager.addActionToGift({
                        eventKey,
                        giftName,
                        giftId,
                        giftEmoji,
                        actionType,
                        playSound,
                    });
                    this._player.sendMessage(`§aNew action added for ${giftName}.`);
                }

                this._player.playSound('random.orb');
            });
    }
}