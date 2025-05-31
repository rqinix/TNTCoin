import { TntCoin } from "app/tntcoin/TntCoin";

export async function onCountdownInterrupted(tntcoin: TntCoin): Promise<void> {
    tntcoin.feedback.displayScreen({ 
        title: '§cOHHH NOOOO!!!§r', 
        sound: 'random.totem'
    });
}