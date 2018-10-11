import { CountryModel } from '../models/country-model';

export class Profile {
    email: string = "";
    password: string = "";
    country: string = "";
    dial_code: string = "";
    first_name: string = "";
    last_name: string = "";
    phone_number: string = "";
    _id: string = "";
    provider: string = "";
    verify_code: string = "";
    is_phone_number_verified: boolean = false;
    platform: string = "";
    likes: string[] = [];
    unlikes: string[] = [];
    state: string = "unknow";
    notificationId: string = "";
    isAlvexo: boolean = false
    broker: string = "";
    nickname: string = "";
    comments: number = 0;
    reply: number = 0;
    sharing: number = 0;
    watchlist: any[] = [];
    signalsList: any[] = [];
    brokerimg: string = "";
    date: string = "";
    streak: number = 0;
    version: number = 0;
    counntry: CountryModel = new CountryModel();
}