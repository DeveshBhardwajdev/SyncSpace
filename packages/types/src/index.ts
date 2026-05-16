export interface User{
    id:string;
    email:string;
    name:string;
    createdAt:Date;
}

export interface Meetin {
    id:string;
    title:string;
    hostId:string;
    scheduledAt:Date;
    status: 'scheduled' | 'active' | 'completed';
}