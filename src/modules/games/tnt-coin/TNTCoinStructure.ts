import { Player, Vector3, Dimension } from "@minecraft/server";
import { PlayerFeedback } from "../../../lib/PlayerFeedback";
import { floorVector3 } from "../../../utilities/math/floorVector";
import { fill } from "../../../utilities/blocks/fill";
import { clearBlocks } from "../../../utilities/blocks/clearing";
import { getRelativeBlockLocation } from "../../../utilities/blocks/relative";
import { applyToBlocks, iterateBlocks } from "../../../utilities/blocks/iteration";
import { isBlockAir, isBlockOnBorder, isBlockOnBoundary, isBlockOnBottomLayer, isBlockOnPerimeter } from "../../../utilities/blocks/state";


/**
 * @class TNTCoinStructure
 * @classdesc the structure of the TNT Coin.
 */
export class TNTCoinStructure {
    private readonly _player: Player;
    private readonly _dimension: Dimension;
    private readonly _feedback: PlayerFeedback;
    private readonly _structureKey: string;
    private _fillBlockName: string = "minecraft:amethyst_block";
    private _fillTickInterval: number = 1;
    private _fillBlocksPerTick: number = 1;
    private _isFilling: boolean = false;
    private _protectedBlockLocations = new Set<string>();
    private _airBlockLocations = new Set<string>();
    private _filledBlockLocations = new Set<string>();
    private _barrierBlockLocations = new Set<string>();

    
    /**
    * Creates a new instance of the TNTCoinGameStructure class.
    * @param {Player} player The player to create the structure for.
    */
    constructor(player: Player) {
        this._structureKey = `tnt_coin_structure-${player.name}`;
        this._player = player;
        this._dimension = player.dimension;
        this._feedback = new PlayerFeedback(player);
    }

    /**
     * Gets the fill settings for the TNT coin structure.
     * @returns {{ blockName: string, tickInterval: number, blocksPerTick: number }} The fill settings.
     */
    public get fillSettings(): { blockName: string, tickInterval: number, blocksPerTick: number } {
        return { blockName: this._fillBlockName, tickInterval: this._fillTickInterval, blocksPerTick: this._fillBlocksPerTick };
    }

    /**
     * Set the fill settings
     */
    public set fillSettings({ blockName, tickInterval, blocksPerTick }: { blockName: string, tickInterval: number, blocksPerTick: number }) {
        this._fillBlockName = blockName;
        this._fillTickInterval = tickInterval;
        this._fillBlocksPerTick = blocksPerTick;
    }

    public get structureKey(): string {
        return this._structureKey;
    }
    
    /**
     * Gets a value indicating whether the structure is currently being filled.
     * @returns {boolean} `true` if the structure is being filled, `false` otherwise.
     */
    public get isFilling(): boolean {
        return this._isFilling;
    }

    /**
     * Get the width of the structure
     * @returns {number} the width of the structure
     */
    public get structureWidth(): number {
        return this.structureProperties.width;
    }

    /**
     * Get the height of the structure
     * @returns {number} the height of the structure
     */
    public get structureHeight(): number {
        return this.structureProperties.height;
    }

    /**
     * Get the center of the structure
     * @returns {Vector3} the center of the structure
     */
    public get structureCenter(): Vector3 {
        const { centerLocation, width } = this.structureProperties;
        const x = centerLocation.x + Math.floor(width / 2);
        const y = centerLocation.y;
        const z = centerLocation.z + Math.floor(width / 2);
        return floorVector3({ x, y, z });
    }

    /**
     * Set the structure properties
     * @param {string} newProperties the new properties
     */
    public set structureProperties(newProperties: string) {
        try {
            this._player.setDynamicProperty(this._structureKey, newProperties);
        } catch (error) {
            console.error(`Failed to set structure data for player ${this._player.name}: `,error);
        }
    }

    /**
     * Get the structure properties
     * @returns {StructureProperties} the structure properties
     */
    public get structureProperties(): StructureProperties {
        try {
            const data = this._player.getDynamicProperty(this._structureKey) as string;
            if (!data) {
                this._feedback.error("No structure data found.");
                return;
            };
            return JSON.parse(data) as StructureProperties;
        } catch (error) {
            console.error(`Failed to get structure data for player ${this._player.name}: `, error);
        }
    }

    /**
     * Get the protected block locations
     * @returns {Set<string>} the protected block locations
     */
    public get protectedBlockLocations(): Set<string> {
        return this._protectedBlockLocations;
    }

    /**
     * Get the filled locations
     * @returns {Set<string>} the filled block locations
     */
    public get filledBlockLocations(): Set<string> {
        return this._filledBlockLocations;
    }

    /**
     * Get the air block locations
     * @returns {Vector3[]} the air block locations
     */
    public get airBlockLocations(): Vector3[] {
        return Array.from(this._airBlockLocations)
            .filter((location) => {
                const blockLocation: Vector3 = JSON.parse(location);
                return isBlockAir(this._dimension, blockLocation);
            })
            .map((location) => JSON.parse(location));
    }

