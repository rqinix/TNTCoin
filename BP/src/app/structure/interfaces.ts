import { Dimension, Vector3 } from "@minecraft/server";
import TntCoinStructure  from "./TntCoinStructure";

export interface BarrierGeneratorInterface {
    generate(tntCoinStructure: TntCoinStructure): Promise<void>;
}

export interface FillInterface {
    fill(dimension: Dimension, blockName: string, locations: Vector3[] | (() => Vector3[]), blocksPerTick: number, options: FillOptions): Promise<void>;
}

export interface ClearBlocksInterface {
    clear(dimension: Dimension, locations: Vector3[], chunkSize: number): Promise<void>;
}

export interface LocationManager {
    addAirLocation(location: Vector3): void;
    addFilledLocation(location: Vector3): void;
    addProtectedLocation(location: Vector3): void;
    addBarrierLocation(location: Vector3): void;
    getAirLocations(): Vector3[];
    getFilledLocations(): Vector3[];
    getProtectedLocations(): Vector3[];
    getBarrierLocations(): Vector3[];
    clearAirLocations(): void;
    clearFilledLocations(): void;
    clearProtectedLocations(): void;
    clearBarrierLocations(): void;
    isLocationProtected(location: Vector3): boolean;
    isLocationBarrier(location: Vector3): boolean;
    isLocationFilled(location: Vector3): boolean;
    isLocationAir(location: Vector3): boolean;
}

export interface PropertiesManager {
    getStructureProperties(): StructureProperties;
    setStructureProperties(properties: StructureProperties): void;
    getStructureWidth(): number;
    getStructureHeight(): number;
    getStructureCenter(): Vector3;
}

export interface FillOptions {
    delayInTicks?: number;
    isFilling?: () => boolean;
    setFilling?: (isFilling: boolean) => void;
    onSetBlock?: (location: Vector3) => void;
    onComplete?: () => void;
}

export interface StructureProperties {
    width: number;
    height: number;
    centerLocation: Vector3;
    blockOptions: {
        baseBlockName: string;
        sideBlockName: string;
        floorBlockName: string;
    };
}

export interface Command {
    execute(): Promise<void>;
}
