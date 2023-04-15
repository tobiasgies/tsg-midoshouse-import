export class RaceId {
    readonly midosHouseId: string;
    readonly discriminator: number;

    private static readonly REGEX = /^\s*(?<mhid>.+)#(?<discriminator>[0-9]+)\s*$/

    constructor(midosHouseId: string, discriminator: number) {
        this.midosHouseId = midosHouseId;
        this.discriminator = discriminator;
    }

    public nextDiscriminator(): number {
        return this.discriminator + 1;
    }

    public toString(): string {
        return `${this.midosHouseId}#${this.discriminator}`;
    }

    static fromString(mhidAndDiscriminator: string): RaceId {
        let match = mhidAndDiscriminator.match(this.REGEX);
        if (!match) {
            throw new TypeError("Race ID string must be of the format MidosHouseId#Discriminator, e.g. 123456#3.");
        }
        return new RaceId(match.groups["mhid"], Number.parseInt(match.groups["discriminator"]));
    }
}