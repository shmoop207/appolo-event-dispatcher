export interface IEventOptions {
    once?: boolean,
}

export interface IEventHook extends IEventOptions{
    parallel?: boolean
}

export interface ICallback {
    fn: (...args: any[]) => any,
    scope?: any,
    options?: IEventOptions
}