const Promise = require('bluebird');
const nsq = Promise.promisifyAll(require('nsqjs'));
const request = Promise.promisifyAll(require('request'));

class Publisher {
	constructor({ dataUrl, dataHttpPort, dataTcpPort, topic, protocol }) {
		this.dataUrl = dataUrl;
		this.dataTcpPort = dataTcpPort;
		this.topic = topic;
		this.topicUrl = `${protocol || 'http'}://${dataUrl}:${dataHttpPort}/topic/create?topic=${topic}`;
	}

	createTopic(callback) {
		return callback
			? request.postAsync(this.topicUrl)
				.then(() => callback())
				.catch(err => callback(err))
			: request.postAsync(this.topicUrl);
	}

	publish(message, callback) {
		if (!callback) {
			return new Promise((res, rej) =>
				this.publish(message, (err) => err ? rej(err) : res()));
		}

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
				.then(() => callback())
				.catch(() => callback(err));
		}
	}
}

module.exports = Publisher;

