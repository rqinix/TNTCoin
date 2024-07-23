import { Player, Vector3, EasingType } from "@minecraft/server";
import { taskManager } from "../../lib/TaskManager";
import { toRadians } from "../math/toRadians";

/**
 * Rotates the player's camera around a structure.
 * @param {Player} player The player to rotate the camera for.
 * @param {string} timeoutId The id of the timeout task.
 * @param {Vector3} structurePosition The position of the structure to rotate around.
 * @param {number} radius The distance from the center.
 * @param {number} height The height of the camera.
 * @param {number} tickInterval The interval in ticks between each rotation.
 */
export function rotateCamera360(player: Player, timeoutId: string, structurePosition: Vector3, radius: number, height: number, tickInterval: number): void {
    let angle = 0;

    const updateCamera = () => {
        if(!taskManager.has(timeoutId)) return;

        const radians = toRadians(angle);
        const x = structurePosition.x + radius * Math.cos(radians);
        const z = structurePosition.z + radius * Math.sin(radians);
        const y = structurePosition.y + height;

        const cameraOptions = {
            location: { x, y, z },
            facingLocation: structurePosition,
            easeOptions: {
                easeTime: 0.5,
                easeType: EasingType.Linear
            }
        };

        angle = (angle + 10) % 360;
        
        if (taskManager.has(timeoutId)) {
            player.camera.setCamera('minecraft:free', cameraOptions);
            taskManager.addTimeout(timeoutId, updateCamera, tickInterval);
        }
    };

    taskManager.addTimeout(timeoutId, updateCamera, tickInterval);
}

