type EventCallback = (data: any) => void;

export default class EventEmitter {
    private static instance: EventEmitter;
    private listeners: Map<string, EventCallback[]> = new Map();
    
    private constructor() {}

    public static getInstance(): EventEmitter {
        if (!EventEmitter.instance) {
            EventEmitter.instance = new EventEmitter();
        }
        return EventEmitter.instance;
    }

    /**
     * Subscribe to an event
     * @param event The event name
     * @param callback The callback function that will handle the event data
     */
    public subscribe(event: string, callback: EventCallback): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    /**
     * Publish an event with data
     * @param event The event name
     * @param data The data to send with the event
     */
    public publish(event: string, data: any): void {
        if (!this.listeners.has(event)) return;

        for (const callback of this.listeners.get(event)!) {
            callback(data);
        }
    }

    /**
     * Unsubscribe from an event
     * @param event Object containing the event id and handler
     */
    public unsubscribe(event: { id: string, handler: EventCallback }): void {
        const { id, handler } = event;
        if (!this.listeners.has(id)) return;

        const callbacks = this.listeners.get(id)!;
        const index = callbacks.indexOf(handler);

        if (index !== -1) {
            callbacks.splice(index, 1);
        }
    }
}