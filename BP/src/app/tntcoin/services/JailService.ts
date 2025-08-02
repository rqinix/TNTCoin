import { Player, Vector3, Dimension, BlockPermutation } from "@minecraft/server";
import { Actionbar } from "lib/ScreenDisplay/Actionbar";
import { Timer } from "lib/System/Timer";
import { PlayerPropertiesManager } from "lib/Player/PlayerPropertiesManager";
import { StructureBlocksManager } from "app/structure/managers/StructureBlocksManager";
import EventEmitter from "lib/Events/EventEmitter";
import { TntCoinConfigManager } from "app/tntcoin/TntCoinConfigManager";
import { JailConfigInterface, TntCoinSettingsInterface } from "types";

export interface JailState {
    isJailed: boolean;
    remainingTime: number;
    playerOriginalLocation: Vector3;
    jailLocation: Vector3;
    jailBlocks: string[];
    jailDimension: string;
}

export default class JailService {
    private _player: Player;
    private _jailTimer: Timer;
    private _actionbar: Actionbar;
    private _propertiesManager: PlayerPropertiesManager;
    private _structureBlocksManager?: StructureBlocksManager;
    private _jailBlocks = new Set<string>();
    private _originalBlocks = new Map<string, string>();
    private _jailConfig: JailConfigInterface;

    constructor(player: Player, actionbar?: Actionbar, structureBlocksManager?: StructureBlocksManager) {
        this._player = player;
        this._actionbar = actionbar ?? new Actionbar(player);
        this._structureBlocksManager = structureBlocksManager;
        this._propertiesManager = new PlayerPropertiesManager(player);
        this._jailConfig = this._loadJailConfig();
        this._jailTimer = new Timer(player, this._jailConfig.jailTime, this._actionbar, "Jail Time", "Jail Timer");
        this._initializeJailEvents();
    }

    /**
     * Initialize jail timer events
     */
    private _initializeJailEvents(): void {
        const events = this._jailTimer.events;
        EventEmitter.getInstance().subscribe(events.ended, () => {
            this.releasePlayer();
        });
    }
    
    /**
     * Set jail configuration
     */
    public set jailConfig(config: Partial<JailConfigInterface>) {
        this._jailConfig = { ...this._jailConfig, ...config };
        this._jailTimer.setTimerDuration(this._jailConfig.jailTime);
    }

    /**
     * Get jail configuration
     */
    public get jailConfig(): JailConfigInterface {
        return { ...this._jailConfig };
    }

    private _loadJailConfig(): JailConfigInterface {
        const configManager = TntCoinConfigManager.getInstance();
        return this._jailConfig = configManager.getConfig<TntCoinSettingsInterface>('TNT_COIN_SETTINGS').jailSettings || {
            size: 5,
            jailTime: 10,
            enableEffects: true
        };
    }

    /**
     * Check if player is currently jailed
     */
    public get isPlayerJailed(): boolean {
        const jailState = this._getJailState();
        return jailState?.isJailed ?? false;
    }

    /**
     * Get remaining jail time
     */
    public get remainingJailTime(): number {
        return this._jailTimer.timeRemaining;
    }

    /**
     * Get jail state from player properties
     */
    private _getJailState(): JailState | null {
        const stateJson = this._propertiesManager.getProperty('tntcoin:jail_state') as string;
        if (!stateJson) return null;
        try {
            return JSON.parse(stateJson) as JailState;
        } catch {
            return null;
        }
    }

    /**
     * Save jail state to player properties
     */
    private _saveJailState(state: JailState): void {
        this._propertiesManager.setProperty('tntcoin:jail_state', JSON.stringify(state));
    }

    /**
     * Generate jail location relative to a reference point
     */
    private _generateJailLocation(referencePoint: Vector3): Vector3 {
        const offset = this._jailConfig.size + 5;
        return {
            x: referencePoint.x + offset,
            y: referencePoint.y + 2,
            z: referencePoint.z + offset
        };
    }

    /**
     * Generate iron bar cage around the jail location
     */
    private _generateCage(center: Vector3): void {
        const dimension = this._player.dimension;
        const size = this._jailConfig.size;
        const halfSize = Math.floor(size / 2);
        
        this._jailBlocks.clear();
        this._originalBlocks.clear();

        // floor
        for (let x = -halfSize; x <= halfSize; x++) {
            for (let z = -halfSize; z <= halfSize; z++) {
                const pos = {
                    x: center.x + x,
                    y: center.y - 1,
                    z: center.z + z
                };
                this._placeJailBlock(dimension, pos, 'minecraft:stone');
            }
        }

        // walls
        for (let y = 0; y < size - 1; y++) {
            for (let x = -halfSize; x <= halfSize; x++) {
                for (let z = -halfSize; z <= halfSize; z++) {
                    // Only place blocks on the perimeter
                    if (x === -halfSize || x === halfSize || z === -halfSize || z === halfSize) {
                        const pos = {
                            x: center.x + x,
                            y: center.y + y,
                            z: center.z + z
                        };
                        this._placeJailBlock(dimension, pos, 'minecraft:iron_bars');
                    }
                }
            }
        }

        // roof
        for (let x = -halfSize; x <= halfSize; x++) {
            for (let z = -halfSize; z <= halfSize; z++) {
                const pos = {
                    x: center.x + x,
                    y: center.y + size - 1,
                    z: center.z + z
                };
                this._placeJailBlock(dimension, pos, 'minecraft:stone');
            }
        }
    }

