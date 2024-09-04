import { Player, Vector3 } from "@minecraft/server";
import { toRadians } from "../math/toRadians";
import { floorVector3 } from "../math/floorVector";

/**
 * calculates the center position of a structure relative to the player's location and rotation.
 * the structure's width is taken into account to find the center.
 * the player's rotation is used to determine the direction in which to place the structure
 * @param {Player} player the player for whom the center position is calculated.
 * @param {number} width the width of the structure for which the center position is calculated.
 * @returns {Vector3} the calculated center position of the structure relative to the player.
 */
export function getStructureCenter(player:Player, width: number): Vector3 {
    const { x, y, z } = player.location;
    const yaw = toRadians(player.getRotation().y);
    const sin = -Math.sin(yaw);
    const cos = Math.cos(yaw);
    const blockX = sin - (width / 2);
    const blockZ = cos - (width / 2);
    return floorVector3({ x: x + blockX, y, z: z + blockZ });
}
