import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class RegisterService {

    constructor(private http: HttpClient) {}

    registerUser(user:any) {
        return this.http.put<any>(environment.api + '/api/register/' + user.id, {})
    }
}