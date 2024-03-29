export class MidosHouseScheduleEntry {
    readonly id: string;
    readonly scheduledStart: Date;
    readonly phase: string;
    readonly round: string;
    readonly game: number;
    readonly runner1Id: string;
    readonly runner1RacetimeId: string;
    readonly runner1Name: string;
    readonly runner2Id: string;
    readonly runner2RacetimeId: string;
    readonly runner2Name: string;
    readonly isCancelled: boolean;
    readonly bothRunnersConsentToRestream: boolean;
    readonly scheduleUpdatedAt: Date;

    constructor(id: string,
                scheduledStart: Date,
                phase: string,
                round: string,
                game: number,
                runner1Id: string,
                runner1RacetimeId: string,
                runner1Name: string,
                runner2Id: string,
                runner2RacetimeId: string,
                runner2Name: string,
                isCancelled: boolean,
                bothRunnersConsentToRestream: boolean,
                scheduleUpdatedAt: Date) {
        this.id = id;
        this.scheduledStart = scheduledStart;
        this.phase = phase;
        this.round = round;
        this.game = game;
        this.runner1Id = runner1Id;
        this.runner1RacetimeId = runner1RacetimeId;
        this.runner1Name = runner1Name;
        this.runner2Id = runner2Id;
        this.runner2RacetimeId = runner2RacetimeId;
        this.runner2Name = runner2Name;
        this.isCancelled = isCancelled;
        this.bothRunnersConsentToRestream = bothRunnersConsentToRestream;
        this.scheduleUpdatedAt = scheduleUpdatedAt;
    }

    public getGameName(): string {
        let gameName = `${this.phase} ${this.round}`;
        if (!!this.game) {
            gameName = gameName + ` Game ${this.game}`;
        }
        return gameName;
    }

    public toString(): string {
        return `MidosHouseScheduleEntry {
            id: ${this.id},
            scheduledStart: ${this.scheduledStart?.toISOString()},
            phase: ${this.phase},
            round: ${this.round},
            game: ${this.game},
            runner1Id: ${this.runner1Id},
            runner1RacetimeId: ${this.runner1RacetimeId},
            runner1Name: ${this.runner1Name},
            runner2Id: ${this.runner2Id},
            runner2RacetimeId: ${this.runner2RacetimeId},
            runner2Name: ${this.runner2Name},
            isCancelled: ${this.isCancelled},
            bothRunnersConsentToRestream: ${this.bothRunnersConsentToRestream},
            scheduleUpdatedAt: ${this.scheduleUpdatedAt?.toISOString()}
        }`;
    }
}