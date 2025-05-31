import { Player, Vector3, Dimension } from "@minecraft/server";
import { Feedback } from "lib/ScreenDisplay/Feedback";
import ServiceRegistry from "lib/System/ServiceRegistry";
import BlockUtils from "utilities/blocks/BlockUtils";
import { StructureBlocksManager, StructurePropertiesManager } from "./managers/index";
import { StructureProperties } from "./interfaces";


export default class TntCoinStructure {
    private readonly _player: Player;
    private readonly _dimension: Dimension;
    private readonly _feedback: Feedback;
    private readonly _propertiesManager: StructurePropertiesManager;
    public blocksManager: StructureBlocksManager;

    public fillConfig = {
        isActive: false,
        blockName: "minecraft:gold_block",
        tickInterval: 1,
        blocksPerTick: 50
    }

    private _cacheConfig = {
        fillStatusCache: new Map<string, { isComplete: boolean, timestamp: number }>(),
        expiryTime: 20000
    }

    /**
     * Creates a new instance of the TntCoinStructure class.
     * @param {Player} player The player to create the structure for.
     */
    constructor(player: Player) {
        const registry = ServiceRegistry.getInstance();
        this._player = player;
        this._dimension = player.dimension;
        this._feedback = registry.get("PlayerMessageService");
        this.blocksManager = new StructureBlocksManager();
        this._propertiesManager = new StructurePropertiesManager(player);
    }

    get key(): string {
        return this._propertiesManager.structureKey;
    }

    public get structureProperties() {
        return this._propertiesManager.getStructureProperties();
    }

    set structureProperties(properties: StructureProperties) {
        if (!properties || !properties.width || !properties.height || !properties.centerLocation) {
            throw new Error("Invalid structure properties provided.");
        }
        this._propertiesManager.setStructureProperties(properties);
    }

    get fillSettings(): { blockName: string, tickInterval: number, blocksPerTick: number } {
        return {
            blockName: this.fillConfig.blockName,
            tickInterval: this.fillConfig.tickInterval,
            blocksPerTick: this.fillConfig.blocksPerTick
        };
    }

    set fillSettings({ blockName, tickInterval, blocksPerTick }: { blockName: string, tickInterval: number, blocksPerTick: number }) {
        this.fillConfig.blockName = blockName;
        this.fillConfig.tickInterval = tickInterval;
        this.fillConfig.blocksPerTick = blocksPerTick;
    }

    get structureWidth(): number {
        return this._propertiesManager.getStructureWidth();
    }

    get structureHeight(): number {
        return this._propertiesManager.getStructureHeight();
    }

    get structureCenter(): Vector3 {
        return this._propertiesManager.getStructureCenter();
    }

    /**
     * Generates a random location within or on top of the structure.
     * @param {number} offset The offset from the edges to avoid.
     * @param {boolean} onTop If `true`, generates a random Y on top of the structure. 
     * @returns {Vector3} A random location within or on top of the structure's bounds.
     */
    public randomLocation(offset: number, onTop: boolean = false): Vector3 {
        const { width, height, centerLocation } = this.structureProperties;
        if (!centerLocation) {
            throw new Error("Structure properties not set");
        }
        const adjustedWidth = width - (offset * 2);
        const adjustedHeight = onTop ? 1 : height - offset;
        const randomX = Math.floor(Math.random() * adjustedWidth) - Math.floor(adjustedWidth / 2);
        const randomY = onTop ? height : Math.floor(Math.random() * adjustedHeight);
        const randomZ = Math.floor(Math.random() * adjustedWidth) - Math.floor(adjustedWidth / 2);
        return {
            x: centerLocation.x + randomX,
            y: centerLocation.y + randomY,
            z: centerLocation.z + randomZ
        };
    }

    public async generateTntCoinStructure(): Promise<void> {
        const protectedBlocks: Array<{ blockName: string; location: Vector3 }> = [];

        try {
            this._iterateProtectedBlockLocations({ x: 0, y: 0, z: 0 },
                (location, blockName) => {
                    protectedBlocks.push({ blockName, location });
                }
            );

            const chunkSize = 100;
            for (const block of protectedBlocks) {
                try {
                    await BlockUtils.fill.start(
                        this._dimension,
                        block.blockName,
                        [block.location],
                        chunkSize,
                        {}
                    );
                } catch (error) {
                    console.error(`Error while generating protected blocks. Block ${block.blockName} at ${JSON.stringify(block.location)}: ${error.message}`);
                    throw error;
                }
            }
        } catch (error) {
            console.error(`Error while generating TNT Coin structure: ${error.message}`);
            throw error;
        }
    }

