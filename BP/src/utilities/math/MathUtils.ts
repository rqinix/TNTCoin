import { Vector3 } from "@minecraft/server";

export default class MathUtils {
    public static floorVector3(vector: Vector3): Vector3 {
        return {
            x: Math.floor(vector.x),
            y: Math.floor(vector.y),
            z: Math.floor(vector.z)
        };
    }

    public static toRadians(angle: number): number {
        return angle * (Math.PI / 180);
    }
}