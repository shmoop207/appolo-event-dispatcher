export interface IEventOptions {
    once?: boolean,
    await?: boolean,
    parallel?: boolean
    timeout?: number,
    order?: number
}


export interface ICallback {
    fn: (...args: any[]) => any,
    scope?: any,
    options?: IEventOptions
}

export interface IHandler {
    callbacks: ICallback[],
    isRoutingKey: boolean
}


export interface IDispatcherOptions {
    await?: boolean,
    parallel?: boolean
}
