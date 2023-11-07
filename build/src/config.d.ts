export interface Config {
    get(key: string): string;
}
declare class ConfigService implements Config {
    private config;
    constructor();
    get(key: string): string;
}
export default ConfigService;
