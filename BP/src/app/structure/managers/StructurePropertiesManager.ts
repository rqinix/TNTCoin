import { Player, Vector3 } from "@minecraft/server";
import { PropertiesManager, StructureProperties } from "../interfaces";

export class StructurePropertiesManager implements PropertiesManager {
    public readonly structureKey: string;
    private player: Player;

    constructor(player: Player) {
        this.player = player;
        this.structureKey = `TNTCOIN.STRUCTURE:${player.name}`;
    }
    
    getStructureProperties(): StructureProperties | null {
        try {
            const data = this.player.getDynamicProperty(this.structureKey) as string;
            if (!data) return null;
            return JSON.parse(data) as StructureProperties;
        } catch (error) {
            console.error(`Failed to get structure data for player ${this.player.name}: `, error);
            return null;
        }
    }

    setStructureProperties(properties: StructureProperties): void {
        try {
            this.player.setDynamicProperty(this.structureKey, JSON.stringify(properties));
        } catch (error) {
            console.error(`Failed to set structure data for player ${this.player.name}: `, error);
        }
    }

    getStructureWidth(): number {
        const properties = this.getStructureProperties();
        return properties ? properties.width : 0;
    }

    getStructureHeight(): number {
        const properties = this.getStructureProperties();
        return properties ? properties.height : 0;
    }

    getStructureCenter(): Vector3 {
        const properties = this.getStructureProperties();
        return properties.centerLocation;
    }
}