export interface IEventOptions {
    once?: boolean,
    await?: boolean,
    parallel?: boolean
    timeout?: number
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


export interface IDispacherOptions {
    await?: boolean,
    parallel?: boolean
}
