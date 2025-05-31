import { Player } from "@minecraft/server";
import { TntCoinForm } from "../forms/index";

export default class TntCoinPlayerRegistry {
    private static instance: TntCoinPlayerRegistry;
    private players: Map<string, TntCoinForm> = new Map<string, TntCoinForm>();

    private constructor() {}

    public static getInstance(): TntCoinPlayerRegistry {
        if (!TntCoinPlayerRegistry.instance) {
            TntCoinPlayerRegistry.instance = new TntCoinPlayerRegistry();
        }
        return TntCoinPlayerRegistry.instance;
    }

    /**
     * Register a player with their TntCoinGUI instance
     * @param player The player to register
     * @param guiInstance The TntCoinGUI instance for this player
     */
    public register(player: Player, guiInstance: TntCoinForm): void {
        this.players.set(player.name, guiInstance);
    }

    /**
     * Unregister a player from the registry
     * @param player The player to unregister
     */
    public unregister(player: Player): void {
        this.players.delete(player.name);
    }

    /**
     * Get a player's TntCoinGUI instance
     * @param player The player to get the GUI instance for
     * @returns The TntCoinGUI instance for this player, or undefined if not found
     */
    public get(player: Player): TntCoinForm | undefined {
        return this.players.get(player.name);
    }

    /**
     * Check if a player has a registered TntCoinGUI instance
     * @param player The player to check
     * @returns True if the player is registered, false otherwise
     */
    public has(player: Player): boolean {
        return this.players.has(player.name);
    }

    /**
     * Get all registered players
     * @returns The map of player names to TntCoinGUI instances
     */
    public getAllPlayers(): Map<string, TntCoinForm> {
        return this.players;
    }
}