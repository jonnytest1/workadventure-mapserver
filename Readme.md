feaures provided in this server:


- generate Maps on the fly from openstreetmap  [MapGeneration](./resources/mapserver/mapserver.ts)
- identify the current user and store properties [UserHandling](./index.ts)
- communicate with the user [UserCommunication](./resources/mapserver/message-communication/user-service.ts)

- hidden behind "gamemode" property: [GameMode](./resources/mapserver/user/user.ts#User.gameModeEnabled)
  - ability to make friends with someone (theres a special area where if both people are in at the same time they become friends) 
    - [Friendship](./resources/mapserver/user/friendship.ts)
    - [Becoming Friends](./resources/mapserver/message-communication/friendship-service.ts)
    - [frontend map](https://github.com/jonnytest1/workadventuremap/blob/master/scripts/church.js)
  - ability to enable an overlay on any of my maps that can [https://github.com/jonnytest1/workadventuremap/tree/master/scripts/game/overlay/mapoverlay]
    - teleport to friends 
    - show a compass to friends
    - message friends accross maps
    - teleport to your users personal map
  - customize your users personal map at will (you can pick up "tiles" at chests after completing challenges (currently no pay to win :D ))
    -  [PersonalMapHnadling](resources\mapserver\service\user-map-loader.ts)
    -  [PersonalMapCustomizing](resources\mapserver\user\inventory\inventory-item-activation.ts)
  
