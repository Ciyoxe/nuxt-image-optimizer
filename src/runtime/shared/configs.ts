export type Size = `${number}${'B' | 'KB' | 'MB' | 'GB'}`;
export type Time = `${number}${'s' | 'm' | 'h' | 'd'}`;

type LengthUnit = 'px' | 'cm' | 'mm' | 'Q' | 'in' | 'pt' | 'pc' | 'em' | 'rem' | 'cap' | 'ch' | 'ex' | 'ic' | 'lh' | 'rcap' | 'rch' | 'rex' | 'ric' | 'rlh';
export type MediaQuery =
    `${'min-width' | 'max-width' | 'min-height' | 'max-height'}: ${number}${LengthUnit}` |
    `${'width' | 'height'} ${'<' | '<=' | '>' | '>='} ${number}${LengthUnit}` |
    `${number}${LengthUnit} ${'<' | '<=' | '>' | '>='} ${'width' | 'height'} ${'<' | '<=' | '>' | '>='} ${number}${LengthUnit}`;

export const getSizeInBytes = (size: string) => {
    const trimmedSize = size.trim();
    switch (true) {
        case trimmedSize.endsWith('B'):
            return Number(trimmedSize.slice(0, -1));
        case trimmedSize.endsWith('KB'):
            return Number(trimmedSize.slice(0, -2)) * 1024;
        case trimmedSize.endsWith('MB'):
            return Number(trimmedSize.slice(0, -2)) * 1024 * 1024;
        case trimmedSize.endsWith('GB'):
            return Number(trimmedSize.slice(0, -2)) * 1024 * 1024 * 1024;
        default:
            throw new Error(`Invalid size: ${size}, it should end with B | KB | MB | GB`);
    }
};

export const getTimeInMilliseconds = (time: string) => {
    const trimmedTime = time.trim();
    switch (true) {
        case trimmedTime.endsWith('s'):
            return Number(trimmedTime.slice(0, -1)) * 1000;
        case trimmedTime.endsWith('m'):
            return Number(trimmedTime.slice(0, -1)) * 1000 * 60;
        case trimmedTime.endsWith('h'):
            return Number(trimmedTime.slice(0, -1)) * 1000 * 60 * 60;
        case trimmedTime.endsWith('d'):
            return Number(trimmedTime.slice(0, -1)) * 1000 * 60 * 60 * 24;
        default:
            throw new Error(`Invalid time: ${time}, it should end with s | m | h | d`);
    }
};

export const matchClamping = (value: number, clamping: string) => {
    switch (true) {
        case clamping.startsWith('<'):
            return value < Number(clamping.slice(1));
        case clamping.startsWith('<='):
            return value <= Number(clamping.slice(2));
        case clamping.startsWith('>'):
            return value > Number(clamping.slice(1));
        case clamping.startsWith('>='):
            return value >= Number(clamping.slice(2));
        default:
            throw new Error(`Invalid clamping: ${clamping}, it should start with < | <= | > | >=`);
    }
};
