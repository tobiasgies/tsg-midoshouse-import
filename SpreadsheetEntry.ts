import {RaceId} from "./RaceId";
import {MidosHouseScheduleEntry} from "./MidosHouseScheduleEntry";
import {SupplementalData} from "./SupplementalData";

export abstract class SpreadsheetEntry<T extends SpreadsheetEntry<any>> {
    readonly raceId: RaceId
    readonly scheduledStart: Date
    readonly gameName: string
    readonly isCancelled: boolean
    readonly bothRunnersConsentToRestream: boolean
    readonly scheduleUpdatedAt: Date

    constructor(raceId: RaceId,
                scheduledStart: Date,
                gameName: string,
                isCancelled: boolean,
                bothRunnersConsentToRestream: boolean,
                scheduleUpdatedAt: Date) {
        this.raceId = raceId;
        this.scheduledStart = scheduledStart;
        this.gameName = gameName;
        this.isCancelled = isCancelled;
        this.bothRunnersConsentToRestream = bothRunnersConsentToRestream;
        this.scheduleUpdatedAt = scheduleUpdatedAt;
    }

    public abstract withRaceCancelled(): T;
    public abstract withRestreamConsent(): T;
    public abstract withNewScheduledStart(mhEntry: MidosHouseScheduleEntry): T;
    public abstract withUpdatedNoncriticalData(mhEntry: MidosHouseScheduleEntry): T;
    public abstract matches(mhEntry: MidosHouseScheduleEntry): boolean;
    public abstract onlyNewScheduledStartWasAdded(mhEntry: MidosHouseScheduleEntry): boolean;
    public abstract onlyNewRestreamConsentWasGiven(mhEntry: MidosHouseScheduleEntry): boolean;
    public abstract toSpreadsheetArray(): any[];
}

