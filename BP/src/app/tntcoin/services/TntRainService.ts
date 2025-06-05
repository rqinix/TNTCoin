import { Player, Vector3, system } from "@minecraft/server";
import { Timer, TimerEventData } from "lib/System/Timer";
import { Actionbar } from "lib/ScreenDisplay/Actionbar";
import EventEmitter from "lib/Events/EventEmitter";
import { TntCoin } from "../TntCoin";
import TntCoinStructure from "app/structure/TntCoinStructure";
import { summonEntities } from "utilities/entities/summonEntities";
import CameraUtils from "utilities/camera/CameraUtils";
import { taskManager } from "lib/Managers/TaskManager";
import ServiceRegistry from "lib/System/ServiceRegistry";

export interface TntRainState {
    isActive: boolean;
    phase: 'ramp' | 'bombard' | 'inactive';
    startTime: number;
    duration: number;
    intensity: number;
    entityType: string;
    enableCameraShake: boolean;
    effectsActive: boolean;
    rainCoin: boolean;
}

export class TntRainService {
    private _player: Player;
    private _tntcoin: TntCoin;
    private _structure: TntCoinStructure;
    private _actionbar: Actionbar;
    private _rainTimer: Timer;
    private _phaseTimer: Timer;
    private _spawnTaskId: string;
    private _cameraShakeTaskId: string;
    private _particleTaskId: string;
    private _rainState: TntRainState;

    constructor(player: Player, tntcoin: TntCoin, structure: TntCoinStructure, actionbar?: Actionbar) {
        this._player = player;
        this._tntcoin = tntcoin;
        this._structure = structure;
        this._actionbar = actionbar ?? new Actionbar(player);
        this._spawnTaskId = `tnt_rain_spawn:${player.name}`;
        this._cameraShakeTaskId = `tnt_rain_shake:${player.name}`;
        this._particleTaskId = `tnt_rain_particles:${player.name}`;

        this._rainState = {
            isActive: false,
            phase: 'inactive',
            startTime: 0,
            duration: 0,
            intensity: 1.0,
            entityType: 'minecraft:tnt',
            enableCameraShake: true,
            effectsActive: false,
            rainCoin: true
        };

        this._initializeTimers();
        this._initializeRainEvents();
    }

    /**
     * Initialize rain timers
     */
    private _initializeTimers(): void {
        this._rainTimer = new Timer(this._player, 30, this._actionbar, "Rain Time", "Entity Rain");
        this._phaseTimer = new Timer(this._player, 5, this._actionbar, "Phase", "Entity Rain Phase");
    }

    /**
     * Initialize rain-related events
     */
    private _initializeRainEvents(): void {
        const eventEmitter = EventEmitter.getInstance();
        eventEmitter.subscribe(this._rainTimer.events.ended, () => {
            this.stopRain();
        });
        eventEmitter.subscribe(this._phaseTimer.events.ended, () => {
            if (this._rainState.phase === 'ramp') {
                this._startBombardPhase();
            }
        });
    }

    /**
     * Check if rain is active
     */
    public get isRainActive(): boolean {
        return this._rainState.isActive;
    }

    /**
     * Get current rain state
     */
    public get rainState(): TntRainState {
        return { ...this._rainState };
    }

    /**
     * Start Entity Rain with specified parameters
     */
    public startRain(
        duration: number,
        intensity: number = 2.0,
        entityType: string = 'minecraft:tnt',
        enableCameraShake: boolean = true,
        rainCoin: boolean = true
    ): void {
        if (this._rainState.isActive) {
            throw new Error('Entity Rain is already active');
        }
        this._rainState = {
            isActive: true,
            phase: 'ramp',
            startTime: Date.now(),
            duration: duration,
            intensity: intensity,
            entityType: entityType,
            enableCameraShake: enableCameraShake,
            effectsActive: true,
            rainCoin: rainCoin
        };
        this._rainTimer.setTimerDuration(duration);
        this._phaseTimer.setTimerDuration(5);
        this._startVisualEffects();
        this._startRampPhase();
        this._rainTimer.start();
        const entityDisplayName = this._getEntityDisplayName(entityType);
        this._player.sendMessage(`§c§l${entityDisplayName.toUpperCase()} RAIN STARTED!`);
        this._player.playSound('ambient.weather.thunder');
        this._player.playSound('raid.horn');
        this._player.playSound('ambient.weather.lightning.impact');
        this._player.playSound('ambient.weather.rain');
    }

    /**
     * Stop Entity Rain and cleanup all effects
     */
    public stopRain(): void {
        if (!this._rainState.isActive) {
            return;
        }

        const entityDisplayName = this._getEntityDisplayName(this._rainState.entityType);

        // Stop all timers
        this._rainTimer.stop();
        this._phaseTimer.stop();

        // Clear all tasks
        taskManager.clearTask(this._spawnTaskId);
        taskManager.clearTask(this._cameraShakeTaskId);
        taskManager.clearTask(this._particleTaskId);

        // Stop visual effects
        this._stopVisualEffects();

        // Reset state
        this._rainState = {
            isActive: false,
            phase: 'inactive',
            startTime: 0,
            duration: 0,
            intensity: 1.0,
            entityType: 'minecraft:tnt',
            enableCameraShake: true,
            effectsActive: false,
            rainCoin: true
        };

        // Notify player
        this._player.sendMessage(`§a§l${entityDisplayName.toUpperCase()} RAIN ENDED!`);
        this._player.playSound('random.levelup');
    }

