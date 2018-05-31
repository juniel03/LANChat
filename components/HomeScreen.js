import React from 'react';
import {
	View,
	Text,
	Alert,
	StyleSheet,
	NetInfo
} from 'react-native';
import {
	Button,
	List,
	ListItem
} from 'react-native-elements';
import BottomNavigation, { Tab } from 'react-native-material-bottom-navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import MIcon from 'react-native-vector-icons/MaterialIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import moment from 'moment';

import UnreadCounter from './UnreadCounter.js';

import GroupsTitle from './GroupsTitle.js';
import Storage from '../modules/Storage.js';
import Util from '../modules/util.js';

export default class HomeScreen extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			joinedGroups: '{}',
			currentNet: null,
			userCount: '...',
			lastMsg: '{}', // { groupID: { username: '', msg: '', time: 'ISO 8601' } }
			unreadCount: '{}' // { groupID: countNUm }
		};

		global.UdpSocket.init();
		this.handleTabChange = this.handleTabChange.bind(this);
		this.handlePressGroup = this.handlePressGroup.bind(this);
		this.checkPersonalInfo = this.checkPersonalInfo.bind(this);
		this.renderGroups = this.renderGroups.bind(this);
		this.getUserCount = this.getUserCount.bind(this);
		this.getLastMsgAndCountUnread = this.getLastMsgAndCountUnread.bind(this);
		this.handleOnMsg = this.handleOnMsg.bind(this);
	}

	static navigationOptions = ({ navigation }) => ({
		title: '訊息',
		headerRight: (
			<Icon
				size={24}
				color="#37474F"
				name="pencil-square-o"
				style={ styles.newGroupBtn }
				onPress={ () => navigation.navigate('CreateGroup') }
			/>
		)
	});

	componentDidMount() {
		this.props.navigation.setParams({ handlePressNewGroup: this.handlePressNewGroup });
		this.props.navigation.addListener('didFocus', () => {
			this.checkPersonalInfo();
			this.renderGroups();
			this.getLastMsgAndCountUnread();
			this.handleOnMsg();
		});

		Util.parseAlive();
		Util.parseUserData();
		Util.parseMsg();
		Util.parseMsgSync();
		Util.checkConnection();
		Util.listenWiFiChanged();
		Util.sendAlive();
		Util.sendUserDataInterval();

		global.PubSub.on('wifi:disconnect', () => {
			this.props.navigation.navigate('LoginRegister');
		});

		global.PubSub.on('wifi:changed', ([ssid, bssid]) => {
			global.netUsers = {};
			!!this.renderGroups && this.renderGroups();
		});

		global.PubSub.on('tcp:connect', () => {
			setTimeout(this.getUserCount, 1000);
		});

		global.PubSub.on('tcp:disconnect', (ip) => {
			setTimeout(this.getUserCount, 1000);
			Util.handleTcpDisconnect(ip);
		});

		this.getUserCount();
	}

	handleTabChange(index) {
		switch (index) {
			case 0:
				this.props.navigation.navigate('Settings');
				break;
			case 1:
				this.renderGroups();
				break;
			case 2:
				this.props.navigation.navigate('QRScanner');
				break;
		}
	}

	async handlePressGroup(groupID, groupName, bssid) {
		const wifiInfo = await Util.getWifi();
		const currentBssid = wifiInfo[1];
		if (groupID === 'LOBBY') {
			const { ssid, bssid } = JSON.parse(this.state.currentNet);
			this.props.navigation.navigate('Chat', {
				groupID,
				groupName: 'LOBBY',
				bssid,
				ssid,
				currentBssid
			});

			return;
		}

		const joinedGroups = JSON.parse(this.state.joinedGroups);
		const groupInfo = JSON.stringify(joinedGroups[bssid][groupID]);
		this.props.navigation.navigate('Chat', {
			groupID,
			groupName,
			bssid,
			groupInfo,
			currentBssid
		});
	}

	handleOnMsg() {
		global.PubSub.on('receiveMsg', () => {
			setTimeout(() => {
				this.getLastMsgAndCountUnread();
			}, 150);
		});
	}

	async checkPersonalInfo() {
		const info = await Storage.getPersonalInfo();
		if (!info.normal.username) {
			Alert.alert('請先填寫個人資料', null, [{ text: 'OK', onPress: () => this.props.navigation.navigate('Settings') }]);
		}
	}

	async renderGroups() {
		const joinedGroups = await Storage.getJoinedGroups();
		// console.warn(JSON.stringify(joinedGroups, null, 4));
		const [ssid, bssid] = await Util.getWifi();
		this.setState({
			joinedGroups: JSON.stringify(joinedGroups),
			currentNet: JSON.stringify({
				ssid,
				bssid
			})
		});
	}

	async getUserCount() {
		this.setState({
			userCount: Object.keys(global.netUsers).length
		});
	}

	async getLastMsgAndCountUnread() {
		const [ssid, bssid] = await Util.getWifi();
		const messages = await Storage.getMsg(bssid);
		const users = await Storage.getUsers();
		const lastMsg = {};
		const unread = {};
		Object.keys(messages).forEach((groupID) => {
			const last = Object.values(messages[groupID]).sort((a, b) => moment(a.timestamp).diff(moment(b.timestamp))).pop();
			if (last) {
				lastMsg[groupID] = {
					username: users[last.sender].username,
					msg: last[last.type],
					time: last.timestamp
				}
			}

			// count unread
			unread[groupID] = Object.values(messages[groupID]).reduce((sum, msgObj) => sum + (msgObj.read ? 0 : 1), 0);
		});

		this.setState({
			lastMsg: JSON.stringify(lastMsg),
			unreadCount: JSON.stringify(unread)
		});
	}

	genSubtitle(groupID) {
		const lastMsg = JSON.parse(this.state.lastMsg);
		return lastMsg[groupID] ? `${moment(lastMsg[groupID].timestamp).format('HH:mm')} | ${ lastMsg[groupID].username }: ${ lastMsg[groupID].msg.substring(0, 100) }` : '';
	}

	genUnreadCounter(groupID) {
		const unreadCount = JSON.parse(this.state.unreadCount);
		if (!unreadCount[groupID]) {
			return null;
		} else {
			return {
				element: <UnreadCounter count={ unreadCount[groupID] } />
			}
		}
	}

	render() {
		let joinedGroups = JSON.parse(this.state.joinedGroups);
		let currentNet = this.state.currentNet ? JSON.parse(this.state.currentNet) : null;
		return (
			<View style={ styles.container }>
				<List containerStyle={ styles.groupList }>
					<ListItem
						hideChevron
						title="LOBBY"
						subtitle={ this.genSubtitle('LOBBY') }
						underlayColor="#d3d3d3"
						leftIcon={{ name: 'home'}}
						titleStyle={ styles.groupTitle }
						badge={ this.genUnreadCounter('LOBBY') }
						onPress={() => { this.handlePressGroup('LOBBY') }}
					/>
				</List>
				<KeyboardAwareScrollView style={{ marginBottom: 50}}>
					{ currentNet &&
						<View>
							<GroupsTitle ssid={ `[連線中] ${currentNet.ssid}` } count={ this.state.userCount } />
							<List containerStyle={styles.groupList}>
								{ joinedGroups[currentNet.bssid] && Object.keys(joinedGroups[currentNet.bssid]).map((groupID) => (
									<ListItem
										key={ groupID }
										hideChevron
										title={ joinedGroups[currentNet.bssid][groupID].groupName }
										subtitle={ this.genSubtitle(groupID) }
										underlayColor="#d3d3d3"
										titleStyle={styles.groupTitle}
										badge={ this.genUnreadCounter(groupID) }
										onPress={() => { this.handlePressGroup(groupID, joinedGroups[currentNet.bssid][groupID].groupName, currentNet.bssid) }}
									/>
								)) }
							</List>
						</View>
					}

					{ Object.keys(joinedGroups).filter((bssid) => !currentNet || bssid !== currentNet.bssid).map((bssid) => {
						const ssid = Object.values(joinedGroups[bssid])[0] ? Object.values(joinedGroups[bssid])[0].net.ssid : null;
						if (ssid === null) {
							return null;
						}

						return (
							<View key={ bssid }>
								<GroupsTitle ssid={ ssid } />
								<List containerStyle={styles.groupList}>
									{ Object.keys(joinedGroups[bssid]).map((groupID) => (
										<ListItem
											key={ groupID }
											hideChevron
											title={ joinedGroups[bssid][groupID].groupName }
											subtitle={ this.genSubtitle(groupID) }
											underlayColor="#d3d3d3"
											titleStyle={styles.groupTitle}
											badge={ this.genUnreadCounter(groupID) }
											onPress={() => { this.handlePressGroup(groupID, joinedGroups[bssid][groupID].groupName, bssid) }}
										/>
									)) }
								</List>
							</View>
						)
					}) }
				</KeyboardAwareScrollView>
				<BottomNavigation
					labelColor="white"
					rippleColor="white"
					activeTab={1}
					style={ styles.bottomNavigation }
					onTabChange={this.handleTabChange}
				>
					<Tab
						barBackgroundColor="#37474F"
						label="個人資訊"
						icon={<Icon size={24} color="white" name="user" />}
					/>
					<Tab
						barBackgroundColor="#37474F"
						label="訊息"
						icon={<MIcon size={24} color="white" name="message" />}
					/>
					<Tab
						barBackgroundColor="#37474F"
						label="加入群組"
						icon={<Icon size={24} color="white" name="qrcode" />}
					/>
				</BottomNavigation>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		height: '100%'
	},
	bottomNavigation: {
		height: 50,
		elevation: 8,
		position: 'absolute',
		left: 0,
		bottom: 0,
		right: 0
	},
	newGroupBtn: {
		marginRight: 10
	},
	groupList: {
		marginTop: 0,
		marginBottom: 0,
		borderTopWidth: 0
	},
	groupTitle: {
		fontWeight: 'bold'
	}
});
