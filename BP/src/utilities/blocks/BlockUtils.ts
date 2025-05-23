import { BlockPermutation, Dimension, Vector3 } from "@minecraft/server";
import { TntCoinConfigManager } from "app/game/TntCoinConfigManager";
import { batch } from "../batch";
import MathUtils from "../math/MathUtils";
import BlockState from "./BlockState";
import BlockFill from "./BlockFill";

export default class BlockUtils extends BlockState {
    public static fill: typeof BlockFill = BlockFill;

    public static randomBlock(): string {
        const BLOCKS = TntCoinConfigManager.getInstance().getConfig("BLOCKS") as string[];
        const randomIndex = Math.floor(Math.random() * BLOCKS.length);
        return BLOCKS[randomIndex];
    }

    /**
    * Clears blocks in the specified dimension at the given block locations.
    * @param {Dimension} dimension The dimension to clear blocks in.
    * @param {Array<Vector3>} blockLocations An array of block locations to clear.
    * @param {number} batchSize 
    * @returns {Promise<void>} a promise that resolves when the blocks have been cleared.
    */
    public static async clearBlocks(
        dimension: Dimension,
        blockLocations: Vector3[],
        batchSize: number
    ): Promise<void> {
        console.warn(`Clearing ${blockLocations.length} blocks...`);
        await batch(blockLocations, batchSize, (blockLocation) => {
            const blockAtLocation = dimension.getBlock(blockLocation);
            if (!this.isBlockAir(dimension, blockLocation)) {
                try {
                    const permutation = BlockPermutation.resolve('minecraft:air');
                    blockAtLocation.setPermutation(permutation);
                } catch (error) {
                    console.error(`Failed to clear block: ${error}`);
                }
            }
        });
        console.warn(`Cleared ${blockLocations.length} blocks.`);
    }

    /**
    * calculates the new position of a block by adding the block's current location to a given position.
    * @param {Vector3} relativePosition the given relative position to be added to the block's current location.
    * @param {Vector3} blockLocation the current location of the block.
    * @returns {Vector3} the new location of the block.
    */
    public static getRelativeBlockLocation(
        relativePosition: Vector3,
        blockLocation: Vector3
    ): Vector3 {
        return MathUtils.floorVector3({
            x: relativePosition.x + blockLocation.x,
            y: relativePosition.y + blockLocation.y,
            z: relativePosition.z + blockLocation.z,
        });
    }

    /**
    * Iterates through blocks in a specified area and applies a callback function to each block location.
    * @param {Vector3} startingPosition The starting position of the iteration.
    * @param {(blockLocation: Vector3) => void} callback The function to apply to each block location.
    * @param {number} width The width of the area to iterate through.
    * @param {number} height The height of the area to iterate through.
    */
    public static iterateBlocks(
        startingPosition: Vector3,
        callback: (blockLocation: Vector3) => void,
        width: number,
        height: number
    ): void {
        let isError = false;
        for (let blockY = startingPosition.y; blockY < height && !isError; blockY++) {
            for (let blockZ = startingPosition.z; blockZ < width && !isError; blockZ++) {
                try {
                    for (let blockX = startingPosition.x; blockX < width && !isError; blockX++) {
                        callback({ x: blockX, y: blockY, z: blockZ });
                    }
                } catch (error) {
                    isError = true;
                    throw error;
                }
            }
        }
    }

    /**
    * Iterates through blocks in a specified area and applies a callback function to each block location.
    * @param {Vector3} startingPosition The starting position of the iteration.
    * @param {(blockLocation: Vector3) => void} callback The function to apply to each block location.
    * @param {number} width The width of the area to iterate through.
    * @param {number} height The height of the area to iterate through.
    * @param {Vector3} relativeLocation The location to use for calculating the block locations.
    */
    public static applyToBlocks(
        startingPosition: Vector3,
        callback: (blockLocation: Vector3) => void,
        width: number,
        height: number,
        relativeLocation: Vector3,
    ): void {
        this.iterateBlocks(startingPosition, (blockLocation) => {
            callback(this.getRelativeBlockLocation(relativeLocation, blockLocation));
        }, width, height);
    }
}
