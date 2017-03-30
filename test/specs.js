const assert = require('chai').assert;
const mockery = require('mockery');
const sinon = require('sinon');

describe('NSQ Publisher', () => {
	let nsqjsMock;
	let requestMock;
	let NsqPublisher;

	before(() => {
		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true,
		});
		nsqjsMock = {
			Writer: () => {
				return {
					publish: sinon.spy(),
				};
			},
		};
		requestMock = {
			post: sinon.spy(),
		};

		mockery.registerMock('request', requestMock);
		mockery.registerMock('nsqjs', nsqjsMock);

		NsqPublisher = require('../lib/index');
	});

	after(() => mockery.disable());
	context('#constructor', () => {
		beforeEach(() => console.log(123));
		it('must set dataUrl correctly');
		it('must set dataTcpPort correctly');
		it('must set topic correctly');
		it('must set topicUrl correctly');
		it('must set autoCreate correctly');
		it('must set _topicCreated correctly');
	});

	context('#createTopic', () => {
		it('calls the request.post once', () => {
			const publisher = new NsqPublisher({});
			publisher.createTopic();
			assert.isTrue(requestMock.post.calledOnce);
		});
		it('must return nothing when passing a callback');
		it('must return a promise when nothing as callback');
		it('calls callback one, without arguments when everything goes right');
		it('calls callback one, with error argument when returns a error');
		it('execute then method when everything goes right');
		it('execute catch when returns a error');
		it('must post in to the topic url once');
	});

	context('#publish', () => {
		it('calls the request.post once, if "_topicCreated" is set to true');
		it('calls the request.post once, if "_topicCreated" is set to true and called twice');
		it('never calls the request.post, if "_topicCreated" is set to false');
		it('must return nothing when passing a callback');
		it('must return a promise when nothing as callback');
		it('calls callback one, without arguments when everything goes right');
		it('calls callback one, with error argument when returns a error');
		it('execute then method when everything goes right');
		it('execute catch when returns a error');
		it('must call nsqWriter.publish once, passing the message');
	});
});
