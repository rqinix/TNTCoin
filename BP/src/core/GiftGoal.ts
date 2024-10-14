import { DEFAULT_GIFT, TIKTOK_GIFT } from '../lang/tiktokGifts';
import { ActionBar } from './ActionBar';
import { Player } from "@minecraft/server";

export class GiftGoal {
    private _player: Player;
    private _actionBar: ActionBar;
    private _gift: TikTokGift | null = null;
    private _giftName: string = '';
    private _currentCount: number = 0;
    private _maxCount: number = 100; 
    private _isActive: boolean = false;
    private _isEnabled: boolean = false;
    private _isGoalAnnounced: boolean = false;


    constructor(player: Player, actionBar: ActionBar) {
        this._player = player;
        this._actionBar = actionBar;
    }

    public get settings(): GiftGoalSettings {
        return {
            giftName: this._giftName,
            maxCount: this._maxCount,
            currentCount: this._currentCount,
            isActive: this._isActive,
            isEnabled: this._isEnabled
        };
    }
    
    public set settings(data: GiftGoalSettings) {
        if (data.giftName) this.setGift(data.giftName);
        if (data.maxCount) this.setMaxCount(data.maxCount);
        if (data.currentCount) this.setCurrentCount(data.currentCount);
        if (data.isActive) this._isActive = data.isActive;
        if (data.isEnabled) this.setEnabled(data.isEnabled);
    }

    /**
     * Increases the current count of gifts.
     * @param count - The number of gifts to add.
     */
    public addGifts(count: number): void {
        if (!this._isActive || !this._gift) return;

        this._currentCount += count;
        if (this._currentCount > this._maxCount) {
            this._currentCount = this._maxCount;
        }

        this.updateActionBar();
    }

    /**
     * Resets the current gift count to zero.
     */
    public reset(): void {
        this._currentCount = 0;
        this._isGoalAnnounced = false; 
        this.updateActionBar();
    }

    /**
     * Toggles the gift goal display on or off.
     * @param isEnabled - True to enable, false to disable.
     */
    public setEnabled(isEnabled: boolean): void {
        this._isEnabled = isEnabled;
        if (this._isEnabled) {
            this.updateActionBar();
        } else {
            this._actionBar.removeTasks(['giftGoal']);
        }
    }

    /**
     * Clears the action bar display for the gift goal.
     */
    public clearActionbar(): void {
        this._isActive = false;
        this._actionBar.removeTasks(['giftGoal']);
    }

    /**
     * Checks if the gift goal display is enabled.
     * @returns {boolean} - True if enabled, false if disabled.
     */
    public isEnabled(): boolean {
        return this._isEnabled;
    }

    /**
     * Updates the action bar display.
     */
    private updateActionBar(): void {
        if (!this._gift || !this._isEnabled) return;

        if (this._currentCount === undefined) {
            this._currentCount = 0;
        }

        this._isActive = this._isEnabled;

        if (this.isGoalReached()) {
            if (!this._isGoalAnnounced) {
                this._player.sendMessage(`§aYou have reached the goal of §d${this._giftName}§a!`);
                this._player.playSound('random.levelup');
                this._isGoalAnnounced = true; 
            }
        } else {
            this._isGoalAnnounced = false; 
        }

        this._actionBar.addTask('giftGoal', () => {
            const progress = [
                this._gift!.emoji,
                ' ',
                this._giftName,
                ': ',
                this.isGoalReached() ? '§a§l' : '§c',
                this._currentCount,
                '§r/',
                '§d',
                this._maxCount,
                '§f'
            ];
            return progress;
        });
    }

    /**
     * Checks if the goal has been reached.
     * @returns {boolean} - True if the goal is reached, otherwise false.
     */
    public isGoalReached(): boolean {
        return this._currentCount >= this._maxCount;
    }

    /**
     * Returns whether the gift goal is active.
     */
    public isActive(): boolean {
        return this._isActive;
    }

    /**
     * Gets the current count of gifts.
     * @returns {number} - The current count of gifts.
     */
    public getCurrentCount(): number {
        return this._currentCount;
    }

    /**
     * Gets the maximum count of gifts for the goal.
     * @returns {number} - The maximum count of gifts for the goal.
     */
    public getMaxCount(): number {
        return this._maxCount;
    }

    /**
     * Gets the emoji or icon of the gift.
     * @returns {string} - The emoji or icon of the gift.
     */
    public getGiftEmoji(): string {
        return this._gift ? this._gift.emoji : DEFAULT_GIFT;
    }

    /**
     * Gets the name of the gift.
     * @returns {string} - The name of the gift.
     */
    public getGiftName(): string {
        return this._giftName;
    }

    /**
     * Gets the ID of the gift.
     * @returns {number | null} - The ID of the gift.
     */
    public getGiftId(): number | null {
        return this._gift ? this._gift.id : null;
    }

    /**
     * Sets the current count of gifts.
     * @param count - The current count of gifts.
     */
    public setCurrentCount(count: number): void {
        this._currentCount = count;
        this.updateActionBar();
    }

    /**
     * Sets the maximum count of gifts for the goal.
     * @param maxCount - The maximum count of gifts.
     */
    public setMaxCount(maxCount: number): void {
        this._maxCount = maxCount;
        this.updateActionBar();
    }

    /**
     * Sets the gift for the goal and resets the current count.
     * @param giftName - The name of the gift.
     */
    public setGift(giftName: string): void {
        const gift = TIKTOK_GIFT[giftName];
        if (!gift || !gift.emoji) {
            throw new Error('Selected gift does not have a valid emoji.');
        }

        this._gift = gift;
        this._giftName = giftName;
        this.reset();
        this.updateActionBar();
        this._player.playSound('random.orb');
    }
}

