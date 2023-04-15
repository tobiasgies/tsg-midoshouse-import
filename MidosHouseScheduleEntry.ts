export class MidosHouseScheduleEntry {
    readonly id: string;
    readonly scheduledStart: Date;
    readonly runner1Id: string;
    readonly runner1Name: string;
    readonly runner2Id: string;
    readonly runner2Name: string;
    readonly isCancelled: boolean;
    readonly bothRunnersConsentToRestream: boolean;

    constructor(id: string,
                scheduledStart: Date,
                runner1Id: string,
                runner1Name: string,
                runner2Id: string,
                runner2Name: string,
                isCancelled: boolean,
                bothRunnersConsentToRestream: boolean) {
        this.id = id;
        this.scheduledStart = scheduledStart;
        this.runner1Id = runner1Id;
        this.runner1Name = runner1Name;
        this.runner2Id = runner2Id;
        this.runner2Name = runner2Name;
        this.isCancelled = isCancelled;
        this.bothRunnersConsentToRestream = bothRunnersConsentToRestream;
    }
}