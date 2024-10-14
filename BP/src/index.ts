/*
|
| TNT Coin for Minecraft Bedrock
|
| Author: Rqinix
| Version: 1.1.0
| Source Code: https://github.com/rqinix/TNTCoin
|
*/

import { system, world } from "@minecraft/server";
import { floorVector3 } from "./game/utilities/math/floorVector";
import { GUI_ITEM, RANDOM_BLOCK_ITEM } from "./config/config";
import { INGAME_PLAYERS, TNTCoinGUI } from "./game/TNTCoinGui";
import { getRandomBlock } from "./game/utilities/blocks/randomBlock";

/**
 * Shows the TNT Coin GUI when a player uses the designated GUI item.
 */
world.beforeEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const usedItem = event.itemStack.typeId;
    if (usedItem === GUI_ITEM) {
        const game = INGAME_PLAYERS.get(player.name) ?? new TNTCoinGUI(player);
        game.showForm();
    }
});

/**
 * Prevents players from breaking protected blocks.
 */
world.beforeEvents.playerBreakBlock.subscribe(event => {
    const block = event.block;
    const blockLocation = JSON.stringify(floorVector3(block.location));
    world.getAllPlayers().forEach(player => {
        const gui = INGAME_PLAYERS.get(player.name);
        if (gui?.game.isPlayerInGame && gui.game.structure.protectedBlockLocations.has(blockLocation)) {
            event.cancel = true;
            system.run(() => player.playSound("item.shield.block"));
        }
    });
});

/**
 * Prevents explosions from destroying protected blocks.
 */
world.beforeEvents.explosion.subscribe(event => {
    const impactedBlocks = event.getImpactedBlocks();
    const allProtectedLocations = new Set<string>();
    
    world.getAllPlayers().forEach(player => {
        const gui = INGAME_PLAYERS.get(player.name);
        if (gui?.game.isPlayerInGame) {
            gui.game.structure.protectedBlockLocations.forEach(location => {
                allProtectedLocations.add(location);
            });
        }
    });

    event.setImpactedBlocks(impactedBlocks.filter((block) => {
        return !allProtectedLocations.has(JSON.stringify(floorVector3(block.location)));
    }));
});

/**
 * Loads the game state for players who are in a game when they spawn.
 */
world.afterEvents.playerSpawn.subscribe(async event => {
    const player = event.player;
    const playerName = player.name;
    try {
        const gameState = player.getDynamicProperty("TNTCoinGameState") as string;
        const parsedState = JSON.parse(gameState) as GameState;

        if (parsedState.isPlayerInGame) {
            const gui = new TNTCoinGUI(player);
            INGAME_PLAYERS.set(playerName, gui);
            await gui.game.loadGame();
        }
    } catch (error) {
        console.error(`No game state found or failed to load for player ${playerName}: ${error.message}`);
    }
});

/**
 * Randomizes the block permutation when a player places a random block.
 */
world.afterEvents.playerPlaceBlock.subscribe(event => {
    const player = event.player;
    const blockUsed = event.block.typeId;
    const gui = INGAME_PLAYERS.get(player.name);

    if (gui?.game.isPlayerInGame && gui.game.settings.randomizeBlocks && blockUsed === RANDOM_BLOCK_ITEM) {
        try {
            const randomBlockType = getRandomBlock();
            player.dimension.setBlockType(event.block.location, randomBlockType)
        } catch (error) {
            player.sendMessage(`§4Failed to place random block: ${error.message}`);
            player.playSound('item.shield.block');
        }
    }
});

/**
 * Handles script events for TNTCoin
 */
system.afterEvents.scriptEventReceive.subscribe((event) => {
    world.getAllPlayers().forEach(player => {
        const gui = INGAME_PLAYERS.get(player.name);
        if (event.id === 'tntcoin:connected') {
            const tiktokUserName = JSON.parse(event.message).tiktokUserName;
            player.onScreenDisplay.setTitle(`§aWelcome\nto\n§cTNT§f §eCoin§f\n§b${tiktokUserName}§a!`);
        }
        if (gui?.game.isPlayerInGame) gui.game.handleScriptEvents(event);
    });
}, { namespaces: ['tntcoin'] });
