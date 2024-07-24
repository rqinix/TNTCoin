/*
|
| TNT Coin for Minecraft Bedrock
|
| Author: Rqinix
| Version: 1.0.0
| Source Code: https://github.com/rqinix/MCBE-TNT-Coin
|
*/

import { system, world } from "@minecraft/server";
import { floorVector3 } from "./utilities/math/floorVector";
import { GUI_ITEM } from "./config";
import { INGAME_PLAYERS, TNTCoinGUI } from "./modules/games/tnt-coin/TNTCoinGui";

/**
 * Shows the TNT Coin GUI when a player uses the designated GUI item.
 */
world.beforeEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const usedItem = event.itemStack.typeId;
    if (usedItem === GUI_ITEM) {
        const game = INGAME_PLAYERS.get(player.name) ?? new TNTCoinGUI(player);
        game.showGui();
    }
});

/**
 * Prevents players from breaking protected blocks.
 */
world.beforeEvents.playerBreakBlock.subscribe(event => {
    const block = event.block;
    const players = world.getAllPlayers();
    for (const player of players) {
        const game = INGAME_PLAYERS.get(player.name);
        if (game && game.isPlayerInGame) {
            const blockLocation = JSON.stringify(floorVector3(block.location));
            if (game.protectedBlockLocations.has(blockLocation)) {
                event.cancel = true;
                system.run(() => player.playSound("item.shield.block"));
            }
        }
    }
});

/**
 * Prevents explosions from destroying protected blocks.
 */
world.beforeEvents.explosion.subscribe(event => {
    const impactedBlocks = event.getImpactedBlocks();
    const players = world.getAllPlayers();
    for (const player of players) {
        const game = INGAME_PLAYERS.get(player.name);
        if (game && game.isPlayerInGame) {
            event.setImpactedBlocks(impactedBlocks.filter((block) => {
                const blockLocation = JSON.stringify(floorVector3(block.location));
                return !game.protectedBlockLocations.has(blockLocation);
            }));
        }
    }
});

/**
 * Loads the game state for players who are in a game.
 */
world.afterEvents.playerSpawn.subscribe(event => {
    const player = event.player;
    const playerName = player.name;
    let gameStates: GameState;
    try {
        const gameState = event.player.getDynamicProperty("TNTCoinGameState") as string;
        gameStates = JSON.parse(gameState) as GameState;
    } catch (error) {
        console.error(`No game state found for player ${playerName}.`);
        return; 
    }
    if (gameStates.isPlayerInGame) {
        INGAME_PLAYERS
            .set(playerName, new TNTCoinGUI(player))
            .get(playerName)
            .loadGame();
    }
});
