import { Player } from "@minecraft/server";
import { DynamicPropertiesManager } from "./DynamicPropertiesManager";

export class EventActionManager<T extends EventAction> {
    private _player: Player;
    private _propertiesManager: DynamicPropertiesManager;
    private _propertyKey: string;
    private _eventActions: Map<string, T[]> = new Map();

    /**
     * Creates a new instance of the EventActionManager class.
     * @param {Player} player The player to manage event actions for.
     */
    constructor(player: Player) {
        this._player = player;
        this._propertiesManager = new DynamicPropertiesManager(player);
        this._propertyKey = `${player.name}:actions`; 
        this.loadAllEventActions(); 
    }

    /**
     * Adds a new action to an event.
     * @param action The action to add.
     */
    public addActionToEvent(action: T): void {
        const actions = this._eventActions.get(action.eventKey) || [];
        actions.push(action);
        this._eventActions.set(action.eventKey, actions);
        this.saveAllEventActions();
    }

    /**
     * Removes a specific action from an event.
     * @param {string} eventKey The name of the event.
     * @param {number} index The index of the action to remove.
     */
    public removeActionFromEvent(eventKey: string, index: number): void {
        const actions = this._eventActions.get(eventKey);
        if (actions && actions[index]) {
            actions.splice(index, 1);
            actions.length === 0 ? this._eventActions.delete(eventKey) : this._eventActions.set(eventKey, actions);
            this.saveAllEventActions();
        } else {
            console.warn(`No action found at index ${index} for event ${eventKey}`);
        }
    }

    /**
     * Removes all actions from a specific event.
     * @param {string} eventKey The name of the event.
     */
    public removeAllActionsFromEvent(eventKey: string): void {
        this._eventActions.delete(eventKey);
        this.saveAllEventActions();
    }

    /**
     * Updates a specific action in an event.
     * @param {string} eventKey The name of the event.
     * @param {number} index The index of the action to update.
     * @param updatedAction The updated action properties.
     */
    public updateActionInEvent(eventKey: string, index: number, updatedAction: Partial<T>): void {
        const actions = this._eventActions.get(eventKey);

        if (actions && actions[index]) {
            const action = actions[index];
            Object.keys(updatedAction).forEach((key) => {
                const value = updatedAction[key as keyof T];
                if (value !== undefined) {
                    (action[key as keyof T] as any) = value; 
                }
            });
            this.saveAllEventActions();
        } else {
            console.warn(`No action found at index ${index} for event ${eventKey}`);
        }
    }

    /**
     * Save all event actions to dynamic properties of the player.
     */
    public saveAllEventActions(): void {
        try {
            const serializedActions = this._eventActions.size === 0 ? "[]" : JSON.stringify(Array.from(this._eventActions.entries())); 
            this._propertiesManager.setProperty(this._propertyKey, serializedActions);
            console.warn("Actions saved successfully.");
        } catch (error) {
            console.error(`Failed to save user actions: ${error}`);
        }
    }

    /**
     * Load all event actions from dynamic properties of the player.
     */
    public loadAllEventActions(): void {
        try {
            const serializedActions = this._propertiesManager.getProperty(this._propertyKey) as string;
            if (serializedActions && serializedActions !== "[]") {
                const parsedActions = JSON.parse(serializedActions);
                if (Array.isArray(parsedActions)) {
                    this._eventActions = new Map(parsedActions);
                    console.warn("Actions loaded successfully.");
                } else {
                    console.warn("Parsed actions are not in a valid format.");
                    this._eventActions.clear();
                }
            } else {
                console.warn("No actions found to load.");
                this._eventActions.clear();
            }
        } catch (error) {
            console.error(`Failed to load user actions: ${error}`);
            this._eventActions.clear();
        }
    }


    /**
     * Clears all event actions.
     */
    public clearAllEventActions(): void {
        if (this._eventActions.size === 0) return;
        this._eventActions.clear();
        this.saveAllEventActions();
    }

    /**
     * Clears all actions for a specific event.
     * @param {string} eventKey The name of the event.
     */
    public clearActionsForEvent(eventKey: string): void {
        this._eventActions.delete(eventKey);
        this.saveAllEventActions();
    }

    /**
     * Retrieves all actions for a specific event.
     * @param {string} eventKey The name of the event.
     * @returns An array of actions or undefined if no actions are found.
     */
    public getActionsForEvent(eventKey: string): T[] | undefined {
        return this._eventActions.get(eventKey);
    }

    /**
     * Retrieves all event actions.
     * @returns A map of all event actions.
     */
    public getAllActions(): Map<string, T[]> {
        return this._eventActions;
    }
}