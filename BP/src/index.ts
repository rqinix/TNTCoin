/*
|
| TNT Coin for Minecraft Bedrock
|
| Author: Rqinix
| Version: 1.2.0
| Source Code: https://github.com/rqinix/TntCoin
|
*/

import { BlockType, BlockTypes, system, world } from "@minecraft/server";
import { TntCoinForm } from "app/forms/index";
import TntCoinBuilder from "app/tntcoin/TntCoinBuilder";
import TntCoinPlayerRegistry from "./app/tntcoin/TntCoinPlayerRegistry";
import { TntCoinConfigManager } from "app/tntcoin/TntCoinConfigManager";
import MathUtils from "utilities/math/MathUtils";
import BlockUtils from "utilities/blocks/BlockUtils";
import "config/tntcoin";
import { TntCoinSession } from "types";

const config = TntCoinConfigManager.getInstance();

/**
 * Loads saved TNT Coin session to player when they spawn.
 */
world.afterEvents.playerSpawn.subscribe(async event => {
    const player = event.player;
    if (!player) return;
    const playerName = player.name;
    try {
        const tntCoinProperty = player.getDynamicProperty(`TNTCOIN.STATE:${playerName}`);
        if (typeof tntCoinProperty !== 'string' || tntCoinProperty.trim() === '') {
            return;
        }
        const parsedState = JSON.parse(tntCoinProperty) as TntCoinSession;
        if (parsedState.isPlayerInGame) {
            console.warn(`Player ${playerName} has saved TNT Coin session. Loading the session...`);
            TntCoinBuilder.registerTntCoinServices(player);
            TntCoinBuilder.registerEventActionManagers(player);
            const gui = new TntCoinForm(player);
            const registry = TntCoinPlayerRegistry.getInstance();
            registry.register(player, gui);
            await gui.tntcoin.load();
            console.warn(`Successfully loaded TNT Coin session for player: ${player.name}`);
        }
    } catch (error) {
        console.warn(`Failed to load TNT Coin session for ${playerName}: ${error.message}`);
        player.sendMessage(`§cAn error occurred while loading your TNT Coin session.`);
        player.playSound('item.shield.block');
    }
});

/**
 * Handles item use events to open the TNT Coin Menu.
 */
world.beforeEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const usedItem = event.itemStack.typeId;
    const GUI_ITEM = config.getConfig<string>("GUI_ITEM");
    const tntCoinRegistry = TntCoinPlayerRegistry.getInstance();
    if (usedItem === GUI_ITEM) {
        let tntCoinGui: TntCoinForm;
        if (tntCoinRegistry.has(player)) {
            tntCoinGui = tntCoinRegistry.get(player);
        } else {
            tntCoinGui = TntCoinBuilder.createTntCoinWithGui(player);
        }
        tntCoinGui.showForm();
    }
});

/**
 * Prevents explosions from destroying the TNT Coin Structure
 */
world.beforeEvents.explosion.subscribe(event => {
    const impactedBlocks = event.getImpactedBlocks();
    const filteredBlocks = [];
    const allProtectedLocations = new Set<string>();
    const registry = TntCoinPlayerRegistry.getInstance();
    world.getAllPlayers().forEach(player => {
        const gui = registry.get(player);
        if (gui?.tntcoin.isPlayerInSession) {
            const protectedLocations = gui.tntcoin.structure.blocksManager.getProtectedLocations();
            protectedLocations.forEach(location => {
                const flooredLocation = MathUtils.floorVector3(location);
                allProtectedLocations.add(`${flooredLocation.x},${flooredLocation.y},${flooredLocation.z}`);
                gui.tntCoinStructure.clearFillCache();
            });
        }
    });
    for (const block of impactedBlocks) {
        const loc = MathUtils.floorVector3(block.location);
        const locKey = `${loc.x},${loc.y},${loc.z}`;
        if (!allProtectedLocations.has(locKey)) {
            filteredBlocks.push(block);
        }
    }
    event.setImpactedBlocks(filteredBlocks);
});

/**
 * Handles the placement of blocks by players.
 */
