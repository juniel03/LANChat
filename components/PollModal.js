import React from 'react';
import {
	View,
	Text,
	StyleSheet
} from 'react-native';
import Modal from 'react-native-modal';

export default class PollModal extends React.Component {
	render() {
		return (
			<Modal
				isVisible={ this.props.isOpen }
				onBackButtonPress={ this.props.hide }
				onBackdropPress={ this.props.hide }
			>
				<View style={ styles.container }>
					<Text>this is PollModal</Text>
					<Text>pollID: { this.props.pollID }</Text>
				</View>
			</Modal>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		height: '100%',
		backgroundColor: '#fff'
	}
});
