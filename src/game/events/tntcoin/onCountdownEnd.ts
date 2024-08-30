import { TNTCoin } from "../../TNTCoin";
import { onWin } from "./onWin";

/**
 * Event called when the countdown ends
 */
export async function onCountdownEnd(game: TNTCoin): Promise<void> {
    await onWin(game);
}