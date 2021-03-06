
export default (() => {
	/**
	 * private variable
	 */
	const _events = {};

	/**
	 * public method
	 */
	function on(eventName, callback) {
		_events[eventName] = callback
	}

	function emit(eventName, data) {
		typeof _events[eventName] === 'function' && _events[eventName](data);
	}

	function off(eventName) {
		delete _events[eventName];
	}

	return {
		emit,
		on,
		off
	}
})();
