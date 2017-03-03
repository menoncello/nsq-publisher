const nsq = require('nsqjs');
const request = require('request');

function Publisher(options) {
	this.options = options;
	this.optionsErrors = [];
}

Publisher.prototype.createTopic = createTopic;
Publisher.prototype.publish = publish;
Publisher.prototype.checkOptions = checkOptions;

module.exports = Publisher;

function createTopic(callback) {
	if (!this.checkOptions()) {
		callback({
			msg: this.optionsErrors.join('\n'),
		});
		return;
	}

	request.post(
		`${this.options.dataUrl}:${this.options.dataPort}/topic/create?topic=${this.options.topic}`,
		topicCreated);

	function topicCreated(err) {
		if (err) {
			console.error(err);
			callback(err);
			return;
		}

		callback();
	}
}

function publish(message, callback) {
	if (!this.checkOptions()) {
		callback({
			msg: this.optionsErrors.join('\n'),
		});
		return;
	}

	const nsqWriter = new nsq.Writer(this.options.dataUrl, this.options.dataPort);

	nsqWriter.connect();
	nsqWriter.on('ready', (err) => {
		if (err) {
			callback(err);
			return;
		}

		nsqWriter.publish(this.options.topic, message, (errPublish) => {
			nsqWriter.close();
			if (errPublish) {
				callback(errPublish);
				return;
			}

			callback();
		});
	});
}

function checkOptions() {
	if (!this.options) {
		const err = 'options is a required parameter';
		if (this.optionsErrors.indexOf(err) === -1) {
			this.optionsErrors.push(err);
		}
		return false;
	}

	if (!this.options.dataUrl) {
		const err = 'Property of options "dataUrl" is a required';
		if (this.optionsErrors.indexOf(err) === -1) {
			this.optionsErrors.push(err);
		}
	}

	if (!this.options.dataPort) {
		const err = 'Property of options "dataPort" is a required';
		if (this.optionsErrors.indexOf(err) === -1) {
			this.optionsErrors.push(err);
		}
	}

	if (!this.options.topic) {
		const err = 'Property of options "topic" is a required';
		if (this.optionsErrors.indexOf(err) === -1) {
			this.optionsErrors.push(err);
		}
	}

	return this.optionsErrors.length === 0;
}
