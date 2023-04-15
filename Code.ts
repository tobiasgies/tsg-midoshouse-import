import {MidosHouseScheduleEntry} from "./MidosHouseScheduleEntry";
import {SpreadsheetScheduleEntry} from "./SpreadsheetScheduleEntry";
import {RaceId} from "./RaceId";

// URL of schedule JSON on midos.house
// TODO use real URL, currently uses dummy from Tobias' server
const MIDOS_HOUSE_SCHEDULE_URL = "https://www.tobiasgies.de/files/midos-schedule-dummy.json";

// Name of sheet that stores our imported schedule data
const SCHEDULE_IMPORT_SHEET_NAME = "Midos.house schedule import";

// Range of fields that contain our imported schedule
const SCHEDULE_IMPORT_SHEET_RANGE = "A3:H1000";

function importScheduleFromMidosHouse() {
    const mhSchedule = fetchScheduleData(MIDOS_HOUSE_SCHEDULE_URL);
    const existingSchedule = fetchExistingSchedule(SCHEDULE_IMPORT_SHEET_NAME);

    let output = compareMidosHouseAndExistingSchedule(mhSchedule, existingSchedule);

    // Sort output list by stream date/time
    output.sort(function (a, b) {
        if (a.scheduledStart < b.scheduledStart) return -1;
        else if (a.scheduledStart > b.scheduledStart) return 1;
        else return 0;
    })

    // Overwrite entire spreadsheet with output
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const schedulingSheet = spreadsheet.getSheetByName(SCHEDULE_IMPORT_SHEET_NAME);

    let spreadsheetData = output.map(it => it.toSpreadsheetArray());
    padWithEmptyArrays(spreadsheetData, 998);
    schedulingSheet.getRange(SCHEDULE_IMPORT_SHEET_RANGE)
        .clear()
        .setValues(spreadsheetData);
}

function padWithEmptyArrays(spreadsheetData: any[][], targetRowCount: number) {
    const rowsToAdd = targetRowCount - spreadsheetData.length;
    for (let i = 0; i < rowsToAdd; i++) {
        spreadsheetData.push([[], [], [], [], [], [], [], []]);
    }
}

function fetchScheduleData(sourceUrl: string): MidosHouseScheduleEntry[] {
    // Fetch schedule JSON from midos.house
    const request = UrlFetchApp.fetch(sourceUrl);
    const response = JSON.parse(request.getContentText()) as any[];

    // Convert JSON rows to ScheduleEntries
    let schedule: MidosHouseScheduleEntry[] = [];
    for (const entry of response) {
        schedule.push(new MidosHouseScheduleEntry(entry.race_id,
            new Date(entry.scheduled_start),
            entry.runner1_id,
            entry.runner1_name,
            entry.runner2_id,
            entry.runner2_name,
            !!entry.is_cancelled,
            !!entry.both_runners_consent_to_restream));
    }

    return schedule;
}

function fetchExistingSchedule(sheetName: string): SpreadsheetScheduleEntry[] {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const schedulingSheet = spreadsheet.getSheetByName(sheetName);

    return schedulingSheet.getRange(SCHEDULE_IMPORT_SHEET_RANGE).getValues()
        .filter(it => !!it[0])
        .map(it => new SpreadsheetScheduleEntry(RaceId.fromString(it[0]), it[1], it[2], it[3], it[4], it[5], !!it[6], !!it[7]));
}

function reindexExistingScheduleByMidosHouseId(existingSchedule: SpreadsheetScheduleEntry[]): SpreadsheetScheduleEntry[][] {
    let reindexedByMhid: SpreadsheetScheduleEntry[][] = [];
    for (const entry of existingSchedule) {
        if (!reindexedByMhid[entry.raceId.midosHouseId]) {
            reindexedByMhid[entry.raceId.midosHouseId] = [];
        }
        reindexedByMhid[entry.raceId.midosHouseId].push(entry);
    }
    return reindexedByMhid;
}

function compareMidosHouseAndExistingSchedule(mhSchedule: MidosHouseScheduleEntry[], existingSchedule: SpreadsheetScheduleEntry[]) {
    const mhIdsInSchedule = mhSchedule.map(it => it.id);
    const reindexed = reindexExistingScheduleByMidosHouseId(existingSchedule);

    let output: SpreadsheetScheduleEntry[] = [];

    // Compare MH schedule entries with existing entries.
    for (const mhEntry of mhSchedule) {
        if (!reindexed[mhEntry.id]) {
            // Add new entry to output list
            output.push(SpreadsheetScheduleEntry.fromMidosHouseEntryWithDiscriminator(mhEntry, 0));
            console.info(`New entry from Midos House with ID ${mhEntry.id} added to output.`);
            continue;
        }
        for (const it of reindexed[mhEntry.id]) {
            const spreadsheetEntry = it as SpreadsheetScheduleEntry;
            if (spreadsheetEntry.matches(mhEntry)) {
                // Add unchanged entry to output list
                output.push(spreadsheetEntry.withUpdatedNames(mhEntry));
                console.log(`Entry from Midos House with ID ${spreadsheetEntry.raceId.toString()} is unchanged.`);
            } else if (spreadsheetEntry.onlyNewRestreamConsentWasGiven(mhEntry)) {
                // Add entry with new restream consent to output list
                output.push(spreadsheetEntry.withUpdatedNames(mhEntry).withRestreamConsent());
                console.info(`New restream consent for entry with ID ${spreadsheetEntry.raceId.toString()}.`);
            } else if (spreadsheetEntry.isCancelled) {
                // This spreadsheet entry was already outdated and marked as cancelled. Update names and move on.
                output.push(spreadsheetEntry.withUpdatedNames(mhEntry));
                console.log(`Encountered outdated spreadsheet entry with ID ${spreadsheetEntry.raceId.toString()}.`);
            } else {
                // Scheduled time or runner consent has changed. Cancel old entry, add new entry to output list.
                output.push(spreadsheetEntry.withUpdatedNames(mhEntry).withRaceCancelled());
                output.push(SpreadsheetScheduleEntry.fromMidosHouseEntryWithDiscriminator(mhEntry, spreadsheetEntry.raceId.nextDiscriminator()));
                console.warn(`Schedule change received from Midos House for entry with ID ${spreadsheetEntry.raceId.toString()}`);
            }
        }
    }

    // Cancel deleted entries and add to output list.
    let racesDeletedFromMidosHouse = existingSchedule.filter(it => !mhIdsInSchedule.includes(it.raceId.midosHouseId));
    for (const spreadsheetEntry of racesDeletedFromMidosHouse) {
        output.push(spreadsheetEntry.withRaceCancelled());
    }
    return output;
}