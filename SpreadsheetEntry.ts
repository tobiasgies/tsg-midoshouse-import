import {RaceId} from "./RaceId";
import {MidosHouseScheduleEntry} from "./MidosHouseScheduleEntry";
import {SupplementalData} from "./SupplementalData";

export abstract class SpreadsheetEntry<T extends SpreadsheetEntry<any>> {
    readonly raceId: RaceId
    readonly scheduledStart: Date
    readonly gameName: string
    readonly isCancelled: boolean
    readonly restreamConsent: boolean
    readonly scheduleUpdatedAt: Date

    protected constructor(raceId: RaceId,
                          scheduledStart: Date,
                          gameName: string,
                          isCancelled: boolean,
                          restreamConsent: boolean,
                          scheduleUpdatedAt: Date) {
        this.raceId = raceId;
        this.scheduledStart = scheduledStart;
        this.gameName = gameName;
        this.isCancelled = isCancelled;
        this.restreamConsent = restreamConsent;
        this.scheduleUpdatedAt = scheduleUpdatedAt;
    }

    public matches(mhEntry: MidosHouseScheduleEntry): boolean {
        return this.raceDataMatches(mhEntry) &&
            (!this.scheduledStart && !mhEntry.scheduledStart ||
                (!!this.scheduledStart && this.scheduledStart.getTime() == mhEntry.scheduledStart?.getTime())) &&
            this.restreamConsent == mhEntry.restreamConsent
    }

    public onlyNewScheduledStartWasAdded(mhEntry: MidosHouseScheduleEntry): boolean {
        return this.raceDataMatches(mhEntry) &&
            !this.scheduledStart && !!mhEntry.scheduledStart
    }

    public onlyNewRestreamConsentWasGiven(mhEntry: MidosHouseScheduleEntry): boolean {
        return this.raceDataMatches(mhEntry) &&
            this.restreamConsent == false &&
            mhEntry.restreamConsent == true
    }

