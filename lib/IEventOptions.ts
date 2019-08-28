export interface IEventOptions {
    once?: boolean,
}


export interface ICallback {
    fn: (...args: any[]) => any,
    scope?: any,
    options?: IEventOptions
}

export interface IHandler{
    callbacks: ICallback[],
    isRoutingKey: boolean
}
