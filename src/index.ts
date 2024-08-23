/*
|
| TNT Coin for Minecraft Bedrock
|
| Author: Rqinix
| Version: 1.0.0
| Source Code: https://github.com/rqinix/MCBE-TNTCoin-BP
|
*/

import { BlockPermutation, system, Vector3, world } from "@minecraft/server";
import { floorVector3 } from "./game/utilities/math/floorVector";
import { GUI_ITEM, RANDOM_BLOCK_ITEM } from "./config";
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
        const gui = INGAME_PLAYERS.get(player.name);
        if (gui && gui.game.isPlayerInGame) {
            const blockLocation = JSON.stringify(floorVector3(block.location));
            if (gui.game.structure.protectedBlockLocations.has(blockLocation)) {
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
    
    const allProtectedLocations = new Set<string>();
    for (const player of players) {
        const gui = INGAME_PLAYERS.get(player.name);
        if (gui && gui.game.isPlayerInGame) {
            for (const location of gui.game.structure.protectedBlockLocations) {
                allProtectedLocations.add(location);
            }
        }
    }
    
    event.setImpactedBlocks(impactedBlocks.filter((block) => {
        const blockLocation = JSON.stringify(floorVector3(block.location));
        return !allProtectedLocations.has(blockLocation);
    }));
});


/**
 * Loads the game state for players who are in a game when they spawn.
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
  
/**
 * Randomizes the block permutation when a player places a random block.
 */
world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const player = event.player;
    const blockLocation = event.block.location;
    const dimension = event.block.dimension;
    const blockUsed = event.block.typeId;
    const gui = INGAME_PLAYERS.get(player.name);
    if (
        gui && 
        gui.game.isPlayerInGame &&
        gui.game.gameSettings.randomizeBlocks &&
        blockUsed === RANDOM_BLOCK_ITEM
    ) {
        const randomBlockType = getRandomBlock();
        let permutation: BlockPermutation;
        try {
            permutation = BlockPermutation.resolve(randomBlockType);
        } catch (error) {
            player.sendMessage(`§4Failed to place block §c${randomBlockType}§4 name.`);
            player.playSound('item.shield.block');
        }
        const block = dimension.getBlock(blockLocation);
        block.setPermutation(permutation);
    };
});

/**
 * Handles script events for TNTCoin
 */
system.afterEvents.scriptEventReceive.subscribe((event) => {
    // const sourceEntity = event.sourceEntity;
    // const gui = INGAME_PLAYERS.get(sourceEntity.nameTag);
    // if (gui && gui.game.isPlayerInGame) gui.game.handleEvents(event);
    const players = world.getAllPlayers();
    for (const player of players) {
        const gui = INGAME_PLAYERS.get(player.name);
        if (gui && gui.game.isPlayerInGame) gui.game.handleEvents(event);
    }
}, { namespaces: ['tntcoin'] });
