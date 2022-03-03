import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class TaskService {

    constructor(private http: HttpClient) {}

    getTasks(): Observable<any> {
        return this.http.get<any[]>(environment.api + '/api/task').pipe(
            map((response:any) => response.tasks)
        );
    }

    toggleTaskStatus(task:any): Observable<any> {
        return this.http.put<any[]>(environment.api + '/api/task/toggle/status/' + task.id, {});
    }

    runTaskNow(task:any): Observable<any> {
        return this.http.put<any[]>(environment.api + '/api/task/run-now/' + task.id, {});
    }
}