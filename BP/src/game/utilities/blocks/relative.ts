import { Vector3 } from "@minecraft/server";
import { floorVector3 } from "../math/floorVector";

/**
* calculates the new position of a block by adding the block's current location to a given position.
* @param {Vector3} relativePosition the given relative position to be added to the block's current location.
* @param {Vector3} blockLocation the current location of the block.
* @returns {Vector3} the new location of the block.
*/
export function getRelativeBlockLocation(
    relativePosition: Vector3, 
    blockLocation: Vector3
): Vector3 {
    return floorVector3({
        x: relativePosition.x + blockLocation.x,
        y: relativePosition.y + blockLocation.y,
        z: relativePosition.z + blockLocation.z,
    });
}