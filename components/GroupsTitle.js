import React from 'react';
import {
	View,
	Text,
	StyleSheet
} from 'react-native';

export default class GroupsTitle extends React.PureComponent {
	render() {
		return (
			<View style={ styles.container }>
				<Text style={ styles.text }>{ this.props.ssid }</Text>
				{ this.props.count !== undefined &&
					<Text style={ styles.count }>在線人數: { this.props.count }</Text>
				}
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#132731',
		paddingTop: 5,
		paddingBottom: 5,
		paddingLeft: 10,
		borderColor: '#4E6068',
		borderBottomWidth: 1,
		flexDirection: 'row'
	},
	text: {
		color: '#6b7b83',
		fontWeight: 'bold',
		fontSize: 16,
		flex: 1
	},
	count: {
		color: '#6b7b83',
		fontSize: 16,
		textAlign: 'right',
		paddingRight: 10,
		width: 115
	}
});
