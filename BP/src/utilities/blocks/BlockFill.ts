import { BlockPermutation, Dimension, Vector3 } from "@minecraft/server";
import { batch } from "../batch";

export default class BlockFill {
    private static defaultFillOptions = {
        delayInTicks: 5,
        isFilling: () => true,
        setFilling: (value: boolean) => { },
        onSetBlock: (location: Vector3) => { },
        onComplete: () => { },
    };

    /**
     * Fills blocks in the specified locations with the given block name.
     * @param dimension - The dimension to fill blocks in.
     * @param blockName - The name of the block to fill.
     * @param blockLocations - The locations of the blocks to fill.
     * @param chunkSize - Amount of blocks to fill in each batch.
     * @param fillOptions - Options for the filling process.
     * @returns A promise that resolves when the filling process is complete.
     */
    public static async start(
        dimension: Dimension,
        blockName: string,
        blockLocations: Vector3[],
        chunkSize: number,
        fillOptions: {
            delayInTicks?: number,
            isFilling?: () => boolean,
            setFilling?: (value: boolean) => void,
            onSetBlock?: (location: Vector3) => void,
            onComplete?: () => void,
        } = {}
    ): Promise<void> {
        const options = { ...BlockFill.defaultFillOptions, ...fillOptions };

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
}