import { TntCoin } from "./index";
import { taskManager } from "lib/Managers/TaskManager";
import MathUtils from "utilities/math/MathUtils";
import CameraUtils from "utilities/camera/CameraUtils";
import { onMaxWin } from "app/events/tntcoin/onMaxWin";
import { EVENTS } from "app/events/eventTypes";

export default class TntCoinProgressManager {

    /**
     * Checks the status of the TNT Coin
     * @param tntcoin The TntCoin instance to check
     */
    public checkStatus(tntcoin: TntCoin): void {
        taskManager.clearTask(tntcoin.taskFillCheckId);
        const check = () => {
            try {
                if (!tntcoin.isPlayerInSession) {
                    taskManager.clearTask(tntcoin.taskFillCheckId);
                    console.warn(`TNT Coin session for player ${tntcoin.player.name} is no longer active.`);
                    return;
                }
                this.handleTntCoinProgress(tntcoin);
                taskManager.addTask(tntcoin.taskFillCheckId, check, 10);
            } catch (error) {
                console.warn(`Error checking TNT Coin session for player ${tntcoin.player.name}: ${error.message}`);
                tntcoin.clearTasks();
            }
        };
        taskManager.addTask(tntcoin.taskFillCheckId, check, 1);
    }

    /**
     * Handles the progress of the game, including managing countdowns and checking for wins.
     * @param tntcoin The TntCoin instance
     * @param isStructureFilled Whether the structure is fully filled
     */
    private handleTntCoinProgress(tntcoin: TntCoin): void {
        try {
            if (tntcoin.isInProcess) {
                return;
            }
            
            if (tntcoin.wins.hasReachedMaxWins()) {
                onMaxWin(tntcoin);
            } else {
                this.handleTntCoinCountdown(tntcoin);
            }
        } catch (error) {
            console.error(`Error handling TNT Coin progress: ${error.message}`);
            throw error;
        }
    }

    /**
     * Manages the countdown based on whether the structure is filled or not
     * @param tntcoin The TntCoin instance
     */
    private handleTntCoinCountdown(tntcoin: TntCoin): void {
        const isStructureFilled = tntcoin.structure.isStructureFilled();
        if (!isStructureFilled && tntcoin.countdown.isCountingDown) {
            CameraUtils.clearTaskCamera(tntcoin.player, `rotateCamera360`);
            tntcoin.countdown.stop();
            tntcoin.event.publish
        } else if (isStructureFilled && !tntcoin.countdown.isCountingDown) {
            if (tntcoin.settings.getTntCoinSettings().doesCameraRotate) {
                CameraUtils.rotateCamera360(tntcoin.player, {
                    structurePosition: MathUtils.floorVector3(tntcoin.structure.structureCenter),
                    radius: tntcoin.structure.structureWidth,
                    height: tntcoin.structure.structureHeight + 12,
                }, 5);
            }
            tntcoin.countdown.start();
        }
    }
}