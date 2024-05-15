type MidosHouseRace = {
    id: string,
    start: string,
    phase: string,
    round: string,
    game: number,
    restreamConsent: boolean,
    scheduleUpdatedAt: string,
    teams: Array<{
        id: string,
        name: string,
        members: Array<{
            role: string,
            user: {
                id: string,
                displayName: string,
                racetimeId: string
            }
        }>
    }>
}

class MidosHouseTeam {
    readonly id: string;
    readonly name: string;
    readonly players: MidosHousePlayer[];

    constructor(id: string, name: string, players: MidosHousePlayer[]) {
        this.id = id;
        this.name = name;
        this.players = players;
    }

    public toString(): string {
        return `MidosHouseTeam {
            id: ${this.id},
            name: ${this.name},
            players: ${this.players.map(it => it.toString()).toString()}
        }`;
    }
}

class MidosHousePlayer {
    readonly id: string;
    readonly racetimeId: string;
    readonly name: string;
    readonly role: string;

    constructor(id: string, racetimeId: string, name: string, role: string) {
        this.id = id;
        this.racetimeId = racetimeId;
        this.name = name;
        this.role = role;
    }

    public toString(): string {
        return `MidosHousePayer {
            id: ${this.id},
            racetimeId: ${this.racetimeId},
            name: ${this.name},
            role: ${this.role}
        }`;
    }
}

export class MidosHouseScheduleEntry {
    readonly id: string;
    readonly scheduledStart: Date;
    readonly phase: string;
    readonly round: string;
    readonly game: number;
    readonly teams: MidosHouseTeam[];
    readonly isCancelled: boolean;
    readonly restreamConsent: boolean;
    readonly scheduleUpdatedAt: Date;

    constructor(id: string,
                scheduledStart: Date,
                phase: string,
                round: string,
                game: number,
                teams: MidosHouseTeam[],
                isCancelled: boolean,
                restreamConsent: boolean,
                scheduleUpdatedAt: Date) {
        this.id = id;
        this.scheduledStart = scheduledStart;
        this.phase = phase;
        this.round = round;
        this.game = game;
        this.teams = teams;
        this.isCancelled = isCancelled;
        this.restreamConsent = restreamConsent;
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
            teams: ${this.teams.map(it => it.toString()).toString()},
            isCancelled: ${this.isCancelled},
            restreamConsent: ${this.restreamConsent},
            scheduleUpdatedAt: ${this.scheduleUpdatedAt?.toISOString()}
        }`;
    }

    static fromMidosHouseRace(race: MidosHouseRace) {
        return new MidosHouseScheduleEntry(
            race.id,
            (!!race.start) ? new Date(race.start) : null,
            race.phase,
            race.round,
            race.game,
            race.teams.map(team => new MidosHouseTeam(
                team.id,
                team.name,
                team.members.map(member => new MidosHousePlayer(
                    member.user.id,
                    member.user.racetimeId,
                    member.user.displayName,
                    member.role
                ))
            )),
            false,
            race.restreamConsent,
            (!!race.scheduleUpdatedAt) ? new Date(race.scheduleUpdatedAt) : null
        )
    }
}