    /**
     * Iterates through all protected block locations in TNT Coin structure and executes a callback for each block.
     */
    private _iterateProtectedBlockLocations(
        localStartingPosition: Vector3,
        onSetBlock: (absoluteBlockLocation: Vector3, blockName: string) => void
    ): void {
        this.blocksManager.clearAirLocations();

        const properties = this.structureProperties;
        if (!properties) {
            console.error("Cannot iterate locations, structure properties not found.");
            return;
        }

        const { width, height, centerLocation, blockOptions } = properties;
        const { baseBlockName, sideBlockName, floorBlockName } = blockOptions;

        BlockUtils.iterateBlocks(localStartingPosition, (localBlockOffset) => {
            const absoluteLocation = {
                x: centerLocation.x - Math.floor(width / 2) + localBlockOffset.x,
                y: centerLocation.y + localBlockOffset.y,
                z: centerLocation.z - Math.floor(width / 2) + localBlockOffset.z,
            };

            const { x: localX, y: localY, z: localZ } = localBlockOffset;

            const isOnBottomLayer = BlockUtils.isBlockOnBottomLayer(localY);
            const isAtVerticalBoundary = BlockUtils.isBlockAtVerticalBoundary(localY, height);
            const isOnHorizontalPerimeter = BlockUtils.isBlockOnHorizontalPerimeter(localBlockOffset, width);
            const isCorner = (localX === 0 || localX === width - 1) && (localZ === 0 || localZ === width - 1);

            let blockName: string | null = null;

            if (isOnBottomLayer) {
                if (isCorner) {
                    blockName = baseBlockName;
                } else if (isOnHorizontalPerimeter) {
                    blockName = baseBlockName;
                } else {
                    blockName = floorBlockName;
                }
            } else if (isOnHorizontalPerimeter) {
                if (isCorner) {
                    blockName = baseBlockName;
                } else if (isAtVerticalBoundary) {
                    blockName = baseBlockName;
                } else {
                    blockName = sideBlockName;
                }
            }

            if (blockName) {
                onSetBlock(absoluteLocation, blockName);
                this.blocksManager.addProtectedLocation(absoluteLocation);
            } else {
                this.blocksManager.addAirLocation(absoluteLocation);
            }
        }, width, height);
    }

    public async generateBarriers(): Promise<void> {
        try {
            let barrierBlocks: Vector3[] = [];
            const barrierHeight = 7;
            const properties = this.structureProperties;
            if (!properties) throw new Error("Structure properties not set");
            const { width, height, centerLocation } = properties;
            BlockUtils.iterateBlocks({ x: 0, y: 0, z: 0 }, (blockLocation) => {
                const isBlockOnBorder = BlockUtils.isBlockOnHorizontalPerimeter(blockLocation, width);
                const isTopLayer = blockLocation.y === (barrierHeight - 1);
                if (isBlockOnBorder || isTopLayer) {
                    const absoluteLocation = {
                        x: centerLocation.x - Math.floor(width / 2) + blockLocation.x,
                        y: centerLocation.y + height + blockLocation.y,
                        z: centerLocation.z - Math.floor(width / 2) + blockLocation.z,
                    };
                    barrierBlocks.push(absoluteLocation);
                    this.blocksManager.addProtectedLocation(absoluteLocation);
                }
            }, width, barrierHeight);
            await BlockUtils.fill.start(this._dimension, 'minecraft:barrier', barrierBlocks, 100, {
                onSetBlock: (location: Vector3) => this.blocksManager.addBarrierLocation(location),
            });
            this._feedback.playSound('random.anvil_use');
        } catch (error) {
            console.error('Failed to generate barriers:', error);
            this._feedback.error("Failed to generate barriers.", { sound: "item.shield.block" });
        }
    }

    public async clearBarriers(): Promise<void> {
        try {
            const barrierLocations = this.blocksManager.getBarrierLocations();
            await BlockUtils.clearBlocks(this._dimension, barrierLocations, 100);
            for (const location of barrierLocations) {
                this.blocksManager.removeProtectedLocation(location);
            }
            this.blocksManager.clearBarrierLocations();
            this._feedback.playSound('mob.wither.break_block');
        } catch (error) {
            console.error('Failed to clear barriers:', error);
            this._feedback.error("Failed to clear barriers.", { sound: "item.shield.block" });
        }
    }

    public async destroy(): Promise<void> {
        if (this.blocksManager.protectedBlocksCount === 0) return;
        const protectedLocations = this.blocksManager.getProtectedLocations();
        try {
            await BlockUtils.clearBlocks(this._dimension, protectedLocations, 100);
            this.blocksManager.clearProtectedLocations();
            this._feedback.playSound('mob.wither.break_block');
        } catch (error) {
            console.error('Failed to clear protected structure:', error);
            this._feedback.error("Failed to clear protected structure.", { sound: "item.shield.block" });
        }
    }

    private _toggleFilling(isFilling: boolean): void {
        this.fillConfig.isActive = isFilling;
    }

