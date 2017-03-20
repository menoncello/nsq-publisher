const Promise = require('bluebird');
const nsq = Promise.promisifyAll(require('nsqjs'));
const request = Promise.promisifyAll(require('request'));

class Publisher {
	constructor(dataUrl, dataHttpPort, dataTcpPort, topic) {
		this.dataUrl = dataUrl;
		this.dataHttpPort = dataHttpPort;
		this.dataTcpPort = dataTcpPort;
		this.topic = topic;
	}

	createTopicAsync() {
		return request.postAsync(
				`${this.dataUrl}:${this.dataHttpPort}/topic/create?topic=${this.topic}`
			);
	}

	createTopic(callback) {
		request.postAsync(
			`${this.dataUrl}:${this.dataHttpPort}/topic/create?topic=${this.topic}`
			)
			.catch(callback)
			.then(() => callback());
	}

	publishAsync(message) {
		return new Promise((res, rej) => {
			this.publish(message, (err) => {
				if (err) { rej(err); }
				else { res(); }
			});
		});
	}

	publish(message, callback) {
		const nsqWriter = new nsq.Writer(this.dataUrl, this.dataTcpPort);

		nsqWriter.connect();
		nsqWriter.on('ready', ready);

		function ready(err) {
			if (err) {
				callback(err);
				return;
			}

			nsqWriter.publishAsync(this.topic, message)
				.then(nsqWriter.close)
				.catch(callback)
				.then(() => callback());
		}
	}
}

module.exports = Publisher;

