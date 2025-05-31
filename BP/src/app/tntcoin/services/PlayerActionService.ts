import { Vector3 } from "@minecraft/server";
import { TntCoin } from "../index";
import { summonEntities } from "utilities/entities/summonEntities";
import { batch } from "utilities/batch";

export class PlayerActionService {
    /**
     * Teleport the player to a specific height relative to the structure center
     * @param tntCoinInstance The TntCoin instance
     * @param height The height offset from structure center (default: 1)
     */
    public teleportPlayer(tntCoinInstance: TntCoin, height: number = 1): void {
        const { x, y, z } = tntCoinInstance.structure.structureCenter;
        const location = { x, y: y + height, z };
        tntCoinInstance.player.teleport(location);
        tntCoinInstance.feedback.playSound('mob.shulker.teleport');
    }

    /**
     * Summon entities according to the specified options
     * @param tntCoinInstance The TntCoin instance
     * @param options Entity summoning options
     */
    public summonEntities(tntCoinInstance: TntCoin, options: SummonOptions): void {
        tntCoinInstance.settings.summonEntitySettings = options;
        summonEntities(tntCoinInstance, options);
    }

    /**
     * Summon fireworks at random locations
     * @param tntCoinInstance The TntCoin instance
     * @param amount The number of fireworks to summon
     */
    public summonFireworks(tntCoinInstance: TntCoin, amount: number): void {
        const locations = Array.from({ length: amount }, () => tntCoinInstance.structure.randomLocation(2));
        const particle = 'tntcoin:firework_1';
        batch(locations, 3, (location: Vector3) => {
            tntCoinInstance.player.dimension.spawnParticle(particle, location);
            tntCoinInstance.player.playSound('firework.large_blast');
            tntCoinInstance.player.playSound('firework.twinkle');
        }, {
            delayInTicks: 10
        });
    }

    /**
     * Summon TNT at random locations within the structure
     * @param tntCoinInstance The TntCoin instance
     */
    public summonTNT(tntCoinInstance: TntCoin): void {
        this.summonEntities(tntCoinInstance, {
            entityName: 'tnt_minecart',
            locationType: 'random',
            onTop: true
        });
    }
}