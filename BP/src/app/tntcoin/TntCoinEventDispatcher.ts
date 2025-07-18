import { ScriptEventCommandMessageAfterEvent } from "@minecraft/server";
import { TntCoin } from "./index";
import EventEmitter from "lib/Events/EventEmitter";
import { onGift, onFollow, onLike, onShare, onChat, onJoin } from "app/events/index";
import { EVENTS } from "app/events/eventTypes";
import { onTntCoinTimerEnded } from "app/events/tntcoin/onTntCoinTimerEnded";
import { onCountdownInterrupted } from "app/events/tntcoin/onCountdownInterrupted";
import { onCountdownEnded } from "app/events/tntcoin/onCountdownEnded";
import { TimerEventData } from "lib/System/Timer";

export default class TntCoinEventDispatcher {
    private _tntcoin: TntCoin;

    /**
     * Initializes all event listeners for a TntCoin instance
     * @param tntcoin The TntCoin instance to setup event listeners for
     */
    public initializeEventListeners(tntcoin: TntCoin): void {
        const event = EventEmitter.getInstance();
        this._tntcoin = tntcoin;

        const onCountdownCancelHandler = (data: any) => {
            if (tntcoin.player.name === data.player.name) {
                onCountdownInterrupted(tntcoin);
            }
        };

        const onCountdownEndHandler = (data: any) => {
            if (tntcoin.player.name === data.player.name) {
                onCountdownEnded(tntcoin);
            }
        };

        const onTntCoinTimerEndedHandler = (data: TimerEventData) => {
            if (data.player.name === tntcoin.player.name) {
                onTntCoinTimerEnded(tntcoin);
            }
        };

        const tntCoinTimerEvents = tntcoin.timer.events;

        tntcoin.eventMap = {
            onCountdownInterrupted: { id: EVENTS.COUNTDOWN_INTERRUPTED, handler: onCountdownInterrupted },
            onCountdownEnded: { id: EVENTS.COUNTDOWN_ENDED, handler: onCountdownEndHandler },
            onTntCoinTimerEnded: { id: tntCoinTimerEvents.ended, handler: onTntCoinTimerEndedHandler }
        };

        event.subscribe(EVENTS.COUNTDOWN_INTERRUPTED, onCountdownCancelHandler);
        event.subscribe(EVENTS.COUNTDOWN_ENDED, onCountdownEndHandler);
        event.subscribe(tntCoinTimerEvents.ended, onTntCoinTimerEndedHandler);
    }

    /**
     * Handles script events coming from WebSocket server
     * @param tntcoin The TntCoin instance
     * @param scriptEvent The script event to handle
     */
    public handleScriptEvent(tntcoin: TntCoin, scriptEvent: ScriptEventCommandMessageAfterEvent): void {
        if (!scriptEvent.id.startsWith('tntcoin')) return;

        try {
            const eventId = scriptEvent.id;
            const eventMessage = scriptEvent.message;
            let message: JoinProps | FollowProps | GiftProps | LikeProps | ShareProps | ChatProps;

            try {
                message = JSON.parse(eventMessage);
            } catch (error) {
                console.error(`Failed to parse event message: ${error}`);
                return;
            }

            switch (eventId) {
                case 'tntcoin:gift':
                    onGift(this._tntcoin, message as GiftProps);
                    break;

                case 'tntcoin:follow':
                    onFollow(this._tntcoin, message as FollowProps);
                    break;

                case 'tntcoin:like':
                    onLike(this._tntcoin, message as LikeProps);
                    break;

                case 'tntcoin:share':
                    onShare(this._tntcoin, message as ShareProps);
                    break;

                case 'tntcoin:chat':
                    onChat(this._tntcoin, message as ChatProps);
                    break;

                case 'tntcoin:join':
                    onJoin(this._tntcoin, message as JoinProps);
                    break;

                default:
                    EventEmitter.getInstance().publish(eventId, tntcoin);
                    break;
            }
        } catch (error) {
            console.error(`Error handling script event ${scriptEvent.id}: ${error}`);
        }
    }
}