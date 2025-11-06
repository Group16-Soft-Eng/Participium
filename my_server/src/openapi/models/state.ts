

export const State = {
    Pending: 'PENDING',
    Approved: 'APPROVED',
    Declined: 'DECLINED'
} as const;
export type State = typeof State[keyof typeof State];

