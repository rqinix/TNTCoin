import { Vector3 } from "@minecraft/server";

/**
* rounds the x, y, and z components of the given vector to the nearest whole number.
* @param {Vector3} vector the vector to round.
* @returns {Vector3} a new vector with the rounded components.
*/
export function floorVector3(vector: Vector3): Vector3 {
    return {
        x: Math.floor(vector.x),
        y: Math.floor(vector.y),
        z: Math.floor(vector.z)
    };
}