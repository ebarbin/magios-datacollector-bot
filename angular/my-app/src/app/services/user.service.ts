import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "src/environments/environment";
import * as moment from 'moment';

@Injectable({ providedIn: 'root' })
export class UserService {

    private usersObs: Observable<any> | undefined;

    constructor(private http: HttpClient) {}

    getAllUsers(): Observable<any> {
        if (!this.usersObs) {
            this.usersObs = this.http.get<any[]>(environment.api + '/api/users').pipe(
                map((response:any) => {
                    return response.users.map((u:any) => {
                      u.joinDate = u.joinDate ? moment(u.joinDate, 'DD/MM/YYYY HH:mm:ss') : null
                      u.lastTextChannelDate = u.lastTextChannelDate ? moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss') : null;
                      u.lastVoiceChannelAccessDate = u.lastVoiceChannelAccessDate ? moment(u.lastVoiceChannelAccessDate, 'DD/MM/YYYY HH:mm:ss') : null;
                      u.lastServerAccess = u.lastServerAccess ? moment(u.lastServerAccess, 'DD/MM/YYYY HH:mm:ss') : null;
                      return u;
                    })
                  })
            )
        }
        return this.usersObs;
    }
}