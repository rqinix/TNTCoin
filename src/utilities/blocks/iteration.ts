import { Vector3 } from "@minecraft/server";
import { getRelativeBlockLocation } from "./relative";

/**
* Iterates through blocks in a specified area and applies a callback function to each block location.
* @param {Vector3} startingPosition The starting position of the iteration.
* @param {(blockLocation: Vector3) => void} callback The function to apply to each block location.
* @param {number} width The width of the area to iterate through.
* @param {number} height The height of the area to iterate through.
*/
export function iterateBlocks(
    startingPosition: Vector3, 
    callback: (blockLocation: Vector3) => void, 
    width: number, 
    height: number
): void {
    for (let blockZ = startingPosition.z; blockZ < width; blockZ++) {
        for (let blockX = startingPosition.x; blockX < width; blockX++) {
            for (let blockY = startingPosition.y; blockY < height; blockY++) {
                callback({ x: blockX, y: blockY, z: blockZ });
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
export function applyToBlocks(
    startingPosition: Vector3,
    callback: (blockLocation: Vector3) => void,
    width: number,
    height: number,
    relativeLocation: Vector3,
): void {
    iterateBlocks(startingPosition, (blockLocation) => {
        callback(getRelativeBlockLocation(relativeLocation, blockLocation));
    }, width, height);
}