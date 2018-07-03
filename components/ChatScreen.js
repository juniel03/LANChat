import React from 'react';
import {
	View,
	StyleSheet,
	Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import moment from 'moment';

import QRCodeModal from './QRCodeModal.js';
import InputBar from './InputBar.js';
import MsgList from './MsgList.js';

import Storage from '../modules/Storage';
import Util from '../modules/util';

export default class ChatScreen extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			qrcodeModalOpen: false,
			messages: [],
			votes: {},
			polls: {}
		};

		this.getOnlineCountInterval = 0;

		this.handleShowQRCode = this.handleShowQRCode.bind(this);
		this.handleReceiveMsg = this.handleReceiveMsg.bind(this);
		this.handleReadFile = this.handleReadFile.bind(this);
		this.checkGroup = this.checkGroup.bind(this);
		this.getOnlineCount = this.getOnlineCount.bind(this);
		this.loadHistoryMsg = this.loadHistoryMsg.bind(this);
	}

	static navigationOptions = ({ navigation }) => ({
		title: navigation.state.params.title || navigation.state.params.groupName,
		headerBackTitle: 'Back',
		headerRight: (
			<View style={ styles.headerRightContainer }>
				{ navigation.state.params.groupID !== 'LOBBY' &&
				<Icon
					size={24}
					color="#132731"
					name="qrcode"
					underlayColor="#d3d3d3"
					style={ styles.qrcodeBtn }
					onPress={ navigation.state.params.handleShowQRCode }
				/>
				}
				<Icon
					size={24}
					color="#007dff"
					name="info-circle"
					underlayColor="#d3d3d3"
					style={styles.settingsBtn}
					onPress={() => navigation.navigate('ChatInfo', navigation.state.params)}
				/>
			</View>
		)
	});

	componentDidMount() {
		this.props.navigation.addListener('didFocus', () => {
			Storage.setMsgRead(this.props.navigation.state.params.bssid, this.props.navigation.state.params.groupID);
			this.checkGroup();
			this.getOnlineCount();
			this.getOnlineCountInterval = setInterval(this.getOnlineCount, 9 * 1000);
			this.loadHistoryMsg();
		});

		this.props.navigation.setParams({ handleShowQRCode: this.handleShowQRCode });
		this.handleReceiveMsg();
	}

	componentWillUnmount() {
		clearInterval(this.getOnlineCountInterval);
		global.PubSub.off('msgInChat');
	}

	handleShowQRCode() {
		this.setState({
			qrcodeModalOpen: true
		});
	}

	handleReceiveMsg() {
		global.PubSub.on('msgInChat', async ({ groupID, msgData }) => {
			if (this.props.navigation.state.params.groupID !== groupID) {
				return;
			}

			const users = await Storage.getUsers();
			msgData.username = users[msgData.sender].username;
			Storage.setMsgRead(this.props.navigation.state.params.bssid, this.props.navigation.state.params.groupID);

			if (msgData.type === 'vote') {
				setTimeout(async () => {
					const votes = await Storage.getVote();
					const polls = await Storage.getPoll();
					this.setState((prevState) => ({
						messages: [...prevState.messages, msgData],
						votes,
						polls
					}));
				}, 500);
			} else {
				this.setState((prevState) => ({
					messages: [...prevState.messages, msgData]
				}));
			}
		});
	}

	handleReadFile(fileName, file) {
		this.props.navigation.navigate('FileReader', {
			fileName,
			file
		});
	}

	async checkGroup() {
		const joinedGroups = await Storage.getJoinedGroups();
		const { bssid, groupID } = this.props.navigation.state.params;
		if (groupID !== 'LOBBY' && (!joinedGroups[bssid] || !joinedGroups[bssid][groupID])) {
			this.props.navigation.goBack();
		}
	}

	async getOnlineCount() {
		const groupID = this.props.navigation.state.params.groupID;
		if (groupID === 'LOBBY') {
			this.props.navigation.setParams({
				title: `${this.props.navigation.state.params.groupName} (${ Object.keys(global.netUsers).length })`
			});

			return;
		}

		const bssid = this.props.navigation.state.params.bssid;
		const members = await Util.getGroupMembers(bssid, groupID);

		let onlineMemberCount = 0;
		Promise
			.all(Object.keys(members).map((uid) => Util.getOnlineStatus(uid)))
			.then((onlineStatusArr) => {
				onlineMemberCount = onlineStatusArr.filter((onlineStatus) => !!onlineStatus.online).length
				this.props.navigation.setParams({
					title: `${this.props.navigation.state.params.groupName} (${ onlineMemberCount })`
				});
			});
	}

	async loadHistoryMsg() {
		const messages = await Storage.getMsg(this.props.navigation.state.params.bssid, this.props.navigation.state.params.groupID);
		const users = await Storage.getUsers();
		const sorted = Object.values(messages).sort((a, b) => moment(a.timestamp).diff(moment(b.timestamp))).map((msg) => {
			return Object.assign({}, msg, { username: users[msg.sender] ? users[msg.sender].username : `Someone-${ msg.sender.substring(0, 3) }` });
		});

		const votes = await Storage.getVote();
		const polls = await Storage.getPoll();
		this.setState({
			messages: sorted,
			votes,
			polls
		});
	}

	render() {
		const isLobby = this.props.navigation.state.params.groupID === 'LOBBY';
		return (
			<View style={ styles.container }>
				<MsgList
					messages={ this.state.messages }
					votes={ this.state.votes }
					polls={ this.state.polls }
					onReadFile={ this.handleReadFile }
					{ ...this.props.navigation.state.params }
				/>
				<InputBar { ...this.props.navigation.state.params } />
				{ Platform.OS === 'ios' && <KeyboardSpacer /> }
				{ !isLobby &&
				<QRCodeModal
					open={ this.state.qrcodeModalOpen }
					onHide={() => { this.setState({ qrcodeModalOpen: false }) }}
					groupInfo={ JSON.parse(this.props.navigation.state.params.groupInfo) }
				/>
				}
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		height: '100%',
		backgroundColor: '#D5D6CB'
	},
	settingsBtn: {
		marginRight: 10
	},
	qrcodeBtn: {
		marginRight: 10
	},
	headerRightContainer: {
		flexDirection: 'row'
	}
});
