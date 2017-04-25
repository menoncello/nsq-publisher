# NSQ Publisher
[![Build Status](https://travis-ci.org/menoncello/nsq-publisher.svg?branch=master)](https://travis-ci.org/menoncello/nsq-publisher)
[![Coverage Status](https://coveralls.io/repos/github/menoncello/nsq-publisher/badge.svg?branch=1.0-version)](https://coveralls.io/github/menoncello/nsq-publisher?branch=1.0-version)
[![Dependency Status](https://img.shields.io/david/menoncello/nsq-publisher.svg?style=flat-square)](https://david-dm.org/request/request)

Simple way to create topics and publish messages.

## Installation

```bash
npm instal --save nsq-publisher
```

## Usage

```js
const Publisher = require('nsq-publisher');


const pub = new Publisher({
  dataUrl: 'localhost', // optional 
  dataHttpPort: 4151, // optional 
  dataTcpPort: 4150, // optional 
  topic: 'test-topic', 
  protocol: 'http', // optional 
  autoCreate: false // optional
});




// pub.createTopic is necessary to make sure that topic exists, 
// but is not necessary if autoCreate is set to true
pub.createTopic(function (err) {
  if (err) {
  	console.error(err);
  } else {
  	console.log('ok');
  }
});
// or
pub.createTopic()
  .then(() => console.log('ok'))
  .catch(err => console.error(err));
  
  
pub.publish('test message', function (err) {
  if (err) {
  	console.error(err);
  } else {
  	console.log('published');
  }
});

// or

pub.publish('test message')
  .then(() => console.log('published'))
  .catch(err => console.error(err));

```