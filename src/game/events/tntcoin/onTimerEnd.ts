import { TNTCoin } from "../../TNTCoin";
import { onLose } from "./onLose";

export async function onTimerEnd(game: TNTCoin): Promise<void> {
    await onLose(game);
}