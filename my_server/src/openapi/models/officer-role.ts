

export const OfficerRole = {
    Role1: 'Role 1',
    Role2: 'Role 2',
    Role3: 'Role 3'
} as const;
export type OfficerRole = typeof OfficerRole[keyof typeof OfficerRole];

