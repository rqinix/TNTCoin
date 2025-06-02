import { Actionbar } from "../ScreenDisplay/Actionbar";

export class WinTracker {
    private _currentWins: number = 0;
    private _maxWins: number;
    private _actionBar: Actionbar;
    private _taskId: string = 'wins:actionbar';

    constructor(maxWins: number, actionBar: Actionbar) {
        this._maxWins = maxWins;
        this._actionBar = actionBar;
        this.setupActionBar();
    }

    /**
     * Sets up the ActionBar to display the current and maximum wins.
     */
    private setupActionBar(): void {
        this._actionBar.addTask(this._taskId, {
            id: this._taskId,
            callback: () => {
                const currentWins = this._currentWins;
                const maxWins = this._maxWins;

                let countColor = '§a';
                if (currentWins < 0) {
                    countColor = '§c';
                } else if (currentWins >= maxWins) {
                    countColor = '§c';
                }

                return ['Wins: ', countColor, currentWins, '§f/', '§a', maxWins];
            },
        });
    }

    /**
     * Increments the win count by 1.
     */
    public increment(): void {
        this._currentWins++;
        this._actionBar.updateDisplay();
    }

    /**
     * Decrements the win count by 1.
     */
    public decrement(): void {
        this._currentWins--;
        this._actionBar.updateDisplay();
    }

    /**
     * Increments the win count by a specific amount.
     * @param amount The amount to increment by
     */
    public incrementBy(amount: number): void {
        this._currentWins += amount;
        this._actionBar.updateDisplay();
    }

    /**
     * Decrements the win count by a specific amount.
     * @param amount The amount to decrement by
     */
    public decrementBy(amount: number): void {
        this._currentWins -= amount;
        this._actionBar.updateDisplay();
    }

    /**
     * Resets the win count to 0.
     */
    public reset(): void {
        this._currentWins = 0;
        this._actionBar.updateDisplay();
    }

    /**
     * Checks if the player has reached the max wins.
     * @returns {boolean} `true` if the player has reached the max wins, otherwise `false`.
     */
    public hasReachedMaxWins(): boolean {
        return this._currentWins >= this._maxWins;
    }

    /**
     * Gets the current win count.
     * @returns {number} The current win count.
     */
    public getCurrentWins(): number {
        return this._currentWins;
    }

    /**
     * Gets the max wins required to trigger a win.
     * @returns {number} The max wins.
     */
    public getMaxWins(): number {
        return this._maxWins;
    }

    /**
     * Sets the max wins required to trigger a win.
     * @param {number} maxWins The new max wins.
     * @returns {number} The new max wins.
     */
    public setMaxWins(maxWins: number): number {
        this._maxWins = maxWins;
        this._actionBar.updateDisplay();
        return this._maxWins;
    }

    /**
     * Sets the current win count.
     * @param {number} wins The new win count.
     * @returns {number} The new win count.
     */
    public setWins(wins: number): number {
        this._currentWins = wins;
        this._actionBar.updateDisplay();
        return this._currentWins;
    }

    public clearActionbar(): void {
        this._actionBar.removeTasks([this._taskId]);
    }
}
