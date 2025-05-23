import { Player } from "@minecraft/server";
import { PlayerPropertiesManager } from "../Player/PlayerPropertiesManager";

export class EventActionManager<Action extends EventAction> {
    private _propertiesManager: PlayerPropertiesManager;
    private _propertyKey: string;
    private _eventActions: Map<string, Action[]>;

    /**
     * Creates a new instance of the EventActionManager class.
     * @param {Player} player The player to manage event actions for.
     * @param {string} key The key to use for saving event actions.
     */
    constructor(player: Player, key: string) {
        this._propertiesManager = new PlayerPropertiesManager(player);
        this._propertyKey = `${key}:actions:${player.name}`;
        this._eventActions = new Map<string, Action[]>();
        this.loadEvents();
    }

    /**
     * Retrieves all events.
     * @returns A map of all events.
     */
    public getEvents(): Map<string, Action[]> {
        return this._eventActions;
    }

    /**
     * Load all events from dynamic properties of the player.
     */
    public loadEvents(): void {
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
                console.warn(`No ${this._propertyKey} found.`);
                this._eventActions.clear();
            }
        } catch (error) {
            console.error(`Failed to load player actions: ${error}`);
            this._eventActions.clear();
        }
    }

    /**
     * Adds a new action to an event.
     * @param action The action to add.
     */
    public addActionToEvent(action: Action): void {
        const actions = this._eventActions.get(action.eventKey) || [];
        actions.push(action);
        this._eventActions.set(action.eventKey, actions);
        this.save();
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
            this.save();
        } else {
            console.warn(`No action found at index ${index} for event ${eventKey}`);
        }
    }

    /**
     * Removes all actions from a specific event.
     * @param {string} eventKey The name of the event.
     */
    public clearActionsFromEvent(eventKey: string): void {
        this._eventActions.delete(eventKey);
        this.save();
    }

    /**
     * Updates a specific action in an event.
     * @param {string} eventKey The name of the event.
     * @param {number} index The index of the action to update.
     * @param updatedAction The updated action properties.
     */
    public updateActionInEvent(eventKey: string, index: number, updatedAction: Partial<Action>): void {
        const actions = this._eventActions.get(eventKey);
        if (actions && actions[index]) {
            const action = actions[index];
            Object.keys(updatedAction).forEach((key) => {
                const value = updatedAction[key as keyof Action];
                if (value !== undefined) {
                    (action[key as keyof Action] as any) = value;
                }
            });
            this.save();
        } else {
            console.warn(`No action found at index ${index} for event ${eventKey}`);
        }
    }

    /**
     * Save all event actions to dynamic properties of the player.
     */
    public save(): void {
        try {
            const serializedActions = this._eventActions.size === 0 ? "[]" : JSON.stringify(Array.from(this._eventActions.entries()));
            this._propertiesManager.setProperty(this._propertyKey, serializedActions);
            console.warn("Actions saved successfully.");
        } catch (error) {
            console.error(`Failed to save player actions: ${error}`);
            throw error;
        }
    }

    /**
     * Clears all event actions.
     */
    public clearAllEvents(): void {
        if (this._eventActions.size === 0) return;
        this._eventActions.clear();
        this.save();
    }

    /**
     * Retrieves all actions for a specific event.
     * @param {string} eventKey The name of the event.
     * @returns An array of actions or undefined if no actions are found.
     */
    public getActionsForEvent(eventKey: string): Action[] | undefined {
        return this._eventActions.get(eventKey);
    }
}