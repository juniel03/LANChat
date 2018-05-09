const dgram = require('dgram');

export default (() => {
	/**
	 * private variable
	 */
	const _serverSocket = dgram.createSocket('udp4');
	const _port = 12321;
	const _multicastAddress = '225.225.225.225';

	/**
	 * public method
	 */
	function init() {
		_serverSocket.bind(_port);
		_serverSocket.on('listening', () => {
			_serverSocket.addMembership(_multicastAddress);
		});

		_serverSocket.on('message', function (msg, rinfo) {
			global.PubSub.emit('message');
		});
	}

	function send(msg) {
		_serverSocket.send(msg, 0, msg.length, _port, _multicastAddress, (err) => {
			if (err) {
				console.warn(err);
				return;
			}
		});
	}

	return {
		init,
		send
	}
})();