import sleep from '@anmiles/sleep';
import Queue from '../queue';

describe('src/lib/queue', () => {
	let queue: Queue<number>;
	let log: string[];

	beforeEach(() => {
		queue = new Queue([ 500, 400 ]);
		log   = [];
	});

	const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

	beforeEach(() => {
		setTimeoutSpy.mockImplementation((func, timeout) => {
			log.push(`timeout(${Math.floor(timeout ?? 0)})`);
			func();
			return 0 as unknown as ReturnType<typeof setTimeout>;
		});
	});

	afterAll(() => {
		setTimeoutSpy.mockRestore();
	});

	describe('constructor', () => {
		describe('data', () => {
			it('should be empty array by default', () => {
				expect(new Queue()['data']).toEqual([]);
			});

			it('should be set if specified', () => {
				expect(new Queue([ 3, 4, 5 ])['data']).toEqual([ 3, 4, 5 ]);
			});
		});

		describe('interval', () => {
			it('should be 0 by default', () => {
				expect(new Queue()['interval']).toEqual(0);
			});

			it('should be set if specified', () => {
				expect(new Queue([], { interval : 10 })['interval']).toEqual(10);
			});
		});
	});

	describe('sync', () => {
		beforeEach(() => {
			queue.on('item', (item) => {
				log.push(`item(${item})`);
			});
		});

		it('should process empty queue', async () => new Promise<void>((resolve) => {
			Reflect.set(queue, 'data', []);

			queue.on('done', () => {
				log.push('done');

				expect(log).toEqual([
					'done',
				]);

				resolve();
			});

			void queue.dequeue();
		}));

		it('should process queue in sequential order', async () => new Promise<void>((resolve) => {
			queue.on('done', () => {
				log.push('done');

				expect(log).toEqual([
					'item(500)',
					'timeout(0)',
					'item(400)',
					'timeout(0)',
					'done',
				]);

				resolve();
			});

			void queue.dequeue();
		}));

		it('should process queue with intervals in sequential order', async () => new Promise<void>((resolve) => {
			Reflect.set(queue, 'interval', 1000);

			queue.on('done', () => {
				log.push('done');

				expect(log).toEqual([
					'item(500)',
					'timeout(999)',
					'item(400)',
					'timeout(999)',
					'done',
				]);

				resolve();
			});

			void queue.dequeue();
		}));

		it('should process queue in sequential order when enqueuing items before dequeueing', async () => new Promise<void>((resolve) => {
			queue.on('done', () => {
				log.push('done');

				expect(log).toEqual([
					'item(500)',
					'timeout(0)',
					'item(400)',
					'timeout(0)',
					'item(300)',
					'timeout(0)',
					'item(200)',
					'timeout(0)',
					'done',
				]);

				resolve();
			});

			queue.enqueue(300, 200);
			void queue.dequeue();
		}));

		it('should process queue in sequential order when enqueuing items after dequeueing', async () => new Promise<void>((resolve) => {
			let doneCalledOnce = false;

			queue.on('done', () => {
				log.push('done');

				if (!doneCalledOnce) {
					doneCalledOnce = true;
					queue.enqueue(300, 200);
					return;
				}

				expect(log).toEqual([
					'item(500)',
					'timeout(0)',
					'item(400)',
					'timeout(0)',
					'done',
					'item(300)',
					'timeout(0)',
					'item(200)',
					'timeout(0)',
					'done',
				]);

				resolve();
			});

			void queue.dequeue();
		}));

		it('should process queue with intervals in sequential order when enqueuing items before dequeueing', async () => new Promise<void>((resolve) => {
			Reflect.set(queue, 'interval', 1000);

			queue.on('done', () => {
				log.push('done');

				expect(log).toEqual([
					'item(500)',
					'timeout(999)',
					'item(400)',
					'timeout(999)',
					'item(300)',
					'timeout(999)',
					'item(200)',
					'timeout(999)',
					'done',
				]);

				resolve();
			});

			queue.enqueue(300, 200);
			void queue.dequeue();
		}));

		it('should process queue with intervals in sequential order when enqueuing items after dequeueing', async () => new Promise<void>((resolve) => {
			Reflect.set(queue, 'interval', 1000);

			let doneCalledOnce = false;

			queue.on('done', () => {
				log.push('done');

				if (!doneCalledOnce) {
					doneCalledOnce = true;
					queue.enqueue(300, 200);
					return;
				}

				expect(log).toEqual([
					'item(500)',
					'timeout(999)',
					'item(400)',
					'timeout(999)',
					'done',
					'item(300)',
					'timeout(999)',
					'item(200)',
					'timeout(999)',
					'done',
				]);

				resolve();
			});

			void queue.dequeue();
		}));
	});

	describe('async', () => {
		beforeEach(() => {
			queue.on('item', async (item) => {
				log.push(`before(${item})`);
				await sleep(item || 0);
				log.push(`after(${item})`);
			});
		});

		it('should process empty queue', async () => new Promise<void>((resolve) => {
			Reflect.set(queue, 'data', []);

			queue.on('done', () => {
				log.push('done');

				expect(log).toEqual([
					'done',
				]);

				resolve();
			});

			void queue.dequeue();
		}));

		it('should process queue in sequential order', async () => new Promise<void>((resolve) => {
			queue.on('done', () => {
				log.push('done');

				expect(log).toEqual([
					'before(500)',
					'timeout(500)',
					'after(500)',
					'timeout(0)',
					'before(400)',
					'timeout(400)',
					'after(400)',
					'timeout(0)',
					'done',
				]);

				resolve();
			});

			void queue.dequeue();
		}));

		it('should process queue with intervals in sequential order', async () => new Promise<void>((resolve) => {
			Reflect.set(queue, 'interval', 1000);

			queue.on('done', () => {
				log.push('done');

				expect(log).toEqual([
					'before(500)',
					'timeout(500)',
					'after(500)',
					'timeout(999)',
					'before(400)',
					'timeout(400)',
					'after(400)',
					'timeout(999)',
					'done',
				]);

				resolve();
			});

			void queue.dequeue();
		}));

		it('should process queue in sequential order when enqueuing items before dequeueing', async () => new Promise<void>((resolve) => {
			queue.on('done', () => {
				log.push('done');

				expect(log).toEqual([
					'before(500)',
					'timeout(500)',
					'after(500)',
					'timeout(0)',
					'before(400)',
					'timeout(400)',
					'after(400)',
					'timeout(0)',
					'before(300)',
					'timeout(300)',
					'after(300)',
					'timeout(0)',
					'before(200)',
					'timeout(200)',
					'after(200)',
					'timeout(0)',
					'done',
				]);

				resolve();
			});

			queue.enqueue(300, 200);
			void queue.dequeue();
		}));

		it('should process queue in sequential order when enqueuing items after dequeueing', async () => new Promise<void>((resolve) => {
			let doneCalledOnce = false;

			queue.on('done', () => {
				log.push('done');

				if (!doneCalledOnce) {
					doneCalledOnce = true;
					queue.enqueue(300, 200);
					return;
				}

				expect(log).toEqual([
					'before(500)',
					'timeout(500)',
					'after(500)',
					'timeout(0)',
					'before(400)',
					'timeout(400)',
					'after(400)',
					'timeout(0)',
					'done',
					'before(300)',
					'timeout(300)',
					'after(300)',
					'timeout(0)',
					'before(200)',
					'timeout(200)',
					'after(200)',
					'timeout(0)',
					'done',
				]);

				resolve();
			});

			void queue.dequeue();
		}));

		it('should process queue with intervals in sequential order when enqueuing items before dequeueing', async () => new Promise<void>((resolve) => {
			Reflect.set(queue, 'interval', 1000);

			queue.on('done', () => {
				log.push('done');

				expect(log).toEqual([
					'before(500)',
					'timeout(500)',
					'after(500)',
					'timeout(999)',
					'before(400)',
					'timeout(400)',
					'after(400)',
					'timeout(999)',
					'before(300)',
					'timeout(300)',
					'after(300)',
					'timeout(999)',
					'before(200)',
					'timeout(200)',
					'after(200)',
					'timeout(999)',
					'done',
				]);

				resolve();
			});

			queue.enqueue(300, 200);
			void queue.dequeue();
		}));

		it('should process queue with intervals in sequential order when enqueuing items after dequeueing', async () => new Promise<void>((resolve) => {
			Reflect.set(queue, 'interval', 1000);

			let doneCalledOnce = false;

			queue.on('done', () => {
				log.push('done');

				if (!doneCalledOnce) {
					doneCalledOnce = true;
					queue.enqueue(300, 200);
					return;
				}

				expect(log).toEqual([
					'before(500)',
					'timeout(500)',
					'after(500)',
					'timeout(999)',
					'before(400)',
					'timeout(400)',
					'after(400)',
					'timeout(999)',
					'done',
					'before(300)',
					'timeout(300)',
					'after(300)',
					'timeout(999)',
					'before(200)',
					'timeout(200)',
					'after(200)',
					'timeout(999)',
					'done',
				]);

				resolve();
			});

			void queue.dequeue();
		}));
	});

	describe('count', () => {
		it('return count of data', () => {
			expect(queue.count()).toEqual(2);
		});
	});
});

