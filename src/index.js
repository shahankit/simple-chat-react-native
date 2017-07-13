import { StackNavigator } from 'react-navigation';

import HomePage from './HomePage';
import ChatsPage from './ChatsPage';

console.disableYellowBox = true;

export default StackNavigator({
  Home: { screen: HomePage },
  Chats: { screen: ChatsPage }
});
