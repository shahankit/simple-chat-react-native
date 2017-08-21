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
      const mostOccuringUserResult = await window.db.executeSql(
        'select senderId, count(senderId) as freq from chat group by senderId order by freq desc limit 1;'
      );
      const currentUser = mostOccuringUserResult[0].rows.item(0);
      console.log('currentUser is', currentUser);
      this.currentUser = currentUser;
      this.fetchMessages();
    } catch (error) {
      console.log('Error in componentDidMount', error);
    }
  }

  onSend = async (messages) => {
    await Promise.all(
      messages.map(message =>
        window.db.executeSql(
          'insert into chat (id, message, senderName, senderPicture, senderId, messageDate) values (?, ?, ?, ?, ?, ?)',
          [
            message._id,
            message.text,
            this.currentUser.senderName,
            this.currentUser.senderPicture,
            this.currentUser.senderId,
            message.createdAt.getTime()
          ]
        )
      )
    );
    this.setState({
      messages: messages.concat(this.state.messages)
    });
  };

  fetchMessages = async () => {
    try {
      this.setState({ isFetching: true });
      const currentNumMessages = this.state.messages.length;
      const chatMessagesResult = await window.db.executeSql(
        'select * from chat order by messageDate desc limit ? offset ?',
        [BATCH_SIZE, currentNumMessages]
      );
      const numChatMessages = chatMessagesResult[0].rows.length;
      const messageObjects = [];
      const getChatMessage = chatMessagesResult[0].rows.item;
      for (let index = 0; index < numChatMessages; index += 1) {
        const chatMessage = getChatMessage(index);
        const messageNumber = currentNumMessages + index;
        messageObjects.push({
          _id: chatMessage.id,
          text: chatMessage.messageType === 'image' ? messageNumber.toString() : `${messageNumber}\n${chatMessage.messageText}`,
          image: chatMessage.messageImage,
          createdAt: new Date(chatMessage.messageDate),
          user: {
            _id: chatMessage.senderId,
            name: chatMessage.senderName,
            avatar: chatMessage.senderPicture
          }
        });
      }
      this.setState({
        messages: this.state.messages.concat(messageObjects),
        isFetching: false
      });
    } catch (error) {
      console.log('Error in fetchMessages', error);
    }
  };

  render() {
    return (
      <GiftedChat
        messages={this.state.messages}
        user={{ _id: this.currentUser && this.currentUser.senderId }}
        loadEarlier={true}
        onLoadEarlier={this.fetchMessages}
        isLoadingEarlier={this.state.isFetching}
        onSend={this.onSend}
      />
    );
  }
}
