import { PlayerFeedback } from "./PlayerFeedback";

export class Win {
    private _currentWins: number = 0;
    private _maxWins: number;

    constructor(maxWins: number) {
        this._maxWins = maxWins;
    }

    /**
     * Increments the win count by 1.
     * If the win count reaches the max wins, triggers the win condition.
     */
    public incrementWin(): void {
        this._currentWins++;
    }

    /**
     * Decrements the win count by 1.
     */
    public decrementWin(): void {
        this._currentWins--;
    }

    /**
     * Resets the win count to 0.
     */
    public resetWins(): void {
        this._currentWins = 0;
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
        return this._maxWins;
    }

    /**
     * Sets the current win count.
     * @param {number} wins The new win count.
     * @returns {number} The new win count.
     */
    public setWins(wins: number): number {
        this._currentWins = wins;
        return this._currentWins;
    }
}