    /**
    * Get the blocks to clear
    * @returns {Vector3[]} the block locations to clear
    */
    public get blocksToClear(): Vector3[] {
        const blocksToClear: Vector3[] = [];
        const { width, height, centerLocation } = this.structureProperties;
        applyToBlocks({ x: 1, y: 1, z: 1 }, (blockPosition) => {
            if (!isBlockAir(this._dimension, blockPosition)) 
                blocksToClear.push(blockPosition);
        }, width - 1, height, centerLocation);
        return blocksToClear;
    }

    /**
    * Generates a random location within or above the bounds of the structure.
    * @param {number} offset The offset from the edges to avoid.
    * @param {boolean} useRandomHeight If `true`, generates a random Y within the structure. If `false`, uses the top of the structure plus a random value between 5 and 10 blocks.
    * @returns {Vector3} A random location within or above the structure's bounds.
    * @remarks the default value of `useRandomHeight` is `true`.
    */
    public randomLocation(offset: number, useRandomHeight: boolean = true): Vector3 {
        const { centerLocation, width, height } = this.structureProperties;
        const { x, y, z } = centerLocation;
        const randomX = x + offset + Math.floor(Math.random() * (width - 2 * offset));
        const randomZ = z + offset + Math.floor(Math.random() * (width - 2 * offset));
        let randomY: number;
        if (useRandomHeight) {
            randomY = y + offset + Math.floor(Math.random() * (height - 2 * offset));
        } else {
            const randomOffset = Math.floor(Math.random() * 3) + 4;
            randomY = y + height + randomOffset;
        }
        return floorVector3({ x: randomX, y: randomY, z: randomZ });
    }
    
    /** 
    * Generate protected structure.
    * @returns {Promise<void>} a promise that resolves when the protected structure is generated.
    */
    public async generateProtectedStructure(): Promise<void> {
        let protectedBlocks: Array<{ 
            blockName: string; 
            blockLocation: Vector3 
        }> = [];

        const heightMinRange = this._dimension.heightRange.min;
        const heightMaxRange = this._dimension.heightRange.max;

        try {
            this.iterateProtectedBlockLocations({ x: 0, y: 0, z: 0 }, (blockLocation, blockName) => {
                if (blockLocation.y < heightMinRange || blockLocation.y > heightMaxRange) {
                    throw new Error('Block out of bounds.');
                } else {
                    protectedBlocks.push({ blockName, blockLocation });
                }
            });
            await this.generateProtectedBlocks(protectedBlocks);
        } catch (error) {
            throw error;
        }
    }
    
    /**
    * Generates protected blocks.
    * @param {Array<{ blockName: string; blockLocation: Vector3 }>} blocks The blocks to generate.
    * @returns {Promise<void>} a promise that resolves when all blocks have been generated.
    */
    private async generateProtectedBlocks(
        blocks: { blockName: string; blockLocation: Vector3 }[],
    ): Promise<void> {
        const chunkSize = 100;
        for (const block of blocks) {
            try {
                await fill(
                    this._dimension, block.blockName, [block.blockLocation], chunkSize,
                    { 
                        onSetBlock: (location) => this._protectedBlockLocations.add(JSON.stringify(location)), 
                    }
                );
            } catch (error) {
                throw error;
            }
        }
    } 
    
