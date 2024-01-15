import Emittery from 'emittery';

type Listeners<T> = {
	item: (item: T) => Promise<void>;
	done: () => void;
}

export default class Queue<TItem> extends Emittery<{[TEvent in keyof Listeners<TItem>]: Parameters<Listeners<TItem>[TEvent]>[0]}> {
	private done: boolean;
	private data: TItem[];
	private interval: number;

	constructor(data: TItem[] = [], { interval = 0 }: { interval?: number } = {}) {
		super();
		this.done     = false;
		this.data     = data;
		this.interval = interval;
	}

	enqueue(...items: TItem[]): Queue<TItem> {
		this.data.push(...items);

		if (this.done) {
			this.dequeue();
		}

		return this;
	}

	async dequeue(): Promise<void> {
		this.done = false;

		if (this.data.length > 0) {
			const now = performance.now();
			await this.emit('item', this.data.shift() as TItem);
			setTimeout(() => this.dequeue(), Math.max(0, this.interval - (performance.now() - now)));
		} else {
			this.done = true;
			this.emit('done');
		}
	}

	count(): number {
		return this.data.length;
	}
}
