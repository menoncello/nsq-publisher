const Promise = require('bluebird');
const nsq = Promise.promisifyAll(require('nsqjs'));
const request = Promise.promisifyAll(require('request'));

class Publisher {
	constructor(dataUrl, dataPort, topic) {
		this.dataUrl = dataUrl;
		this.dataPort = dataPort;
		this.topic = topic;
	}

	createTopicAsync() {
		return request.postAsync(
				`${this.dataUrl}:${this.dataPort}/topic/create?topic=${this.topic}`
			);
	}

	createTopic(callback) {
		request.postAsync(
			`${this.dataUrl}:${this.dataPort}/topic/create?topic=${this.topic}`
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

		const nsqWriter = new nsq.Writer(this.options.dataUrl, this.options.dataPort);

		nsqWriter.connect();
		nsqWriter.on('ready', ready);

		function ready(err) {
			if (err) {
				callback(err);
				return;
			}

			nsqWriter.publishAsync(this.options.topic, message)
				.then(nsqWriter.close)
				.catch(callback)
				.then(() => callback());
		}
	}
}

module.exports = Publisher;

