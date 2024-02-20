export class SupplementalData {
    readonly runnerId: string;
    readonly qualifierRank: number;
    readonly country: string;

    constructor(runnerId: string, qualifierRank: number, country: string) {
        this.runnerId = runnerId;
        this.qualifierRank = qualifierRank;
        this.country = country;
    }

    public toString(): string {
        return `SupplementalData {
            runnerId: ${this.runnerId},
            qualifierRank: ${this.qualifierRank},
            country: ${this.country}
        }`;
    }
}