
export type Position = {
    x: number;
    y: number;
};

export type ApiUser = {
    name: string;
    position: Position;
    joinedAt: string;
    jitsiRoom: string
    pusherUuid?: string
    userRefereneUuid: string
};

export interface RoomMap {
    [room: string]: {
        slug: string,
        users: Array<ApiUser>
    };
}

export interface RoomObj {
    roomSlug: string;
    users: { [indx: string]: UserObj };
}

export type RoomDump = { [index: string]: RoomObj };

export interface UserObj {
    roomId: string;
    name: string;
    position: {
        x: number, y: number
    };

    joinedAt: string;

    positionNotifier: {
        zones: Array<Array<{
            things: Array<UserObj>;
        }>>;
    };

    uuid: string
}



export interface MapJson {
    layers: Array<{
        properties: Array<{
            name: string,
            value: string
        }>
        data: Array<number>
        width: number
    }>;

}