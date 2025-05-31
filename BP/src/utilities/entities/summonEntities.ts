import { Vector3 } from "@minecraft/server";
import { TntCoin } from "app/tntcoin/TntCoin";
import BlockUtils from "../blocks/BlockUtils";
import { batch } from "../batch";

/**
 * Summons entities in the game based on the provided options.
 * @param {TntCoin} game - The game instance to summon entities for.
 * @param {SummonOptions} options - The options for summoning entities.
 */
export function summonEntities(game: TntCoin, options: SummonOptions): void {
    const {
        entityName,
        locationType = 'random', 
        onTop = false,
        amount = 1,
        clearBlocksAfterSummon = false,
        customLocations = [],
        batchSize = 10, 
        batchDelay = 10,
        playSound: {
            playSoundOnSummon = false,
            sound = 'kururin'
        } = {},
        onSummon = () => {},
    } = options;

    let locations: Vector3[] = [];

    if (customLocations.length > 0) {
        locations = customLocations;
    } else if (locationType === 'center') {
        const { structureCenter, structureHeight } = game.structure;
        const { x, y, z } = structureCenter;
        const centerLocation = { x, y: onTop ? y + structureHeight + 5 : y + 2, z };
        locations = Array(amount).fill(centerLocation);
    } else if (locationType === 'random') {
        locations = Array.from({ length: amount }, () => game.structure.randomLocation(2, onTop));
    }

    batch(
        locations,
        batchSize,
        (location) => {
            try {
                const entity = game.player.dimension.spawnEntity(entityName, location);
                if (options.newNameTag) entity.nameTag = options.newNameTag;
                if (playSoundOnSummon) game.feedback.playSound(sound);
                if (clearBlocksAfterSummon) BlockUtils.clearBlocks(game.player.dimension, [location], 100);
                onSummon();
            } catch (error) {
                game.feedback.error(`Failed to summon ${entityName} at location: ${JSON.stringify(location)}`, { sound: "item.shield.block" });
            }
        },
        { delayInTicks: batchDelay }
    );
}