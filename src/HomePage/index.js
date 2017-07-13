import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import loremIpsum from 'lorem-ipsum-react-native';
import uuid from 'uuid/v4';

SQLite.enablePromise(true);

const NUM_TOTAL_MESSAGES = 2000;

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
    width: 180,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9c99f'
  }
});

export default class HomePage extends Component {
  static navigationOptions = {
    header: null
  };

  async componentDidMount() {
    try {
      this.db = await SQLite.openDatabase({ name: 'test.db' });
      await this.db.executeSql('CREATE TABLE IF NOT EXISTS `chat` ( `id` TEXT, `message` TEXT, `senderName` TEXT, `senderPicture` TEXT, PRIMARY KEY(`id`) );');
      const numChatsResult = await this.db.executeSql('select count(*) as numChats from chat;');
      const numChats = numChatsResult[0].rows.item(0).numChats;
      if (numChats < NUM_TOTAL_MESSAGES) {
        this.populateDatabase();
      }
    } catch (error) {
      console.log('Error is', error);
    }
  }

  getRandomNumber = (min, max) => Math.floor(Math.random() * max) + min

  populateDatabase = async () => {
    try {
      console.log('starting populatedb');
      await this.db.executeSql('delete from chat;');
      const response = await fetch('https://randomuser.me/api/?results=1000&inc=name,id,picture');
      if (response.status < 200 || response.status >= 300) {
        throw new Error('Got repsonse with status code: ' + response.status);
      }
      setTimeout(() => null, 0); // workaround for #issue-6679
      const responseObject = await response.json();
      const randomUsers = responseObject.results;
      for (let index = 0; index < NUM_TOTAL_MESSAGES; index += 1) {
        const randomUser = randomUsers[this.getRandomNumber(0, 1000)];
        const id = uuid();
        const senderName = `${randomUser.name.first} ${randomUser.name.last}`;
        const senderPicture = randomUser.picture.medium;
        const numberOfWords = this.getRandomNumber(10, 100);
        const message = loremIpsum({ count: numberOfWords, units: 'words' });
        await this.db.executeSql('insert into chat (id, message, senderName, senderPicture) values (?, ?, ?, ?)', [id, message, senderName, senderPicture]);
      }
      console.log('chats added successfully');
    } catch (error) {
      console.log('Error in populatedb', error);
    }
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
        <TouchableOpacity style={styles.populateDBButton} onPress={this.populateDatabase}>
          <Text>Repopulate Database</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
