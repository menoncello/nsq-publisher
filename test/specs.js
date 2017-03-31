const Promise = require('bluebird-tools');
const chai = require('chai');
const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
const timers = require('timers');
const EventEmitter = require('events');

chai.use(sinonChai);

suite('NSQ Publisher', function() {
	let nsqjsMock;
	let requestMock;
	let NsqPublisher;

	before(function() {
		// this.timeout(250);
		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true,
		});
		nsqjsMock = {
			Writer: class extends EventEmitter {
				publish(topic, message, cb) {
					cb();
				}
				connect() {
					this.emit('ready');
					return this;
				}
				close() {

				}
			},
		};
		requestMock = {
			post: sinon.stub().callsFake((x, cb) => cb()),
		};

		mockery.registerMock('request', requestMock);
		mockery.registerMock('nsqjs', nsqjsMock);
		// sinon.stub(request, 'post')
		// 	.yields(null, null, null);

		NsqPublisher = require('../lib/index');
	});

	after(() => {
		mockery.disable();
	});

	beforeEach(function () {
		// Overwrite the global timer functions (setTimeout, setInterval) with Sinon fakes
		this.clock = sinon.useFakeTimers();
		requestMock.post = sinon.stub().callsFake((x, cb) => cb());
	});
	afterEach(function () {
		// Restore the global timer functions to their native implementations
		this.clock.restore();
		// requestMock.post.restore();
	});

	suite('#constructor', () => {
		let publisher;

		beforeEach(() => publisher = new NsqPublisher({
			dataUrl: 'test.com',
			dataTcpPort: 1234,
			dataHttpPort: 4321,
			topic: 'topic-test',
			protocol: 'https',
			autoCreate: true
		}));

		test('must set dataUrl correctly', () => expect(publisher.dataUrl).equal('test.com'));
		test('must set dataTcpPort correctly', () => expect(publisher.dataTcpPort).equal(1234));
		test('must set topic correctly', () => expect(publisher.topic).equal('topic-test'));
		test('must set topicUrl correctly',
			() => expect(publisher.topicUrl).equal('https://test.com:4321/topic/create?topic=topic-test'));
		test('must set autoCreate correctly', () => expect(publisher.autoCreate).to.be.true);
		test('must set _topicCreated correctly', () => expect(publisher._topicCreated).to.be.false);
	});

	suite('#createTopic', function() {
		test('calls the request.post once', (done) => {
			const publisher = new NsqPublisher({});
			publisher.createTopic()
				.then(() => {
					expect(requestMock.post.calledOnce).to.be.true;
					done();
				})
				.catch(err => done(err));
		});
		test('must return undefined when passing a callback', () => {
			const publisher = new NsqPublisher({});
			const result = publisher.createTopic(() => {});
			expect(result).to.be.undefined;
		});
		test('must return a promise when nothing as callback', () => {
			const publisher = new NsqPublisher({});
			const result = publisher.createTopic();
			expect(result.isBluebird).to.be.true;
		});
		test('calls callback once, without arguments when everything goes right', (done) => {
			const publisher = new NsqPublisher({});
			const callback = sinon.stub();
			new Promise((resolve) => {
				callback.callsFake(resolve);
				publisher.createTopic(callback);
			})
				.then((e) => {
					expect(e).to.be.undefined;
					expect(callback.calledOnce).to.be.true;
					done();
				})
				.catch(e => done(e));
		});
		test('calls callback once, with error argument when returns a error', done => {
			const publisher = new NsqPublisher({});
			const callback = sinon.stub();
			requestMock.post.callsFake((url, cb) => cb('error'));
			new Promise((resolve) => {
				callback.callsFake(resolve);
				publisher.createTopic(callback);
			})
				.then((e) => {
					expect(e).to.be.not.undefined;
					expect(callback.calledOnce).to.be.true;
					done();
				})
				.catch(e => done(e));
		});
		test('execute then method when everything goes right',  done => {
			const publisher = new NsqPublisher({});
			publisher.createTopic()
				.then(() => done())
				.catch(e => done(e));
		});
		test('execute catch when returns a error', done => {
			const publisher = new NsqPublisher({});
			requestMock.post.callsFake((url, cb) => cb('error'));
			publisher.createTopic()
				.then(() => done('should not pass here'))
				.catch(() => done());
		});
		test('must post in to the topic url once', done => {
			const publisher = new NsqPublisher({});
			requestMock.post.callsFake((url, cb) => cb(new Error('error')));
			publisher.createTopic()
				.then(() => done('must not pass'))
				.catch(() => {
					expect(requestMock.post.calledOnce).to.be.true;
					done();
				});
		});
	});

	suite('#publish', () => {
		let publisher;
		test('calls the request.post once, if "_topicCreated" is set to true', done => {
			publisher = new NsqPublisher({ autoCreate: true });

			publisher.publish('asd')
				.then(() => {
					expect(publisher._topicCreated).to.be.true;
					done();
				})
				.catch(() => done());
		});
		test('calls the request.post once, if "_topicCreated" is set to true and called twice', done => {
			publisher = new NsqPublisher({ autoCreate: true });

			publisher.publish('asd')
				.then(() => publisher.publish('test'))
				.then(() => {
					expect(publisher._topicCreated).to.be.true;
					expect(requestMock.post.calledOnce).to.be.true;
					done();
				})
				.catch(() => done());
		});
		test('never calls the request.post, if "_topicCreated" is set to false', done => {
			publisher = new NsqPublisher({});

			publisher.publish('asd')
				.then(() => {
					expect(publisher._topicCreated).to.be.false;
					expect(requestMock.post.neverCalled).to.be.true;
					done();
				})
				.catch(() => done());
		});
		test('must return undefined when passing a callback', () => {
			const publisher = new NsqPublisher({});
			const result = publisher.publish('asd', () => {});
			expect(result).to.be.undefined;
		});
		test('must return a promise when nothing as callback', () => {
			const publisher = new NsqPublisher({});
			const result = publisher.publish('asd');
			expect(result.isBluebird).to.be.true;
		});
		test('calls callback one, without arguments when everything goes right', (done) => {
			const publisher = new NsqPublisher({});
			const callback = sinon.stub();
			new Promise((resolve) => {
				callback.callsFake(resolve);
				publisher.publish('asd', callback);
			})
				.then((e) => {
					expect(e).to.be.undefined;
					expect(callback.calledOnce).to.be.true;
					done();
				})
				.catch(e => done(e));
		});
		test('execute then method when everything goes right',  done => {
			const publisher = new NsqPublisher({});
			publisher.publish('asd')
				.then(() => done())
				.catch(e => done(e));
		});
		test('calls callback one, with error argument when returns a error', done => {
			const publisher = new NsqPublisher({});
			const callback = sinon.stub();
			new Promise(resolve => {
				callback.callsFake(() => resolve());
				publisher.publish('asd', callback);
			})
				.then((e) => {
					expect(e).to.be.undefined;
					expect(callback.calledOnce).to.be.true;
					done();
				})
				.catch(e => done(e));
		});
		test('execute catch when returns a error', done => {
			const publisher = new NsqPublisher({});
			// nsqjsMock.publish.callsFake((topic, message, cb) => cb('error'));
			nsqjsMock.Writer = class extends EventEmitter {
				publish(topic, message, cb) {
					cb({});
				}
				connect() {
					this.emit('ready');
					return this;
				}
				close() {

				}
			};
			publisher.publish('asd')
				.then(() => done('should not pass here'))
				.catch(() => done());
		});
		test('must call nsqWriter.publish once, passing the message', done => {
			nsqjsMock.Writer = class extends EventEmitter {
				publish(topic, message, cb) {
					cb(new Error('error'));
				}

				connect() {
					this.emit('ready');
					return this;
				}

				close() {

				}
			};

			const publisher = new NsqPublisher({});
			requestMock.post.callsFake((url, cb) => cb('error'));
			publisher.createTopic()
				.then(() => done('must not pass'))
				.catch(() => {
					expect(requestMock.post.calledOnce).to.be.true;
					done();
				});
		});
	});
});
