import { Player, Vector3, EasingType } from "@minecraft/server";
import { taskManager } from "../../lib/Managers/TaskManager";
import MathUtils from "../math/MathUtils";

interface Camera360Options {
    structurePosition: Vector3;
    radius: number; 
    height: number; 
}

export default class CameraUtils {
    public static rotateCamera360(player: Player, camera360Options: Camera360Options, tickInterval: number): string {
        player.camera.clear();

        const taskId = `rotateCamera360:${player.name}`;
        let angle = 0;

        const updateCamera = () => {
            if (!taskManager.has(taskId)) {
                player.camera.clear();
                return;
            }

            const radians = MathUtils.toRadians(angle);
            const cameraX = camera360Options.structurePosition.x + camera360Options.radius * Math.cos(radians);
            const cameraZ = camera360Options.structurePosition.z + camera360Options.radius * Math.sin(radians);
            const cameraY = camera360Options.structurePosition.y + camera360Options.height;

            const cameraCurrentPosition = { x: cameraX, y: cameraY, z: cameraZ };

            const targetToLookAt: Vector3 = camera360Options.structurePosition;

            const cameraOptions = {
                location: cameraCurrentPosition,
                facingLocation: targetToLookAt,
                easeOptions: {
                    easeTime: 0.5,
                    easeType: EasingType.Linear
                }
            };

            const speed = 10;
            angle = (angle + speed) % 360;

            if (taskManager.has(taskId)) {
                try {
                    player.camera.setCamera('minecraft:free', cameraOptions);
                } catch (e) {
                    console.error(`Error setting camera: ${e}`);
                    taskManager.clearTask(taskId);
                    player.camera.clear();
                    return;
                }
                taskManager.addTask(taskId, updateCamera, tickInterval);
            } else {
                player.camera.clear();
            }
        };

        taskManager.addTask(taskId, updateCamera, tickInterval);
        return taskId;
    }

    public static clearTaskCamera(player: Player, taskId: string): void {
        const taskIdPrefix = `${taskId}:${player.name}`;
        if (taskManager.has(taskIdPrefix)) {
            taskManager.clearTask(taskIdPrefix);
        }
        player.camera.clear();
    }
}