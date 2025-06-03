export const Collection = {
    User: 'users',
    Step: 'steps',
}

export interface User {
    id: string;
    name: string;
    createdAt: Date;
}