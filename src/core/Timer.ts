import { Player } from "@minecraft/server";
import { taskManager } from "./TaskManager";
import { ActionBar } from "./ActionBar";

type TimerCallback = () => Promise<void> | void;

export class Timer {
    private player: Player;
    private duration: number;
    private remainingTime: number;
    private timeoutId: string;
    private isRunning: boolean;
    private actionBar: ActionBar;
    private taskId: string;
    private onEndCallbacks: TimerCallback[] = [];

    /**
     * Creates a new timer for the given player.
     * @param {Player} player The player for whom the timer is created.
     * @param {ActionBar} actionBar The action bar instance to display the timer.
     */
    constructor(player: Player, actionBar: ActionBar) {
        this.player = player;
        this.actionBar = actionBar;
        this.timeoutId = `${player.name}:timer`;
        this.taskId = `${player.name}:timer:actionbar`;
        this.isRunning = false;
    }

    /**
     * Gets whether the timer is currently running.
     */
    public get isTimerRunning(): boolean {
        return this.isRunning;
    }

    /**
     * Gets the remaining time on the timer.
     */
    public get timeRemaining(): number {
        return this.remainingTime;
    }

    /**
     * Registers a callback to be called when the timer ends.
     * @param {TimerCallback} callback The callback function to be executed on timer end.
     */
    public onEnd(callback: TimerCallback): void {
        this.onEndCallbacks.push(callback);
    }

    /**
     * Starts the timer.
     * @param {number} duration The duration of the timer in seconds.
     */
    public start(duration: number): void {
        if (this.isRunning) {
            this.player.sendMessage('§cTimer is already running.');
            return;
        };
        
        this.duration = duration + 1;
        this.remainingTime = this.duration;
        this.isRunning = true;

        this.actionBar.addTask(this.taskId, async () => {
            const result = await this.task();
            return result as (string | number)[];
        });

        this.player.playSound('random.orb');
    }

    /**
     * The main task that runs the timer.
     */
    private async task(): Promise<(string | number | undefined)[]> {
        if (this.remainingTime > 0) {
            this.remainingTime--;
        } else {
            this.isRunning = false;
            this.clearActionBar();
            await this.triggerOnEnd();
        }

        return this.getFormattedTime();
    }

    /**
     * Triggers all registered onEnd callbacks.
     */
    private async triggerOnEnd(): Promise<void> {
        for (const callback of this.onEndCallbacks) {
            await Promise.resolve(callback());
        }
    }

    /**
     * Stops the timer.
     */
    public stop(): void {
        taskManager.clearTask(this.timeoutId);
        this.isRunning = false;
        this.clearActionBar();
        this.player.playSound('random.orb');
    }

    /**
     * Restarts the timer with the initial duration.
     */
    public restart(): void {
        if (this.isRunning) {
            this.reset();
            this.player.playSound('random.orb');
        }
    }

    /**
     * Resets the timer to the initial duration.
     */
    public reset(): void {
        this.remainingTime = this.duration;
    }

    /**
     * Gets the formatted time string for the action bar display.
     */
    private getFormattedTime(): (string | number | undefined)[] {
        const timeColor = this.remainingTime <= 10 ? '§c' : '§a';
        return ['Time Left: ', timeColor, this.remainingTime];
    }

    /**
     * Clears the action bar display.
     */
    private clearActionBar(): void {
        this.actionBar.removeTasks([this.taskId]);
    }
}