export class SinglePlayerSpreadsheetEntry extends SpreadsheetEntry<SinglePlayerSpreadsheetEntry> {
    readonly runner1Id: string
    readonly runner1RacetimeId: string
    readonly runner1Name: string
    readonly runner1Supplemental?: SupplementalData
    readonly runner2Id: string
    readonly runner2RacetimeId: string
    readonly runner2Name: string
    readonly runner2Supplemental?: SupplementalData

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
                scheduleUpdatedAt: Date,
                runner1Supplemental?: SupplementalData,
                runner2Supplemental?: SupplementalData) {
        super(raceId, scheduledStart, gameName, isCancelled, bothRunnersConsentToRestream, scheduleUpdatedAt);
        this.runner1Id = runner1Id;
        this.runner1RacetimeId = runner1RacetimeId;
        this.runner1Name = runner1Name;
        this.runner2Id = runner2Id;
        this.runner2RacetimeId = runner2RacetimeId;
        this.runner2Name = runner2Name;
        this.runner1Supplemental = runner1Supplemental;
        this.runner2Supplemental = runner2Supplemental;
    }

    public override withRaceCancelled(): SinglePlayerSpreadsheetEntry {
        return new SinglePlayerSpreadsheetEntry(this.raceId,
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
            this.scheduleUpdatedAt,
            this.runner1Supplemental,
            this.runner2Supplemental)
    }

    public override withRestreamConsent() {
        return new SinglePlayerSpreadsheetEntry(this.raceId,
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
            this.scheduleUpdatedAt,
            this.runner1Supplemental,
            this.runner2Supplemental)
    }

    public override withNewScheduledStart(mhEntry: MidosHouseScheduleEntry) {
        if (!!this.scheduledStart) {
            throw new Error("This race already has a scheduled start, you may not change it. Cancel this race and create a new instance.");
        } else if (!mhEntry.scheduledStart) {
            throw new TypeError("No scheduled start date given in Midos.house entry.");
        }
        // Fallback for races that were manually recorded. They may not have scheduleUpdatedAt set.
        const scheduleUpdatedAt = mhEntry.scheduleUpdatedAt ?? mhEntry.scheduledStart;
        return new SinglePlayerSpreadsheetEntry(this.raceId,
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
            scheduleUpdatedAt,
            this.runner1Supplemental,
            this.runner2Supplemental)
    }

    public override withUpdatedNoncriticalData(mhEntry: MidosHouseScheduleEntry) {
        let scheduleUpdatedAt = this.scheduleUpdatedAt;
        if (!scheduleUpdatedAt && !this.isCancelled) {
            // Update scheduling information with data that we previously weren't tracking.
            scheduleUpdatedAt = mhEntry.scheduleUpdatedAt ?? mhEntry.scheduledStart
        }
        return new SinglePlayerSpreadsheetEntry(this.raceId,
            this.scheduledStart,
            mhEntry.getGameName(),
            this.runner1Id,
            mhEntry.teams[0].players[0].racetimeId,
            mhEntry.teams[0].players[0].name,
            this.runner2Id,
            mhEntry.teams[1].players[0].racetimeId,
            mhEntry.teams[1].players[0].name,
            this.isCancelled,
            this.bothRunnersConsentToRestream,
            scheduleUpdatedAt,
            this.runner1Supplemental,
            this.runner2Supplemental)
    }

    public override matches(mhEntry: MidosHouseScheduleEntry): boolean {
        return this.raceDataMatches(mhEntry) &&
            (!this.scheduledStart && !mhEntry.scheduledStart ||
                (!!this.scheduledStart && this.scheduledStart.getTime() == mhEntry.scheduledStart?.getTime())) &&
            this.bothRunnersConsentToRestream == mhEntry.bothRunnersConsentToRestream
    }

    public override onlyNewScheduledStartWasAdded(mhEntry: MidosHouseScheduleEntry): boolean {
        return this.raceDataMatches(mhEntry) &&
            !this.scheduledStart && !!mhEntry.scheduledStart
    }

    public override onlyNewRestreamConsentWasGiven(mhEntry: MidosHouseScheduleEntry): boolean {
        return this.raceDataMatches(mhEntry) &&
            this.bothRunnersConsentToRestream == false &&
            mhEntry.bothRunnersConsentToRestream == true
    }

    public override toSpreadsheetArray(): any[] {
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
            this.scheduleUpdatedAt,
            this.runner1Supplemental?.qualifierRank,
            this.runner1Supplemental?.country,
            this.runner2Supplemental?.qualifierRank,
            this.runner2Supplemental?.country
        ];
    }

    public withSupplementalData(runner1Supplemental?: SupplementalData, runner2Supplemental?: SupplementalData) {
        return new SinglePlayerSpreadsheetEntry(this.raceId,
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
            this.scheduleUpdatedAt,
            runner1Supplemental,
            runner2Supplemental)
    }

    public toString(): string {
        return `SpreadsheetScheduleEntry {
            raceId: ${this.raceId?.toString()},
            scheduledStart: ${this.scheduledStart?.toISOString()},
            gameName: ${this.gameName},
            runner1Id: ${this.runner1Id},
            runner1RacetimeId: ${this.runner1RacetimeId},
            runner1Name: ${this.runner1Name},
            runner1Supplemental: ${this.runner1Supplemental?.toString()},
            runner2Id: ${this.runner2Id},
            runner2RacetimeId: ${this.runner2RacetimeId},
            runner2Name: ${this.runner2Name},
            runner2Supplemental: ${this.runner2Supplemental?.toString()},
            isCancelled: ${this.isCancelled},
            bothRunnersConsentToRestream: ${this.bothRunnersConsentToRestream},
            scheduleUpdatedAt: ${this.scheduleUpdatedAt?.toISOString()}
        }`;
    }

    private raceDataMatches(mhEntry: MidosHouseScheduleEntry): boolean {
        return this.raceId.midosHouseId == mhEntry.id &&
            this.runner1Id == mhEntry.teams[0].players[0].id &&
            this.runner2Id == mhEntry.teams[1].players[0].id &&
            this.isCancelled == mhEntry.isCancelled;
    }

    static fromMidosHouseEntryWithDiscriminator(mhEntry: MidosHouseScheduleEntry, discriminator: number) {
        return new SinglePlayerSpreadsheetEntry(new RaceId(mhEntry.id, discriminator),
            mhEntry.scheduledStart,
            mhEntry.getGameName(),
            mhEntry.teams[0].players[0].id,
            mhEntry.teams[0].players[0].racetimeId,
            mhEntry.teams[0].players[0].name,
            mhEntry.teams[1].players[0].id,
            mhEntry.teams[1].players[0].racetimeId,
            mhEntry.teams[1].players[0].name,
            mhEntry.isCancelled,
            mhEntry.bothRunnersConsentToRestream,
            // Fallback for races that were manually recorded. They may not have scheduleUpdatedAt set.
            mhEntry.scheduleUpdatedAt ?? mhEntry.scheduledStart);
    }

    static fromSpreadsheetArray(row: any[]): SinglePlayerSpreadsheetEntry {
        return new SinglePlayerSpreadsheetEntry(RaceId.fromString(row[0]),
            (!!row[1]) ? row[1] : null,
            row[2],
            row[3],
            row[4],
            row[5],
            row[6],
            row[7],
            row[8],
            !!row[9],
            !!row[10],
            (!!row[11]) ? row[11] : null)
    }
}

export class CoOpSpreadsheetEntry extends SpreadsheetEntry<CoOpSpreadsheetEntry> {

    public withRaceCancelled(): CoOpSpreadsheetEntry {
        throw new Error("Method not implemented.");
    }
    public withRestreamConsent(): CoOpSpreadsheetEntry {
        throw new Error("Method not implemented.");
    }
    public withNewScheduledStart(mhEntry: MidosHouseScheduleEntry): CoOpSpreadsheetEntry {
        throw new Error("Method not implemented.");
    }
    public withUpdatedNoncriticalData(mhEntry: MidosHouseScheduleEntry): CoOpSpreadsheetEntry {
        throw new Error("Method not implemented.");
    }
    public matches(mhEntry: MidosHouseScheduleEntry): boolean {
        throw new Error("Method not implemented.");
    }
    public onlyNewScheduledStartWasAdded(mhEntry: MidosHouseScheduleEntry): boolean {
        throw new Error("Method not implemented.");
    }
    public onlyNewRestreamConsentWasGiven(mhEntry: MidosHouseScheduleEntry): boolean {
        throw new Error("Method not implemented.");
    }
    public toSpreadsheetArray(): any[] {
        throw new Error("Method not implemented.");
    }
}