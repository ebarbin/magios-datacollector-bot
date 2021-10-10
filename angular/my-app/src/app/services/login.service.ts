import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class LoginService {

    constructor(private http: HttpClient) {}

    login(code: string): Observable<any> {
        return this.http.post<any>(environment.api + '/oauth/login', {code: code })
    }

    logout(): Observable<any> {
        return this.http.post<any>(environment.api + '/oauth/logout', {});
    }
}