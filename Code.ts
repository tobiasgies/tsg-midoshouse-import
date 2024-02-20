import {MidosHouseScheduleEntry} from "./MidosHouseScheduleEntry";
import {SpreadsheetScheduleEntry} from "./SpreadsheetScheduleEntry";
import {RaceId} from "./RaceId";
import {SupplementalData} from "./SupplementalData";

// URL of schedule JSON on midos.house
const MIDOS_HOUSE_GQL_URL = "https://midos.house/api/v1/graphql";
const MIDOS_HOUSE_GQL_SHAPE = "{series(name:\"s\"){event(name:\"7cc\"){races{id,phase,round,game,start,restreamConsent,scheduleUpdatedAt,teams{name,members{user{id,displayName,racetimeId}}}}}}}";

// Name of sheet that stores our imported schedule data
const SCHEDULE_IMPORT_SHEET_NAME = "Midos.house schedule import";

// Range of fields that contain our imported schedule
const SCHEDULE_IMPORT_SHEET_RANGE = "A3:P1000";

// Name of sheet that stores supplemental data that can't be obtained from Midos.house
const SUPPLEMENTAL_SHEET_NAME = "Supplemental data";

// Range of fields that contain our supplemental data
const SUPPLEMENTAL_SHEET_RANGE = "A2:D1000";

function importScheduleFromMidosHouse() {
    const apiKey = PropertiesService.getScriptProperties().getProperty("MIDOS_HOUSE_API_KEY");
    const mhSchedule = fetchScheduleData(MIDOS_HOUSE_GQL_URL, MIDOS_HOUSE_GQL_SHAPE, apiKey);
    const existingSchedule = fetchExistingSchedule(SCHEDULE_IMPORT_SHEET_NAME, SCHEDULE_IMPORT_SHEET_RANGE);
    const supplemental = fetchSupplementalData(SUPPLEMENTAL_SHEET_NAME, SUPPLEMENTAL_SHEET_RANGE);

    let output = compareMidosHouseAndExistingSchedule(mhSchedule, existingSchedule).map(
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
    saveOutputToSpreadsheet(output, SCHEDULE_IMPORT_SHEET_NAME, SCHEDULE_IMPORT_SHEET_RANGE);
}

function saveOutputToSpreadsheet(output: SpreadsheetScheduleEntry[], sheetName: string, sheetRange: string) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const schedulingSheet = spreadsheet.getSheetByName(sheetName);

    let spreadsheetData = output.map(it => it.toSpreadsheetArray());
    padWithEmptyArrays(spreadsheetData, 998);
    schedulingSheet.getRange(sheetRange)
        .clear()
        .setValues(spreadsheetData);
}

function padWithEmptyArrays(spreadsheetData: any[][], targetRowCount: number) {
    const rowsToAdd = targetRowCount - spreadsheetData.length;
    for (let i = 0; i < rowsToAdd; i++) {
        spreadsheetData.push([[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]);
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
        const scheduledStart = (!!entry.start) ? new Date(entry.start) : null;
        const scheduleUpdatedAt = (!!entry.scheduleUpdatedAt) ? new Date(entry.scheduleUpdatedAt) : null;
        schedule.push(new MidosHouseScheduleEntry(entry.id,
            scheduledStart,
            entry.phase,
            entry.round,
            entry.game,
            entry.teams[0].members[0].user.id,
            entry.teams[0].members[0].user.racetimeId,
            entry.teams[0].members[0].user.displayName,
            entry.teams[1].members[0].user.id,
            entry.teams[1].members[0].user.racetimeId,
            entry.teams[1].members[0].user.displayName,
            false,
            !!entry.restreamConsent,
            scheduleUpdatedAt));
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

function fetchExistingSchedule(sheetName: string, sheetRange: string): SpreadsheetScheduleEntry[] {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const schedulingSheet = spreadsheet.getSheetByName(sheetName);

    return schedulingSheet.getRange(sheetRange).getValues()
        .filter(it => !!it[0])
        .map(it => new SpreadsheetScheduleEntry(RaceId.fromString(it[0]),
            (!!it[1]) ? it[1] : null,
            it[2],
            it[3],
            it[4],
            it[5],
            it[6],
            it[7],
            it[8],
            !!it[9],
            !!it[10],
            (!!it[11]) ? it[11] : null));
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
                output.push(SpreadsheetScheduleEntry.fromMidosHouseEntryWithDiscriminator(mhEntry, spreadsheetEntry.raceId.nextDiscriminator()));
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