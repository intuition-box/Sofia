import { KVMap } from "../schemas.js";
export declare function extractUsageMetadata(span?: {
    status?: {
        code: number;
    };
    attributes?: Record<string, unknown>;
}): KVMap;
