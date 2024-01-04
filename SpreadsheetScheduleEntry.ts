import {RaceId} from "./RaceId";
import {MidosHouseScheduleEntry} from "./MidosHouseScheduleEntry";

export class SpreadsheetScheduleEntry {
    readonly raceId: RaceId
    readonly scheduledStart: Date
    readonly gameName: string
    readonly runner1Id: string
    readonly runner1RacetimeId: string
    readonly runner1Name: string
    readonly runner2Id: string
    readonly runner2RacetimeId: string
    readonly runner2Name: string
    readonly isCancelled: boolean
    readonly bothRunnersConsentToRestream: boolean
    readonly scheduleUpdatedAt: Date

    constructor(raceId: RaceId,
                scheduledStart: Date,
                gameName: string,
                runner1Id: string,
                runner1RacetimeId: string,
                runner1Name: string,
                runner2Id: string,
                runner2RacetimeId: string,
                runner2Name: string,
                isCancelled: boolean,
                bothRunnersConsentToRestream: boolean,
                scheduleUpdatedAt: Date) {
        this.raceId = raceId;
        this.scheduledStart = scheduledStart;
        this.gameName = gameName;
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

    public withRaceCancelled() {
        return new SpreadsheetScheduleEntry(this.raceId,
            this.scheduledStart,
            this.gameName,
            this.runner1Id,
            this.runner1RacetimeId,
            this.runner1Name,
            this.runner2Id,
            this.runner2RacetimeId,
            this.runner2Name,
            true,
            this.bothRunnersConsentToRestream,
            this.scheduleUpdatedAt)
    }

    public withRestreamConsent() {
        return new SpreadsheetScheduleEntry(this.raceId,
            this.scheduledStart,
            this.gameName,
            this.runner1Id,
            this.runner1RacetimeId,
            this.runner1Name,
            this.runner2Id,
            this.runner2RacetimeId,
            this.runner2Name,
            this.isCancelled,
            true,
            this.scheduleUpdatedAt)
    }

    public withNewScheduledStart(mhEntry: MidosHouseScheduleEntry) {
        if (!!this.scheduledStart) {
            throw new Error("This race already has a scheduled start, you may not change it. Cancel this race and create a new instance.");
        } else if (!mhEntry.scheduledStart || !mhEntry.scheduleUpdatedAt) {
            throw new TypeError("You may not delete the scheduled start of this race. Cancel this race and create a new instance.");
        }
        return new SpreadsheetScheduleEntry(this.raceId,
            mhEntry.scheduledStart,
            this.gameName,
            this.runner1Id,
            this.runner1RacetimeId,
            this.runner1Name,
            this.runner2Id,
            this.runner2RacetimeId,
            this.runner2Name,
            this.isCancelled,
            this.bothRunnersConsentToRestream,
            mhEntry.scheduleUpdatedAt)
    }

    public withUpdatedNoncriticalData(mhEntry: MidosHouseScheduleEntry) {
        let scheduleUpdatedAt = this.scheduleUpdatedAt;
        if (!scheduleUpdatedAt && !this.isCancelled && !!mhEntry.scheduleUpdatedAt) {
            // Update scheduling information with data that we previously weren't tracking.
            scheduleUpdatedAt = mhEntry.scheduleUpdatedAt
        }
        return new SpreadsheetScheduleEntry(this.raceId,
            this.scheduledStart,
            mhEntry.getGameName(),
            this.runner1Id,
            mhEntry.runner1RacetimeId,
            mhEntry.runner1Name,
            this.runner2Id,
            mhEntry.runner2RacetimeId,
            mhEntry.runner2Name,
            this.isCancelled,
            this.bothRunnersConsentToRestream,
            scheduleUpdatedAt)
    }

    public matches(mhEntry: MidosHouseScheduleEntry): boolean {
        return this.raceDataMatches(mhEntry) &&
            (!this.scheduledStart && !mhEntry.scheduledStart ||
                (!!this.scheduledStart && this.scheduledStart.getTime() == mhEntry.scheduledStart?.getTime())) &&
            this.bothRunnersConsentToRestream == mhEntry.bothRunnersConsentToRestream
    }

    public onlyNewScheduledStartWasAdded(mhEntry: MidosHouseScheduleEntry): boolean {
        return this.raceDataMatches(mhEntry) &&
            !this.scheduledStart && !!mhEntry.scheduledStart
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
            this.gameName,
            this.runner1Id,
            this.runner1RacetimeId,
            this.runner1Name,
            this.runner2Id,
            this.runner2RacetimeId,
            this.runner2Name,
            this.isCancelled,
            this.bothRunnersConsentToRestream,
            this.scheduleUpdatedAt
        ];
    }

    private raceDataMatches(mhEntry: MidosHouseScheduleEntry): boolean {
        return this.raceId.midosHouseId == mhEntry.id &&
            this.runner1Id == mhEntry.runner1Id &&
            this.runner2Id == mhEntry.runner2Id &&
            this.isCancelled == mhEntry.isCancelled;
    }

    static fromMidosHouseEntryWithDiscriminator(mhEntry: MidosHouseScheduleEntry, discriminator: number) {
        return new SpreadsheetScheduleEntry(new RaceId(mhEntry.id, discriminator),
            mhEntry.scheduledStart,
            mhEntry.getGameName(),
            mhEntry.runner1Id,
            mhEntry.runner1RacetimeId,
            mhEntry.runner1Name,
            mhEntry.runner2Id,
            mhEntry.runner2RacetimeId,
            mhEntry.runner2Name,
            mhEntry.isCancelled,
            mhEntry.bothRunnersConsentToRestream,
            mhEntry.scheduleUpdatedAt);
    }
}