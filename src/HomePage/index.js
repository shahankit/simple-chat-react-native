import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import loremIpsum from 'lorem-ipsum-react-native';
import uuid from 'uuid/v4';

SQLite.enablePromise(true);

const NUM_TOTAL_MESSAGES = 2000;
const RANDOM_USER_COUNT = 500;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  populateDBButton: {
    height: 50,
    width: 200,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9c99f',
    flexDirection: 'row',
  },
  openChatButton: {
    height: 50,
    width: 120,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c6a0ff'
  },
  populatingLoaderContainer: {
    marginLeft: 10
  },
});

export default class HomePage extends Component {
  static navigationOptions = {
    header: null,
    headerBackTitle: 'Home'
  };

  state = {
    isPopulating: false
  };

  async componentDidMount() {
    try {
      window.db = await SQLite.openDatabase({ name: 'test.db' });
      // await window.db.executeSql('DROP TABLE IF EXISTS chat;');
      await window.db.executeSql('CREATE TABLE IF NOT EXISTS "chat" ( `id` TEXT, `message` TEXT, `senderName` TEXT, `senderPicture` TEXT, `senderId` TEXT, `messageDate` INTEGER, PRIMARY KEY(`id`) )');
      const numChatsResult = await window.db.executeSql('select count(*) as numChats from chat;');
      const numChats = numChatsResult[0].rows.item(0).numChats;
      if (numChats < NUM_TOTAL_MESSAGES) {
        this.populateDatabase();
      }
    } catch (error) {
      console.log('Error is', error);
    }
  }

  getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min)) + min

  openChatScreen = () => {
    const { navigate } = this.props.navigation;
    navigate('Chats');
  }

  repopulateDatabase = () => {
    if (this.state.isPopulating) {
      return;
    }

    this.populateDatabase();
  }

  populateDatabase = async () => {
    try {
      this.setState({ isPopulating: true });
      console.log('starting populatedb');
      await window.db.executeSql('delete from chat;');

      const response = await fetch(`https://randomuser.me/api/?results=${RANDOM_USER_COUNT}&inc=name,picture`);
      if (response.status < 200 || response.status >= 300) {
        throw new Error('Got repsonse with status code: ' + response.status);
      }
      setTimeout(() => null, 0); // workaround for #issue-6679
      const responseObject = await response.json();
      const randomUsers = responseObject.results;
      console.log('randomUsers are', randomUsers);

      const maxDate = new Date().getTime();
      const monthMillis = 30 * 24 * 60 * 60 * 1000;
      const minDate = maxDate - monthMillis;

      for (let index = 0; index < NUM_TOTAL_MESSAGES; index += 1) {
        const randomUser = randomUsers[this.getRandomNumber(0, RANDOM_USER_COUNT)];
        const id = uuid();
        const senderId = randomUser.id || uuid();
        randomUser.id = senderId;
        const senderName = `${randomUser.name.first} ${randomUser.name.last}`;
        const senderPicture = randomUser.picture.medium;
        const numberOfWords = this.getRandomNumber(10, 100);
        const message = loremIpsum({ count: numberOfWords, units: 'words' });
        const messageDate = this.getRandomNumber(minDate, maxDate);
        await window.db.executeSql('insert into chat (id, message, senderName, senderPicture, senderId, messageDate) values (?, ?, ?, ?, ?, ?)', [id, message, senderName, senderPicture, senderId, messageDate]);
      }
      console.log('chats added successfully');
    } catch (error) {
      console.log('Error in populatedb', error);
    }
    this.setState({ isPopulating: false });
  }

  renderPopulatingLoader = () => {
    if (!this.state.isPopulating) {
      return null;
    }

    return (
      <View style={styles.populatingLoaderContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to React Native!
        </Text>
        <Text style={styles.instructions}>
          To get started, edit src/index.js
        </Text>
        <Text style={styles.instructions}>
          Press Cmd+R to reload,{'\n'}
          Cmd+D or shake for dev menu
        </Text>
        <TouchableOpacity style={styles.populateDBButton} onPress={this.repopulateDatabase}>
          <Text>Repopulat{this.state.isPopulating ? 'ing' : 'e'} Database</Text>
          {this.renderPopulatingLoader()}
        </TouchableOpacity>
        <TouchableOpacity style={styles.openChatButton} onPress={this.openChatScreen}>
          <Text>Open Chats</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
