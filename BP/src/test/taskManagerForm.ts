import { world } from "@minecraft/server";
import { ActionForm } from "../core/Form";
import { taskManager } from "../core/TaskManager";
import { INGAME_PLAYERS } from "../game/TNTCoinGui";

world.beforeEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const usedItem = event.itemStack.typeId;
    if (usedItem === 'minecraft:ominous_trial_key') {
        const intervals = taskManager.getIntervals();
        const timeouts = taskManager.getTimeouts();
        const form = new ActionForm(player, 'Task Manager');

        if (intervals.size === 0 && timeouts.size === 0) {
            form.body('No tasks are currently running.');
            form.button('Close');
        }

        if (intervals.size > 0) {
            form.button('§l§fInterval Tasks', () => form.show());
            intervals.forEach((_, key) => {
                form.button(`§2§kii§r§4${key}§2§kii§r\n§9(Click to Remove)§r`, () => taskManager.clearTask(key));
            });
        }

        if (timeouts.size > 0) {
            form.button('§l§fTimeout Tasks', () => form.show());
            timeouts.forEach((_, key) => {
                form.button(`§2§kii§r§4${key}§4§2§kii§r\n§9(Click to Remove)§r`, () => taskManager.clearTask(key));
            });
        }
        
        if (INGAME_PLAYERS.size > 0) {
            form.button('§l§fTNT Coin Players', () => form.show());
            INGAME_PLAYERS.forEach((tntCoinGui, playerName) => {
                form.button(`§2§kii§r§4${playerName}§2§kii§r\n§9(Click to Remove)§r`, () =>{
                    tntCoinGui.game.quitGame();
                });
            });
        }

        form.show();
    }
});