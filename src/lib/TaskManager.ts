import { system } from "@minecraft/server";

export class TaskManager {
    private static instance: TaskManager;
    /**
     * The intervals managed by the task manager.
     */
    private intervals: Map<string, number> = new Map();
    /**
     * The timeouts managed by the task manager.
     */
    private timeouts: Map<string, number> = new Map();

    private constructor() {}

    /**
     * Gets the instance of the task manager.
     * @returns {TaskManager} The instance of the task manager.
     */
    public static getInstance(): TaskManager {
        if (!this.instance) {
            this.instance = new TaskManager();
        }
        return this.instance;
    }
    
    /**
    * Adds an interval to be managed.
    * @param {number} id The identifier for the interval.
    * @param {() => void} callback The function to be executed at each interval.
    * @param {number} delay The delay in ticks between each execution of the interval.
    */
    public addInterval(id: string, callback: () => void, delay: number): void {
        if (this.intervals.has(id)) {
            console.warn(`Interval with id ${id} already exists. Replacing it.`);
            system.clearRun(this.intervals.get(id)!);
        }
        const intervalId = system.runInterval(callback, delay);
        this.intervals.set(id, intervalId);
    }

    /**
     * Adds a timeout to be managed.
     * @param {number} id The identifier for the timeout.
     * @param {() => void} callback The function to be executed after the delay.
     * @param {number} delay The delay in ticks before the function is executed.
     */
    public addTimeout(id: string, callback: () => void, delay: number): void {
        if (this.timeouts.has(id)) {
            system.clearRun(this.timeouts.get(id)!);
        }
        const timeoutId = system.runTimeout(callback, delay);
        this.timeouts.set(id, timeoutId);
    }

    /**
     * Gets the interval by its identifier.
     * @param {number} id The identifier of the interval.
     * @returns {number | undefined} The interval identifier.
     */
    public getInterval(id: string): number | undefined {
        return this.intervals.get(id);
    }

    /**
     * Gets the timeout by its identifier.
     * @param {number} id The identifier of the timeout.
     * @returns {number | undefined} The timeout identifier.
     */
    public getTimeout(id: string): number | undefined {
        return this.timeouts.get(id);
    }

    /**
     * Gets all intervals.
     *@returns {Map<string, number>} The intervals.
    */
    public getIntervals(): Map<string, number> {
        return this.intervals;
    }

    /**
     * Gets all timeouts.
     * @returns {Map<string, number>} The timeouts.
     */
    public getTimeouts(): Map<string, number> {
        return this.timeouts;
    }
    
    /**
    * Clears a specific interval by its identifier.
    * @param {number} id The identifier of the interval to be cleared
    */
    public clearInterval(id: string): void {
        if (this.intervals.has(id)) {
            system.clearRun(this.intervals.get(id)!);
            this.intervals.delete(id);
        }
    }

    /**
     * Clears a specific timeout by its identifier.
     * @param {number} id The identifier of the timeout to be cleared.
     */
    public clearTimeout(id: string): void {
        if (this.timeouts.has(id)) {
            system.clearRun(this.timeouts.get(id)!);
            this.timeouts.delete(id);
        }
    }
    
    /**
    * Clears all intervals.
    */
    public clearAlIntervals(): void {
        this.intervals.forEach((intervalId) => system.clearRun(intervalId));
        this.intervals.clear();
    }

    /**
     * Clears all timeouts.
     */
    public clearAllTimeouts(): void {
        this.timeouts.forEach((timeoutId) => system.clearRun(timeoutId));
        this.timeouts.clear();
    }

    /**
     * Runs an interval.
     * @param {() => void} callback The function to be executed at each interval.
     * @param {number} delay The delay in ticks between each execution of the interval.
     */
    public runInterval(callback: () => void, delay: number): void {
        system.runInterval(callback, delay);
    }

    /**
     * Runs a timeout.
     * @param {() => void} callback The function to be executed after the delay.
     * @param {number} delay The delay in ticks before the function is executed.
     */
    public runTimeout(callback: () => void, delay: number): void {
        system.runTimeout(callback, delay);
    }

    /**
     * Clears all intervals and timeouts.
     */
    public clearAll(): void {
        this.clearAlIntervals();
        this.clearAllTimeouts();
    }

    /**
     * Checks if an interval or timeout exists by its identifier.
     * @param id The identifier of the interval or timeout.
     * @returns {boolean} `true` if the interval or timeout exists; otherwise, `false`.
     */
    public has(id: string): boolean {
        return this.intervals.has(id) || this.timeouts.has(id);
    }
}

export const taskManager = TaskManager.getInstance();