    /**
    * Gets the locations of the protected blocks.
    * @param {Vector3} startingPosition where's location to start
    * @param {(blockLocation: Vector3, blockName: string) => void} handleBlock handle block location
    */
    private iterateProtectedBlockLocations(
        startingPosition: Vector3,
        handleBlock: (blockLocation: Vector3, blockName: string) => void,
    ): void {
        this._airBlockLocations.clear();

        const { width, height, centerLocation, blockOptions } = this.structureProperties;
        const { baseBlockName, sideBlockName } = blockOptions;

        try {
            iterateBlocks(startingPosition, (blockLocation) => {
                const blockPosition = JSON.stringify(getRelativeBlockLocation(centerLocation, blockLocation));
                const blockName = isBlockOnBoundary(blockLocation.y, height) ? baseBlockName : sideBlockName;
                const isOnPerimeter = isBlockOnPerimeter(blockLocation, width, height);
                const isOnBottomLayer = isBlockOnBottomLayer(blockLocation.y);
                if (isOnPerimeter || isOnBottomLayer) {
                    handleBlock(JSON.parse(blockPosition), blockName);
                    this._protectedBlockLocations.add(blockPosition);
                } else {
                    this._airBlockLocations.add(blockPosition);
                }
            }, width, height);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate barrier blocks on top of the structure.
     */
    public async generateBarriers(): Promise<void> {
        let barrierBlocks: Vector3[] = [];
        const { width, height, centerLocation } = this.structureProperties;
        const barrierHeight = 7;

        iterateBlocks({ x: 0, y: 0, z: 0 }, (blockLocation) => {
            const isOnPerimeter = isBlockOnBorder(blockLocation, width);
            const isTopLayer = blockLocation.y === (barrierHeight - 1);
            if (isOnPerimeter || isTopLayer) {
                const absoluteLocation = {
                    x: centerLocation.x + blockLocation.x,
                    y: centerLocation.y + height + blockLocation.y,
                    z: centerLocation.z + blockLocation.z
                };
                barrierBlocks.push(absoluteLocation);
                this._protectedBlockLocations.add(JSON.stringify(absoluteLocation));
            }
        }, width, barrierHeight);

        try {
            await fill(this._dimension, 'minecraft:barrier', barrierBlocks, 100, {
                onSetBlock: (location) => this._barrierBlockLocations.add(JSON.stringify(location)),
            });
        } catch (error) {
            console.error('Failed to generate barriers:', error);
        }
    }

    /**
     * Clear barrier blocks around the structure.
     */
    public async clearBarriers(): Promise<void> {
        try {
            const blocksToClear = Array.from(this._barrierBlockLocations)
                .map(location => JSON.parse(location));
            await clearBlocks(this._dimension, blocksToClear, 100);
            blocksToClear.forEach(location => {
                this._protectedBlockLocations
                    .delete(JSON.stringify(location));
            });
            this._barrierBlockLocations.clear();
        } catch (error) {
            console.error('Failed to clear barriers:', error);
        }
    }

    /**
    * Clear the protected structure
    * @returns {Promise<void>} a promise that resolves when the protected structure is cleared.
    */
    public async clearProtedtedStructure(): Promise<void> {
        if (!this._protectedBlockLocations.size) return;

        const blocksToClear = Array.from(this._protectedBlockLocations)
            .map((location) => JSON.parse(location));

        try {
            await clearBlocks(this._dimension, blocksToClear, 100);
            this._protectedBlockLocations.clear();
            this._feedback.playSound('mob.wither.break_block');
        } catch (error) {
            throw new Error(`Failed to clear protected structure: ${error}`);
        }
    }
    
    /**
    * Fills the empty locations within the structure.
    * @returns {Promise<void>} A promise that resolves when the filling is complete.
    */
    public async fill(): Promise<void> {
        if (this._isFilling) {
            this._feedback.warning("Already filling blocks.", { sound: 'item.shield.block' });
            return;
        };
        if (this._airBlockLocations.size === 0) {
            this._feedback.error("No locations  to fill.", { sound: 'item.shield.block' });
            return;
        }

        this._isFilling = true;
        
        const ON_SET_BLOCK_SOUND = 'block.bamboo.place';
        const ON_SET_BLOCK_PARTICLE = 'minecraft:wind_explosion_emitter';
        const ON_COMPLETE_SOUND = 'random.levelup';

        try {
            await fill(
                this._dimension,
                this._fillBlockName, this.airBlockLocations, this._fillBlocksPerTick,
                {
                    tickInterval: this._fillTickInterval,
                    isFilling: () => this._isFilling,
                    setFilling: (isFilling: boolean) => (this._isFilling = isFilling),
                    onSetBlock: (blockLocation) => {
                        const { x, y, z } = blockLocation;
                        this._dimension.spawnParticle(ON_SET_BLOCK_PARTICLE, { x, y: y + 1, z });
                        this._player.playSound(ON_SET_BLOCK_SOUND);
                    },
                    onComplete: () => this._player.playSound(ON_COMPLETE_SOUND),
                }
            );
        } catch (error) {
            console.error(`Failed to fill blocks: `, error);
        }
    }
    
    /**
    * Stops the filling process.
    */
    public fillStop(): void{
        if (this._isFilling) this._isFilling = false;
    }
    
    /**
    * Clears all filled blocks.
    * @returns {Promise<void>} A promise that resolves when all filled blocks have been cleared.
    */
    public async clearFilledBlocks(): Promise<void> {
        if (!this._filledBlockLocations.size) return;
        const SOUND = 'mob.wither.break_block';
        
        try {
            await clearBlocks(this._dimension, this.blocksToClear, 100);
            this._feedback.playSound(SOUND);
        } catch (error) {
            console.error(`Failed to clear filled blocks: `, error);
            this._feedback.error("Failed to clear blocks.");
        }
    }

    /**
    * Checks if the structure is fully filled.
    * @returns {boolean} `true` if the structure is fully filled, `false` otherwise.
    */
    public isStructureFilled(): boolean {
        this._filledBlockLocations.clear();
        const { width, height, centerLocation } = this.structureProperties;
        try {
            applyToBlocks({ x: 1, y: 1, z: 1 }, (blockLocation) => {
                if (!isBlockAir(this._dimension, blockLocation)) 
                    this._filledBlockLocations.add(JSON.stringify(blockLocation));
            }, width - 1, height, centerLocation);
            return this._filledBlockLocations.size === this._airBlockLocations.size;
        } catch (error) {
            console.error(`Failed to check fill status: `, error);
            return false;
        }
    }
}
