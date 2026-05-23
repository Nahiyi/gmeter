export namespace desktop {
	
	export class DesktopRunOptions {
	    threads: number;
	    loops: number;
	    rampUpSeconds: number;
	    requestTimeoutMs: number;
	    maxDurationSec: number;
	
	    static createFrom(source: any = {}) {
	        return new DesktopRunOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.threads = source["threads"];
	        this.loops = source["loops"];
	        this.rampUpSeconds = source["rampUpSeconds"];
	        this.requestTimeoutMs = source["requestTimeoutMs"];
	        this.maxDurationSec = source["maxDurationSec"];
	    }
	}
	export class TraceDTO {
	    threadId: number;
	    loopIndex: number;
	    requestIndex: number;
	    url: string;
	    method: string;
	    responseStatus: number;
	    responseTimeMs: number;
	    success: boolean;
	    error: string;
	    requestHeaders: Record<string, string>;
	    responseBody: string;
	
	    static createFrom(source: any = {}) {
	        return new TraceDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.threadId = source["threadId"];
	        this.loopIndex = source["loopIndex"];
	        this.requestIndex = source["requestIndex"];
	        this.url = source["url"];
	        this.method = source["method"];
	        this.responseStatus = source["responseStatus"];
	        this.responseTimeMs = source["responseTimeMs"];
	        this.success = source["success"];
	        this.error = source["error"];
	        this.requestHeaders = source["requestHeaders"];
	        this.responseBody = source["responseBody"];
	    }
	}
	export class SummaryDTO {
	    totalThreads: number;
	    totalLoops: number;
	    totalRequests: number;
	    successCount: number;
	    failCount: number;
	    successRate: number;
	    durationMs: number;
	    avgResponseTimeMs: number;
	    minResponseTimeMs: number;
	    maxResponseTimeMs: number;
	    p50ResponseTimeMs: number;
	    p90ResponseTimeMs: number;
	    p99ResponseTimeMs: number;
	
	    static createFrom(source: any = {}) {
	        return new SummaryDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalThreads = source["totalThreads"];
	        this.totalLoops = source["totalLoops"];
	        this.totalRequests = source["totalRequests"];
	        this.successCount = source["successCount"];
	        this.failCount = source["failCount"];
	        this.successRate = source["successRate"];
	        this.durationMs = source["durationMs"];
	        this.avgResponseTimeMs = source["avgResponseTimeMs"];
	        this.minResponseTimeMs = source["minResponseTimeMs"];
	        this.maxResponseTimeMs = source["maxResponseTimeMs"];
	        this.p50ResponseTimeMs = source["p50ResponseTimeMs"];
	        this.p90ResponseTimeMs = source["p90ResponseTimeMs"];
	        this.p99ResponseTimeMs = source["p99ResponseTimeMs"];
	    }
	}
	export class RunSnapshot {
	    runId: string;
	    status: string;
	    startedAt: string;
	    finishedAt: string;
	    message: string;
	    summary: SummaryDTO;
	    traceCount: number;
	    recentTraces: TraceDTO[];
	
	    static createFrom(source: any = {}) {
	        return new RunSnapshot(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.runId = source["runId"];
	        this.status = source["status"];
	        this.startedAt = source["startedAt"];
	        this.finishedAt = source["finishedAt"];
	        this.message = source["message"];
	        this.summary = this.convertValues(source["summary"], SummaryDTO);
	        this.traceCount = source["traceCount"];
	        this.recentTraces = this.convertValues(source["recentTraces"], TraceDTO);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	

}

export namespace engine {
	
	export class RequestSpec {
	    Method: string;
	    URL: string;
	    Headers: Record<string, string>;
	    Body: string;
	
	    static createFrom(source: any = {}) {
	        return new RequestSpec(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Method = source["Method"];
	        this.URL = source["URL"];
	        this.Headers = source["Headers"];
	        this.Body = source["Body"];
	    }
	}
	export class UserSpec {
	    Headers: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new UserSpec(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Headers = source["Headers"];
	    }
	}
	export class TestPlan {
	    Name: string;
	    Request: RequestSpec;
	    Users: UserSpec[];
	
	    static createFrom(source: any = {}) {
	        return new TestPlan(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Request = this.convertValues(source["Request"], RequestSpec);
	        this.Users = this.convertValues(source["Users"], UserSpec);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

