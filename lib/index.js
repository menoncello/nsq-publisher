const Promise = require('bluebird-tools');
const nsq = require('nsqjs');
const request = Promise.promisifyAll(require('request'));

class Publisher {
	constructor({ dataUrl, dataHttpPort, dataTcpPort, topic, protocol, autoCreate }) {
		this.dataUrl = dataUrl;
		this.dataTcpPort = dataTcpPort;
		this.topic = topic;
		this.topicUrl = `${protocol || 'http'}://${dataUrl}:${dataHttpPort}/topic/create?topic=${topic}`;
		this.autoCreate = autoCreate;
		this._topicCreated = false;
	}

	createTopic(callback) {
		const promise = request.postAsync(this.topicUrl)
			.then(() => { this._topicCreated = true; });

		if (callback) {
			promise
				.then(() => callback())
				.catch(err => callback(err));
			return null;
		}

		return promise;
	}

	publish(message, callback) {

		const promise = Promise.when(() => this._topicCreated && this.autoCreate, this.createTopic)
			.then(() => new Promise((resolve, reject) => {
				const nsqWriter = new nsq.Writer(this.dataUrl, this.dataTcpPort)
					.connect()
					.on('ready', () => {
						Promise.promisify(nsqWriter.publish)(this.topic, message)
							.then(nsqWriter.close)
							.then(() => resolve)
							.catch(reject);
					});
			}));

		if (callback) {
			promise
				.then(() => callback())
				.catch(err => callback(err));
			return null;
		}
		return promise;
	}
}

module.exports = Publisher;

