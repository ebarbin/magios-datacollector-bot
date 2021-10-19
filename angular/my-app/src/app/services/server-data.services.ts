import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class ServerDataService {

    constructor(private http: HttpClient) {}

    getServers(): Observable<any> {
        return this.http.get<any[]>(environment.api + '/api/servers').pipe(
            map((response:any) => response.servers)
        );
    }

    updateServer(server:any): Observable<any> {
        return this.http.put<any[]>(environment.api + '/api/servers/' + server.id, server);
    }
}