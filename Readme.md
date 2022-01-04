feaures provided in this server:


- generate Maps on the fly from openstreetmap  [MapGeneration](./resources/mapserver/mapserver.ts)
  - register your own site at [Register Page](https://pi4.e6azumuvyiabvs9s.myfritz.net/mapserver/register.html)
  - will skip zoom levels if there are is only one site linked
  - zoom out in the bottom left
  - will clear cache upon new site registration
  - exitUrl to get back to main map : "https://pi4.e6azumuvyiabvs9s.myfritz.net/mapserver/rest/mapserver/site.json"
  - or take the url from where you jumped off(though that may change when new sites get generated)
  
- identify the current user and store properties [UserHandling](./index.ts)
- communicate with the user [UserCommunication](./resources/mapserver/message-communication/user-service.ts)
- item pickup [Items](resources\mapserver\user\inventory\inventory-item-activation.ts)
  - [customizing user(add items/reset with death count)](https://github.com/jonnytest1/workadventuremap/tree/master/scripts/fire.js)

- hidden behind "gamemode" property: [GameMode](./resources/mapserver/user/user.ts#User.gameModeEnabled)
      - [enable gamemode](https://github.com/jonnytest1/workadventuremap/tree/master/scripts/game-mode.js)
  - ability to make friends with someone (theres a special area where if both people are in at the same time they become friends) 
    - [Friendship](./resources/mapserver/user/friendship.ts)
    - [Becoming Friends](./resources/mapserver/message-communication/friendship-service.ts)
    - [frontend map](https://github.com/jonnytest1/workadventuremap/blob/master/scripts/church.js)
  
  - ability to enable an overlay on any of my maps that can [map overlay](https://github.com/jonnytest1/workadventuremap/tree/master/scripts/game/overlay/mapoverlay)
    - teleport to friends 
    - show a compass to friends
    - message friends accross maps
    - teleport to your users personal map
  - customize your users personal map at will (you can pick up "tiles" at chests after completing challenges (currently no pay to win :D ))
    -  [PersonalMapHnadling](resources\mapserver\service\user-map-loader.ts)
    -  [PersonalMapCustomizing](resources\mapserver\user\inventory\inventory-item-activation.ts)
  
- frontend scripts at https://github.com/jonnytest1/workadventuremap/tree/master/scripts
    - script loader [index.js](https://github.com/jonnytest1/workadventuremap/tree/master/scripts/index.js)
      - because using scripts on multiple places is annoying otherwise
    - backend communcation [backend comm](https://github.com/jonnytest1/workadventuremap/tree/master/scripts/backend-connection.js)
      - iframe type for settings cookies
      - then webhook type for events and stuff
      - (check out the typing )
    - utility scripts for pupups 
      - [zoned-popup](https://github.com/jonnytest1/workadventuremap/tree/master/scripts/zoned-popup.js)
      - and on top of that [an ENTIRE BOT TREE](https://github.com/jonnytest1/workadventuremap/tree/master/scripts/conversation.js)

- also minesweeper
  - [frontend code](public\minesweeper.js)
  - [backend code](resources/mapserver/message-communication/minesweeper-service.ts)
  - [and just for fun the backend code as frontend code](public/minesweeper-local.js) this way it can actually be used without backend (minor adjustments may need to be made depending on your map and tilesets)