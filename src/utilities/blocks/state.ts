import { Dimension, Vector3 } from "@minecraft/server";

/**
* Checks if the block at the specified location in the given dimension is air.
* @param {Vector3} blockLocation The location of the block.
* @returns {boolean} `true` if the block is air, `false` otherwise.
*/
export function isBlockAir(dimension: Dimension, blockLocation: Vector3): boolean {
    try {
        const blockAtLocation = dimension.getBlock(blockLocation);
        return blockAtLocation && blockAtLocation.typeId === "minecraft:air";
    } catch (error) {
        console.error(`Failed to get block at location: ${error}`);
        return false;
    }
}

/**
* checks if a given y-coordinate is on the boundary of a structure.
* @param {number} y the y-coordinate of block.
* @param {number} height the height of the structure.
* @returns {boolean} `true` if the block is on the boundary, `false` otherwise.
*/
export function isBlockOnBoundary(y: number, height: number): boolean {
    return (y === 0) || (y === (height - 1));
}

/**
* checks if a given block location is on the border of a structure
* @param {Vector3} blockLocation the location of the block to check 
* @param {number} width the width of the structure
* @returns {boolean} `true` if the block is on the border, `false` otherwise
*/
export function isBlockOnBorder(blockLocation: Vector3, width: number): boolean {
    const { x, y, z } = blockLocation;
    return x === 0 || y === 0 || z === 0 || x === (width - 1) || z === (width - 1);
}

/**
* checks if a given block location is on the top edge of a structure
* @param {Vector3} blockLocation the location of the block to check
* @param {number} width the width of the structure
* @param {number} height the height of the structure
* @returns {boolean} `true` if the block is on the top edge, `false` otherwise
*/
export function isBlockOnTopEdge(blockLocation: Vector3, width: number, height: number): boolean {
    const { x, z } = blockLocation;
    return x === (height - 1) && (x === 0 || x ===(width - 1) || z === 0 || z === (width - 1));
}

/**
* Checks if a given block location is on the perimeter of a structure.
* The perimeter includes both the border and the top edge of the structure.
* @param {Vector3} blockLocation The location of the block to check.
* @param {number} width the width of the structure.
* @param {number} height the height of the structure.
* @returns {boolean} `true` if the block is on the perimeter, `false` otherwise.
*/
export function isBlockOnPerimeter(
    blockLocation: Vector3, 
    width: number, 
    height: number
): boolean {
    return isBlockOnBorder(blockLocation, width) || isBlockOnTopEdge(blockLocation, width, height);
}