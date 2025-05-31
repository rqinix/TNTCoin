import { Vector3 } from "@minecraft/server";
import { LocationManager } from "../interfaces";

export class StructureBlocksManager implements LocationManager {
    private airLocations = new Set<string>();
    private filledLocations = new Set<string>();
    private protectedLocations = new Set<string>();
    private barrierLocations = new Set<string>();
    
    addAirLocation(location: Vector3): void {
        this.airLocations.add(JSON.stringify(location));
        this.filledLocations.delete(JSON.stringify(location));
    }
    
    addFilledLocation(location: Vector3): void {
        this.filledLocations.add(JSON.stringify(location));
        this.airLocations.delete(JSON.stringify(location));
    }
    
    addProtectedLocation(location: Vector3): void {
        this.protectedLocations.add(JSON.stringify(location));
    }
    
    addBarrierLocation(location: Vector3): void {
        this.barrierLocations.add(JSON.stringify(location));
    }

    removeAirLocation(location: Vector3): void {
        this.airLocations.delete(JSON.stringify(location));
    }

    removeFilledLocation(location: Vector3): void {
        this.filledLocations.delete(JSON.stringify(location));
    }

    removeProtectedLocation(location: Vector3): void {
        this.protectedLocations.delete(JSON.stringify(location));
    }

    removeBarrierLocation(location: Vector3): void {
        this.barrierLocations.delete(JSON.stringify(location));
    }
    
    getAirLocations(): Vector3[] {
        return Array.from(this.airLocations).map((location) => JSON.parse(location));
    }
    
    getFilledLocations(): Vector3[] {
        return Array.from(this.filledLocations).map((location) => JSON.parse(location));
    }
    
    getProtectedLocations(): Vector3[] {
        return Array.from(this.protectedLocations).map((location) => JSON.parse(location));
    }
    
    getBarrierLocations(): Vector3[] {
        return Array.from(this.barrierLocations).map((location) => JSON.parse(location));
    }
    
    clearAirLocations(): void {
        this.airLocations.clear();
    }
    
    clearFilledLocations(): void {
        this.filledLocations.clear();
    }
    
    clearProtectedLocations(): void {
        this.protectedLocations.clear();
    }
    
    clearBarrierLocations(): void {
        this.barrierLocations.clear();
    }
    
    isLocationProtected(location: Vector3): boolean {
        return this.protectedLocations.has(JSON.stringify(location));
    }
    
    isLocationBarrier(location: Vector3): boolean {
        return this.barrierLocations.has(JSON.stringify(location));
    }
    
    isLocationFilled(location: Vector3): boolean {
        return this.filledLocations.has(JSON.stringify(location));
    }
    
    isLocationAir(location: Vector3): boolean {
        return this.airLocations.has(JSON.stringify(location));
    }
    
    get airBlocksCount(): number {
        return this.airLocations.size;
    }
    
    get filledBlocksCount(): number {
        return this.filledLocations.size;
    }
    
    get protectedBlocksCount(): number {
        return this.protectedLocations.size;
    }
}