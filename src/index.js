import { StackNavigator } from 'react-navigation';

import HomePage from './HomePage';

console.disableYellowBox = true;

export default StackNavigator({
  Home: { screen: HomePage },
});
