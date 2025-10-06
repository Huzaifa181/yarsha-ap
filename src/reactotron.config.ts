import Reactotron, {
	openInEditor,
	ReactotronReactNative,
} from 'reactotron-react-native';
import mmkvPlugin from 'reactotron-react-native-mmkv';
import { reactotronRedux } from 'reactotron-redux';
import { storage } from './store';

import config from '../app.json';

Reactotron.configure({
	name: config.name,
})
	.useReactNative({
		networking: {
			ignoreUrls: /symbolicate/,
		},
		editor: false,
		errors: { veto: stackFrame => false },
		overlay: false,
	})
	.use(openInEditor())
	.use(mmkvPlugin<ReactotronReactNative>({ storage }))
	.use(reactotronRedux())
	.connect();

export default Reactotron;