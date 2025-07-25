import { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
export declare class OpenAPISpec {
    document: OpenAPIV3_1.Document;
    constructor(document: OpenAPIV3_1.Document);
    get baseUrl(): string | undefined;
    getPathsStrict(): OpenAPIV3_1.PathsObject<{}, {}>;
    getParametersStrict(): Record<string, OpenAPIV3.ParameterObject | OpenAPIV3_1.ReferenceObject>;
    getSchemasStrict(): Record<string, OpenAPIV3_1.SchemaObject>;
    getRequestBodiesStrict(): Record<string, OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.RequestBodyObject>;
    getPathStrict(path: string): Omit<OpenAPIV3.PathItemObject<{}>, "servers" | "parameters"> & {
        servers?: OpenAPIV3_1.ServerObject[];
        parameters?: (OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ParameterObject)[];
    } & {
        get?: OpenAPIV3_1.OperationObject<{}> | undefined;
        put?: OpenAPIV3_1.OperationObject<{}> | undefined;
        post?: OpenAPIV3_1.OperationObject<{}> | undefined;
        delete?: OpenAPIV3_1.OperationObject<{}> | undefined;
        options?: OpenAPIV3_1.OperationObject<{}> | undefined;
        head?: OpenAPIV3_1.OperationObject<{}> | undefined;
        patch?: OpenAPIV3_1.OperationObject<{}> | undefined;
        trace?: OpenAPIV3_1.OperationObject<{}> | undefined;
    };
    getReferencedParameter(ref: OpenAPIV3_1.ReferenceObject): OpenAPIV3.ParameterObject | OpenAPIV3_1.ReferenceObject;
    getRootReferencedParameter(ref: OpenAPIV3_1.ReferenceObject): OpenAPIV3_1.ParameterObject;
    getReferencedSchema(ref: OpenAPIV3_1.ReferenceObject): OpenAPIV3_1.SchemaObject;
    getSchema(schema: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject): OpenAPIV3_1.SchemaObject;
    getRootReferencedSchema(ref: OpenAPIV3_1.ReferenceObject): OpenAPIV3_1.ParameterObject;
    getReferencedRequestBody(ref: OpenAPIV3_1.ReferenceObject): OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.RequestBodyObject;
    getRootReferencedRequestBody(ref: OpenAPIV3_1.ReferenceObject): OpenAPIV3_1.RequestBodyObject;
    getMethodsForPath(path: string): OpenAPIV3.HttpMethods[];
    getParametersForPath(path: string): OpenAPIV3.ParameterObject[];
    getOperation(path: string, method: OpenAPIV3.HttpMethods): {
        tags?: string[];
        summary?: string;
        description?: string;
        externalDocs?: OpenAPIV3.ExternalDocumentationObject;
        operationId?: string;
        parameters?: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[];
        requestBody?: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject;
        responses: OpenAPIV3.ResponsesObject;
        callbacks?: {
            [callback: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.CallbackObject;
        };
        deprecated?: boolean;
        security?: OpenAPIV3.SecurityRequirementObject[];
        servers?: OpenAPIV3.ServerObject[];
    } & Omit<{
        tags?: string[];
        summary?: string;
        description?: string;
        externalDocs?: OpenAPIV3.ExternalDocumentationObject;
        operationId?: string;
        parameters?: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[];
        requestBody?: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject;
        responses: OpenAPIV3.ResponsesObject;
        callbacks?: {
            [callback: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.CallbackObject;
        };
        deprecated?: boolean;
        security?: OpenAPIV3.SecurityRequirementObject[];
        servers?: OpenAPIV3.ServerObject[];
    }, "callbacks" | "servers" | "parameters" | "responses" | "requestBody"> & {
        parameters?: (OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ParameterObject)[];
        requestBody?: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.RequestBodyObject;
        responses?: OpenAPIV3_1.ResponsesObject;
        callbacks?: Record<string, OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.CallbackObject>;
        servers?: OpenAPIV3_1.ServerObject[];
    };
    getParametersForOperation(operation: OpenAPIV3_1.OperationObject): OpenAPIV3.ParameterObject[];
    getRequestBodyForOperation(operation: OpenAPIV3_1.OperationObject): OpenAPIV3_1.RequestBodyObject;
    static getCleanedOperationId(operation: OpenAPIV3_1.OperationObject, path: string, method: OpenAPIV3_1.HttpMethods): string;
    static alertUnsupportedSpec(document: Record<string, any>): void;
    static fromObject(document: Record<string, any>): OpenAPISpec;
    static fromString(rawString: string): OpenAPISpec;
    static fromURL(url: string): Promise<OpenAPISpec>;
}
