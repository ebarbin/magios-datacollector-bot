import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class UserStatsService {

    constructor(private http: HttpClient) {}

    getAllUsers(): Observable<any> {
        return this.http.get<any[]>(environment.api + '/api/users');   
    }
}