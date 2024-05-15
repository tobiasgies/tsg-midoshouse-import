import {MidosHouseScheduleEntry} from "./MidosHouseScheduleEntry";
import {CoOpSpreadsheetEntry, SinglePlayerSpreadsheetEntry, SpreadsheetEntry} from "./SpreadsheetEntry";
import {SupplementalData} from "./SupplementalData";

// URL of schedule JSON on midos.house
const MIDOS_HOUSE_GQL_URL = "https://midos.house/api/v1/graphql";

// Name of sheet that stores our imported schedule data
const S7_SCHEDULE_SHEET = "Midos.house schedule - S7";

// Name of sheet that stores supplemental data that can't be obtained from Midos.house
const S7_SUPPLEMENTAL_SHEET = "Supplemental data - S7";

// Name of sheet that stores our imported schedule data
const COOP_SCHEDULE_SHEET = "Midos.house schedule - Co-Op S3";

// Name of sheet that stores supplemental data that can't be obtained from Midos.house
const COOP_SUPPLEMENTAL_SHEET = "Supplemental data - Co-Op S3";

// Range of fields that contain our imported schedule
const SINGLE_PLAYER_SHEET_RANGE = "A3:P1000";

// Range of fields that contain our imported schedule
const COOP_SHEET_RANGE = "A3:Z1000";

// Range of fields that contain our supplemental data
const SUPPLEMENTAL_SHEET_RANGE = "A2:D1000";

type SpreadsheetEntryFromRow<T extends SpreadsheetEntry<any>> = {
    (row: any[]): T
}

type SpreadsheetEntryFromMidosHouse<T extends SpreadsheetEntry<any>> = {
    (mhEntry: MidosHouseScheduleEntry, discriminator: number): T
}

function importAllSchedules() {
    importSinglePlayerSchedule("s", "7cc", S7_SCHEDULE_SHEET, S7_SUPPLEMENTAL_SHEET)
    importCoOpSchedule("coop", "3", COOP_SCHEDULE_SHEET, COOP_SUPPLEMENTAL_SHEET)
}

function importSinglePlayerSchedule(series: string, event: string, scheduleSheet: string, supplementalSheet: string) {
    const apiKey = PropertiesService.getScriptProperties().getProperty("MIDOS_HOUSE_API_KEY");
    const mhSchedule = fetchScheduleData(MIDOS_HOUSE_GQL_URL, gqlQuery(series, event), apiKey);
    const existingSchedule = fetchExistingSchedule(
        scheduleSheet,
        SINGLE_PLAYER_SHEET_RANGE,
        SinglePlayerSpreadsheetEntry.fromSpreadsheetArray
    );
    const supplemental = fetchSupplementalData(supplementalSheet, SUPPLEMENTAL_SHEET_RANGE);

    let output = compareMidosHouseAndExistingSchedule(
        mhSchedule,
        existingSchedule,
        SinglePlayerSpreadsheetEntry.fromMidosHouseEntryWithDiscriminator
    ).map(
        it => it.withSupplementalData(supplemental.get(it.runner1Id), supplemental.get(it.runner2Id))
    );

    // Sort output list by stream date/time. Unscheduled races go to end of list.
    output.sort(function (a, b) {
        if (!a.scheduledStart && !b.scheduledStart) return 0;
        else if (!b.scheduledStart) return -1;
        else if (!a.scheduledStart) return 1;
        else if (a.scheduledStart < b.scheduledStart) return -1;
        else if (a.scheduledStart > b.scheduledStart) return 1;
        else return 0;
    })

    // Overwrite entire spreadsheet with output
    saveOutputToSpreadsheet(output, scheduleSheet, SINGLE_PLAYER_SHEET_RANGE, 998, 16);
}

