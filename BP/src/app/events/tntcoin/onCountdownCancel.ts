import { TntCoin } from "app/game/TntCoin";

export async function onCountdownCancel(tntcoin: TntCoin): Promise<void> {
    tntcoin.feedback.displayScreen({ 
        title: '§cOHHH NOOOO!!!§r', 
        sound: 'random.totem'
    });
}