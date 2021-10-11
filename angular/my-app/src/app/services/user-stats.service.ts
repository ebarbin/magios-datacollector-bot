import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class UserStatsService {

    constructor(private http: HttpClient) {}

    getAllUsers(): Observable<any> {
        return this.http.get<any[]>(environment.api + '/api/users');   
    }

    updateUser(user: any): Observable<any> {
        const reqUser = {...user};
        reqUser.joinDate = reqUser.joinDate ? reqUser.joinDate.format('DD/MM/YYYY HH:mm:ss') : null;
        reqUser.lastTextChannelDate = reqUser.lastTextChannelDate ? reqUser.lastTextChannelDate.format('DD/MM/YYYY HH:mm:ss') : null;
        reqUser.lastVoiceChannelAccessDate = reqUser.lastVoiceChannelAccessDate ? reqUser.lastVoiceChannelAccessDate.format('DD/MM/YYYY HH:mm:ss') : null;
        reqUser.lastServerAccess = reqUser.lastServerAccess ? reqUser.lastServerAccess.format('DD/MM/YYYY HH:mm:ss') : null;
        return this.http.put<any[]>(environment.api + '/api/users/' + reqUser.id, reqUser);
    }
}