function importCoOpSchedule(series: string, event: string, scheduleSheet: string, supplementalSheet: string) {
    const apiKey = PropertiesService.getScriptProperties().getProperty("MIDOS_HOUSE_API_KEY");
    const mhSchedule = fetchScheduleData(MIDOS_HOUSE_GQL_URL, gqlQuery(series, event), apiKey);
    const existingSchedule = fetchExistingSchedule(
        scheduleSheet,
        SINGLE_PLAYER_SHEET_RANGE,
        CoOpSpreadsheetEntry.fromSpreadsheetArray
    );
    const supplemental = fetchSupplementalData(supplementalSheet, SUPPLEMENTAL_SHEET_RANGE);

    let output = compareMidosHouseAndExistingSchedule(
        mhSchedule,
        existingSchedule,
        CoOpSpreadsheetEntry.fromMidosHouseEntryWithDiscriminator
    ).map(
        it => it.withSupplementalData(supplemental.get(it.team1Runner1Id),
            supplemental.get(it.team1Runner2Id),
            supplemental.get(it.team2Runner1Id),
            supplemental.get(it.team2Runner2Id))
    );

    // Sort output list by stream date/time. Unscheduled races go to end of list.
    output.sort(function (a, b) {
        if (!a.scheduledStart && !b.scheduledStart) return 0;
        else if (!b.scheduledStart) return -1;
        else if (!a.scheduledStart) return 1;
        else if (a.scheduledStart < b.scheduledStart) return -1;
        else if (a.scheduledStart > b.scheduledStart) return 1;
        else return 0;
    })

    // Overwrite entire spreadsheet with output
    saveOutputToSpreadsheet(output, scheduleSheet, COOP_SHEET_RANGE, 998, 26);
}

function gqlQuery(series: string, event: string) {
    return `{series(name:"${series}"){event(name:"${event}"){races{id,phase,round,game,start,restreamConsent,scheduleUpdatedAt,teams{id,name,members{role,user{id,displayName,racetimeId}}}}}}}`;
}

function saveOutputToSpreadsheet(output: SpreadsheetEntry<any>[], sheetName: string, sheetRange: string, rowCount: number, columnCount: number) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const schedulingSheet = spreadsheet.getSheetByName(sheetName);

    let spreadsheetData = output.map(it => it.toSpreadsheetArray());
    padWithEmptyArrays(spreadsheetData, rowCount, columnCount);
    schedulingSheet.getRange(sheetRange)
        .clear()
        .setValues(spreadsheetData);
}

function padWithEmptyArrays(spreadsheetData: any[][], targetRowCount: number, columnCount: number) {
    const rowsToAdd = targetRowCount - spreadsheetData.length;
    for (let i = 0; i < rowsToAdd; i++) {
        spreadsheetData.push(new Array(columnCount).fill([]));
    }
}

function fetchScheduleData(gqlUrl: string, gqlShape: string, apiKey: string): MidosHouseScheduleEntry[] {
    // Fetch schedule from midos.house GraphQL API
    const fetchUrl = encodeURI(`${gqlUrl}?query=${gqlShape}`)
    const request = UrlFetchApp.fetch(fetchUrl, {"headers": {"X-API-Key": apiKey}});
    const response = JSON.parse(request.getContentText());

    // Convert JSON rows to ScheduleEntries
    let schedule: MidosHouseScheduleEntry[] = [];
    for (const entry of response.data.series.event.races) {
        if (!entry.teams) {
            console.warn(`Skipping race with ID ${entry.id} - it has no named racers, likely a qualifier.`);
            continue;
        }
        schedule.push(MidosHouseScheduleEntry.fromMidosHouseRace(entry));
    }

    return schedule;
}

function fetchSupplementalData(sheetName: string, sheetRange: string): Map<string, SupplementalData> {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const supplementalSheet = spreadsheet.getSheetByName(sheetName);

    return new Map(supplementalSheet.getRange(sheetRange).getValues()
        .filter(it => !!it[0])
        .map(it => new SupplementalData(it[0], it[2], it[3]))
        .map(it => [it.runnerId, it]));
}

