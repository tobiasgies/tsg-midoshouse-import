export class MidosHouseScheduleEntry {
    readonly id: string;
    readonly scheduledStart: Date;
    readonly phase: string;
    readonly round: string;
    readonly game: number;
    readonly runner1Id: string;
    readonly runner1Name: string;
    readonly runner2Id: string;
    readonly runner2Name: string;
    readonly isCancelled: boolean;
    readonly bothRunnersConsentToRestream: boolean;

    constructor(id: string,
                scheduledStart: Date,
                phase: string,
                round: string,
                game: number,
                runner1Id: string,
                runner1Name: string,
                runner2Id: string,
                runner2Name: string,
                isCancelled: boolean,
                bothRunnersConsentToRestream: boolean) {
        this.id = id;
        this.scheduledStart = scheduledStart;
        this.phase = phase;
        this.round = round;
        this.game = game;
        this.runner1Id = runner1Id;
        this.runner1Name = runner1Name;
        this.runner2Id = runner2Id;
        this.runner2Name = runner2Name;
        this.isCancelled = isCancelled;
        this.bothRunnersConsentToRestream = bothRunnersConsentToRestream;
    }

    public getGameName(): string {
        return `${this.phase} ${this.round} G${this.game}`;
    }
}