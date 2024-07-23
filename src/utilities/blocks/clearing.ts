import { BlockPermutation, Dimension, Vector3 } from "@minecraft/server";
import { isBlockAir } from "./state";
import { batch } from "../batch";

/**
* Clears the block at the specified position in the given dimension.
* @param {Dimension} dimension The dimension to clear the block in.
* @param {Vector3} blockLocation The position of the block to clear.
*/
export function clearBlock(dimension: Dimension, blockLocation: Vector3): void {
    const blockAtLocation = dimension.getBlock(blockLocation);
    if (!isBlockAir(dimension, blockLocation)) {
        try {
            const permutation = BlockPermutation.resolve('minecraft:air');
            blockAtLocation.setPermutation(permutation);
        } catch (error) {
            console.error(`Failed to clear block: ${error}`);
        }
    }
}

/**
* Clears blocks in the specified dimension at the given block locations.
* @param {Dimension} dimension The dimension to clear blocks in.
* @param {Array<Vector3>} blockLocations An array of block locations to clear.
* @param {number} batchSize 
* @returns {Promise<void>} a promise that resolves when the blocks have been cleared.
*/
export async function clearBlocks(
    dimension: Dimension,
    blockLocations: Vector3[], 
    batchSize: number
): Promise<void> {
    await batch( blockLocations, batchSize, (blockLocation) => clearBlock(dimension, blockLocation));
}