export namespace collector {
	
	export class RequestRecord {
	    requestIndex: number;
	    url: string;
	    method: string;
	    requestHeaders: Record<string, string>;
	    requestBody: string;
	    responseStatus: number;
	    responseTimeMs: number;
	    responseHeaders: Record<string, string>;
	    responseBody: string;
	    success: boolean;
	    error: string;
	
	    static createFrom(source: any = {}) {
	        return new RequestRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.requestIndex = source["requestIndex"];
	        this.url = source["url"];
	        this.method = source["method"];
	        this.requestHeaders = source["requestHeaders"];
	        this.requestBody = source["requestBody"];
	        this.responseStatus = source["responseStatus"];
	        this.responseTimeMs = source["responseTimeMs"];
	        this.responseHeaders = source["responseHeaders"];
	        this.responseBody = source["responseBody"];
	        this.success = source["success"];
	        this.error = source["error"];
	    }
	}
	export class LoopRecord {
	    loopIndex: number;
	    requests: RequestRecord[];
	
	    static createFrom(source: any = {}) {
	        return new LoopRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.loopIndex = source["loopIndex"];
	        this.requests = this.convertValues(source["requests"], RequestRecord);
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
	
	export class ThreadRecord {
	    threadId: number;
	    loopResults: LoopRecord[];
	
	    static createFrom(source: any = {}) {
	        return new ThreadRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.threadId = source["threadId"];
	        this.loopResults = this.convertValues(source["loopResults"], LoopRecord);
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
	export class RunResult {
	    // Go type: time
	    StartedAt: any;
	    // Go type: time
	    FinishedAt: any;
	    Duration: number;
	    Records: collector.ThreadRecord[];
	    Report: reporter.Report;
	
	    static createFrom(source: any = {}) {
	        return new RunResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.StartedAt = this.convertValues(source["StartedAt"], null);
	        this.FinishedAt = this.convertValues(source["FinishedAt"], null);
	        this.Duration = source["Duration"];
	        this.Records = this.convertValues(source["Records"], collector.ThreadRecord);
	        this.Report = this.convertValues(source["Report"], reporter.Report);
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

export namespace reporter {
	
	export class Summary {
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
	        return new Summary(source);
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
	export class Report {
	    summary: Summary;
	    threads: collector.ThreadRecord[];
	
	    static createFrom(source: any = {}) {
	        return new Report(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.summary = this.convertValues(source["summary"], Summary);
	        this.threads = this.convertValues(source["threads"], collector.ThreadRecord);
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

