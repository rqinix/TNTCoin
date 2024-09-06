import { Player } from "@minecraft/server";
import { EventActionManager } from "../../core/EventActionManager";

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