    public async fill(): Promise<void> {
        if (this.fillConfig.isActive) {
            this._feedback.warning("Already filling blocks.", { sound: 'item.shield.block' });
            return;
        }
        const airLocations = this.blocksManager.getAirLocations();
        if (airLocations.length === 0) return;
        this._toggleFilling(true);
        try {
            await BlockUtils.fill.start(
                this._dimension,
                this.fillConfig.blockName,
                airLocations,
                this.fillConfig.blocksPerTick,
                {
                    delayInTicks: this.fillConfig.tickInterval,
                    isFilling: () => this.fillConfig.isActive,
                    setFilling: (isFilling: boolean) => this._toggleFilling(isFilling),
                    onSetBlock: (blockLocation: Vector3) => {
                        this.blocksManager.addFilledLocation(blockLocation);
                        this._player.playSound('block.bamboo.place');
                        this.clearFillCache();
                    },
                    onComplete: () => {
                        this._player.playSound('random.levelup');
                        const size = this.blocksManager.filledBlocksCount;
                        console.warn(`Filled ${size} blocks`);
                        this.clearFillCache();
                    }
                }
            );
        } catch (error) {
            this._toggleFilling(false);
            console.error('Failed to fill blocks: ', error);
            this._feedback.error("Failed to fill structure with blocks.", { sound: 'item.shield.block' });
        }
    }

    public stopFilling(): void {
        if (this.fillConfig.isActive) {
            this._toggleFilling(false);
            this._feedback.info("Block filling stopped.", { sound: 'note.bassattack' });
        }
    }

    /**
     * Clear blocks from the structure.
     */
    public async clearBlocks(): Promise<void> {
        const fillLocations = this.blocksManager.getFilledLocations();
        if (fillLocations.length === 0) return;
        await BlockUtils.clearBlocks(this._dimension, fillLocations, this.fillSettings.blocksPerTick);
        this.blocksManager.clearFilledLocations();
        this._feedback.playSound('mob.wither.break_block');
        this.clearFillCache();
    }

    public isStructureFilled(forceRefresh: boolean = false): boolean {
        const cacheKey = this.key;
        const now = Date.now();
        if (!forceRefresh && this._cacheConfig.fillStatusCache.has(cacheKey)) {
            const cached = this._cacheConfig.fillStatusCache.get(cacheKey)!;
            if (now - cached.timestamp < this._cacheConfig.expiryTime) {
                return cached.isComplete;
            }
        }
        const isComplete = this._checkIfStructureFilled();
        this._cacheConfig.fillStatusCache.set(cacheKey, { isComplete, timestamp: now });
        console.warn(`§bStructure Cache: '${cacheKey}' -> ${isComplete ? '§aFILLED' : '§cNOT FILLED'}§r`);
        return isComplete;
    }

    /**
     * Checks if a given location is within the structure bounds (excluding the outer walls).
     * @param {Vector3} location The location to check.
     * @returns {boolean} True if the location is within the structure interior.
     */
    public isLocationWithinStructure(location: Vector3): boolean {
        const properties = this.structureProperties;
        if (!properties) return false;
        const { width, height, centerLocation } = properties;
        const structureWorldOrigin = {
            x: centerLocation.x - Math.floor(width / 2),
            y: centerLocation.y,
            z: centerLocation.z - Math.floor(width / 2)
        };
        const relativeX = location.x - structureWorldOrigin.x;
        const relativeY = location.y - structureWorldOrigin.y;
        const relativeZ = location.z - structureWorldOrigin.z;
        return relativeX >= 1 && relativeX < width - 1 &&
               relativeY >= 1 && relativeY < height &&
               relativeZ >= 1 && relativeZ < width - 1;
    }
    
    private _checkIfStructureFilled(): boolean {
        const properties = this.structureProperties;
        if (!properties) return false;
        const { width, height, centerLocation } = properties;
        const structureWorldOrigin = {
            x: centerLocation.x - Math.floor(width / 2),
            y: centerLocation.y,
            z: centerLocation.z - Math.floor(width / 2)
        };
        try {
            this.blocksManager.clearAirLocations();
            this.blocksManager.clearFilledLocations();
            BlockUtils.iterateBlocks(
                { x: 1, y: 1, z: 1 },
                (localGridOffset) => {
                    const actualWorldLocation = BlockUtils.getRelativeBlockLocation(structureWorldOrigin, localGridOffset);
                    if (this.isLocationWithinStructure(actualWorldLocation)) {
                        if (BlockUtils.isBlockAir(this._dimension, actualWorldLocation)) {
                            this.blocksManager.addAirLocation(actualWorldLocation);
                        } else {
                            this.blocksManager.addFilledLocation(actualWorldLocation);
                        }
                    }
                },
                width - 1,
                height
            );
            const airCount = this.blocksManager.airBlocksCount;
            return airCount === 0;
        } catch (error) {
            console.error(`Failed to check if structure is filled: ${error}`);
            return false;
        }
    }

    public clearFillCache(): void {
        this._cacheConfig.fillStatusCache.delete(this.key);
    }
}