# Appolo Event Dispatcher
Fast and simple event dispatcher for node.js written in typescript.

## Installation:

```javascript
npm install appolo-event-dispatcher --save
```

## Usage:

```javascript
import {EventDispatcher} from "appolo-event-dispatcher";
 
class EventHandler extends EventDispatcher {
    constructor() {
        super();
        setTimeout(() => this.fireEvent("test", 5), 100)
    }
}

let do = new EventHandler();

a.on("test", ()=>{
        //do something
});
    

```


## API
- `on(event,callback,[scope])` add an event listener
  - `event` - event name.
  - `callback` - callback function that will triggered on event name.
  - `scope` - optional, the scope of the `callback` function default: `this`.

- `un(event,callback,[scope])` - remove an event listener. All the arguments must be `===` to the onces used in the `on` method, or else it won\`t be removed.
  - `event` - event name.
  - `callback` - callback function.
  - `scope` - optional, the scope of the callback function.

- `fireEvent(event,[arguments])` fireEvent - triggers the callback functions of a given event name
  - `eventName` - name of the event
  - `arguments` -  all other `arguments` will be passed to the `callback` function
- `removeAllListeners()` - removes all event listeners

## License
MIT