    protected abstract raceDataMatches(mhEntry: MidosHouseScheduleEntry): boolean;
    public abstract withRaceCancelled(): T;
    public abstract withRestreamConsent(): T;
    public abstract withNewScheduledStart(mhEntry: MidosHouseScheduleEntry): T;
    public abstract withUpdatedNoncriticalData(mhEntry: MidosHouseScheduleEntry): T;
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
                restreamConsent: boolean,
                scheduleUpdatedAt: Date,
                runner1Supplemental?: SupplementalData,
                runner2Supplemental?: SupplementalData) {
        super(raceId, scheduledStart, gameName, isCancelled, restreamConsent, scheduleUpdatedAt);
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
            this.restreamConsent,
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
            this.restreamConsent,
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
            this.restreamConsent,
            scheduleUpdatedAt,
            this.runner1Supplemental,
            this.runner2Supplemental)
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
            this.restreamConsent,
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
            this.restreamConsent,
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
            restreamConsent: ${this.restreamConsent},
            scheduleUpdatedAt: ${this.scheduleUpdatedAt?.toISOString()}
        }`;
    }

    protected override raceDataMatches(mhEntry: MidosHouseScheduleEntry): boolean {
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
            mhEntry.restreamConsent,
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
    readonly team1Id: string
    readonly team1Name: string
    readonly team1Runner1Id: string
    readonly team1Runner1RacetimeId: string
    readonly team1Runner1Name: string
    readonly team1Runner1Supplemental?: SupplementalData
    readonly team1Runner2Id: string
    readonly team1Runner2RacetimeId: string
    readonly team1Runner2Name: string
    readonly team1Runner2Supplemental?: SupplementalData
    readonly team2Id: string
    readonly team2Name: string
    readonly team2Runner1Id: string
    readonly team2Runner1RacetimeId: string
    readonly team2Runner1Name: string
    readonly team2Runner1Supplemental?: SupplementalData
    readonly team2Runner2Id: string
    readonly team2Runner2RacetimeId: string
    readonly team2Runner2Name: string
    readonly team2Runner2Supplemental?: SupplementalData


    constructor(raceId: RaceId,
                scheduledStart: Date,
                gameName: string,
                team1Id: string,
                team1Name: string,
                team1Runner1Id: string,
                team1Runner1RacetimeId: string,
                team1Runner1Name: string,
                team1Runner1Supplemental: SupplementalData,
                team1Runner2Id: string,
                team1Runner2RacetimeId: string,
                team1Runner2Name: string,
                team1Runner2Supplemental: SupplementalData,
                team2Id: string,
                team2Name: string,
                team2Runner1Id: string,
                team2Runner1RacetimeId: string,
                team2Runner1Name: string,
                team2Runner1Supplemental: SupplementalData,
                team2Runner2Id: string,
                team2Runner2RacetimeId: string,
                team2Runner2Name: string,
                team2Runner2Supplemental: SupplementalData,
                isCancelled: boolean,
                bothRunnersConsentToRestream: boolean,
                scheduleUpdatedAt: Date) {
        super(raceId, scheduledStart, gameName, isCancelled, bothRunnersConsentToRestream, scheduleUpdatedAt);
        this.team1Id = team1Id;
        this.team1Name = team1Name;
        this.team1Runner1Id = team1Runner1Id;
        this.team1Runner1RacetimeId = team1Runner1RacetimeId;
        this.team1Runner1Name = team1Runner1Name;
        this.team1Runner1Supplemental = team1Runner1Supplemental;
        this.team1Runner2Id = team1Runner2Id;
        this.team1Runner2RacetimeId = team1Runner2RacetimeId;
        this.team1Runner2Name = team1Runner2Name;
        this.team1Runner2Supplemental = team1Runner2Supplemental;
        this.team2Id = team2Id;
        this.team2Name = team2Name;
        this.team2Runner1Id = team2Runner1Id;
        this.team2Runner1RacetimeId = team2Runner1RacetimeId;
        this.team2Runner1Name = team2Runner1Name;
        this.team2Runner1Supplemental = team2Runner1Supplemental;
        this.team2Runner2Id = team2Runner2Id;
        this.team2Runner2RacetimeId = team2Runner2RacetimeId;
        this.team2Runner2Name = team2Runner2Name;
        this.team2Runner2Supplemental = team2Runner2Supplemental;
    }

    public override withRaceCancelled(): CoOpSpreadsheetEntry {
        return new CoOpSpreadsheetEntry(
            this.raceId,
            this.scheduledStart,
            this.gameName,
            this.team1Id,
            this.team1Name,
            this.team1Runner1Id,
            this.team1Runner1RacetimeId,
            this.team1Runner1Name,
            this.team1Runner1Supplemental,
            this.team1Runner2Id,
            this.team1Runner2RacetimeId,
            this.team1Runner2Name,
            this.team1Runner2Supplemental,
            this.team2Id,
            this.team2Name,
            this.team2Runner1Id,
            this.team2Runner1RacetimeId,
            this.team2Runner1Name,
            this.team2Runner1Supplemental,
            this.team2Runner2Id,
            this.team2Runner2RacetimeId,
            this.team2Runner2Name,
            this.team2Runner2Supplemental,
            true,
            this.restreamConsent,
            this.scheduleUpdatedAt)
    }
    public override withRestreamConsent(): CoOpSpreadsheetEntry {
        return new CoOpSpreadsheetEntry(
            this.raceId,
            this.scheduledStart,
            this.gameName,
            this.team1Id,
            this.team1Name,
            this.team1Runner1Id,
            this.team1Runner1RacetimeId,
            this.team1Runner1Name,
            this.team1Runner1Supplemental,
            this.team1Runner2Id,
            this.team1Runner2RacetimeId,
            this.team1Runner2Name,
            this.team1Runner2Supplemental,
            this.team2Id,
            this.team2Name,
            this.team2Runner1Id,
            this.team2Runner1RacetimeId,
            this.team2Runner1Name,
            this.team2Runner1Supplemental,
            this.team2Runner2Id,
            this.team2Runner2RacetimeId,
            this.team2Runner2Name,
            this.team2Runner2Supplemental,
            this.isCancelled,
            true,
            this.scheduleUpdatedAt)
    }
    public override withNewScheduledStart(mhEntry: MidosHouseScheduleEntry): CoOpSpreadsheetEntry {
        if (!!this.scheduledStart) {
            throw new Error("This race already has a scheduled start, you may not change it. Cancel this race and create a new instance.");
        } else if (!mhEntry.scheduledStart) {
            throw new TypeError("No scheduled start date given in Midos.house entry.");
        }
        // Fallback for races that were manually recorded. They may not have scheduleUpdatedAt set.
        const scheduleUpdatedAt = mhEntry.scheduleUpdatedAt ?? mhEntry.scheduledStart;
        return new CoOpSpreadsheetEntry(
            this.raceId,
            mhEntry.scheduledStart,
            this.gameName,
            this.team1Id,
            this.team1Name,
            this.team1Runner1Id,
            this.team1Runner1RacetimeId,
            this.team1Runner1Name,
            this.team1Runner1Supplemental,
            this.team1Runner2Id,
            this.team1Runner2RacetimeId,
            this.team1Runner2Name,
            this.team1Runner2Supplemental,
            this.team2Id,
            this.team2Name,
            this.team2Runner1Id,
            this.team2Runner1RacetimeId,
            this.team2Runner1Name,
            this.team2Runner1Supplemental,
            this.team2Runner2Id,
            this.team2Runner2RacetimeId,
            this.team2Runner2Name,
            this.team2Runner2Supplemental,
            this.isCancelled,
            this.restreamConsent,
            scheduleUpdatedAt)
    }
    public override withUpdatedNoncriticalData(mhEntry: MidosHouseScheduleEntry): CoOpSpreadsheetEntry {
        let scheduleUpdatedAt = this.scheduleUpdatedAt;
        if (!scheduleUpdatedAt && !this.isCancelled) {
            // Update scheduling information with data that we previously weren't tracking.
            scheduleUpdatedAt = mhEntry.scheduleUpdatedAt ?? mhEntry.scheduledStart
        }
        return new CoOpSpreadsheetEntry(
            this.raceId,
            this.scheduledStart,
            mhEntry.getGameName(),
            this.team1Id,
            mhEntry.teams[0].name,
            this.team1Runner1Id,
            mhEntry.teams[0].players[0].racetimeId,
            mhEntry.teams[0].players[0].name,
            this.team1Runner1Supplemental,
            this.team1Runner2Id,
            mhEntry.teams[0].players[1].racetimeId,
            mhEntry.teams[0].players[1].name,
            this.team1Runner2Supplemental,
            this.team2Id,
            mhEntry.teams[1].name,
            this.team2Runner1Id,
            mhEntry.teams[1].players[0].racetimeId,
            mhEntry.teams[1].players[0].name,
            this.team2Runner1Supplemental,
            this.team2Runner2Id,
            mhEntry.teams[1].players[1].racetimeId,
            mhEntry.teams[1].players[1].name,
            this.team2Runner2Supplemental,
            this.isCancelled,
            this.restreamConsent,
            scheduleUpdatedAt)
    }

    public override matches(mhEntry: MidosHouseScheduleEntry): boolean {
        return this.raceDataMatches(mhEntry) &&
            (!this.scheduledStart && !mhEntry.scheduledStart ||
                (!!this.scheduledStart && this.scheduledStart.getTime() == mhEntry.scheduledStart?.getTime())) &&
            this.restreamConsent == mhEntry.restreamConsent
    }

    public toSpreadsheetArray(): any[] {
        return [
            this.raceId.toString(),
            this.scheduledStart,
            this.gameName,
            this.team1Id,
            this.team1Name,
            this.team1Runner1Id,
            this.team1Runner1RacetimeId,
            this.team1Runner1Name,
            this.team1Runner1Supplemental.country,
            this.team1Runner2Id,
            this.team1Runner2RacetimeId,
            this.team1Runner2Name,
            this.team1Runner2Supplemental.country,
            this.team2Id,
            this.team2Name,
            this.team2Runner1Id,
            this.team2Runner1RacetimeId,
            this.team2Runner1Name,
            this.team2Runner1Supplemental.country,
            this.team2Runner2Id,
            this.team2Runner2RacetimeId,
            this.team2Runner2Name,
            this.team2Runner2Supplemental.country,
            this.isCancelled,
            this.restreamConsent,
            this.scheduleUpdatedAt
        ];
    }

    protected override raceDataMatches(mhEntry: MidosHouseScheduleEntry): boolean {
        return this.raceId.midosHouseId == mhEntry.id &&
            this.team1Id == mhEntry.teams[0].id &&
            this.team2Id == mhEntry.teams[1].id &&
            this.team1Runner1Id == mhEntry.teams[0].players[0].id &&
            this.team1Runner2Id == mhEntry.teams[0].players[1].id &&
            this.team2Runner1Id == mhEntry.teams[1].players[0].id &&
            this.team2Runner2Id == mhEntry.teams[1].players[1].id &&
            this.isCancelled == mhEntry.isCancelled;
    }

    static fromMidosHouseEntryWithDiscriminator(mhEntry: MidosHouseScheduleEntry, discriminator: number) {
        return new CoOpSpreadsheetEntry(new RaceId(mhEntry.id, discriminator),
            mhEntry.scheduledStart,
            mhEntry.getGameName(),
            mhEntry.teams[0].id,
            mhEntry.teams[0].name,
            mhEntry.teams[0].players[0].id,
            mhEntry.teams[0].players[0].racetimeId,
            mhEntry.teams[0].players[0].name,
            undefined,
            mhEntry.teams[0].players[1].id,
            mhEntry.teams[0].players[1].racetimeId,
            mhEntry.teams[0].players[1].name,
            undefined,
            mhEntry.teams[1].id,
            mhEntry.teams[1].name,
            mhEntry.teams[1].players[0].id,
            mhEntry.teams[1].players[0].racetimeId,
            mhEntry.teams[1].players[0].name,
            undefined,
            mhEntry.teams[1].players[1].id,
            mhEntry.teams[1].players[1].racetimeId,
            mhEntry.teams[1].players[1].name,
            undefined,
            mhEntry.isCancelled,
            mhEntry.restreamConsent,
            mhEntry.scheduleUpdatedAt ?? mhEntry.scheduledStart);
    }

    static fromSpreadsheetArray(row: any[]): CoOpSpreadsheetEntry {
        return new CoOpSpreadsheetEntry(RaceId.fromString(row[0]),
            (!!row[1]) ? row[1] : null,
            row[2],
            row[3],
            row[4],
            row[5],
            row[6],
            row[7],
            row[8],
            row[9],
            row[10],
            row[11],
            row[12],
            row[13],
            row[14],
            row[15],
            row[16],
            row[17],
            row[18],
            row[19],
            row[20],
            row[21],
            row[22],
            !!row[23],
            !!row[24],
            (!!row[25]) ? row[25] : null)
    }
}