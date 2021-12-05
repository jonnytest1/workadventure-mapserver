import { FriendshipService } from './friendship-service';
import { MinesweeperService } from './minesweeper-service';
import { UserService } from "./user-service";

type MethodMap<T> = { [key in keyof T]: (...args: any) => any }


type methodTypes<T extends MethodMap<T>> = { [K in keyof T]: {
    param: Parameters<(T[K])>[0],
    response: ReturnType<T[K]>
} }



export type messaging = methodTypes<UserService> & methodTypes<FriendshipService> & methodTypes<MinesweeperService>

//export type messageParam<T extends keyof messaging> = messaging[T]["param"];

//export type ReturnMessageType<T extends keyof messaging> = messaging[T]["response"]

//export type MessageFunction<T extends keyof messaging> = (data: messageParam<T>) => Promise<ReturnMessageType<T>>
