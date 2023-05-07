# @anmiles/queue

Queue dispatcher that sequentially processes incoming items

----

## Installation

`npm install @anmiles/queue`

## Usage

```js
import Queue from '@anmiles/queue';

const queue = new Queue([ item1, item2, item3 ], { interval: 500 });
queue.on('item', (item) => console.log('queue accessed this item in 500ms after previous one', item));
queue.on('done', () => console.log('queue finished'));
queue.dequeue();

/* after some time */
queue.enqueue([ item4, item5 ]);
/* queue automatically gets dequeued new items here */
```
