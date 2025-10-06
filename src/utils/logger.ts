import {
	consoleTransport,
	logger,
	transportFunctionType,
} from 'react-native-logs';
import { InteractionManager } from 'react-native';

const defaultConfig = {
	levels: {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3,
	},
	severity: 'debug',
	transport: consoleTransport,
	transportOptions: {
		colors: {
			debug: 'gray',
			info: 'blueBright',
			warn: 'yellowBright',
			error: 'redBright',
		},
		extensionColors: {
			root: 'magenta',
			home: 'green',
		},
	},
	async: true,
	asyncFunc: InteractionManager.runAfterInteractions,
	dateFormat: 'time',
	printLevel: true,
	printDate: true,
	enabled: true,
};

let log = logger.createLogger<'trace' | 'info' | 'warn' | 'error'>(
	defaultConfig,
);
export const homeLog = log.extend('home');
export const rootLog = log.extend('root');

export default log;
