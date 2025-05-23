import { Player } from "@minecraft/server";
import { taskManager } from "../Managers/TaskManager";

/**
 * Class for managing and updating the action bar display for a player.
 */
export class Actionbar {
    private _player: Player;
    private _tasks: Map<string, ActionbarTask> = new Map();
    private _isRunning: boolean = false;

    constructor(player: Player) {
        this._player = player;
    }

    /**
     * Adds a task to the action bar display.
     * @param {string} id - Unique identifier for the task.
     * @param {ActionbarTask} callback 
     * - Function that returns an array of strings, numbers, or undefined values to be displayed, or a promise that resolves to such an array.
     */
    public addTask(id: string, callback: ActionbarTask): void {
        this._tasks.set(id, callback);
        this.updateDisplay();
    }

    /**
     * Removes a task from the action bar display.
     * @param {string[]} ids - Unique identifier for the task to remove.
     */
    public removeTasks(ids: string[]): void {
        ids.forEach(id => this._tasks.delete(id));
        this.updateDisplay();
    }

    /**
     * Removes all tasks from the action bar display.
     */
    public removeAllTasks(): void {
        this._tasks.clear();
        this.updateDisplay();
    }

    public reset(): void {
        this._isRunning = false;
        this._tasks.clear();
        taskManager.clearTask(`actionbar:${this._player.name}`);
    }

    /**
     * Starts the action bar updates.
     * @param {number} interval - Update interval in ticks (default is 20 ticks).
     */
    public start(interval: number = 20): void {
        if (this._isRunning) return;

        this._isRunning = true;
        this.scheduleUpdate(interval);
    }

    /**
     * Stops the action bar updates.
     */
    public stop(): void {
        this._player.onScreenDisplay.setActionBar('');
        this._isRunning = false;
        taskManager.clearTask(`actionbar:${this._player.name}`);
    }

    /**
     * Schedules the next update for the action bar.
     * @param {number} interval - Update interval in ticks.
     */
    private scheduleUpdate(interval: number): void {
        if (!this._isRunning) return;

        taskManager.addTask(`actionbar:${this._player.name}`, () => {
            this.updateDisplay();
            this.scheduleUpdate(interval);
        }, interval);
    }

    /**
     * Updates the action bar display with the latest information from all tasks.
     * @param {number} tasksPerLine - Maximum number of tasks to display per line.
     */
    public async updateDisplay(tasksPerLine: number = 3): Promise<void> {
        if (!this._isRunning) return;

        const divider = ' §f| ';
        const lines: string[] = [];
        const taskArray = Array.from(this._tasks.values());

        for (let i = 0; i < taskArray.length; i += tasksPerLine) {
            const linePromises = taskArray.slice(i, i + tasksPerLine).map(async (task) => {
                const result = await task.callback();
                return this.formatTask(result);
            });

            const resolvedLine = await Promise.all(linePromises);
            lines.push(resolvedLine.join(divider));
        }

        const displayText = lines.join('\n');
        this._player.onScreenDisplay.setActionBar(displayText);
    }

    /**
     * Formats a task's output, replacing undefined or null values with a placeholder.
     * @param {(string | number | undefined)[]} values - The values returned by a task's callback function.
     * @returns {string} - A formatted string for display.
     */
    private formatTask(values: (string | number | undefined)[]): string {
        return values.map(value => value !== undefined && value !== null ? value : '§b§kii§r').join('');
    }

    /**
     * Checks if the action bar display is currently running.
     * @returns {boolean} - True if the action bar is running, false otherwise.
     */
    public isRunning(): boolean {
        return this._isRunning;
    }
}
