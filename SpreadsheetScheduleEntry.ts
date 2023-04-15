import {RaceId} from "./RaceId";
import {MidosHouseScheduleEntry} from "./MidosHouseScheduleEntry";

export class SpreadsheetScheduleEntry {
    readonly raceId: RaceId
    readonly scheduledStart: Date
    readonly runner1Id: string
    readonly runner1Name: string
    readonly runner2Id: string
    readonly runner2Name: string
    readonly isCancelled: boolean
    readonly bothRunnersConsentToRestream: boolean

    constructor(raceId: RaceId, scheduledStart: Date, runner1Id: string, runner1Name: string, runner2Id: string, runner2Name: string, isCancelled: boolean, bothRunnersConsentToRestream: boolean) {
        this.raceId = raceId;
        this.scheduledStart = scheduledStart;
        this.runner1Id = runner1Id;
        this.runner1Name = runner1Name;
        this.runner2Id = runner2Id;
        this.runner2Name = runner2Name;
        this.isCancelled = isCancelled;
        this.bothRunnersConsentToRestream = bothRunnersConsentToRestream;
    }

    public withRaceCancelled() {
        return new SpreadsheetScheduleEntry(this.raceId,
            this.scheduledStart,
            this.runner1Id,
            this.runner1Name,
            this.runner2Id,
            this.runner2Name,
            true,
            this.bothRunnersConsentToRestream)
    }

    public withRestreamConsent() {
        return new SpreadsheetScheduleEntry(this.raceId,
            this.scheduledStart,
            this.runner1Id,
            this.runner1Name,
            this.runner2Id,
            this.runner2Name,
            this.isCancelled,
            true)
    }

    public withUpdatedNames(mhEntry: MidosHouseScheduleEntry) {
        return new SpreadsheetScheduleEntry(this.raceId,
            this.scheduledStart,
            this.runner1Id,
            mhEntry.runner1Name,
            this.runner2Id,
            mhEntry.runner2Name,
            this.isCancelled,
            this.bothRunnersConsentToRestream)
    }

    public matches(mhEntry: MidosHouseScheduleEntry): boolean {
        return this.raceDataMatches(mhEntry) &&
            this.bothRunnersConsentToRestream == mhEntry.bothRunnersConsentToRestream
    }

    public onlyNewRestreamConsentWasGiven(mhEntry: MidosHouseScheduleEntry): boolean {
        return this.raceDataMatches(mhEntry) &&
            this.bothRunnersConsentToRestream == false &&
            mhEntry.bothRunnersConsentToRestream == true
    }

    public toSpreadsheetArray(): any[] {
        return [
            this.raceId.toString(),
            this.scheduledStart,
            this.runner1Id,
            this.runner1Name,
            this.runner2Id,
            this.runner2Name,
            this.isCancelled,
            this.bothRunnersConsentToRestream
        ];
    }

    private raceDataMatches(mhEntry: MidosHouseScheduleEntry): boolean {
        return this.raceId.midosHouseId == mhEntry.id &&
            this.scheduledStart.getTime() == mhEntry.scheduledStart.getTime() &&
            this.runner1Id == mhEntry.runner1Id &&
            this.runner2Id == mhEntry.runner2Id &&
            this.isCancelled == mhEntry.isCancelled;
    }

    static fromMidosHouseEntryWithDiscriminator(mhEntry: MidosHouseScheduleEntry, discriminator: number) {
        return new SpreadsheetScheduleEntry(new RaceId(mhEntry.id, discriminator),
            mhEntry.scheduledStart,
            mhEntry.runner1Id,
            mhEntry.runner1Name,
            mhEntry.runner2Id,
            mhEntry.runner2Name,
            mhEntry.isCancelled,
            mhEntry.bothRunnersConsentToRestream);
    }
}