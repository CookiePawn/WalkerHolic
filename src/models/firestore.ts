export const Collection = {
    User: 'users',
    Step: 'steps',
}

export interface User {
    id: string;
    name: string;
    createdAt: Date;
}

export interface Step {
    userUid: string;
    steps: number;
    date: string;
    timestamp: Date;
}
