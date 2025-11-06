

export const OfficeType = {
    Office1: 'Office 1',
    Office2: 'Office 2',
    Office3: 'Office 3'
} as const;
export type OfficeType = typeof OfficeType[keyof typeof OfficeType];

