import React, { Component } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';

const BATCH_SIZE = 50;

export default class ChatsPage extends Component {
  static navigationOptions = {
    title: 'Chats'
  };

  state = {
    messages: [],
    isFetching: false
  };

  async componentDidMount() {
    try {
      const mostOccuringUserResult = await window.db.executeSql('select senderId, count(senderId) as freq from chat group by senderId order by freq desc limit 1;');
      const userId = mostOccuringUserResult[0].rows.item(0).senderId;
      this.currentUserId = userId;
      this.fetchMessages();
    } catch (error) {
      console.log('Error in componentDidMount', error);
    }
  }

  fetchMessages = async () => {
    try {
      this.setState({ isFetching: true });
      const currentNumMessages = this.state.messages.length;
      const chatMessagesResult = await window.db.executeSql('select * from chat order by messageDate desc limit ? offset ?', [BATCH_SIZE, currentNumMessages]);
      const numChatMessages = chatMessagesResult[0].rows.length;
      const messageObjects = [];
      const getChatMessage = chatMessagesResult[0].rows.item;
      for (let index = 0; index < numChatMessages; index += 1) {
        const chatMessage = getChatMessage(index);
        messageObjects.push({
          _id: chatMessage.id,
          text: chatMessage.message,
          createdAt: new Date(chatMessage.messageDate),
          user: {
            _id: chatMessage.senderId,
            name: chatMessage.senderName,
            avatar: chatMessage.senderPicture,
          },
        });
      }
      this.setState({
        messages: this.state.messages.concat(messageObjects),
        isFetching: false
      });
    } catch (error) {
      console.log('Error in fetchMessages', error);
    }
  }

  render() {
    return (
      <GiftedChat
        messages={this.state.messages}
        user={{ _id: this.currentUserId }}
        loadEarlier={true}
        onLoadEarlier={this.fetchMessages}
        isLoadingEarlier={this.state.isFetching}
      />
    );
  }
}
