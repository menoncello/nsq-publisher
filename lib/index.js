const Promise = require('bluebird-tools');
const nsq = require('nsqjs');
const request = require('request');

class Publisher {
	constructor({ dataUrl, dataHttpPort, dataTcpPort, topic, protocol, autoCreate }) {
		this.dataUrl = dataUrl || 'localhost';
		this.dataTcpPort = dataTcpPort || 4151;
		this.topic = topic;
		this.topicUrl = `${protocol || 'http'}://${this.dataUrl}:${dataHttpPort || 4150}/topic/create?topic=${topic}`;
		this.autoCreate = autoCreate || false;
		this._topicCreated = false;
	}

	setCreated() {
		this._topicCreated = true;
	}

	createTopic(callback) {
		if (!callback) {
			return new Promise((resolve, reject) => {
				request.post(this.topicUrl, (err) => {
					if (err) {
						reject(err);
					}
					this.setCreated();
					resolve();
				});
			});
		}

		request.post(this.topicUrl, (err) => {
			if (err) {
				callback(err);
				return;
			}
			this.setCreated();
			callback();
		});
	}

	publish(message, callback) {
		if (!callback) {
			return Promise.when(() => this._topicCreated && this.autoCreate, this.createTopic)
				.then(() => new Promise((resolve, reject) => {
					const nsqWriter = new nsq.Writer(this.dataUrl, this.dataTcpPort);

					nsqWriter
						.on('ready', () => {
							Promise.promisify(nsqWriter.publish)(this.topic, message)
								.then(() => nsqWriter.close())
								.then(() => resolve())
								.catch(err => reject(err));
						});

					nsqWriter.connect();
				}));
		}

		Promise.when(() => this._topicCreated && this.autoCreate, this.createTopic)
			.then(() => {
				const nsqWriter = new nsq.Writer(this.dataUrl, this.dataTcpPort);

				nsqWriter
					.on('ready', () => {
						Promise.promisify(nsqWriter.publish)(this.topic, message)
							.then(() => nsqWriter.close())
							.then(() => callback())
							.catch(err => callback(err));
					});

				nsqWriter.connect();
			});
	}
}

module.exports = Publisher;
