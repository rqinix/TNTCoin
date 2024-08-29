import { TNTCoin } from "../../TNTCoin";


export async function onCountdownCancelled(game: TNTCoin): Promise<void> {
    const TITLE = '§cOHHH NOOOO!!!§r';
    const SOUND = 'random.totem';

    game.feedback.showFeedbackScreen({ 
        title: TITLE, 
        sound: SOUND 
    });
}