import { Player, Vector3 } from "@minecraft/server";
import MathUtils from "../math/MathUtils";

/**
 * calculates the center position of a structure relative to the player's location and rotation.
 * the structure's width is taken into account to find the center.
 * the player's rotation is used to determine the direction in which to place the structure
 * @param {Player} player the player for whom the center position is calculated.
 * @param {number} width the width of the structure for which the center position is calculated.
 * @returns {Vector3} the calculated center position of the structure relative to the player.
 */
export function getStructureCenter(player: Player, width: number): Vector3 {
    const { x, y, z } = player.location;
    const yaw = MathUtils.toRadians(player.getRotation().y);
    const sin = -Math.sin(yaw);
    const cos = Math.cos(yaw);
    const offset = width / 2;
    const centerX = x + Math.round(sin * offset);
    const centerZ = z + Math.round(cos * offset);
    const structureCenter = MathUtils.floorVector3({ 
        x: centerX, 
        y, 
        z: centerZ 
    });
    return structureCenter;
}
