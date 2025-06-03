import { BlockPermutation, Player, system, TicksPerSecond } from '@minecraft/server';
import { summonEntities } from '../../../utilities/entities/summonEntities';
import { TntCoin } from '../TntCoin';

export interface TntRocketConfig {
    entityType: string;
    duration: number;
    particles: string[];
    levitationLevel: number;
}

export class TntRocketService {
    private player: Player | null = null;
    private tntCoin: TntCoin | null = null;
    private isFlying: boolean = false;
    private flightStartTime: number = 0;
    private levitationInterval: number | null = null;
    private summonInterval: number | null = null;
    private config: TntRocketConfig;

    constructor() {
        this.config = {
            entityType: 'minecraft:tnt',
            duration: 15,
            particles: ['minecraft:white_smoke_particle', 'tntcoin:rocket_smoke'],
            levitationLevel: 10
        };
    }

    public setConfig(config: Partial<TntRocketConfig>): void {
        this.config = { ...this.config, ...config };
    }

    public getConfig(): TntRocketConfig {
        return { ...this.config };
    }

    public isPlayerFlying(): boolean {
        return this.isFlying;
    }

    public launch(player: Player, tntCoin?: TntCoin): boolean {
        if (this.isFlying) {
            return false;
        }
        this.player = player;
        this.tntCoin = tntCoin || null;
        this.isFlying = true;
        this.flightStartTime = Date.now();
        player.dimension.createExplosion(player.location, 10, { breaksBlocks: true, causesFire: true });
        player.playSound('firework.launch');
        this._levitate(this.config.levitationLevel);
        this._startEntitySummoning();
        this._startFlight();
        return true;
    }

    public abort(): boolean {
        if (!this.isFlying || !this.player) return false;
        this.player.sendMessage('§c§lTNT Rocket aborted!');
        this.player.playSound('random.break');
        this._stopFlight();
        return true;
    }

    private _startEntitySummoning(): void {
        if (!this.player) return;

        this.summonInterval = system.runInterval(() => {
            if (!this.isFlying || !this.player) {
                this._stopSummoning();
                return;
            }

            if (this.player.location.y >= this.player.dimension.heightRange.max) {
                this.abort();
                return;
            }

            const bl = { ...this.player.location, y: this.player.location.y + 2 };
            const blockage = this.player.dimension.getBlock(bl)
            const isBarrier = blockage.typeId === 'minecraft:barrier';
            if (!blockage.isAir && !isBarrier) {
                this.player.dimension.createExplosion(this.player.location, 5, { breaksBlocks: true, causesFire: true });
            }

            const playerLocation = this.player.location;
            const numEntities = 1;
            const summonLocations = [];
            for (let i = 0; i < numEntities; i++) {
                summonLocations.push({
                    ...playerLocation,
                    y: playerLocation.y - Math.random() * 2,
                });
            }

            this._spawnParticles();
            this.tntCoin.feedback.playSound('random.orb');
            this.tntCoin.feedback.playSound('elytra.loop');
            this.tntCoin.feedback.playSound('firework.large_blast');
            summonEntities(this.tntCoin, {
                entityName: this.config.entityType,
                amount: numEntities,
                customLocations: summonLocations,
                batchSize: 1,
                batchDelay: 1,
            });
        }, 2);
    }

    private _spawnParticles(): void {
        if (!this.player) return;
        const location = this.player.location;
        try {
            for (let i = 0; i < 8; i++) {
                const offsetX = (Math.random() - 0.5) * 2;
                const offsetZ = (Math.random() - 0.5);
                const particleLocation = {
                    x: location.x + offsetX,
                    y: location.y - 0.5,
                    z: location.z + offsetZ
                };
                this.player.spawnParticle('tntcoin:rocket_smoke', particleLocation);
            }
        } catch (error) {
            console.warn(`Failed to spawn particles: ${error}`);
        }
    }

    private _startFlight(): void {
        const durationTicks = this.config.duration * TicksPerSecond;
        system.runTimeout(() => {
            if (this.isFlying) {
                if (this.player) {
                    this.player.sendMessage('§a§lTNT Rocket flight completed!');
                    this.player.playSound('random.levelup');
                }
                this._stopFlight();
            }
        }, durationTicks);
    }

    private _stopFlight(): void {
        this.isFlying = false;
        this._stopSummoning();
        this.player.removeEffect('levitation');
        if (this.levitationInterval !== null) {
            system.clearRun(this.levitationInterval);
            this.levitationInterval = null;
        }
        this.player = null;
        this.tntCoin = null;
        this.flightStartTime = 0;
    }

    private _levitate(level: number): void {
        if (!this.player || !this.isFlying) return;
        try {
            this.player.removeEffect('levitation');
            const elapsedMs = Date.now() - this.flightStartTime;
            const remainingMs = (this.config.duration * 1000) - elapsedMs;
            const remainingTicks = Math.max(20, Math.floor(remainingMs / (1000 / TicksPerSecond)));
            this.player.addEffect('levitation', remainingTicks, {
                amplifier: level,
                showParticles: false
            });
        } catch (error) {
            console.warn(`Failed to apply levitation: ${error}`);
        }
    }

    private _stopSummoning(): void {
        if (this.summonInterval !== null) {
            system.clearRun(this.summonInterval);
            this.summonInterval = null;
        }
    }
}
