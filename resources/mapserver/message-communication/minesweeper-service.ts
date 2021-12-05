import { HttpRequest } from 'express-hibernate-wrapper';
import { Position } from '../../../public/users';
import { MessageHandlerRegistration } from '../message-communication';
import { MinesweeperResolver } from '../service/minesweeper';
import { User } from '../user/user';

@MessageHandlerRegistration
export class MinesweeperService {


    public uncover(position: Position, req: HttpRequest<User>) {
        const minesweeperResolver = MinesweeperResolver.getMapResolver(req.user);
        return minesweeperResolver.uncover(position);
    }

    public initialise(noargs: unknown, req: HttpRequest<User>) {
        const minesweeperResolver = MinesweeperResolver.getMapResolver(req.user);

        return minesweeperResolver.getUncovered();
    }
}