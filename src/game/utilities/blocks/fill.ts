import { Block, BlockPermutation, Dimension, Vector3 } from "@minecraft/server";
import { batch } from "../batch";

const defaultFillSettings = {
    delayInTicks: 0,
    isFilling: () => true,
    setFilling: () => {},
    onSetBlock: () => {},
    onComplete: () => {},
};

/**
 * Fills blocks in the specified locations with the given block name.
 * @param {Dimension} dimension The dimension to fill blocks in.
 * @param {string} blockName The name of the block to fill.
 * @param {Vector3[]} blockLocations The locations of the blocks to fill.
 * @param {number} chunkSize Amount of blocks to fill in each batch.
 * @param {Object} fillSettings Control options for the filling process.
 * @returns {Promise<void>} A promise that resolves when the filling process is complete.
 */
export async function fill(
    dimension: Dimension,
    blockName: string,
    blockLocations: Vector3[], 
    chunkSize: number,
    fillSettings: { 
        delayInTicks?: number,
        isFilling?: () => boolean, 
        setFilling?: (value: boolean) => void,
        onSetBlock?: (location: Vector3) => void,
        onComplete?: () => void,
    } = {}
): Promise<void> {
    const options = { ...defaultFillSettings, ...fillSettings };

    let permutation: BlockPermutation;
    try {
        permutation = BlockPermutation.resolve(blockName);
    } catch (error) {
        throw new Error(`Invalid block name: ${blockName}. Error: ${error.message}`);
    }

    const setBlock = (blockLocation: Vector3): void => {
        if (!options.isFilling()) return;

        try {
            const blockAtLocation = dimension.getBlock(blockLocation);
            if (!blockAtLocation) {
                throw new Error(`Block at location ${blockLocation} is undefined.`);
            }

            blockAtLocation.setPermutation(permutation);
            options.onSetBlock(blockLocation);
        } catch (error) {
            console.error(`Failed to set block at location ${blockLocation}: ${error.message}`);
            throw error; 
        }
    };

    try {
        await batch(
            blockLocations, 
            chunkSize, 
            setBlock, 
            { 
                delayInTicks: options.delayInTicks,
                shouldContinue: options.isFilling,
                onComplete: options.onComplete,
            }
        );

        options.setFilling(false);
    } catch (error) {
        console.error(`Failed to fill blocks: ${error.message}`);
        throw error; 
    }
}