world.afterEvents.playerPlaceBlock.subscribe(event => {
    const player = event.player;
    const blockUsed = event.block.typeId;
    const registry = TntCoinPlayerRegistry.getInstance();
    const tntCoinGui = registry.get(player);
    const RANDOM_BLOCK_ITEM = config.getConfig<string>("RANDOM_BLOCK_ITEM");
    if (
        tntCoinGui?.tntcoin.isPlayerInSession &&
        tntCoinGui.tntcoin.settings.getTntCoinSettings().randomizeBlocks &&
        blockUsed === RANDOM_BLOCK_ITEM
    ) {
        try {
            const randomBlockType = BlockUtils.randomBlock();
            player.dimension.setBlockType(event.block.location, randomBlockType);
            tntCoinGui.tntcoin.structure.clearFillCache();
        } catch (error) {
            player.sendMessage(`§4Failed to place random block: ${error.message}`);
            player.playSound('item.shield.block');
        }
    }

    // Clear the fill cache after placing a block
    const blockLocation = MathUtils.floorVector3(event.block.location);
    const activeGui = registry.get(player);
    if (activeGui?.tntcoin.isPlayerInSession) {
        const structure = activeGui.tntcoin.structure;
        const { width, height, centerLocation } = structure.structureProperties;
        const minX = centerLocation.x - Math.floor(width / 2);
        const maxX = centerLocation.x + Math.floor(width / 2);
        const minZ = centerLocation.z - Math.floor(width / 2);
        const maxZ = centerLocation.z + Math.floor(width / 2);
        const minY = centerLocation.y;
        const maxY = centerLocation.y + height;
        if (blockLocation.x >= minX && blockLocation.x <= maxX &&
            blockLocation.z >= minZ && blockLocation.z <= maxZ &&
            blockLocation.y >= minY && blockLocation.y <= maxY) {
            structure.clearFillCache();
        }
    }
});

/**
 * Prevents players from breaking protected blocks.
 */
world.beforeEvents.playerBreakBlock.subscribe(event => {
    const block = event.block;
    const blockLocation = MathUtils.floorVector3(block.location);
    const registry = TntCoinPlayerRegistry.getInstance();
    world.getAllPlayers().forEach(player => {
        const gui = registry.get(player);
        if (gui?.tntcoin.isPlayerInSession) {
            const isProtectedBlock = gui.tntcoin.structure.blocksManager.getProtectedLocations().some((location: any) => {
                return location.x === blockLocation.x &&
                    location.y === blockLocation.y &&
                    location.z === blockLocation.z;
            });
            if (isProtectedBlock && !gui.tntcoin.settings.structureEditMode) {
                event.cancel = true;
                system.run(() => player.playSound("item.shield.block"));
            }
        }
    });
});

/**
 * Clears the fill cache when a player breaks a block within the TNT Coin structure.
 */
world.afterEvents.playerBreakBlock.subscribe(event => {
    const blockLocation = MathUtils.floorVector3(event.block.location);
    const registry = TntCoinPlayerRegistry.getInstance();
    world.getAllPlayers().forEach(activePlayer => {
        const activeGui = registry.get(activePlayer);
        if (activeGui?.tntcoin.isPlayerInSession) {
            const structure = activeGui.tntcoin.structure;
            const { width, height, centerLocation } = structure.structureProperties;
            const minX = centerLocation.x - Math.floor(width / 2);
            const maxX = centerLocation.x + Math.floor(width / 2);
            const minZ = centerLocation.z - Math.floor(width / 2);
            const maxZ = centerLocation.z + Math.floor(width / 2);
            const minY = centerLocation.y;
            const maxY = centerLocation.y + height;
            if (blockLocation.x >= minX && blockLocation.x <= maxX &&
                blockLocation.z >= minZ && blockLocation.z <= maxZ &&
                blockLocation.y >= minY && blockLocation.y <= maxY) {
                structure.clearFillCache();
            }
        }
    });
});

/**
 * Handles script events for TNT Coin
 */
system.afterEvents.scriptEventReceive.subscribe((event) => {
    const registry = TntCoinPlayerRegistry.getInstance();
    world.getAllPlayers().forEach(player => {
        const gui = registry.get(player);
        if (event.id === 'tntcoin:connected') {
            const tiktokUsername = JSON.parse(event.message).tiktokUsername;
            player.onScreenDisplay.setTitle(`§aWelcome\nto\n§cTNT§f §eCoin§f\n§b${tiktokUsername}§a!`);
        }
        if (gui?.tntcoin.isPlayerInSession) {
            gui.tntcoin.handleScriptEvents(event);
        }
    });
}, { namespaces: ['tntcoin'] });