    /**
     * Start the ramp phase
     */
    private _startRampPhase(): void {
        this._rainState.phase = 'ramp';
        this._phaseTimer.start();
        let rampTick = 0;
        const maxRampTicks = 100;
        const rampSpawning = () => {
            if (!this._rainState.isActive || this._rainState.phase !== 'ramp') {
                return;
            }
            rampTick++;
            const progress = rampTick / maxRampTicks;
            const baseRate = 1 + (4 * Math.pow(progress, 2));
            const shouldSpawn = Math.random() < (baseRate / 20);
            if (shouldSpawn) {
                this._spawnEntity();
            }
            if (rampTick < maxRampTicks && this._rainState.phase === 'ramp') {
                taskManager.addTask(this._spawnTaskId, rampSpawning, 1);
            }
        };
        taskManager.addTask(this._spawnTaskId, rampSpawning, 1);
    }

    /**
     * Start the bombard phase
     */
    private _startBombardPhase(): void {
        this._rainState.phase = 'bombard';
        taskManager.clearTask(this._spawnTaskId);
        const bombardRate = Math.floor(20 / (10 * this._rainState.intensity));
        const bombardSpawning = () => {
            if (!this._rainState.isActive || this._rainState.phase !== 'bombard') {
                return;
            }
            this._spawnEntity();
            taskManager.addTask(this._spawnTaskId, bombardSpawning, bombardRate);
        };
        taskManager.addTask(this._spawnTaskId, bombardSpawning, bombardRate);
        this._player.playSound('mob.wither.spawn');
    }

    /**
     * Spawn an entity at random location above structure
     */
    private _spawnEntity(): void {
        const center = this._structure.structureCenter;
        const radius = Math.max(this._structure.structureHeight, this._structure.structureWidth) / 2;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        const spawnLocation: Vector3 = {
            x: center.x + Math.cos(angle) * distance,
            y: center.y + this._structure.structureHeight + 15 + Math.random() * 5,
            z: center.z + Math.sin(angle) * distance
        };

        try {
            summonEntities(this._tntcoin, {
                entityName: this._rainState.entityType,
                amount: 1,
                customLocations: [spawnLocation],
                batchSize: 1,
                batchDelay: 1,
                onSummon: () => {
                    if (this._rainState.effectsActive) {
                        this._player.playSound('random.orb');
                    }
                }
            });
        } catch (error) {
            console.warn(`Failed to spawn entity during rain: ${error}`);
        }
    }

    /**
     * Start all visual effects (camera shake, particles)
     */
    private _startVisualEffects(): void {
        if (this._rainState.enableCameraShake) {
            this._startCameraShake();
        }
        if (this._rainState.rainCoin) {
            this._startParticleEffect();
        }
    }

    /**
     * Stop all visual effects
     */
    private _stopVisualEffects(): void {
        this._stopCameraShake();
        this._stopParticleEffect();
    }

    /**
     * Start camera shake effect
     */
    private _startCameraShake(): void {
        if (!this._rainState.enableCameraShake) {
            return;
        }

        let shakeIntensity = 0.1;
        const shakeCamera = () => {
            if (!this._rainState.isActive || !this._rainState.enableCameraShake) {
                return;
            }
            shakeIntensity = this._rainState.phase === 'bombard' ? 0.1 * this._rainState.intensity : 0.1;
            
            try {
                this._player.runCommand(`camerashake add @s ${shakeIntensity} ${shakeIntensity} rotational`);
            } catch (error) {
                console.warn(`Camera shake error: ${error}`);
            }
            
            taskManager.addTask(this._cameraShakeTaskId, shakeCamera, 5);
        };
        taskManager.addTask(this._cameraShakeTaskId, shakeCamera, 2);
    }

    /**
     * Stop camera shake
     */
    private _stopCameraShake(): void {
        taskManager.clearTask(this._cameraShakeTaskId);
        try {
            this._player.camera.clear();
        } catch (error) {
            console.warn(`Failed to clear camera: ${error}`);
        }
    }

    /**
     * Start particle effect at structure center
     */
    private _startParticleEffect(): void {
        const particleSpawning = () => {
            if (!this._rainState.isActive) {
                return;
            }
            try {
                const center = this._structure.structureCenter;
                const particleLocation = {
                    x: center.x,
                    y: center.y + this._structure.structureHeight + 8,
                    z: center.z
                };
                this._player.dimension.spawnParticle('tntcoin:rain', particleLocation);
            } catch (error) {
                console.warn(`Failed to spawn particles: ${error}`);
            }
            const particleRate = this._rainState.phase === 'bombard' ? 30 : 10;
            taskManager.addTask(this._particleTaskId, particleSpawning, particleRate);
        };
        taskManager.addTask(this._particleTaskId, particleSpawning, 80);
    }

    /**
     * Stop particle effects
     */
    private _stopParticleEffect(): void {
        taskManager.clearTask(this._particleTaskId);
    }

    /**
     * Get display name for entity type
     */
    private _getEntityDisplayName(entityType: string): string {
        const cleanName = entityType.replace('minecraft:', '').replace(/_/g, ' ');
        return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    }
}
