import { system } from "@minecraft/server";

export class TaskManager {
    private static instance: TaskManager;

    /**
     * The tasks managed by the task manager.
     */
    private tasks: Map<string, number> = new Map();

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
     * Adds a task to be managed.
     * @param {number} id The identifier for the task.
     * @param {() => void} callback The task to be executed after the delay.
     * @param {number} delay The delay in ticks before the task is executed every time.
     * @returns {number} The task id.
     */
    public addTask(id: string, callback: () => void, delay: number): number {
        if (this.tasks.has(id)) {
            system.clearRun(this.tasks.get(id)!);
        }
        const taskId = system.runTimeout(callback, delay);
        this.tasks.set(id, taskId);
        return taskId;
    }

    /**
     * Gets the task by its identifier.
     * @param {number} id The identifier of the task.
     * @returns {number | undefined} The task identifier.
     */
    public getTask(id: string): number | undefined {
        return this.tasks.get(id);
    }

    /**
     * Gets all tasks.
     * @returns {Array<[string, number]>} The tasks.
     */
    public getAllTasks(): Array<[string, number]> {
        return Array.from(this.tasks.entries());
    }

    /**
     * Executes a task after the given delay.
     * @param {() => void} callback The function to be executed after the delay.
     * @param {number} delay The delay in ticks before the function is executed.
     */
    public executeTask(callback: () => void, delay: number): void {
        system.runTimeout(callback, delay);
    }

    /**
     * Clears a task by its identifier.
     * @param {number} id The identifier of the task.
     */
    public clearTask(id: string): void {
        if (this.tasks.has(id)) {
            system.clearRun(this.tasks.get(id)!);
            this.tasks.delete(id);
        }
    }

    /**
     * Clears all tasks.
     */
    public clearAllTasks(): void {
        this.tasks.forEach((taskId) => system.clearRun(taskId));
        this.tasks.clear();
    }

    /**
     * Checks if task exists by its identifier.
     * @param id The identifier of the task.
     * @returns {boolean} `true` if the task exists; otherwise, `false`.
     */
    public has(id: string): boolean {
        return this.tasks.has(id);
    }
}

export const taskManager = TaskManager.getInstance();