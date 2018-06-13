import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	Platform
} from 'react-native';
import {
	Button,
	Divider,
	FormInput,
	FormLabel
} from 'react-native-elements';
import Modal from 'react-native-modal';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default class CreatePollModal extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			title: '',
			desc: ''
		};

		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit() {
		const { title, desc } = this.state;
		// TODO: get options
	}

	render() {
		return (
			<Modal
				isVisible={ this.props.isOpen }
				onBackButtonPress={ this.props.hide }
				onBackdropPress={ this.props.hide }
			>
				<KeyboardAwareScrollView style={ styles.container }>
					<Text style={ styles.title }>新增投票</Text>
					<Divider style={ styles.divider } />
					<FormLabel>標題</FormLabel>
					<FormInput
						ref={(ref) => { this.title = ref }}
						maxLength={ 15 }
						value={ Platform.OS === 'ios' ? null : this.state.title }
						onChangeText={(title) => { this.setState({ title }) }}
					/>
					<FormLabel>描述</FormLabel>
					<FormInput
						ref={(ref) => { this.desc = ref }}
						multiline
						maxLength={ 150 }
						value={ Platform.OS === 'ios' ? null : this.state.desc }
						onChangeText={(desc) => { this.setState({ desc }) }}
					/>
					<View style={ styles.btnContainer }>
						<View style={ styles.btn }>
							<Button
								icon={{ name: 'close' }}
								backgroundColor="#ff3b30"
								title='取消'
								containerViewStyle={{ marginRight: 5, marginLeft: 5 }}
								onPress={ this.props.hide }
							/>
						</View>
						<View style={ styles.btn }>
							<Button
								icon={{ name: 'send' }}
								backgroundColor="#007aff"
								title='送出'
								containerViewStyle={{ marginRight: 5, marginLeft: 5 }}
								onPress={ this.handleSubmit }
							/>
						</View>
					</View>
				</KeyboardAwareScrollView>
			</Modal>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#fff',
		padding: 20,
		width: 500,
		maxWidth: '100%',
		alignSelf: 'center'
	},
	title: {
		textAlign: 'center',
		fontSize: 26
	},
	divider: {
		marginTop: 10,
		marginBottom: 10
	},
	btnContainer: {
		marginTop: 20,
		flexDirection: 'row',
		alignItems: 'flex-start'
	},
	btn: {
		width: '50%'
	},
});
