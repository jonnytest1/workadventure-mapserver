
type Postion = {
    x: number;
    y: number;
};

type ApiUser = {
    name: string;
    position: Postion;
    joinedAt: string;

};

interface RoomMap {
    [room: string]: {
        slug: string,
        users: Array<ApiUser>
    };
}

interface RoomObj {
    roomSlug: string;
    users: { [indx: string]: UserObj };
}

type RoomDump = { [index: string]: RoomObj };

interface UserObj {
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
}



interface MapJson {
    layers: Array<{
        properties: Array<{
            name: string,
            value: string
        }>
        data: Array<number>
        width: number
    }>;

}