import { ActionBar } from "./ActionBar";

export class WinManager {
    private _currentWins: number = 0;
    private _maxWins: number;
    private _actionBar: ActionBar;
    private _taskId: string = 'wins:actionbar';

    constructor(maxWins: number, actionBar: ActionBar) {
        this._maxWins = maxWins;
        this._actionBar = actionBar;
        this.setupActionBar();
    }

    /**
     * Sets up the ActionBar to display the current and maximum wins.
     */
    private setupActionBar(): void {
        this._actionBar.addTask(this._taskId, () => {
            const currentWins = this._currentWins;
            const maxWins = this._maxWins;
            let countColor = '§a';

            if (currentWins < 0) {
                countColor = '§c';
            } else if (currentWins >= maxWins) {
                countColor = '§c';
            }

            return ['Wins: ', countColor, currentWins, '§f/', '§a', maxWins];
        });
    }

    /**
     * Increments the win count by 1.
     */
    public incrementWin(): void {
        this._currentWins++;
        this._actionBar.updateDisplay();
    }

    /**
     * Decrements the win count by 1.
     */
    public decrementWin(): void {
        this._currentWins--;
        this._actionBar.updateDisplay();
    }

    /**
     * Resets the win count to 0.
     */
    public resetWins(): void {
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