    /**
     * Place a jail block and store original block for cleanup
     */
    private _placeJailBlock(dimension: Dimension, pos: Vector3, blockType: string): void {
        const posKey = `${pos.x},${pos.y},${pos.z}`;
        try {
            // store original block
            const originalBlock = dimension.getBlock(pos);
            if (originalBlock) {
                this._originalBlocks.set(posKey, originalBlock.permutation.type.id);
            }
            // place jail block
            const blockPermutation = BlockPermutation.resolve(blockType);
            dimension.setBlockPermutation(pos, blockPermutation);
            this._jailBlocks.add(posKey);
            if (this._structureBlocksManager) {
                // Add to protected blocks
                this._structureBlocksManager.addProtectedLocation(pos);
            }
        } catch (error) {
            console.warn(`Failed to place jail block at ${posKey}:`, error);
        }
    }

    /**
     * Apply jail effects to player
     */
    private _applyJailEffects(): void {
        if (!this._jailConfig.enableEffects) return;
        try {
            this._player.addEffect('blindness', 6000, { amplifier: 1, showParticles: false });
            this._player.playSound('mob.enderdragon.growl');
            this._player.sendMessage('§cYou have been jailed!');
        } catch (error) {
            console.warn('Failed to apply jail effects:', error);
        }
    }

    /**
     * Remove jail effects from player
     */
    private _removeJailEffects(): void {
        try {
            this._player.removeEffect('blindness');
            this._player.playSound('random.levelup');
            this._player.sendMessage('§aYou have been released from jail!');
        } catch (error) {
            console.warn('Failed to remove jail effects:', error);
        }
    }

    /**
     * Destroy the jail cage and restore original blocks
     */
    private _destroyCage(): void {
        const dimension = this._player.dimension;
        for (const posKey of this._jailBlocks) {
            try {
                const [x, y, z] = posKey.split(',').map(Number);
                const pos = { x, y, z };
                const originalBlockType = this._originalBlocks.get(posKey) || 'minecraft:air';
                const blockPermutation = BlockPermutation.resolve(originalBlockType);
                dimension.setBlockPermutation(pos, blockPermutation);
                if (this._structureBlocksManager) {
                    this._structureBlocksManager.removeProtectedLocation(pos);
                }
            } catch (error) {
                console.warn(`Failed to cleanup jail block at ${posKey}:`, error);
            }
        }
        this._jailBlocks.clear();
        this._originalBlocks.clear();
    }

    /**
     * Jail the player 
     */
    public jailPlayer(referencePoint: Vector3, duration?: number): void {
        if (this.isPlayerJailed) {
            const additionalTime = duration || this._jailConfig.jailTime;
            this._jailTimer.stop();
            const newDuration = this._jailTimer.timeRemaining + additionalTime;
            this._jailTimer.setTimerDuration(newDuration);
            this._jailTimer.start();
            this._player.sendMessage(`§c+${additionalTime}s added to your jail time!`);
            return;
        }

        this._loadJailConfig();

        const originalLocation = this._player.location;
        const jailLocation = this._generateJailLocation(referencePoint);
        
        if (duration) {
            this._jailConfig.jailTime = duration;
            this._jailTimer.setTimerDuration(duration);
        }

        this._generateCage(jailLocation);
        this._player.teleport(jailLocation);
        this._applyJailEffects();
        this._jailTimer.start();
        const jailState: JailState = {
            isJailed: true,
            remainingTime: this._jailTimer.timeRemaining,
            playerOriginalLocation: originalLocation,
            jailLocation: jailLocation,
            jailBlocks: Array.from(this._jailBlocks),
            jailDimension: this._player.dimension.id
        };
        this._saveJailState(jailState);
    }

    /**
     * Release the player from jail
     */
    public releasePlayer(): void {
        if (!this.isPlayerJailed) {
            this._player.sendMessage('§eYou are not currently jailed.');
            return;
        }
        const jailState = this._getJailState();
        this._jailTimer.stop();
        this._removeJailEffects();
        this._destroyCage();
        if (jailState?.playerOriginalLocation) {
            this._player.teleport(jailState.playerOriginalLocation);
        }
        this._propertiesManager.removeProperty('tntcoin:jail_state');
    }

    /**
     * Load jail state on player spawn/world reload
     */
    public loadJailState(): void {
        const jailState = this._getJailState();
        if (jailState?.isJailed) {
            this._jailTimer.setTimerDuration(jailState.remainingTime);
            this._jailBlocks = new Set(jailState.jailBlocks);
            if (this._structureBlocksManager) {
                for (const posKey of this._jailBlocks) {
                    const [x, y, z] = posKey.split(',').map(Number);
                    const pos = { x, y, z };
                    this._structureBlocksManager.addProtectedLocation(pos);
                }
            }
            if (this._jailConfig.enableEffects) {
                this._applyJailEffects();
            }
            if (jailState.remainingTime > 0) {
                this._jailTimer.start();
            } else {
                this.releasePlayer();
            }
        }
    }
}