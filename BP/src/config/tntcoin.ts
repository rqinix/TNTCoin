import { TntCoinConfigManager } from "app/tntcoin/TntCoinConfigManager";

const config = TntCoinConfigManager.getInstance();

/**
 * The item that will be used to open the TNT Coin GUI.
 */
config.setConfig("GUI_ITEM", "tnt_coin:gui");

/**
 * The item that will be used to place random block.
 */
config.setConfig("RANDOM_BLOCK_ITEM", "minecraft:amethyst_block");

/**
 * List of possible blocks when placing blocks using RANDOM_BLOCK_ITEM.
 */
config.setConfig("BLOCKS", [
    "minecraft:pink_wool",
    "minecraft:magenta_wool",
    "minecraft:orange_wool",
    "minecraft:lime_wool",
    "minecraft:yellow_wool",
]);

config.setConfig('TNT_COIN_CONFIG', {
    useBarriers: false,
    doesCameraRotate: true,
    randomizeBlocks: true,
    wins: 0,
    maxWins: 10,
    timerDuration: 180,
    defaultCountdownTime: 10,
    countdownTickInterval: 20
});

// Entity settings
config.setConfig('SUMMON_ENTITY_CONFIG', {
    entityName: 'tnt_minecart',
    locationType: 'random',
    onTop: true,
    amount: 10,
    batchSize: 5,
    batchDelay: 5,
    playSound: {
        playSoundOnSummon: true,
        sound: 'kururin',
    }
});