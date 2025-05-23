export default class ServiceRegistry {
    private static instance: ServiceRegistry;
    private services: Map<string, any> = new Map();

    private constructor() {}

    public static getInstance(): ServiceRegistry {
        if (!ServiceRegistry.instance) {
            ServiceRegistry.instance = new ServiceRegistry();
        }
        return ServiceRegistry.instance;
    }

    /**
     * Register a service instance
     * @param name Service identifier
     * @param service Service instance
     */
    public register<T>(name: string, service: T): void {
        this.services.set(name, service);
    }

    /**
     * Get a service by name
     * @param name Service identifier
     * @returns The requested service or undefined if not found
     */
    public get<T>(name: string): T | undefined {
        if (this.services.has(name)) {
            const service = this.services.get(name);
            if (typeof service === 'function') {
                return service();
            }
            return service as T;
        }
        return undefined;
    }

    /**
     * Check if a service exists
     * @param name Service identifier
     * @returns True if the service exists
     */
    public has(name: string): boolean {
        return this.services.has(name);
    }
    
    /**
     * Remove a service
     * @param name Service identifier
     */
    public remove(name: string): void {
        this.services.delete(name);
    }
    
    /**
     * Clear all services
     */
    public clear(): void {
        this.services.clear();
    }
}