function fetchExistingSchedule<T extends SpreadsheetEntry<any>>(sheetName: string, sheetRange: string, entryFactory: SpreadsheetEntryFromRow<T>): T[] {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const schedulingSheet = spreadsheet.getSheetByName(sheetName);

    return schedulingSheet.getRange(sheetRange).getValues()
        .filter(it => !!it[0])
        .map(it => entryFactory(it));
}

function reindexExistingScheduleByMidosHouseId<T extends SpreadsheetEntry<any>>(existingSchedule: T[]): T[][] {
    let reindexedByMhid: T[][] = [];
    for (const entry of existingSchedule) {
        if (!reindexedByMhid[entry.raceId.midosHouseId]) {
            reindexedByMhid[entry.raceId.midosHouseId] = [];
        }
        reindexedByMhid[entry.raceId.midosHouseId].push(entry);
    }
    return reindexedByMhid;
}

function compareMidosHouseAndExistingSchedule<T extends SpreadsheetEntry<any>>(mhSchedule: MidosHouseScheduleEntry[], existingSchedule: T[], entryFactory: SpreadsheetEntryFromMidosHouse<T>): T[] {
    const mhIdsInSchedule = mhSchedule.map(it => it.id);
    const reindexed = reindexExistingScheduleByMidosHouseId(existingSchedule);

    let output: T[] = [];

    // Compare MH schedule entries with existing entries.
    for (const mhEntry of mhSchedule) {
        if (!reindexed[mhEntry.id]) {
            // Add new entry to output list
            output.push(entryFactory(mhEntry, 0));
            console.info(`New entry from Midos House with ID ${mhEntry.id} added to output.`);
            continue;
        }
        for (const it of reindexed[mhEntry.id]) {
            const spreadsheetEntry = it as T;
            if (spreadsheetEntry.matches(mhEntry)) {
                // Add unchanged entry to output list
                output.push(spreadsheetEntry.withUpdatedNoncriticalData(mhEntry));
                console.log(`Entry from Midos House with ID ${spreadsheetEntry.raceId.toString()} is unchanged.`);
            } else if (spreadsheetEntry.onlyNewScheduledStartWasAdded(mhEntry)) {
                // Add entry with new scheduled start to output list
                output.push(spreadsheetEntry.withUpdatedNoncriticalData(mhEntry).withNewScheduledStart(mhEntry));
                console.info(`New scheduled start for entry with ID ${spreadsheetEntry.raceId.toString()}.`);
            } else if (spreadsheetEntry.onlyNewRestreamConsentWasGiven(mhEntry)) {
                // Add entry with new restream consent to output list
                output.push(spreadsheetEntry.withUpdatedNoncriticalData(mhEntry).withRestreamConsent());
                console.info(`New restream consent for entry with ID ${spreadsheetEntry.raceId.toString()}.`);
            } else if (spreadsheetEntry.isCancelled) {
                // This spreadsheet entry was already outdated and marked as cancelled. Update names and move on.
                output.push(spreadsheetEntry.withUpdatedNoncriticalData(mhEntry));
                console.log(`Encountered outdated spreadsheet entry with ID ${spreadsheetEntry.raceId.toString()}.`);
            } else {
                // Scheduled time or runner consent has changed. Cancel old entry, add new entry to output list.
                output.push(spreadsheetEntry.withUpdatedNoncriticalData(mhEntry).withRaceCancelled());
                output.push(entryFactory(mhEntry, spreadsheetEntry.raceId.nextDiscriminator()));
                console.warn(`Schedule change received from Midos House for entry with ID ${spreadsheetEntry.raceId.toString()}`);
            }
        }
    }

    // Cancel deleted entries and add to output list.
    let racesDeletedFromMidosHouse = existingSchedule.filter(it => !mhIdsInSchedule.includes(it.raceId.midosHouseId));
    for (const spreadsheetEntry of racesDeletedFromMidosHouse) {
        output.push(spreadsheetEntry.withRaceCancelled());
        console.warn(`Race with ID ${spreadsheetEntry.raceId.toString()} deleted from Midos.house, cancelling.`);
    }
    return output;
}