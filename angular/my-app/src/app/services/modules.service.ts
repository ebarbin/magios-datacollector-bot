import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class ModulesService {

    constructor(private http: HttpClient) {}

    getModules(): Observable<any> {
        return this.http.get<any>(environment.api + '/api/modules');   
    }

    getModulesUser(): Observable<any[]> {
        return this.http.get<any>(environment.api + '/api/modules/user').pipe(
            map(response => response.users)
        ) 
    }

    updateModuleValue(userId: string, module: string, index: string, flag: boolean) {
        return this.http.put<any>(environment.api + '/api/modules/user/' + userId, {module: module, index: index, flag: flag})
    }

    updateUserStatus(userId: string) {
        return this.http.put<any>(environment.api + '/api/modules/user/status/' + userId, {})
    }

    updateUserCountry(userId: string, country: string) {
        return this.http.put<any>(environment.api + '/api/modules/user/country/' + userId, {country: country})
    }
}